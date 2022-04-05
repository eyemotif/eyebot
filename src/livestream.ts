import { Channel } from './channel/channel'
import { Person } from './channel/person'
import { connectToStreamfunServer, StreamfunConnection } from './streamfun'
import { Record } from './utils'

export type Livestream = {
    Channel: Channel
    JoinedPeople: Record<string, Person>
    LastChatTime: number
    LastRewardTime: number
    Topic: string | undefined
    UserChatTimes: Record<string, number>
    Queues: Record<string, string[]>
    LastBotChat: string
    StreamfunConnection: StreamfunConnection | undefined
}

// temporary until the streamfun functionality is better
const defaultConnect = () =>
    connectToStreamfunServer(
        undefined,
        err => console.error(`Streamfun error: ${err}`),
        message => console.log(`Streamfun message: ${message}`)
    )

export const createStream = (channel: Channel): Livestream => {
    return {
        Channel: channel,
        JoinedPeople: {
            'me': channel.People['me']
        },
        LastChatTime: 0,
        LastRewardTime: 0,
        Topic: undefined,
        UserChatTimes: {},
        Queues: Record.fromPairs(channel.Queues.map(name => [name, []])),
        LastBotChat: '',
        StreamfunConnection:
            channel.Options.streamfun ? defaultConnect() : undefined,
    }
}
