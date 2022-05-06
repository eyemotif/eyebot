import { Livestream } from './livestream'
import { ChatUserstate } from 'tmi.js'

export type ChatInfo = {
    ChannelString: string
    Username: string
    IsMod: boolean
    Stream: Livestream
    Message: string
    Userstate: ChatUserstate
}
