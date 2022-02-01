import { Command } from './command'

export type Alias = (input: [string, string[]]) => [string, string[]] | undefined

export const dealias = (commands: Record<string, Command>, aliases: Record<string, Alias[]>, input: [string, string[]]): [Command, string[]] | undefined => {
    const [rawKey, body] = input
    const key = rawKey.toLowerCase()
    if (commands[key])
        return [commands[key], body]
    else if (aliases[key]) {
        for (const alias of aliases[key]) {
            const aliasResult = alias([key, body])
            if (aliasResult)
                return dealias(commands, aliases, aliasResult)
        }
        return undefined
    }
    else return undefined
}
