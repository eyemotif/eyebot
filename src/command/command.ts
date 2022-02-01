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
    NewJoinedPeople?: Record<string, Person>
    NewLastChatTime?: number
    NewTopic?: string
}
