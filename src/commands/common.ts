import { Bot, chatSay } from '../bot'
import { registerCommands } from '../command/register'
import { Record } from '../utils'
import { ChatInfo } from '../chatInfo'
import { Queue } from '../queue'
import { escapeUnderscores } from '../command/command'

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
        .register('addtoqueue', {
            canRun,
            run: (bot, com, body) => {
                if (body.length < 2) {
                    const newChatTime = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}addtoqueue <queue-name> <content...>.`)
                    return { NewLastChatTime: newChatTime }
                }
                const queue = com.Stream.Queues[body[0]]
                if (queue === undefined) {
                    if (com.IsMod) {
                        const newChatTime = chatSay(bot, com, `@${com.Username} unknown queue \"${body[0]}\".`)
                        return { NewLastChatTime: newChatTime }
                    }
                    else return {}
                }
                const newQueue = Queue.enqueue(escapeUnderscores(body.slice(1).join(' ')), queue)
                return { SetQueue: { queueName: body[0], queue: newQueue } }
            }
        })

        .registerAlias('help', _ => ['commands', []])
        .registerAlias('today', _ => ['topic', []])
        .registerAlias('sr', body => ['addtoqueue', ['songrequests'].concat(body)])
) 
