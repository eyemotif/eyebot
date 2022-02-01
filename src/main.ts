import clone from 'clone'
import { Bot, botSay, createBot } from './bot'
import { channelString } from './channel/channel'
import { joinPerson } from './channel/person'
import { Command, CommandInput, CommandResult } from './command/command'
import { CommandRegister } from './command/register'
import { delay, Obj, Result } from './utils'

let registry = new CommandRegister()
let isRunning = false
let commands: Record<string, Command>
let bot: Bot

export const registerCommands = (fn: (commandRegister: CommandRegister) => void) => fn(registry)
export const collectCommands = () => CommandRegister.Finish(registry)

const runBotDaemon = async () => {
    while (isRunning) {
        await delay(1000)
    }
    console.debug('Daemon stopped.')
}

const handleCommandResult = (channelStr: string, commandResult: CommandResult): Result<void, string> => {
    if (commandResult.NewJoinedPerson) {
        const joinResult = joinPerson(commandResult.NewJoinedPerson.id, bot.Streams[channelStr])
        if (joinResult.IsOk) {
            bot.Streams[channelStr] = joinResult.Ok
        }
        else return Result.fromError(joinResult)
    }
    if (commandResult.NewLastChatTime) {
        bot.Streams[channelStr].LastChatTime = commandResult.NewLastChatTime
    }
    if (commandResult.NewTopic) {
        bot.Streams[channelStr].Topic = commandResult.NewTopic
    }
    return Result.ok(void 0)
}

const main = async () => {
    const botResult = createBot()
    if (!botResult.IsOk) {
        const botError = botResult.Error
        for (const error of botError)
            console.error(`ERROR while creating bot: ${error}`)
        return
    }
    bot = botResult.Ok

    await delay(500)
    bot.Client.connect()
        .then(_ => {
            isRunning = true
            commands = collectCommands()
            console.debug(commands)
            runBotDaemon()
        })
        .catch(reason => {
            // bot.Client.disconnect()
            console.error(`ERROR while trying to connect: ${reason}`)
        })

    bot.Client.on('message', (channel, userstate, message, self) => {
        if (self || userstate.username === undefined || userstate['message-type'] !== 'chat') return

        const channelStr = channelString(channel)
        const isMod = userstate.mod || (channelStr === userstate.username)

        bot.Streams[channelStr].UserChatTimes[userstate.username] = Date.now()
        if (bot.Channels[channelStr].Options.gambling)
            bot.Channels[channelStr].Gambling.Users[userstate.username] = 0

        if (message.startsWith(bot.Channels[channelStr].Options.commandPrefix)) {
            const split = message.trim().split(/ +/)
            const commandKey = split[0].substring(bot.Channels[channelStr].Options.commandPrefix.length)
            const commandBody = split.slice(1)

            const command = commands[commandKey]
            if (command) {
                const commandInput: CommandInput = {
                    Username: userstate.username,
                    IsMod: isMod,
                    Stream: bot.Streams[channelStr]
                }
                const botCopy = clone(bot)
                if (command.canRun(botCopy, commandInput)) {
                    const commandResult = command.run(botCopy, commandInput, commandBody)

                    const handleResult = handleCommandResult(channelStr, commandResult)
                    if (!handleResult.IsOk) {
                        if (isMod) botSay(channel, isMod, bot, `${userstate.username} Could not update stream.`)
                        console.log(`* ERROR: Could not update stream: ${handleResult.Error}`)
                    }
                }
            }
            else {
                if (isMod) botSay(channel, isMod, bot, `${userstate.username} command "${commandKey}" not found.`)
                console.error(`* ERROR: Command ${channelStr}:${commandKey} not found`)
            }
        }
    })

}
main()

delay(5000).then(() => {
    if (isRunning) {
        isRunning = false
        bot.Client.disconnect()
    }
})
