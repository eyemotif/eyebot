import { Result } from '../utils'
import { getDefaultScope, getHttps, postHttps, responseResult, TokenInfo, TwitchError } from './common'

export const requestToken = async (clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<Result<TokenInfo, TwitchError>> => {
    const query = {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
    }
    const request = await postHttps('id.twitch.tv', '/oauth2/token', query)
    return Result.map(requestJSON => {
        return {
            Access: requestJSON['access_token'],
            Refresh: requestJSON['refresh_token'],
            Scope: requestJSON['scope']
        }
    }, responseResult(JSON.parse(request)))
}

export const validateToken = async (accessToken: string): Promise<Result<boolean, TwitchError>> => {
    const response = await getHttps('id.twitch.tv', '/oauth2/validate', { Authorization: `OAuth ${accessToken}` })
    const validate: Record<string, string> = JSON.parse(response)

    if (validate['status']) {
        if (validate['status'] == '401') return Result.ok(false)
        else return responseResult(validate)
    }
    else return Result.ok(true)
}

export const refreshToken = async (accessToken: string, refreshToken: string, clientId: string, clientSecret: string): Promise<Result<TokenInfo, TwitchError>> => {
    const refresh = await postHttps('id.twitch.tv', '/oauth2/token', {
        'Content-Type': 'application/x-www-form-urlencoded'
    }, {
        grant_type: 'refresh_token',
        access_token: accessToken,
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
    })
    return Result.map(refreshJSON => {
        return {
            Access: refreshJSON['access_token'],
            Refresh: refreshJSON['refresh_token'],
            Scope: refreshJSON['scope']
        }
    }, responseResult(JSON.parse(refresh)))
}

export const tokensHaveCorrectScope = (tokens: TokenInfo): boolean => {
    const requiredScopes = getDefaultScope()

    for (const scope of requiredScopes) {
        if (!tokens.Scope.includes(scope)) return false
    }
    return true
}
