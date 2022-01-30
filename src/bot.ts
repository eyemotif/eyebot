import { readdirSync, readFileSync } from 'fs'
import { Client } from 'tmi.js'
import { Channel, readChannel } from './channel/channel'
import { Arr, Record } from './utils'

export interface Bot {
    Client: Client,
    Channels: Record<string, Channel>
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
        Record.fromPairs(Arr.zipSelf(channel => readChannel(channel), channelList))

    return {
        Client: client,
        Channels: channels
    }
}
