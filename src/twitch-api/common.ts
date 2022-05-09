import { get, request } from 'https'
import { Result } from '../utils'

export type TokenInfo = {
    Access: string
    Refresh: string
    Scope: string[]
}

export type TwitchError = {
    Status: number
    Error: string
    Message: string
}

export const getDefaultScope = (): string[] => ['channel:read:redemptions', 'channel:read:subscriptions', 'bits:read']

export const recordToUrlQuery = (query: Record<string, string>): string => {
    let queryString = '?'
    queryString += Object.keys(query).map(key => `${key}=${query[key]}`).join('&')
    if (queryString === '?') return ''
    else return queryString
}

export const getHttps = (host: string, path: string, headers: Record<string, string> = {}, query: Record<string, string> = {}): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        let result = ''

        get({
            hostname: host,
            headers,
            path: path + recordToUrlQuery(query)
        }, res => {
            res.on('data', data => result += data.toString())
            res.on('end', () => resolve(result))
        }).on('error', reject)
    })
}

export const postHttps = (host: string, path: string, headers: Record<string, string> = {}, query: Record<string, string> = {}): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
        let result = ''

        const req = request({
            hostname: host,
            headers,
            path: path + recordToUrlQuery(query),
            method: 'POST',

        }, res => {
            res.on('data', data => result += data.toString())
            res.on('end', () => resolve(result))
        }).on('error', reject)

        req.end()
    })
}

export const responseResult = (response: any): Result<any, TwitchError> => {
    if (response.status) {
        return Result.error({
            Status: response.status,
            Error: response.error || '',
            Message: response.message,
        })
    }
    else return Result.ok(response)
}
