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
        this.commands[key] = command
        return this
    }
}
