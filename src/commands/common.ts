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
                const newChat = chatSay(bot, com, `Commands: ${commandListString}.`)
                return { NewChat: newChat }
            }
        })
        .register('pronouns', {
            canRun,
            run: (bot, com, _body) => {
                const pronounsString =
                    Record.toPairs(com.Stream.JoinedPeople)
                        .map(([_, person]) => `- ${person.name}: ${person.pronouns}`)
                        .join(', ')
                const newChat = chatSay(bot, com, pronounsString)
                return { NewChat: newChat }
            }
        })
        .register('topic', {
            canRun,
            run: (bot, com, _body) => {
                if (com.Stream.Topic) {
                    const newChat = chatSay(bot, com, com.Stream.Topic)
                    return { NewChat: newChat }
                }
                else {
                    if (com.IsMod) {
                        const newChat = chatSay(bot, com, `@${com.Username} no topic set.`)
                        return { NewChat: newChat }
                    }
                    else return {}
                }
            }
        })
        .register('addtoqueue', {
            canRun,
            run: (bot, com, body) => {
                if (body.length < 2) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}addtoqueue <queue-name> <content...>.`)
                    return { NewChat: newChat }
                }
                const queue = com.Stream.Queues[body[0]]
                if (queue === undefined) {
                    if (com.IsMod) {
                        const newChat = chatSay(bot, com, `@${com.Username} unknown queue \"${body[0]}\".`)
                        return { NewChat: newChat }
                    }
                    else return {}
                }
                const newQueue = Queue.enqueue(escapeUnderscores(body.slice(1).join(' ')), queue)
                return { SetQueue: { queueName: body[0], queue: newQueue } }
            }
        })
        .register('count', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}count <counter-name>.`)
                    return { NewChat: newChat }
                }
                if (com.Stream.Channel.Counters[body[0]] === undefined) {
                    if (com.IsMod) {
                        const newChat = chatSay(bot, com, `Counter "${body[0]}" not found!`)
                        return { NewChat: newChat }
                    }
                    else return {}
                }
                const newChat = chatSay(bot, com, `${body[0]}: ${com.Stream.Channel.Counters[body[0]]}`)
                return { NewChat: newChat }
            }
        })

        .registerAlias('help', _ => ['commands', []])
        .registerAlias('today', _ => ['topic', []])
        .registerAlias('sr', body => ['addtoqueue', ['songrequests'].concat(body)])
) 
