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
                const newChat = chatSay(bot, com, 'A girl.... AND a gamer? Whoa mama! Hummina hummina hummina bazooooooooing! *eyes pop out* AROOOOOOOOGA! *jaw drops tongue rolls out* WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF WOOF *tongue bursts out of the outh uncontrollably leaking face and everything in reach* WURBLWUBRLBWURblrwurblwurlbrwubrlwburlwbruwrlblwublr *tiny cupid shoots an arrow through heart* Ahhhhhhhhhhh me lady... *heart in the shape of a heart starts beating so hard you can see it through shirt* ba-bum ba-bum ba-bum ba-bum ba-bum *milk truck crashes into a bakery store in the background spiling white liquid and dough on the streets* BABY WANTS TO FUCK *inhales from the gas tank* honka honka honka honka *masturabtes furiously* ohhhh my gooooodd~')
                return { NewChat: newChat }
            }
        })
)
