import { Bot, botSay } from '../bot'
import { gamble, isValidBet, parseBetAmount, pointsNameString, setPoints } from '../channel/gambling'
import { CommandInput } from '../command/command'
import { registerCommands } from '../command/register'

const canRun = (_bot: Bot, com: CommandInput) => com.Stream.Channel.Options.gambling
const canRunMod = (_bot: Bot, com: CommandInput) => com.Stream.Channel.Options.gambling && com.IsMod
const say = (com: CommandInput, bot: Bot, message: string, override: boolean = false) => botSay(com.Stream.Channel.ChannelString, com.IsMod, bot, message, override)

registerCommands(registry =>
    registry
        .register('points', {
            canRun,
            run: (bot, com, _body) => {
                const points = com.Stream.Channel.Gambling.Users[com.Username]
                const pointsString = pointsNameString(com.Stream.Channel.Gambling)(points)
                const newChatTime = say(com, bot, `@${com.Username} you have ${points} ${pointsString}.`, true)
                return { NewLastChatTime: newChatTime }
            }
        })
        .register('gamble', {
            canRun,
            run: (bot, com, body) => {
                if (body.length !== 1) {
                    const newChatTime = say(com, bot, `Usage: ${com.Stream.Channel.Options.commandPrefix}gamble <"help"|amount>.`)
                    return { NewLastChatTime: newChatTime }
                }

                if (body[0].toLowerCase() === 'help') {
                    const helpMessage = [
                        `(amount): bets a set amount of ${com.Stream.Channel.Gambling.Info.pointNamePlur}.`,
                        `(percent)%: bets a percentage of your total ${com.Stream.Channel.Gambling.Info.pointNamePlur}.`,
                        `all: bets all of your ${com.Stream.Channel.Gambling.Info.pointNamePlur}.`,
                        `max: bets the maximum amount of ${com.Stream.Channel.Gambling.Info.pointNamePlur} (or all of your ${com.Stream.Channel.Gambling.Info.pointNamePlur} if no maximum is set).`,
                        `min: bets the minimum amount of ${com.Stream.Channel.Gambling.Info.pointNamePlur} (or 1 ${com.Stream.Channel.Gambling.Info.pointNameSing} if no minimum is set).`,
                    ]
                        .map(line => `${com.Stream.Channel.Options.commandPrefix}gamble ${line}`)
                    let newChatTime = 0
                    for (const line of helpMessage)
                        newChatTime = say(com, bot, line, true)
                    return { NewLastChatTime: newChatTime }
                }
                else {
                    const bet = parseBetAmount(body[0])
                    if (bet !== undefined && isValidBet(bet)) {
                        const gambleResult = gamble(com.Username, bet, com.Stream.Channel.Gambling)
                        if (gambleResult.IsOk) {
                            const [result, newGambling] = gambleResult.Ok
                            if (result.Status === 'ok') {
                                const pointsString = pointsNameString(com.Stream.Channel.Gambling)
                                const gambleMessage = `${com.Username} bet ${result.Bet} ${pointsString(result.Bet)} and rolled a ${result.Roll}, ${result.Difference >= 0 ? 'winning' : 'losing'} ${Math.abs(result.Difference)} ${pointsString(Math.abs(result.Difference))}!`

                                const newChatTime = say(com, bot, gambleMessage, true)
                                return { NewGambling: newGambling, NewLastChatTime: newChatTime }
                            }
                            else {
                                const newChatTime = say(com, bot, `@${com.Username} ${result.Message}.`)
                                return { NewLastChatTime: newChatTime }
                            }
                        }
                        else {
                            const gambleError = gambleResult.Error
                            const newChatTime = say(com, bot, `@${com.Username} Could not gamble.`, true)
                            console.error(`* ERROR: Could not gamble: ${gambleError}`)
                            return { NewLastChatTime: newChatTime }
                        }
                    }
                    else {
                        const newChatTime = say(com, bot, `@${com.Username} Invalid bet amount.`, true)
                        return { NewLastChatTime: newChatTime }
                    }
                }
            }
        })
        .register('givePoints', {
            canRun: canRunMod,
            run: (bot, com, body) => {
                if (body.length !== 2) {
                    const newChatTime = say(com, bot, `Usage: ${com.Stream.Channel.Options.commandPrefix}givepoints <target> <amount>.`)
                    return { NewLastChatTime: newChatTime }
                }

                const target = body[0]
                const amount = parseInt(body[1])

                if (isNaN(amount)) {
                    const newChatTime = say(com, bot, `${com.Username} Invalid ${com.Stream.Channel.Gambling.Info.pointNameSing} amount.`)
                    return { NewLastChatTime: newChatTime }
                }

                const setPointResult = setPoints(points => points + amount, target, com.Stream.Channel.Gambling)
                if (setPointResult.IsOk)
                    return { NewGambling: setPointResult.Ok }
                else {
                    const setPointError = setPointResult.Error
                    const newChatTime = say(com, bot, `@${com.Username} Could not give ${com.Stream.Channel.Gambling.Info.pointNamePlur}.`, true)
                    console.error(`* ERROR: Could not gamble: ${setPointError}`)
                    return { NewLastChatTime: newChatTime }
                }
            }
        })
)
