import { Bot, botSay } from '../bot';
import { registerCommands } from '../main';
import { CommandInput, CommandResult } from './command';

const canRun = (_bot: Bot, _com: CommandInput) => true

registerCommands(registry =>
    registry
        .register('ping', {
            canRun,
            run: (bot, com, _body): CommandResult => {
                const newChatTime = botSay(com.Stream.Channel.ChannelString, com.IsMod, bot, 'Pong!')
                return { NewLastChatTime: newChatTime }
            }
        })
) 
