import clone from 'clone';
import { Livestream } from '../livestream';
import { Channel, InfoCommands } from './channel';

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

export const runInfoCommand = (command: string, _body: string[], _stream: Livestream): string => {
    // TODO: more complicated info commands
    return command
}
