import { Bot, chatSay } from '../bot'
import { ChatInfo } from '../chatInfo'
import { registerCommands } from '../command/register'

const canRun = (_bot: Bot, com: ChatInfo) => com.Stream.Channel.Options.fun

registerCommands(registry =>
    registry
        .register('dude', {
            canRun,
            run: (bot, com, _body) => {
                const newChatTime = chatSay(bot, com, `Sick reference to Snoop Dogg smoking weed. I can’t believe you’re so clever. You were clever enough to bring up Sm – Snoop smoking weed on your stream, because you KNEW that Snoap Dogg smoke weed, and Smoke Dogg, he is s҉m҉d҉snoop. And you KNEW that if you brought up the Smook Dogg smokin 𝚍veed, that you – people would know that! And they would 𝕔𝕝𝕒𝕡!`)
                return { NewLastChatTime: newChatTime }
            }
        })
)
