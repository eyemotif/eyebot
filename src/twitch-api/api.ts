import { Bot } from '../bot'
import { Result } from '../utils'
import { getHttps, responseResult, TwitchError } from './common'

export type ChannelPointReward = {
    Name: string
    ID: string
}

export const twitchAPI = (accessToken: string, clientId: string, endpoint: string, params: Record<string, string>) => getHttps(
    'api.twitch.tv',
    '/helix/' + endpoint,
    { 'Authorization': `Bearer ${accessToken}`, 'Client-Id': clientId },
    params)

export const getIdFromChannelName = async (bot: Bot, channelName: string): Promise<Result<string | undefined, TwitchError>> => {
    if (!bot.Tokens.TwitchApi) return Result.ok(undefined)

    const broadcasterResponse = responseResult(JSON.parse(await (twitchAPI(bot.Tokens.Access, bot.ClientID, 'users', { login: channelName }))))
    if (broadcasterResponse.IsOk) {
        if ((broadcasterResponse.Ok['data']?.length ?? -1) > 0)
            return Result.ok(broadcasterResponse.Ok['data'][0].id)
        else return Result.ok(undefined)
    }
    else return Result.fromError(broadcasterResponse)
}
