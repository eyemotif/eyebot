import { Bot, chatSay } from '../bot'
import { remInfoCommand, setInfoCommand } from '../channel/infoCommand'
import { joinPerson, leavePerson } from '../channel/person'
import { ChatInfo } from '../chatInfo'
import { escapeUnderscores } from '../command/command'
import { registerCommands } from '../command/register'
import { Queue } from '../queue'

const canRun = (_bot: Bot, com: ChatInfo) => com.IsMod

registerCommands(registry =>
    registry
        .register('ping', {
            canRun,
            run: (bot, com, _body) => {
                const newChat = chatSay(bot, com, 'Pong!')
                return { NewChat: newChat }
            }
        })
        .register('setTopic', {
            canRun,
            run: (bot, com, body) => {
                if (body.length === 0) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}settopic <topic...>.`)
                    return { NewChat: newChat }
                }
                const newTopic = escapeUnderscores(body.join(' '))
                return { NewTopic: newTopic }
            }
        })
        .register('join', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}join <person>.`)
                    return { NewChat: newChat }
                }
                const joinResult = joinPerson(body[0], com.Stream)
                if (joinResult.IsOk) {
                    const joinOk = joinResult.Ok
                    return { NewJoinedPeople: joinOk }
                }
                else {
                    const joinError = joinResult.Error
                    const newChat = chatSay(bot, com, `@${com.Username} Could not join "${body[0]}": ${joinError}.`)
                    return { NewChat: newChat }
                }
            }
        })
        .register('leave', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}leave <person>.`)
                    return { NewChat: newChat }
                }
                const leaveResult = leavePerson(body[0], com.Stream)
                if (leaveResult.IsOk) {
                    const leaveOk = leaveResult.Ok
                    return { NewJoinedPeople: leaveOk }
                }
                else {
                    const leaveError = leaveResult.Error
                    const newChat = chatSay(bot, com, `@${com.Username} Could not leave "${body[0]}": ${leaveError}.`)
                    return { NewChat: newChat }
                }
            }
        })
        .register('here', {
            canRun,
            run: (bot, com, _body) => {
                const hereString =
                    Object.keys(com.Stream.JoinedPeople)
                        .join(', ')
                const newChat = chatSay(bot, com, hereString)
                return { NewChat: newChat }
            }
        })
        .register('people', {
            canRun,
            run: (bot, com, _body) => {
                const hereString =
                    Object.keys(com.Stream.Channel.People)
                        .join(', ')
                const newChat = chatSay(bot, com, hereString)
                return { NewChat: newChat }
            }
        })
        .register('newPerson', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 3) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}newperson <id> <name> <pronouns>.`)
                    return { NewChat: newChat }
                }
                // TODO: addPerson and remPerson instead of just returning a person
                return {
                    NewPerson: {
                        id: body[0],
                        name: escapeUnderscores(body[1]),
                        pronouns: escapeUnderscores(body[2])
                    }
                }
            }
        })
        .register('setInfo', {
            canRun,
            run: (bot, com, body) => {
                if (body.length < 2) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}setinfo <command> <body...>.`)
                    return { NewChat: newChat }
                }
                return {
                    NewInfoCommands: setInfoCommand(body[0], body.slice(1).join(' '), com.Stream.Channel)
                }
            }
        })
        .register('remInfo', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}reminfo <command>.`)
                    return { NewChat: newChat }
                }
                return {
                    NewInfoCommands: remInfoCommand(body[0], com.Stream.Channel)
                }
            }
        })
        .register('nextqueue', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}nextqueue <queue-name>.`)
                    return { NewChat: newChat }
                }
                const queue = com.Stream.Queues[body[0]]
                if (queue === undefined) {
                    const newChat = chatSay(bot, com, `@${com.Username} unknown queue \"${body[0]}\".`)
                    return { NewChat: newChat }
                }
                if (queue.length > 0) {
                    const [next, newQueue] = Queue.dequeue(queue)
                    const newChat = chatSay(bot, com, `@${com.Username} Next: \"${next}\"`)
                    return { SetQueue: { queueName: body[0], queue: newQueue }, NewChat: newChat }
                }
                else {
                    const newChat = chatSay(bot, com, `@${com.Username} Queue \"${body[0]}\" is empty!`)
                    return { NewChat: newChat }
                }
            }
        })
        .register('skipqueue', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}skipqueue <queue-name>.`)
                    return { NewChat: newChat }
                }
                const queue = com.Stream.Queues[body[0]]
                if (queue === undefined) {
                    const newChat = chatSay(bot, com, `@${com.Username} unknown queue \"${body[0]}\".`)
                    return { NewChat: newChat }
                }
                if (queue.length > 0) {
                    const [_, newQueue] = Queue.dequeue(queue)
                    return { SetQueue: { queueName: body[0], queue: newQueue } }
                }
                else {
                    const newChat = chatSay(bot, com, `@${com.Username} Queue \"${body[0]}\" is empty.`)
                    return { NewChat: newChat }
                }
            }
        })
        .register('newqueue', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}newqueue <queue-name>.`)
                    return { NewChat: newChat }
                }
                if (com.Stream.Queues[body[0]] === undefined) {
                    return { NewQueue: body[0] }
                }
                else {
                    const newChat = chatSay(bot, com, `@${com.Username} queue \"${body[0]}\" already exists.`)
                    return { NewChat: newChat }
                }
            }
        })
        .register('remqueue', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}remqueue <queue-name>.`)
                    return { NewChat: newChat }
                }
                if (com.Stream.Queues[body[0]] !== undefined) {
                    return { RemoveQueue: body[0] }
                }
                else {
                    const newChat = chatSay(bot, com, `@${com.Username} queue \"${body[0]}\" does not exist.`)
                    return { NewChat: newChat }
                }
            }
        })
        .register('addCount', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}count <counter-name>.`)
                    return { NewChat: newChat }
                }
                const added = (com.Stream.Channel.Counters[body[0]] ?? -1) + 1
                const newChat = chatSay(bot, com, `${body[0]}: ${added}`)
                return { NewChat: newChat, SetCounter: { counterName: body[0], value: added } }
            }
        })
        .register('quote', {
            canRun,
            run: (bot, com, body) => {
                if (body.length === 0) {
                    const newChat = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}quote <quote_string...>.`)
                    return { NewChat: newChat }
                }
                return { NewQuote: escapeUnderscores(body.join(' ')) }
            }
        })

        .registerAlias('ignoreCommand', body => ['setInfo', body.concat('')])
        .registerAlias('nq', body => ['nextqueue', body])
        .registerAlias('skq', body => ['skipqueue', body])
)
