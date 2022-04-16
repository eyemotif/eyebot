import { Bot } from './bot'
import { ChatInfo } from './chatInfo'
import { CommandResult } from './command/command'

export class MessageListener {
    public static When() { return new MessageListener() }
    public static GetListens(bot: Bot, chatInfo: ChatInfo, message: string, messageListener: MessageListener) {
        let listens = []
        for (const listener of messageListener.listeners)
            listens.push(() => listener(bot, chatInfo, message))
        return listens
    }

    private listeners: ((bot: Bot, chatInfo: ChatInfo, message: string) => CommandResult)[]

    private constructor() {
        this.listeners = []
    }

    public is(value: string, fn: (bot: Bot, chatInfo: ChatInfo) => CommandResult) {
        this.listeners.push((bot, chatInfo, message) => {
            if (message.toLowerCase() === value.toLowerCase())
                return fn(bot, chatInfo)
            else return {}
        })
        return this
    }
    public contains(value: string, fn: (bot: Bot, chatInfo: ChatInfo, message: string) => CommandResult) {
        this.listeners.push((bot, chatInfo, message) => {
            if (message.toLowerCase().includes(value.toLowerCase()))
                return fn(bot, chatInfo, message)
            else return {}
        })
        return this
    }
    public matches(value: RegExp, fn: (bot: Bot, chatInfo: ChatInfo, message: string) => CommandResult) {
        this.listeners.push((bot, chatInfo, message) => {
            if (value.test(message))
                return fn(bot, chatInfo, message)
            else return {}
        })
        return this
    }
}

let listeners: MessageListener[] = []

export const registerListener = (listener: MessageListener) => {
    listeners.push(listener)
}
export const getAllListens = (bot: Bot, chatInfo: ChatInfo, message: string): (() => CommandResult)[] => {
    let listens: (() => CommandResult)[][] = []
    for (const listener of listeners)
        listens.push(MessageListener.GetListens(bot, chatInfo, message, listener))
    return listens.flat()
}
