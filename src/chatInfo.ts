import { Livestream } from './livestream'

export type ChatInfo = {
    ChannelString: string
    Username: string
    IsMod: boolean
    Stream: Livestream
    Message: string
    Emotes: Record<string, string[]>
    EmotesRaw: string
}
