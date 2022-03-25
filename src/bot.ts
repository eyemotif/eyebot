import { existsSync, readdirSync, readFileSync } from 'fs'
import { Client } from 'tmi.js'
import { Channel, channelString, readChannel, twitchChannelString } from './channel/channel'
import { ChatInfo } from './chatInfo'
import { Command } from './command/command'
import { createStream, Livestream } from './livestream'
import { Arr, Record, Result } from './utils'

export interface Bot {
    Client: Client
    Channels: Record<string, Channel>
    Streams: Record<string, Livestream>
    Commands: Record<string, Command>
}

type Credentials = {
    TwitchChannel: string
    ClientID: string
    OAuth: string
}

const getCredentials = (): Result<Credentials, string> => {
    const filesList = ['creds/twitchchannel', 'creds/clientid', 'creds/oauth']

    const filesNotExist =
        filesList.filter(path => !existsSync(path))
    if (filesNotExist.length > 0)
        return Result.error(`Files ${filesNotExist.join(', ')} do not exist. Please see the readme on how to configure the bot.`)

    const fileReads = filesList.map(path => readFileSync(path, 'utf8'))

    const filesEmpty = fileReads.filter(file => file.trim().length === 0)
    if (filesEmpty.length > 0)
        return Result.error(`Files ${filesEmpty.join(', ')} are empty. Please see the readme on how to configure the bot.`)

    return Result.ok({
        TwitchChannel: fileReads[0],
        ClientID: fileReads[1],
        OAuth: fileReads[2]
    })
}

export const createBot = (): Result<Bot, string[]> => {
    const credsResult = getCredentials()
    if (!credsResult.IsOk)
        return Result.error([credsResult.Error])
    const creds = credsResult.Ok

    const channelList =
        readdirSync('channels')
            .filter(path => /.+\.json/.test(path))
            .filter(path => path !== 'TEMPLATE.json')
            .map(path => path.replace(/(.+)\.json/, '$1'))

    if (channelList.length === 0)
        return Result.error(['Did not find any channels to create. Please see the readme on how to configure the bot.'])

    const client = new Client({
        options: {
            debug: true,
            clientId: creds.ClientID,
        },
        identity: {
            username: creds.ClientID,
            password: creds.OAuth,
        },
        channels: [...channelList],
    })

    const channelsResult = Result.all(channelList.map(readChannel))

    return Result.map(channelsOk => {
        const channels = Record.fromPairs(Arr.zip(channelList, channelsOk))
        const streams =
            Record.fromPairs(Arr.zip(channelList, channelsOk.map(createStream)))

        return {
            Client: client,
            Channels: channels,
            Streams: streams,
            Commands: {},
        }
    }, channelsResult)
}

export const botSay = (channel: string, isMod: boolean, bot: Bot, message: string, force: boolean = false): [number, string] => {
    const stream = bot.Streams[channelString(channel)]
    const now = Date.now()

    const normalChatCondition = ((now - stream.LastChatTime) >= stream.Channel.Options.nonModChatDelay) && (message !== stream.LastBotChat)

    if (force || isMod || normalChatCondition) {
        bot.Client.say(twitchChannelString(channel), message)
        return [now, message]
    }
    else return [stream.LastChatTime, stream.LastBotChat]
}

export const chatSay = (bot: Bot, chatInfo: ChatInfo, message: string, force: boolean = false) =>
    botSay(chatInfo.ChannelString, chatInfo.IsMod, bot, message, force)
