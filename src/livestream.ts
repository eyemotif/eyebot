import { Channel } from './channel/channel'
import { Person } from './channel/person'

export type Stream = {
    joinedPeople: Record<string, Person>
    lastChatTime: number
    lastRewardTime: number
    topic: string | undefined
    userChatTimes: Record<string, number>
}

export const createStream = (channel: Channel): Stream => {
    return {
        joinedPeople: {
            'me': channel.People['me']
        },
        lastChatTime: 0,
        lastRewardTime: 0,
        topic: undefined,
        userChatTimes: {}
    }
}
