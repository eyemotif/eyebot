import { Bot, chatSay } from '../bot'
import { ChatInfo } from '../chatInfo'
import { registerCommands } from '../command/register'

const canRun = (_bot: Bot, com: ChatInfo) => com.Stream.Channel.Options.street
const ifMod = (_bot: Bot, com: ChatInfo) => com.Stream.Channel.Options.street && com.IsMod


registerCommands(registry =>
    registry
        .register('sounds', {
            canRun,
            run: (bot, com, _body) => {
                bot.StreetServer!.send(com.ChannelString, '~components')
                bot.StreetServer!.getSockets(com.ChannelString)[0].once('message', data => {
                    const components = JSON.parse(data.toString())['audio']
                    chatSay(bot, com, `Sounds: ${components.join(', ')}`)
                })
                return {}
            }
        })
        .register('flush', {
            canRun: ifMod,
            run: (bot, com, body) => {
                if (body.length === 1)
                    bot.StreetServer!.send(com.ChannelString, `~flush ${body[0]}`)
                return {}
            }
        })
)
