import { Bot, botSay } from '../bot';
import { registerCommands } from '../command/register';
import { CommandInput, CommandResult } from '../command/command';
import { Record } from '../utils';

const canRun = (_bot: Bot, _com: CommandInput) => true
const say = (com: CommandInput, bot: Bot, message: string) => botSay(com.Stream.Channel.ChannelString, com.IsMod, bot, message)

registerCommands(registry =>
    registry
        .register('commands', {
            canRun,
            run: (bot, com, _body) => {
                const commandListString =
                    Record.toPairs(bot.Commands)
                        .filter(([_, command]) => command.canRun(bot, com))
                        .map(([key, _]) => key)
                        .join(', ')
                const newChatTime = say(com, bot, `Commands: ${commandListString}.`)
                return { NewLastChatTime: newChatTime }
            }
        })
    
    .registerAlias('help', ([key, _body]) => ['commands', []])
) 
