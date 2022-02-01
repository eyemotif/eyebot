import { Command } from './command'

export class CommandRegister {
    public static Finish(register: CommandRegister) {
        register.isDone = false
        return register.commands
    }

    private commands: Record<string, Command>
    private isDone = false

    public get IsDone(): boolean {
        return this.isDone
    }

    public constructor() {
        this.commands = {}
    }

    public register(key: string, command: Command) {
        if (this.isDone) throw 'CommandRegister already done'

        if (this.commands[key.toLowerCase()] !== undefined)
            throw `Command "${key.toLowerCase()}" already registered`

        this.commands[key.toLowerCase()] = command
        return this
    }
}

let registry = new CommandRegister()

export const registerCommands = (fn: (commandRegister: CommandRegister) => void) => fn(registry)
export const collectCommands = () => CommandRegister.Finish(registry)
