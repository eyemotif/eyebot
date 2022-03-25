import clone from 'clone';
import { ChatInfo } from '../chatInfo'
import { escapeUnderscores } from '../command/command'
import { Livestream } from '../livestream'
import { Channel, channelLocale, InfoCommands } from './channel'

export class InfoCommandEnvironment {
    private variables: Record<string, (chatMessage: ChatInfo) => string>

    public static Create() {
        return new InfoCommandEnvironment()
            .variable('now', chat => (new Date()).toLocaleTimeString(channelLocale(chat.Stream.Channel)))
            .variable('chatter', chat => chat.Username)
    }
    private constructor() {
        this.variables = {}
    }

    public variable(varName: string, varValue: (chatMessage: ChatInfo) => string) {
        if (this.variables[varName] !== undefined)
            throw `Variable "${varName}" already exists.`
        else if (!/^[a-zA-Z0-9_\-]+$/.test(varName))
            throw `Invalid variable name "${varName}".`
        else if (!isNaN(parseInt(varName)))
            throw `Integer variable names are reserved for being replaced with the command body.`
        this.variables[varName] = varValue
        return this
    }

    public replaceVariablesInString(chatMessage: ChatInfo, body: string[], str: string) {
        let resultString = str

        for (let bodyVar = 0; bodyVar < body.length; bodyVar++) {
            const varNameRegexp = new RegExp(`%${bodyVar}`, 'g')
            if (varNameRegexp.test(resultString)) {
                const varReplace = body[bodyVar]
                resultString = resultString.replace(varNameRegexp, varReplace)
            }
        }
        for (const varName in this.variables) {
            const varNameRegexp = new RegExp(`%${varName}`, 'g')
            if (varNameRegexp.test(resultString)) {
                const varReplace = this.variables[varName](chatMessage)
                resultString = resultString.replace(varNameRegexp, varReplace)
            }
        }
        return resultString.replace(/%%/g, escapeUnderscores(body.join(' ')))
    }
}

export const setInfoCommand = (commandName: string, body: string, channel: Channel): InfoCommands => {
    let newInfoCommands = clone(channel.InfoCommands)
    newInfoCommands[commandName] = body
    return newInfoCommands
}

export const remInfoCommand = (commandName: string, channel: Channel): InfoCommands => {
    let newInfoCommands = clone(channel.InfoCommands)
    delete newInfoCommands[commandName]
    return newInfoCommands
}

export const runInfoCommand = (chatInfo: ChatInfo, chatBody: string[], body: string) =>
    chatInfo.Stream.Channel.InfoCommandEnvironment.replaceVariablesInString(chatInfo, chatBody, body)
