import { Bot, chatSay } from '../bot'
import { ChatInfo } from '../chatInfo'
import { Command } from '../command/command'
import { registerCommands } from '../command/register'
import { sendToStreamfunServer } from '../streamfun'

const canRun = (_bot: Bot, com: ChatInfo) => com.Stream.Channel.Options.streamfun

const audioCommand = (componentName: string): Command => {
    return {
        canRun,
        run: (_bot, com) => {
            sendToStreamfunServer(com.Stream.StreamfunConnection!, `audio ${componentName}`)
            return {}
        }
    }
}

registerCommands(registry =>
    registry
        .register('sounds', {
            canRun,
            run: (bot, com) => {
                const newChat = chatSay(bot, com, 'Sounds: !warpstar !boom !thankyou !powerup !treasure !cheer !bonk')
                return { NewChat: newChat }
            }
        })
        .register('warpstar', audioCommand('warpstar'))
        .register('boom', audioCommand('vineboom'))
        .register('thankyou', audioCommand('thankyou'))
        .register('powerup', audioCommand('pwup'))
        .register('treasure', audioCommand('treasure'))
        .register('cheer', audioCommand('cheer'))
        .register('bonk', audioCommand('bonk'))
)
