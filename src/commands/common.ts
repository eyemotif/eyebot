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
        .register('pronouns', {
            canRun,
            run: (bot, com, _body) => {
                const pronounsString =
                    Record.toPairs(com.Stream.JoinedPeople)
                        .map(([_, person]) => `- ${person.name}: ${person.pronouns}`)
                        .join(', ')
                const newChatTime = say(com, bot, pronounsString)
                return { NewLastChatTime: newChatTime }
            }
        })
        .register('topic', {
            canRun,
            run: (bot, com, _body) => {
                if (com.Stream.Topic) {
                    const newChatTime = say(com, bot, com.Stream.Topic)
                    return { NewLastChatTime: newChatTime }
                }
                else {
                    if (com.IsMod) {
                        const newChatTime = say(com, bot, `@${com.Username} no topic set.`)
                        return { NewLastChatTime: newChatTime }
                    }
                    else return {}
                }
            }
        })

        .registerAlias('help', ([_key, _body]) => ['commands', []])
        .registerAlias('today', ([_key, _body]) => ['topic', []])
) 
