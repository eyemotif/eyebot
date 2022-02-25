import { chatSay } from '../bot';
import { MessageListener, registerListener } from '../messageListener';

const replace = (search: string, replaceWith: string, words: string[]) =>
    words
        .filter(word => word.toLowerCase().includes(search))
        .map(word => `${word.toLowerCase().replace(search, replaceWith)}*`)
        .join(' ')
        .trim()


// TODO: update bot's last chat time in these
registerListener(
    MessageListener.When()
        .is('egg', (bot, chatInfo) => {
            if (chatInfo.Stream.Channel.Options.fun)
                chatSay(bot, chatInfo, '🥚')
        })
        .is('...', (bot, chatInfo) => {
            if (chatInfo.Stream.Channel.Options.fun)
                chatSay(bot, chatInfo, '...')
        })
        .is('frong', (bot, chatInfo) => {
            if (chatInfo.Stream.Channel.Options.fun)
                chatSay(bot, chatInfo, 'frong')
        })

        .contains('bot_works', (bot, chatInfo, _message) => {
            if (chatInfo.Stream.Channel.Options.fun)
                chatSay(bot, chatInfo, `This bot has no bugs :)`)
        })
        .contains('get rotated', (bot, chatInfo, _message) => {
            if (chatInfo.Stream.Channel.Options.fun)
                chatSay(bot, chatInfo, 'get rotated idiot 🔄')
        })
        .contains('gamer', (bot, chatInfo, _message) => {
            if (chatInfo.Stream.Channel.Options.fun)
                chatSay(bot, chatInfo, `@${chatInfo.Username} gaymer*`)
        })
        // .contains('brain', (bot, chatInfo, _message) => {
        //     if (chatInfo.Stream.Channel.Options.fun)
        //         chatSay(bot, chatInfo, `@${chatInfo.Username} brian*`)
        // })
        .contains('cigarette', (bot, chatInfo, _message) => {
            if (chatInfo.Stream.Channel.Options.fun)
                chatSay(bot, chatInfo, `@${chatInfo.Username} cig of rette*`)
        })
        .contains('micro', (bot, chatInfo, message) => {
            if (chatInfo.Stream.Channel.Options.fun) {
                const replaced = replace('micro', ' michael ', message.split(' '))
                chatSay(bot, chatInfo, `@${chatInfo.Username} ${replaced}`)
            }
        })
)
