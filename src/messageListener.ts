import { Bot } from './bot'
import { ChatInfo } from './chatInfo'
import { Livestream } from './livestream'

export class MessageListener {
    public static When() { return new MessageListener() }
    public static Listen(bot: Bot, chatInfo: ChatInfo, message: string, messageListener: MessageListener) {
        for (const listener of messageListener.listeners)
            listener(bot, chatInfo, message)
    }

    private listeners: ((bot: Bot, chatInfo: ChatInfo, message: string) => void)[]

    private constructor() {
        this.listeners = []
    }

    public is(value: string, fn: (bot: Bot, chatInfo: ChatInfo) => void) {
        this.listeners.push((bot, chatInfo, message) => {
            if (message.toLowerCase() == value.toLowerCase())
                fn(bot, chatInfo)
        })
        return this
    }
    public contains(value: string, fn: (bot: Bot, chatInfo: ChatInfo, message: string) => void) {
        this.listeners.push((bot, chatInfo, message) => {
            if (message.toLowerCase().includes(value.toLowerCase()))
                fn(bot, chatInfo, message)
        })
        return this
    }
}

let listeners: MessageListener[] = []

export const registerListener = (listener: MessageListener) => {
    listeners.push(listener)
}
export const listenAll = (bot: Bot, chatInfo: ChatInfo, message: string) => {
    for (const listener of listeners)
        MessageListener.Listen(bot, chatInfo, message, listener)
}
