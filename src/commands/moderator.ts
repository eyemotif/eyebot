import { Bot, chatSay } from '../bot'
import { joinPerson, leavePerson } from '../channel/person'
import { ChatInfo } from '../chatInfo'
import { escapeUnderscores } from '../command/command'
import { registerCommands } from '../command/register'

const canRun = (_bot: Bot, com: ChatInfo) => com.IsMod

registerCommands(registry =>
    registry
        .register('ping', {
            canRun,
            run: (bot, com, _body) => {
                const newChatTime = chatSay(bot, com, 'Pong!')
                return { NewLastChatTime: newChatTime }
            }
        })
        .register('setTopic', {
            canRun,
            run: (bot, com, body) => {
                if (body.length == 0) {
                    const newChatTime = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}settopic <topic...>.`)
                    return { NewLastChatTime: newChatTime }
                }
                const newTopic = escapeUnderscores(body.join(' '))
                return { NewTopic: newTopic }
            }
        })
        .register('join', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChatTime = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}join <person>.`)
                    return { NewLastChatTime: newChatTime }
                }
                const joinResult = joinPerson(body[0], com.Stream)
                if (joinResult.IsOk) {
                    const joinOk = joinResult.Ok
                    return { NewJoinedPeople: joinOk }
                }
                else {
                    const joinError = joinResult.Error
                    const newChatTime = chatSay(bot, com, `@${com.Username} Could not join "${body[0]}": ${joinError}.`)
                    return { NewLastChatTime: newChatTime }
                }
            }
        })
        .register('leave', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChatTime = chatSay(bot, com, `Usage: ${com.Stream.Channel.Options.commandPrefix}leave <person>.`)
                    return { NewLastChatTime: newChatTime }
                }
                const leaveResult = leavePerson(body[0], com.Stream)
                if (leaveResult.IsOk) {
                    const leaveOk = leaveResult.Ok
                    return { NewJoinedPeople: leaveOk }
                }
                else {
                    const leaveError = leaveResult.Error
                    const newChatTime = chatSay(bot, com, `@${com.Username} Could not leave "${body[0]}": ${leaveError}.`)
                    return { NewLastChatTime: newChatTime }
                }
            }
        })
        .register('here', {
            canRun,
            run: (bot, com, _body) => {
                const hereString =
                    Object.keys(com.Stream.JoinedPeople)
                        .join(', ')
                const newChatTime = chatSay(bot, com, hereString)
                return { NewLastChatTime: newChatTime }
            }
        })
        .register('people', {
            canRun,
            run: (bot, com, _body) => {
                const hereString =
                    Object.keys(com.Stream.Channel.People)
                        .join(', ')
                const newChatTime = chatSay(bot, com, hereString)
                return { NewLastChatTime: newChatTime }
            }
        })
)
