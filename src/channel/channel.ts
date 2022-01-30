import { readFileSync } from 'fs'
import { Obj, Result, tryJSON } from '../utils'
import { GambleInfo } from './gambling'
import { ChannelOptions } from './options'
import { Person } from './person'

export type Channel = {
    People: Record<string, Person>
    Options: ChannelOptions
    Gambling: GambleInfo
    InfoCommands: Record<string, string>
}

export const readChannel = (channel: string): Result<Channel, string> => {
    const channelJson = tryJSON(readFileSync(`channels/${channel}.json`, 'utf8'))
    const channelObj = (channelJson ?? {}) as Channel

    if (Obj.hasKeys(['People'], channelObj))
        return Result.ok(channelObj)
    else
        return Result.error(`Could not parse channels/${channel}.json into a Channel object. Check to see if it matches the structure of channels/TEMPLATE.json.`)
}
