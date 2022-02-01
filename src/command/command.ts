import { Bot } from '../bot';
import { Person } from '../channel/person';
import { Livestream } from '../livestream';

export interface Command {
    canRun: (bot: Bot, com: CommandInput) => boolean
    run: (bot: Bot, com: CommandInput, body: string[]) => CommandResult
}

export type CommandInput = {
    Username: string
    IsMod: boolean
    Stream: Livestream
}

export type CommandResult = {
    NewJoinedPerson?: Person
    NewLastChatTime?: number
    NewTopic?: string
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
