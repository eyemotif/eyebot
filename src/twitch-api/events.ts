import { Bot } from '../bot'
import { Livestream } from '../livestream'
import { ChannelPointReward, getIdFromChannelName, twitchAPI } from './api'
import { responseResult, TwitchError } from './common'
import { TwitchPubSub } from './pubsub'

export class BotEventListener {
    private bot: Bot
    private pubSub: TwitchPubSub
    private channelIDs: Record<string, string> = {} // convert from id to name
    private channelPointRewards: Record<string, [ChannelPointReward, (stream: Livestream, bot: Bot, username: string) => void][]> = {}
    private accessToken: string

    constructor(bot: Bot) {
        this.bot = bot
        this.pubSub = new TwitchPubSub(message => {
            const json = JSON.parse(message)
            if (json['type'] === 'RESPONSE') {
                if (json['error'])
                    throw `Error in response ${json['nonce']}: "${json['error']}"`
                else console.log(`Listened to ${json['nonce']}.`)
            }

            // channel point reward redemption
            if (json['data']?.redemption) {
                const redemption = json['data']['redemption']
                const channel = this.channelIDs[redemption['channel_id']]
                for (const [reward, fn] of this.channelPointRewards[channel]) {
                    if (reward.ID === redemption['reward']['id']) {
                        fn(bot.Streams[channel], bot, redemption['user']['login'])
                        break
                    }
                }
            }
        }, err => console.error(`Event Listener error: ${err}`))

        if (!bot.Tokens.TwitchApi)
            throw ''
        this.accessToken = bot.Tokens.Access

        for (const channel in this.bot.Channels) {
            if (this.bot.Channels[channel].Options.twitchApi) {
                getIdFromChannelName(this.bot, channel).then(idResult => {
                    if (idResult.IsOk) {
                        const idOk = idResult.Ok
                        if (idOk === undefined) throw `API could not find Twitch channel "${channel}"`

                        // populate
                        // channel IDs
                        this.channelIDs[idOk] = channel

                        // channel point rewards
                        twitchAPI(this.accessToken, this.bot.ClientID, 'channel_points/custom_rewards', {
                            broadcaster_id: idOk
                        }).then(response => {
                            const result = responseResult(JSON.parse(response))
                            if (result.IsOk) {
                                this.channelPointRewards[channel] =
                                    result.Ok['data'].map((el: any) => [{ Name: el.title, ID: el.id }, () => { }])
                            }
                            else throw result.Error
                        })

                        // listen
                        // channel point rewards
                        this.pubSub.send(JSON.stringify({
                            type: 'LISTEN',
                            nonce: `point:${channel}`,
                            data: {
                                'topics': [`channel-points-channel-v1.${idOk}`],
                                'auth_token': this.accessToken,
                            },
                        }))
                    }
                    else throw idResult.Error
                })
            }
        }
    }

    public close() {
        this.pubSub.close('Event listener closing.')
    }

    public onChannelPointReward(channel: string, rewardName: string, callback: (stream: Livestream, bot: Bot, username: string) => void) {
        const channelPointRewards = this.channelPointRewards[channel]
        if (channelPointRewards) {
            for (let i = 0; i < channelPointRewards.length; i++) {
                if (channelPointRewards[i][0].Name == rewardName) {
                    this.channelPointRewards[channel][i][1] = callback
                    return this
                }
            }
            throw `Reward "${rewardName}" not found. Valid reward names: ${channelPointRewards.map(([reward, _]) => `"${reward.Name}"`).join(', ')}`
        }
        else throw `Channel "${channel}" not found in channel point rewards. Valid channels: ${Object.keys(this.channelPointRewards).join(', ')}`
    }
}

let eventListener: BotEventListener
let subs: ((listener: BotEventListener) => BotEventListener)[] = []

export const sub = (fn: (listener: BotEventListener) => BotEventListener) => {
    subs.push(fn)
}
export const collectSubs = (bot: Bot) => {
    eventListener = new BotEventListener(bot)
    for (const sub of subs) {
        eventListener = sub(eventListener)
    }
}
export const closeEventListener = () => { eventListener?.close() }
