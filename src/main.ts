import { CommandRegister } from './command/register'

let registry = new CommandRegister()

export const registerCommands = (fn: (commandRegister: CommandRegister | undefined) => CommandRegister | undefined) => {
    registry = fn(registry.IsDone ? registry : undefined) ?? registry
}
export const collectCommands = () => CommandRegister.Finish(registry)

const main = () => {
    console.log('Hello, World!')
}
main()
