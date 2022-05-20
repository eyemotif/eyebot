import './commands/commandRegisters'
import './listeners/messageListeners'
import './twitch-api/event/events'

import clone from 'clone'
import { stdin, stdout } from 'process'
import readline from 'readline'
import { Bot, botSay, chatSay, createBot } from './bot'
import { channelString, writeChannel } from './channel/channel'
import { GambleInfo, setPoints } from './channel/gambling'
import { ChatInfo } from './chatInfo'
import { Alias, dealias } from './command/alias'
import { Command, CommandResult } from './command/command'
import { collectCommands } from './command/register'
import { getAllListens } from './messageListener'
import { delay, Result } from './utils'
import { closeEventListener, collectSubs } from './twitch-api/events'

let isRunning = true
let commands: Record<string, Command>
let aliases: Record<string, Alias[]>
let bot: Bot

const rl = readline.createInterface(stdin, stdout)

const rewardPoints = (channel: string): Result<GambleInfo, string> => {
    const now = Date.now()
    let newGambleInfo = clone(bot.Streams[channel].Channel.Gambling)
    const canRewardChannel = (now - bot.Streams[channel].LastRewardTime) >= bot.Channels[channel].Gambling.Info.chatRewardCooldown
    if (canRewardChannel) {
        for (const user in bot.Streams[channel].UserChatTimes) {
            const canRewardUser = (now - bot.Streams[channel].UserChatTimes[user]) <= bot.Channels[channel].Gambling.Info.chatRewardCooldown
            if (canRewardUser) {
                const giveResult = setPoints(points => points + bot.Channels[channel].Gambling.Info.chatReward, user, newGambleInfo)
                if (giveResult.IsOk)
                    newGambleInfo = giveResult.Ok
                else return Result.fromError(giveResult)
            }
        }
        // TODO: commit to mutating or not mutating
        bot.Streams[channel].LastRewardTime = now
    }
    return Result.ok(newGambleInfo)
}

const runBotDaemon = async () => {
    while (isRunning) {
        await delay(250)
        for (const channel in bot.Channels) {
            const rewardResult = rewardPoints(channel)
            if (rewardResult.IsOk) {
                bot.Streams[channel].Channel.Gambling = rewardResult.Ok
                bot.Channels[channel].Gambling = rewardResult.Ok
            }
            else console.error(`* ERROR: Could not reward points: ${rewardResult.Error}`)
            writeChannel(bot.Channels[channel])
        }
    }
    console.debug('Daemon stopped.')
}

const handleCommandResult = (channelStr: string, commandResult: CommandResult): Result<void, string> => {
    if (commandResult.NewJoinedPeople !== undefined) {
        bot.Streams[channelStr].JoinedPeople = commandResult.NewJoinedPeople
    }
    if (commandResult.NewChat !== undefined) {
        bot.Streams[channelStr].LastChatTime = commandResult.NewChat[0]
        bot.Streams[channelStr].LastBotChat = commandResult.NewChat[1]
    }
    if (commandResult.NewTopic !== undefined) {
        bot.Streams[channelStr].Topic = commandResult.NewTopic
    }
    if (commandResult.NewGambling !== undefined) {
        // TODO: better GambleInfo update handling
        bot.Channels[channelStr].Gambling = commandResult.NewGambling
        bot.Streams[channelStr].Channel.Gambling = commandResult.NewGambling
    }
    if (commandResult.NewInfoCommands !== undefined) {
        bot.Channels[channelStr].InfoCommands = commandResult.NewInfoCommands
        bot.Streams[channelStr].Channel.InfoCommands = commandResult.NewInfoCommands
    }
    if (commandResult.NewPerson !== undefined) {
        bot.Channels[channelStr].People[commandResult.NewPerson.id] = commandResult.NewPerson
        bot.Streams[channelStr].Channel.People[commandResult.NewPerson.id] = commandResult.NewPerson
    }
    if (commandResult.NewQueue !== undefined) {
        bot.Channels[channelStr].Queues.push(commandResult.NewQueue)
        bot.Streams[channelStr].Queues[commandResult.NewQueue] = []
    }
    if (commandResult.SetQueue !== undefined) {
        bot.Streams[channelStr].Queues[commandResult.SetQueue.queueName] = commandResult.SetQueue.queue
    }
    if (commandResult.RemoveQueue !== undefined) {
        delete bot.Streams[channelStr].Queues[commandResult.RemoveQueue]
        bot.Channels[channelStr].Queues = bot.Channels[channelStr].Queues.filter(name => name !== commandResult.RemoveQueue)
    }
    if (commandResult.SetCounter !== undefined) {
        bot.Channels[channelStr].Counters[commandResult.SetCounter.counterName] = commandResult.SetCounter.value
        bot.Streams[channelStr].Channel.Counters[commandResult.SetCounter.counterName] = commandResult.SetCounter.value
    }
    if (commandResult.NewQuote !== undefined) {
        bot.Channels[channelStr].Quotes.push(commandResult.NewQuote)
        bot.Streams[channelStr].Channel.Quotes.push(commandResult.NewQuote)

    }
    return Result.ok(void 0)
}

createBot().then(botResult => {
    if (!botResult.IsOk) {
        const botError = botResult.Error
        for (const error of botError)
            console.error(`ERROR while creating bot: ${error}`)
        return
    }
    bot = botResult.Ok

    bot.Client.connect()
        .then(_ => {
            const [cmnds, aliss] = collectCommands()
            commands = cmnds
            aliases = aliss
            bot.Commands = clone(commands)

            if (bot.Tokens.TwitchApi)
                collectSubs(bot)

            runBotDaemon()
        })
        .catch(reason => {
            // bot.Client.disconnect()
            console.error(`ERROR while trying to connect: ${reason}`)
        })

    bot.Client.on('message', (channel, userstate, message, self) => {
        if (self || userstate.username === undefined || userstate['message-type'] !== 'chat') return

        const channelStr = channelString(channel)
        const chatInfo: ChatInfo = {
            ChannelString: channelStr,
            Username: userstate.username,
            IsMod: userstate.mod || (channelStr === userstate.username),
            Stream: bot.Streams[channelStr],
            Message: message,
            Userstate: userstate
        }

        bot.Streams[channelStr].UserChatTimes[userstate.username] = Date.now()
        if (bot.Channels[channelStr].Options.gambling) {
            if (bot.Channels[channelStr].Gambling.Users[userstate.username] === undefined)
                bot.Channels[channelStr].Gambling.Users[userstate.username] = 0
        }

        if (message.startsWith(bot.Channels[channelStr].Options.commandPrefix)) {
            const split = message.trim().split(/ +/)
            const commandKey = split[0].substring(bot.Channels[channelStr].Options.commandPrefix.length)
            const body = split.slice(1).map(str => str.trim())

            const [command, commandBody] = dealias(commands, bot.Streams[channelStr].Channel.InfoCommands, aliases, [commandKey, body]) ?? []
            if (command && commandBody) {
                // this breaks. idk why
                // const botCopy = clone(bot, true)
                const botCopy = bot
                if (command.canRun(botCopy, chatInfo)) {
                    const commandResult = command.run(botCopy, chatInfo, commandBody)

                    const handleResult = handleCommandResult(channelStr, commandResult)
                    if (!handleResult.IsOk) {
                        if (chatInfo.IsMod) chatSay(bot, chatInfo, `@${userstate.username} Could not update stream.`)
                        console.log(`* ERROR: Could not update stream: ${handleResult.Error}`)
                    }
                }
            }
            else {
                if (chatInfo.IsMod && bot.Channels[channelStr].Options.unknownCommandMessage)
                    chatSay(bot, chatInfo, `@${userstate.username} command "${commandKey}" not found.`)
            }
        }
        else {
            if (bot.StreetServer) {
                if (bot.StreetServer.validChannel(channelStr)) {
                    bot.StreetServer.cacheUser(channelStr, userstate.username!, userstate['display-name'] ?? userstate.username!, userstate.color ?? '', userstate['badges-raw'] ?? '', userstate['badge-info-raw'] ?? '')
                    bot.StreetServer.send(channelStr, `chat ${userstate.username ?? ''} /${userstate['emotes-raw'] ?? ''} ${message}`)
                }
            }

            const listens = getAllListens(bot, chatInfo, message)
            for (const listen of listens) {
                const listenResult = handleCommandResult(channelStr, listen())
                if (!listenResult.IsOk) {
                    console.log(`* ERROR: Could not update stream: ${listenResult.Error}`)
                    break
                }
            }
        }
    })

    bot.Client.on('clearchat', channel => {
        if (bot.StreetServer && bot.StreetServer.validChannel(channelString(channel))) {
            bot.StreetServer.send(channelString(channel), 'chat.clear')
        }
    })
}).catch(e => { throw e })

rl.on('line', line => {
    switch (line) {
        case 'q':
            if (isRunning) {
                isRunning = false
                bot.Client.disconnect()
                bot.StreetServer?.close()
                closeEventListener()
            }
            rl.close()
            break
        case 'i':
            console.dir(bot)
            break
        case 'b':
            console.log('The next line will be broadcast to all channels. Input nothing to cancel.')
            rl.once('line', message => {
                if (message)
                    for (const channel in Object.keys(bot.Channels))
                        botSay(channel, true, bot, message)
            })
            break
        default: break
    }
})
