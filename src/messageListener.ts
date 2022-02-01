import { Bot } from './bot'
import { Livestream } from './livestream'

export class MessageListener {
    public static When() { return new MessageListener() }
    public static Listen(bot: Bot, stream: Livestream, message: string, messageListener: MessageListener) {
        for (const listener of messageListener.listeners)
            listener(bot, stream, message)
    }

    private listeners: ((bot: Bot, stream: Livestream, message: string) => void)[]

    private constructor() {
        this.listeners = []
    }

    public is(value: string, fn: (bot: Bot, stream: Livestream) => void) {
        this.listeners.push((bot, stream, message) => {
            if (message.toLowerCase() == value.toLowerCase())
                fn(bot, stream)
        })
        return this
    }
    public contains(value: string, fn: (bot: Bot, stream: Livestream, message: string) => void) {
        this.listeners.push((bot, stream, message) => {
            if (message.toLowerCase().includes(value.toLowerCase()))
                fn(bot, stream, message)
        })
        return this
    }
}

let listeners: MessageListener[] = []

export const registerListener = (listener: MessageListener) => {
    listeners.push(listener)
}
export const listenAll = (bot: Bot, stream: Livestream, message: string) => {
    for (const listener of listeners)
        MessageListener.Listen(bot, stream, message, listener)
}
