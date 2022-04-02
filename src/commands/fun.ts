import { Bot, chatSay } from '../bot'
import { ChatInfo } from '../chatInfo'
import { registerCommands } from '../command/register'

const canRun = (_bot: Bot, com: ChatInfo) => com.Stream.Channel.Options.fun

registerCommands(registry =>
    registry
        .register('dude', {
            canRun,
            run: (bot, com, _body) => {
                const newChat = chatSay(bot, com, 'Sick reference to Snoop Dogg smoking weed. I can’t believe you’re so clever. You were clever enough to bring up Sm – Snoop smoking weed on your stream, because you KNEW that Snoap Dogg smoke weed, and Smoke Dogg, he is s҉m҉d҉snoop. And you KNEW that if you brought up the Smook Dogg smokin 𝚍veed, that you – people would know that! And they would 𝕔𝕝𝕒𝕡!')
                return { NewChat: newChat }
            }
        })
        .register('girlGamer', {
            canRun,
            run: (bot, com, _body) => {
                const newChat = chatSay(bot, com, 'hey, sorry I saw your profile and I just thought you looked cute in your picture, I really wanted to tell you that)) It\'s really rare to see girls playing video games haha! I don\'t know why its a guy thing honestly im like really against misogyny and like ill be the one in the kitchen making sandwiches.We should really play l4d2 sometime its a really cool zombie game with a lot of scary moments, but don\'t worry ill be there to protect you ;) sorry that wasnt flirting I swear Im just trying to be friendly I really like your profile picture sorry was that too far? Really sorry i\'m really shy I don\'t go out much haha add me on skype we should talk more you look really nice and fun xxx')
                return { NewChat: newChat }
            }
        })
)
