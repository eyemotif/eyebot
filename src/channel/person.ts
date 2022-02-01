import { Livestream } from '../livestream'
import { Obj, Result } from '../utils'

export type Person = {
    id: string
    name: string
    pronouns: string
}

export const joinPerson = (personId: string, livestream: Livestream): Result<Livestream, string> => {
    if (!(personId in livestream.Channel.People))
        return Result.error(`Person "${personId}" not in channel "${livestream.Channel.ChannelString}"`)
    if (personId in livestream.JoinedPeople)
        return Result.error(`Person "${personId}" already joined channel "${livestream.Channel.ChannelString}"`)

    let newLivestream = Obj.copy(livestream)
    newLivestream.JoinedPeople[personId] = livestream.Channel.People[personId]
    return Result.ok(newLivestream)
}

export const leavePerson = (personId: string, livestream: Livestream): Result<Livestream, string> => {
    if (!(personId in livestream.JoinedPeople))
        return Result.error(`Person "${personId}" not joined channel "${livestream.Channel.ChannelString}"`)
    
    let newLivestream = Obj.copy(livestream)
    delete newLivestream.JoinedPeople[personId]
    return Result.ok(newLivestream)
}