import { Bot } from '../bot'
import { InfoCommands, People } from '../channel/channel'
import { GambleInfo } from '../channel/gambling'
import { Person } from '../channel/person'
import { ChatInfo } from '../chatInfo'

export interface Command {
    canRun: (bot: Bot, com: ChatInfo) => boolean
    run: (bot: Bot, com: ChatInfo, body: string[]) => CommandResult
}

export type CommandResult = {
    NewJoinedPeople?: People
    NewChat?: [number, string]
    NewTopic?: string
    NewGambling?: GambleInfo
    NewInfoCommands?: InfoCommands
    NewPerson?: Person
    NewQueue?: string
    SetQueue?: { queueName: string, queue: string[] }
    RemoveQueue?: string
    SetCounter?: { counterName: string, value: number }
    NewQuote?: string
}

export const escapeUnderscores = (message: string) => {
    const nonEscapedPattern = /([^\\])_/g
    const escapedPattern = /\\_/g

    return message.replace(nonEscapedPattern, '$1 ').replace(escapedPattern, '_')
}
