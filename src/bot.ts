import { readdirSync, readFileSync } from 'fs'
import { Client } from 'tmi.js'
import { Channel, channelString, readChannel, twitchChannelString } from './channel/channel'
import { Command } from './command/command'
import { createStream, Livestream } from './livestream'
import { Arr, Record, Result } from './utils'

export interface Bot {
    Client: Client
    Channels: Record<string, Channel>
    Streams: Record<string, Livestream>
    Commands: Record<string, Command>
}

export const createBot = (): Result<Bot, string[]> => {
    const channelList =
        readdirSync('channels')
            .filter(path => /.+\.json/.test(path))
            .filter(path => path !== 'TEMPLATE.json')
            .map(path => path.replace(/(.+)\.json/, '$1'))

    if (channelList.length === 0)
        return Result.error(['Did not find any channels to create'])

    const client = new Client({
        options: {
            debug: true,
            clientId: readFileSync('creds/clientid', 'utf8'),
        },
        identity: {
            username: readFileSync('creds/twitchchannel', 'utf8'),
            password: readFileSync('creds/oauth', 'utf8')
        },
        channels: [...channelList]
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

export const botSay = (channel: string, isMod: boolean, bot: Bot, message: string, force: boolean = false): number => {
    const stream = bot.Streams[channelString(channel)]
    const now = Date.now()

    if (force || isMod || ((now - stream.LastChatTime) >= stream.Channel.Options.nonModChatDelay)) {
        bot.Client.say(twitchChannelString(channel), message)
        return now
    }
    else return stream.LastChatTime
}
