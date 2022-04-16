import { Bot, chatSay } from '../bot'
import { ChatInfo } from '../chatInfo'
import { registerCommands } from '../command/register'

const canRun = (_bot: Bot, com: ChatInfo) => com.Stream.Channel.Options.streamfun
const ifMod = (_bot: Bot, com: ChatInfo) => com.Stream.Channel.Options.streamfun && com.IsMod


registerCommands(registry =>
    registry
        .register('sounds', {
            canRun,
            run: (bot, com, _body) => {
                com.Stream.StreamfunConnection!.socket.send('components')
                com.Stream.StreamfunConnection!.socket.once('message', data => {
                    const components = JSON.parse(data.toString())['audio']
                    chatSay(bot, com, `Sounds: ${components.join(', ')}`)
                })
                return {}
            }
        })
        .register('flush', {
            canRun: ifMod,
            run: (_bot, com, body) => {
                if (body.length === 1)
                    com.Stream.StreamfunConnection!.socket.send(`flush ${body[0]}`)
                return {}
            }
        })
        .register('volume', {
            canRun: ifMod,
            run: (_bot, com, body) => {
                if (body.length === 2)
                    com.Stream.StreamfunConnection!.socket.send(`volume ${body[0]} ${body[1]}`)
                return {}
            }
        })
)
