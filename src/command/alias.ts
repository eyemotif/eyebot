import { Command } from './command'

export type Alias = (input: [string, string[]]) => [string, string[]] | undefined

export const dealias = (commands: Record<string, Command>, aliases: Record<string, Alias[]>, input: [string, string[]]): [Command, string[]] | undefined => {
    const [key, body] = input
    if (commands[key])
        return [commands[key], body]
    else if (aliases[key]) {
        for (const alias of aliases[key]) {
            const aliasResult = alias(input)
            if (aliasResult)
                return dealias(commands, aliases, aliasResult)
        }
        return undefined
    }
    else return undefined
}
