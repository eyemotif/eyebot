import { readdirSync, readFileSync } from 'fs'
import { Client } from 'tmi.js'
import { Channel, readChannel } from './channel/channel'
import { createStream, Stream as Livestream } from './livestream'
import { Arr, Record } from './utils'

export interface Bot {
    Client: Client,
    Channels: Record<string, Channel>,
    Streams: Record<string, Livestream>
}

export const createBot = (): Bot => {
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

    const channels =
        Record.fromPairs(Arr.zipSelf(readChannel, channelList))

    const streams =
        Record.fromPairs(Arr.zipSelf(createStream, channelList))

    return {
        Client: client,
        Channels: channels,
        Streams: streams
    }
}
