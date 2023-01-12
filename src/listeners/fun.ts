import { chatSay } from '../bot'
import { MessageListener, registerListener } from '../messageListener'

const replace = (search: string, replaceWith: string, words: string[]) =>
    words
        .filter(word => word.toLowerCase().includes(search))
        .map(word => `${word.toLowerCase().replace(search, replaceWith)}*`)
        .join(' ')
        .trim()


registerListener(
    MessageListener.When()
        .is('egg', (bot, chatInfo) => {
            if (chatInfo.Stream.Channel.Options.fun)
                return { NewChat: chatSay(bot, chatInfo, '🥚') }
            else return {}
        })
        .is('...', (bot, chatInfo) => {
            if (chatInfo.Stream.Channel.Options.fun)
                return { NewChat: chatSay(bot, chatInfo, '...') }
            else return {}
        })
        .is('frong', (bot, chatInfo) => {
            if (chatInfo.Stream.Channel.Options.fun)
                return { NewChat: chatSay(bot, chatInfo, 'frong') }
            else return {}
        })

        .contains('bot_works', (bot, chatInfo, _message) => {
            if (chatInfo.Stream.Channel.Options.fun)
                return { NewChat: chatSay(bot, chatInfo, `This bot has no bugs :)`) }
            else return {}
        })
        .contains('get rotated', (bot, chatInfo, _message) => {
            if (chatInfo.Stream.Channel.Options.fun)
                return { NewChat: chatSay(bot, chatInfo, 'get rotated idiot 🔄') }
            else return {}
        })
        // .contains('gamer', (bot, chatInfo, _message) => {
        //     if (chatInfo.Stream.Channel.Options.fun)
        //         return {NewChat: chatSay(bot, chatInfo, `@${chatInfo.Username} gaymer*`)}
        //         else return {}
        // })
        // .contains('brain', (bot, chatInfo, _message) => {
        //     if (chatInfo.Stream.Channel.Options.fun)
        //         return {NewChat: chatSay(bot, chatInfo, `@${chatInfo.Username} brian*`)}
        //     else return {}
        // })
        // .contains('cigarette', (bot, chatInfo, _message) => {
        //     if (chatInfo.Stream.Channel.Options.fun)
        //         return { NewChat: chatSay(bot, chatInfo, `@${chatInfo.Username} cig of rette*`) }
        //     else return {}
        // })
        .contains('micro', (bot, chatInfo, message) => {
            if (chatInfo.Stream.Channel.Options.fun) {
                const replaced = replace('micro', ' michael ', message.split(' '))
                return { NewChat: chatSay(bot, chatInfo, `${replaced}`) }
            }
            else return {}
        })
)
