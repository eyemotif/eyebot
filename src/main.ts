import clone from 'clone'
import { stdin, stdout } from 'process'
import readline from 'readline'
import { Bot, botSay, createBot } from './bot'
import { channelString, writeChannel } from './channel/channel'
import { Alias, dealias } from './command/alias'
import { Command, CommandInput, CommandResult } from './command/command'
import { collectCommands } from './command/register'
import { delay, Result } from './utils'

import './commands/commandRegisters'
import './listeners/messageListeners'

let isRunning = false
let commands: Record<string, Command>
let aliases: Record<string, Alias[]>
let bot: Bot

const rl = readline.createInterface(stdin, stdout)

const runBotDaemon = async () => {
    while (isRunning) {
        await delay(500)
        for (const channel in bot.Channels)
            writeChannel(bot.Channels[channel])
    }
    console.debug('Daemon stopped.')
}

const handleCommandResult = (channelStr: string, commandResult: CommandResult): Result<void, string> => {
    if (commandResult.NewJoinedPeople !== undefined) {
        bot.Streams[channelStr].JoinedPeople = commandResult.NewJoinedPeople
    }
    if (commandResult.NewLastChatTime !== undefined) {
        bot.Streams[channelStr].LastChatTime = commandResult.NewLastChatTime
    }
    if (commandResult.NewTopic !== undefined) {
        bot.Streams[channelStr].Topic = commandResult.NewTopic
    }
    if (commandResult.NewGambling !== undefined) {
        // TODO: better GambleInfo update handling
        // TODO: this doesn't actually update the bot's GambleInfo
        bot.Channels[channelStr].Gambling = commandResult.NewGambling
        bot.Streams[channelStr].Channel.Gambling = commandResult.NewGambling
    }
    return Result.ok(void 0)
}

const main = () => {
    const botResult = createBot()
    if (!botResult.IsOk) {
        const botError = botResult.Error
        for (const error of botError)
            console.error(`ERROR while creating bot: ${error}`)
        return
    }
    bot = botResult.Ok

    bot.Client.connect()
        .then(_ => {
            isRunning = true
            const [cmnds, aliss] = collectCommands()
            commands = cmnds
            aliases = aliss
            bot.Commands = clone(commands)
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
            const body = split.slice(1)

            const [command, commandBody] = dealias(commands, aliases, [commandKey, body]) ?? []
            if (command && commandBody) {
                const commandInput: CommandInput = {
                    Username: userstate.username,
                    IsMod: isMod,
                    Stream: bot.Streams[channelStr]
                }
                // this breaks. idk why
                // const botCopy = clone(bot, true)
                const botCopy = bot
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
                // console.error(`* ERROR: Command ${channelStr}:${commandKey} not found`)
            }
        }
    })

}
main()

rl.on('line', line => {
    switch (line) {
        case 'q':
            if (isRunning) {
                isRunning = false
                bot.Client.disconnect()
            }
            rl.close()
            break
        default: break
    }
})
