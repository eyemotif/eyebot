import { readdirSync, readFileSync } from 'fs'
import { Client } from 'tmi.js'
import { Channel, readChannel } from './channel/channel'
import { createStream, Livestream } from './livestream'
import { Arr, Record, Result } from './utils'

export interface Bot {
    Client: Client,
    Channels: Record<string, Channel>,
    Streams: Record<string, Livestream>,
}

export const createBot = (): Result<Bot, string[]> => {
    const channelList =
        readdirSync('channels')
            .filter(/.+\.json/.test)
            .filter(path => path !== 'TEMPLATE.json')
            .map(path => path.replace(/(.+)\.json/, '$1'))

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
            Streams: streams
        }
    }, channelsResult)
}