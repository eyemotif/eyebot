import { chatSay } from '../bot'
import { runInfoCommand } from '../channel/infoCommand'
import { Command } from './command'

export type Alias = (input: [string, string[]]) => [string, string[]] | undefined

export const dealias = (commands: Record<string, Command>, infoCommands: Record<string, string>, aliases: Record<string, Alias[]>, input: [string, string[]]): [Command, string[]] | undefined => {
    const [rawKey, body] = input
    const key = rawKey.toLowerCase()

    if (commands[key])
        return [commands[key], body]
    else if (infoCommands[key])
        return [{
            canRun: (_bot, _com) => true,
            run: (bot, com, body) => {
                const newChatTime = chatSay(bot, com, runInfoCommand(com, body, infoCommands[key]))
                return { NewLastChatTime: newChatTime }
            }
        }, body]
    else if (aliases[key]) {
        for (const alias of aliases[key]) {
            const aliasResult = alias([key, body])
            if (aliasResult)
                return dealias(commands, infoCommands, aliases, aliasResult)
        }
        return undefined
    }
    else return undefined
}
