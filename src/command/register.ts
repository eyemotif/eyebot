import { Alias } from './alias'
import { Command } from './command'

export class CommandRegister {
    public static Finish(register: CommandRegister): [Record<string, Command>, Record<string, Alias[]>] {
        register.isDone = false
        return [register.commands, register.aliases]
    }

    private commands: Record<string, Command>
    private aliases: Record<string, Alias[]>
    private isDone = false

    public get IsDone(): boolean {
        return this.isDone
    }

    public constructor() {
        this.commands = {}
        this.aliases = {}
    }

    public register(key: string, command: Command) {
        if (this.isDone) throw 'CommandRegister already done'

        if (this.commands[key.toLowerCase()] !== undefined)
            throw `Command "${key.toLowerCase()}" already registered`

        this.commands[key.toLowerCase()] = command
        return this
    }
    public registerAlias(key: string, alias: Alias) {
        if (this.isDone) throw 'CommandRegister already done'

        let maybeAliases = this.aliases[key.toLowerCase()]
        if (!maybeAliases) maybeAliases = []
        maybeAliases.push(alias)

        this.aliases[key.toLowerCase()] = maybeAliases
        return this
    }
}

let registry = new CommandRegister()

export const registerCommands = (fn: (commandRegister: CommandRegister) => void) => fn(registry)
export const collectCommands = () => CommandRegister.Finish(registry)
