import { Bot, chatSay } from '../bot';
import { registerCommands } from '../command/register';
import { Record } from '../utils';
import { ChatInfo } from '../chatInfo';

const canRun = (_bot: Bot, _com: ChatInfo) => true

registerCommands(registry =>
    registry
        .register('commands', {
            canRun,
            run: (bot, com, _body) => {
                const commandListString =
                    Record.toPairs(bot.Commands)
                        .filter(([_, command]) => command.canRun(bot, com))
                        .map(([key, _]) => key)
                        .concat(Object.keys(com.Stream.Channel.InfoCommands))
                        .join(', ')
                const newChatTime = chatSay(bot, com, `Commands: ${commandListString}.`)
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
                const newChatTime = chatSay(bot, com, pronounsString)
                return { NewLastChatTime: newChatTime }
            }
        })
        .register('topic', {
            canRun,
            run: (bot, com, _body) => {
                if (com.Stream.Topic) {
                    const newChatTime = chatSay(bot, com, com.Stream.Topic)
                    return { NewLastChatTime: newChatTime }
                }
                else {
                    if (com.IsMod) {
                        const newChatTime = chatSay(bot, com, `@${com.Username} no topic set.`)
                        return { NewLastChatTime: newChatTime }
                    }
                    else return {}
                }
            }
        })

        .registerAlias('help', _ => ['commands', []])
        .registerAlias('today', _ => ['topic', []])
) 
