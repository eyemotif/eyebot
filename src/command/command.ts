import { Bot } from '../bot';
import { InfoCommands, People } from '../channel/channel';
import { GambleInfo } from '../channel/gambling';
import { Person } from '../channel/person';
import { ChatInfo } from '../chatInfo';
import { Livestream } from '../livestream';

export interface Command {
    canRun: (bot: Bot, com: ChatInfo) => boolean
    run: (bot: Bot, com: ChatInfo, body: string[]) => CommandResult
}

export type CommandResult = {
    NewJoinedPeople?: People
    NewLastChatTime?: number
    NewTopic?: string
    NewGambling?: GambleInfo
    NewInfoCommands?: InfoCommands
    NewPerson?: Person
}

export const escapeUnderscores = (message: string) => {
    const nonEscapedPattern = /([^\\])_/g
    const escapedPattern = /\\_/g

    return message.replace(nonEscapedPattern, '$1 ').replace(escapedPattern, '_')
}
