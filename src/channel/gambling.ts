import clone from 'clone'
import { Obj, Result } from '../utils'
import { Channel } from './channel'

export interface GambleInfo {
    Info: {
        pointNameSing: string
        pointNamePlur: string
        gambleMin?: number
        gambleMax?: number
        chatReward: number
        chatRewardCooldown: number
    },
    Multipliers: Record<string, number>
    Users: Record<string, number>
}

export type GambleResult = {
    Status: 'ok'
    User: string,
    Roll: number,
    Bet: number,
    Difference: number
} | {
    Status: 'error'
    Message: string
}

export type BetAmount =
    | { kind: 'amount', amt: number }
    | { kind: 'percentage', percent: number }
    | { kind: 'all' }
    | { kind: 'min' }
    | { kind: 'max' }

export const pointsNameString = (gambling: GambleInfo) => (amt: number) => amt === 1 ? gambling.Info.pointNameSing : gambling.Info.pointNamePlur

export const findMultiplier = (roll: number, gambling: GambleInfo): number | undefined => {
    let rollMultIndex = roll
    while (rollMultIndex >= 0) {
        if (gambling.Multipliers[rollMultIndex.toString()] !== undefined)
            return gambling.Multipliers[rollMultIndex.toString()]
        rollMultIndex--
    }
    return undefined
}

export const parseBetAmount = (amountStr: string): BetAmount | undefined => {
    const percentageSearch = (amountStr.match(/^\d+%$/) ?? []).concat(amountStr.match(/^%\d+$/) ?? [])
    const intSearch = parseInt(amountStr)

    if (percentageSearch.length > 0) {
        const percent = parseFloat(percentageSearch[0].replace('%', ''))
        return { kind: 'percentage', percent }
    }
    else if (!isNaN(intSearch)) return { kind: 'amount', amt: intSearch }
    else {
        switch (amountStr.toLowerCase()) {
            case 'all': return { kind: 'all' }
            case 'min': return { kind: 'min' }
            case 'max': return { kind: 'max' }
            default: break
        }
        return undefined
    }
}

export const isValidBet = (bet: BetAmount): boolean => {
    switch (bet.kind) {
        case 'amount': return bet.amt > 0
        case 'percentage': return bet.percent > 0 && bet.percent <= 100
        case 'all':
        case 'min':
        case 'max': return true
    }
}

export const setPoints = (pointsFn: (points: number) => number, user: string, gambling: GambleInfo): Result<GambleInfo, string> => {
    const userPoints = gambling.Users[user]
    if (userPoints !== undefined) {
        let newGambling = clone(gambling)
        newGambling.Users[user] = pointsFn(userPoints)
        return Result.ok(newGambling)
    }
    else return Result.error(`Gambling user "${user}" not in channel`)
}

export const gamble = (user: string, betAmount: BetAmount, gambling: GambleInfo): Result<[GambleResult, GambleInfo], string> => {
    const userPoints = gambling.Users[user]
    if (userPoints === undefined)
        return Result.error(`Gambling user "${user}" not in channel`)

    const bet = Math.round((() => {
        switch (betAmount.kind) {
            case 'amount': return betAmount.amt
            case 'percentage': return userPoints * (betAmount.percent * 0.01)
            case 'all': return userPoints
            case 'min': return gambling.Info.gambleMin ?? 1
            case 'max': return gambling.Info.gambleMax ?? userPoints
        }
    })())

    const pointsString = pointsNameString(gambling)
    if (gambling.Info.gambleMax !== undefined && bet > gambling.Info.gambleMax)
        return Result.ok([{
            Status: 'error',
            Message: `Bet ${bet} is over the maximum bet of ${gambling.Info.gambleMax} ${pointsString(gambling.Info.gambleMax)}`
        }, gambling])
    if (gambling.Info.gambleMin !== undefined && bet > gambling.Info.gambleMin)
        return Result.ok([{
            Status: 'error',
            Message: `Bet ${bet} is under the minimum bet of ${gambling.Info.gambleMin} ${pointsString(gambling.Info.gambleMin)}`
        }, gambling])
    if (bet > userPoints)
        return Result.ok([{
            Status: 'error',
            Message: `Not enough ${gambling.Info.pointNamePlur} (${userPoints}) to bet ${bet} ${pointsString(bet)}`
        }, gambling])

    const roll = Math.floor(Math.random() * 101)
    const multiplier = findMultiplier(roll, gambling)

    if (multiplier !== undefined) {
        const newPoints = (userPoints - bet) + (bet * multiplier)
        let newGambling = clone(gambling)

        newGambling.Users[user] = newPoints
        return Result.ok([
            {
                Status: 'ok',
                User: user,
                Roll: roll,
                Bet: bet,
                Difference: newPoints - userPoints
            },
            newGambling
        ])
    }
    else return Result.error(`Undefined multiplier for roll ${roll}`)
}
