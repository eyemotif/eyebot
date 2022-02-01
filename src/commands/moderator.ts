import { Bot, botSay } from '../bot'
import { CommandInput } from '../command/command'
import { registerCommands } from '../command/register'

const canRun = (_bot: Bot, com: CommandInput) => com.IsMod
const say = (com: CommandInput, bot: Bot, message: string) => botSay(com.Stream.Channel.ChannelString, com.IsMod, bot, message)

registerCommands(registry =>
    registry
        .register('ping', {
            canRun,
            run: (bot, com, _body) => {
                const newChatTime = say(com, bot, 'Pong!')
                return { NewLastChatTime: newChatTime }
            }
        })
)
