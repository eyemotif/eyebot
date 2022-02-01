import { botSay } from '../bot';
import { MessageListener, registerListener } from '../messageListener';

// TODO: update bot's last chat time in these
registerListener(
    MessageListener.When()
        .is('egg', (bot, stream) => {
            botSay(stream.Channel.ChannelString, false, bot, '🥚')
        })
)
