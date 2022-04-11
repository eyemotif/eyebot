import { existsSync, readdirSync, readFileSync } from 'fs'
import { Client } from 'tmi.js'
import { Channel, channelString, readChannel, twitchChannelString } from './channel/channel'
import { ChatInfo } from './chatInfo'
import { Command } from './command/command'
import { createStream, Livestream } from './livestream'
import { refreshToken, requestToken, tokensHaveCorrectScope, validateToken } from './twitch-api/access'
import { getDefaultScope, TokenInfo, TwitchError } from './twitch-api/common'
import { Arr, Record, Result } from './utils'

export interface Bot {
    Client: Client
    Channels: Record<string, Channel>
    Streams: Record<string, Livestream>
    Commands: Record<string, Command>

    ClientID: string
    Tokens:
    | { TwitchApi: false }
    | {
        TwitchApi: true,
        Access: string,
        Refresh: string,
    }
}

type Credentials = {
    TwitchChannel: string
    ClientID: string
    OAuth: string

    AuthCode: string
    ClientSecret: string
    RedirectURI: string
}

const getCredentials = (): Result<Credentials, string> => {
    const filesList = ['creds/twitchchannel', 'creds/clientid', 'creds/oauth']
    const optionalFilesList = ['creds/authcode', 'creds/clientsecret', 'creds/redirecturi']

    const filesNotExist =
        filesList.filter(path => !existsSync(path))
    if (filesNotExist.length > 0)
        return Result.error(`Files ${filesNotExist.join(', ')} do not exist. Please see the readme on how to configure the bot.`)

    const fileReads = filesList.map(path => readFileSync(path, 'utf8').trim())

    const filesEmpty = fileReads.filter(file => file.length === 0)
    if (filesEmpty.length > 0)
        return Result.error(`Files ${filesEmpty.join(', ')} are empty. Please see the readme on how to configure the bot.`)

    const optionalFileReads = optionalFilesList.map(path => {
        if (existsSync(path)) return readFileSync(path, 'utf8').trim()
        else return ''
    })

    return Result.ok({
        TwitchChannel: fileReads[0],
        ClientID: fileReads[1],
        OAuth: fileReads[2],
        AuthCode: optionalFileReads[0],
        ClientSecret: optionalFileReads[1],
        RedirectURI: optionalFileReads[2],
    })
}

const getBotTokens = async (creds: Credentials): Promise<Result<TokenInfo | undefined, TwitchError>> => {
    if (!(creds.AuthCode && creds.ClientSecret && creds.RedirectURI)) return Result.ok(undefined)

    if (existsSync('tokens/access') && existsSync('tokens/refresh')) {
        let access = readFileSync('tokens/access', 'utf8')
        let refresh = readFileSync('tokens/refresh', 'utf8')
        let scope = getDefaultScope()

        const validateResult = await validateToken(access)
        if (validateResult.IsOk) {
            const validateOk = validateResult.Ok
            if (!validateOk) {
                const refreshResult = await refreshToken(access, refresh, creds.ClientID, creds.ClientSecret)
                if (refreshResult.IsOk) {
                    const refreshOk = refreshResult.Ok
                    if (tokensHaveCorrectScope(refreshOk)) {
                        access = refreshOk.Access
                        refresh = refreshOk.Refresh
                        scope = refreshOk.Scope
                    }
                    else return Result.error({
                        Status: -1,
                        Error: 'Not enough scope',
                        Message: `Expected access tokens to have scope ${getDefaultScope().join(', ')}; got scope ${refreshOk.Scope.join(', ')}`,
                    })
                }
                else return Result.fromError(refreshResult)
            }
        }
        else return Result.fromError(validateResult)

        return Result.ok({
            Access: access,
            Refresh: refresh,
            Scope: scope,
        })
    }
    else return requestToken(creds.ClientID, creds.ClientSecret, creds.AuthCode, creds.RedirectURI)
}

export const createBot = async (): Promise<Result<Bot, string[]>> => {
    const credsResult = getCredentials()
    if (!credsResult.IsOk)
        return Result.error([credsResult.Error])
    const creds = credsResult.Ok

    const channelList =
        readdirSync('channels')
            .filter(path => /.+\.json/.test(path))
            .filter(path => path !== 'TEMPLATE.json')
            .map(path => path.replace(/(.+)\.json/, '$1'))

    if (channelList.length === 0)
        return Result.error(['Did not find any channels to create. Please see the readme on how to configure the bot.'])

    const client = new Client({
        options: {
            debug: true,
            clientId: creds.ClientID,
        },
        identity: {
            username: creds.ClientID,
            password: creds.OAuth,
        },
        channels: [...channelList],
    })

    const channelsResult = Result.all(channelList.map(readChannel))

    const tokensResult = await getBotTokens(creds)
    if (tokensResult.IsOk) {
        return Result.map(channelsOk => {
            const channels = Record.fromPairs(Arr.zip(channelList, channelsOk))
            const streams =
                Record.fromPairs(Arr.zip(channelList, channelsOk.map(createStream)))

            return {
                Client: client,
                Channels: channels,
                Streams: streams,
                Commands: {},
                ClientID: creds.ClientID,
                Tokens:
                    tokensResult.Ok
                        ? { TwitchApi: true, Access: tokensResult.Ok.Access, Refresh: tokensResult.Ok.Refresh }
                        : { TwitchApi: false },
            }
        }, channelsResult)
    }
    else return Result.error([])
}

export const botSay = (channel: string, isMod: boolean, bot: Bot, message: string, force: boolean = false): [number, string] => {
    const stream = bot.Streams[channelString(channel)]
    const now = Date.now()

    const normalChatCondition = ((now - stream.LastChatTime) >= stream.Channel.Options.nonModChatDelay) && (message !== stream.LastBotChat)

    if (force || isMod || normalChatCondition) {
        bot.Client.say(twitchChannelString(channel), message)
        return [now, message]
    }
    else return [stream.LastChatTime, stream.LastBotChat]
}

export const chatSay = (bot: Bot, chatInfo: ChatInfo, message: string, force: boolean = false) =>
    botSay(chatInfo.ChannelString, chatInfo.IsMod, bot, message, force)
