import clone from 'clone'
import { Livestream } from '../livestream'
import { Result } from '../utils'

export interface Person {
    id: string
    name: string
    pronouns: string
}

export const joinPerson = (personId: string, livestream: Livestream): Result<Record<string, Person>, string> => {
    if (!(personId in livestream.Channel.People))
        return Result.error(`Person "${personId}" not in channel "${livestream.Channel.ChannelString}"`)
    if (personId in livestream.JoinedPeople)
        return Result.error(`Person "${personId}" already joined channel "${livestream.Channel.ChannelString}"`)

    let newJoinedPeople = clone(livestream.JoinedPeople)
    newJoinedPeople[personId] = livestream.Channel.People[personId]
    return Result.ok(newJoinedPeople)
}

export const leavePerson = (personId: string, livestream: Livestream): Result<Record<string, Person>, string> => {
    if (!(personId in livestream.JoinedPeople))
        return Result.error(`Person "${personId}" not joined channel "${livestream.Channel.ChannelString}"`)

    let newJoinedPeople = clone(livestream.JoinedPeople)
    delete newJoinedPeople[personId]
    return Result.ok(newJoinedPeople)
}
