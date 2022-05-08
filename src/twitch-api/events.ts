import { Bot } from '../bot'
import { Livestream } from '../livestream'
import { ChannelPointReward, getIdFromChannelName, twitchAPI } from './api'
import { responseResult } from './common'
import { TwitchPubSub } from './pubsub'

type PopulationInfo = {
    ChannelPoints: boolean
}

export type ChannelPointCallback = (stream: Livestream, bot: Bot, username: string, input: string | undefined) => void
export type ChannelSubscriptionCallback = (stream: Livestream, bot: Bot, username: string, months: number, giftTo: string | undefined, emoteReplacer: string | undefined, input: string | undefined) => void
export type ChannelCheerCallback = (stream: Livestream, bot: Bot, username: string, amount: number, input: string) => void

export class BotEventListener {
    private bot: Bot
    private pubSub: TwitchPubSub
    private channelIDs: Record<string, string> = {} // convert from id to name
    private accessToken: string
    private channelsNotPopulated: Record<string, PopulationInfo> = {}
    public onReady = () => { }

    private channelPointRewards: Record<string, [ChannelPointReward, ChannelPointCallback][]> = {}
    private channelSubscriptions: Record<string, ChannelSubscriptionCallback[]> = {}
    private channelCheers: Record<string, ChannelCheerCallback[]> = {}

    cleanNotPopulatedList = () => {
        for (const channel in this.channelsNotPopulated) {
            const info = this.channelsNotPopulated[channel]
            if (info.ChannelPoints) delete this.channelsNotPopulated[channel]
        }
        if (Object.keys(this.channelsNotPopulated).length === 0)
            this.onReady()
    }

    constructor(bot: Bot) {
        this.bot = bot
        this.pubSub = new TwitchPubSub(message => {
            const json = JSON.parse(message)
            if (json['type'] === 'RESPONSE') {
                if (json['error'])
                    throw `Error in response ${json['nonce']}: "${json['error']}"`
                else console.debug(`Listened to ${json['nonce']}.`)
            }

            // channel point reward redemption
            if (json['data']?.['topic']?.startsWith('channel-points')) {
                const redemption = JSON.parse(json['data']['message'])['data']['redemption']
                const channel = this.channelIDs[redemption['channel_id']]
                for (const [reward, fn] of this.channelPointRewards[channel]) {
                    if (reward.ID === redemption['reward']['id']) {
                        fn(bot.Streams[channel], bot, redemption['user']['login'], redemption['user_input'])
                        break
                    }
                }
            }
            else if (json['data']?.['topic']?.startsWith('channel-subscribe')) {
                const subscription = json['data']['message']
                const channel = this.channelIDs[subscription['channel_id']]
                for (const fn of this.channelSubscriptions[channel]) {
                    fn(
                        bot.Streams[channel],
                        bot,
                        subscription['display_name'] ?? subscription['user_name'] ?? 'anonymous',
                        subscription['cumulative_months'],
                        subscription['is_gift'] ? (subscription['recipient_display_name'] ?? subscription['recipient_user_name']) : undefined,
                        subscription['sub_message']['emotes'] ? subscription['sub_message']['emotes'].map((obj: any) => `${obj['id']}:${obj['begin']}-${obj['end']}`).join('/') : undefined,
                        subscription['sub_message']['message']
                    )
                }
            }
            else if (json['data']?.['topic']?.startsWith('')) {
                const cheer = JSON.parse(json['data']['message'])['data']
                const channel = this.channelIDs[cheer['channel_id']]

                for (const fn of this.channelCheers[channel]) {
                    fn(
                        bot.Streams[channel],
                        bot,
                        cheer['user_name'],
                        cheer['bits_used'],
                        cheer['chat_message']
                    )
                }
            }
        }, err => console.error(`Event Listener error: ${err}`))

        if (!bot.Tokens.TwitchApi)
            throw 'Twitch API Tokens not set.'
        this.accessToken = bot.Tokens.Access

        this.pubSub.start()

        for (const channel in this.bot.Channels) {
            if (this.bot.Channels[channel].Options.twitchApi) {
                this.channelsNotPopulated[channel] = {
                    ChannelPoints: false
                }

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
                                    result.Ok['data'].map((el: any) => [{ Name: el['title'], ID: el['id'] }, () => { }])
                                this.channelsNotPopulated[channel].ChannelPoints = true
                                this.cleanNotPopulatedList()
                            }
                            else throw result.Error
                        })
                        // subscriptions
                        this.channelSubscriptions[channel] = []
                        // bits
                        this.channelCheers[channel] = []

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
                        // subscriptions
                        this.pubSub.send(JSON.stringify({
                            type: 'LISTEN',
                            nonce: `subs:${channel}`,
                            data: {
                                'topics': [`channel-subscribe-events-v1.${idOk}`],
                                'auth_token': this.accessToken,
                            },
                        }))
                        // bits
                        this.pubSub.send(JSON.stringify({
                            type: 'LISTEN',
                            nonce: `bits:${channel}`,
                            data: {
                                'topics': [`channel-bits-events-v2.${idOk}`],
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

    public onChannelPointReward(channel: string, rewardName: string, callback: ChannelPointCallback) {
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

    public onChannelSubscription(channel: string, callback: ChannelSubscriptionCallback) {
        if (this.channelSubscriptions[channel]) {
            this.channelSubscriptions[channel].push(callback)
            return this
        }
        else throw `Channel "${channel}" not found in subscriptions. Valid channels: ${Object.keys(this.channelSubscriptions).join(', ')}`
    }
}

let eventListener: BotEventListener
let subs: ((listener: BotEventListener) => BotEventListener)[] = []

export const sub = (fn: (listener: BotEventListener) => BotEventListener) => {
    subs.push(fn)
}
export const collectSubs = (bot: Bot) => {
    eventListener = new BotEventListener(bot)
    eventListener.onReady = () => {
        console.log('EventListener ready.')
        for (const sub of subs) {
            eventListener = sub(eventListener)
        }
    }
}
export const closeEventListener = () => { eventListener?.close() }
