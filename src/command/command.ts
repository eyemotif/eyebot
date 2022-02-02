import { Bot } from '../bot';
import { GambleInfo } from '../channel/gambling';
import { Person } from '../channel/person';
import { ChatInfo } from '../chatInfo';
import { Livestream } from '../livestream';

export interface Command {
    canRun: (bot: Bot, com: ChatInfo) => boolean
    run: (bot: Bot, com: ChatInfo, body: string[]) => CommandResult
}

export type CommandResult = {
    NewJoinedPeople?: Record<string, Person>
    NewLastChatTime?: number
    NewTopic?: string
    NewGambling?: GambleInfo
}

export const escapeUnderscores = (message: string) => {
    const nonEscapedPattern = /([^\\])_/
    const escapedPattern = /\\_/
    let result = message

    while (nonEscapedPattern.test(result))
        result = result.replace(nonEscapedPattern, '$1 ')
    while (escapedPattern.test(result))
        result = result.replace(escapedPattern, '_')

    return result
}
