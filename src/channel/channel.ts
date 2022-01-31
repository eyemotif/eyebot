import { readFileSync, writeFileSync } from 'fs'
import { Obj, Result, tryJSON } from '../utils'
import { GambleInfo } from './gambling'
import { ChannelOptions } from './options'
import { Person } from './person'

const channelFileKeys = ['People', 'Options', 'Gambling', 'InfoCommands']

export type Channel = {
    ChannelString: string

    People: Record<string, Person>
    Options: ChannelOptions
    Gambling: GambleInfo
    InfoCommands: Record<string, string>
}

export const readChannel = (channelString: string): Result<Channel, string> => {
    const channelJson = tryJSON(readFileSync(`channels/${channelString}.json`, 'utf8'))
    const channelObj = (channelJson ?? {}) as Channel

    if (Obj.hasKeys(channelFileKeys, channelObj)) {
        channelObj.ChannelString = channelString
        return Result.ok(channelObj)
    }
    else
        return Result.error(`Could not parse channels/${channelString}.json into a Channel object. Check to see if it matches the structure of channels/TEMPLATE.json.`)
}

export const writeChannel = (channel: Channel) => {
    let objectToWrite: any = {}
    let channelObj = channel as any
    for (const key of channelFileKeys)
        objectToWrite[key] = channelObj[key]
    writeFileSync(`channels/${channel.ChannelString}.json`, JSON.stringify(objectToWrite, null, 4))
}

export const channelString = (rawChannel: string) => rawChannel.replace(/^#(.+)$/, '$1')
export const twitchChannelString = (channel: string) => channel.replace(/^([^#])(.+)$/, '#$1$2')
