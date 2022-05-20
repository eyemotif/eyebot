import { readFileSync, writeFileSync } from 'fs'
import { Obj, Result, tryJSON } from '../utils'
import { GambleInfo } from './gambling'
import { InfoCommandEnvironment } from './infoCommand'
import { ChannelOptions } from './options'
import { Person } from './person'

const channelFileKeys = ['People', 'Options', 'Gambling', 'InfoCommands', 'Queues', 'Counters', 'Quotes']

export type People = Record<string, Person>
export type InfoCommands = Record<string, string>

export interface Channel {
    ChannelString: string
    InfoCommandEnvironment: InfoCommandEnvironment

    People: People
    Options: ChannelOptions
    Gambling: GambleInfo
    InfoCommands: InfoCommands
    Queues: string[]
    Counters: Record<string, number>
    Quotes: string[]
}

export const readChannel = (channelStr: string): Result<Channel, string> => {
    const channelJson = tryJSON(readFileSync(`channels/${channelStr}.json`, 'utf8'))
    const channelObj = (channelJson ?? {}) as Channel

    if (Obj.hasKeys(channelFileKeys, channelObj)) {
        channelObj.ChannelString = channelString(channelStr)
        channelObj.InfoCommandEnvironment = InfoCommandEnvironment.Create()
        return Result.ok(channelObj)
    }
    else
        return Result.error(`Could not parse channels/${channelString(channelStr)}.json into a Channel object. Check to see if it matches the structure of channels/TEMPLATE.json.`)
}

export const writeChannel = (channel: Channel) => {
    // yeah i know this is gross. ill find a better solution later
    let objectToWrite: any = {}
    let channelObj = channel as any
    for (const key of channelFileKeys)
        objectToWrite[key] = channelObj[key]
    writeFileSync(`channels/${channel.ChannelString}.json`, JSON.stringify(objectToWrite, null, 4))
}

export const channelString = (rawChannel: string) => rawChannel.replace(/^#(.+)$/, '$1')
export const twitchChannelString = (channel: string) => channel.replace(/^([^#])(.+)$/, '#$1$2')

export const channelLocale = (channel: Channel) => channel.Options.locale ?? 'en-US'
