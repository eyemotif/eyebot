import { readFileSync } from 'fs'
import { Client } from 'tmi.js'

export interface Bot {
    Client: Client
}

export const createBot = (): Bot => {
    const channels: string[] = []

    const client = new Client({
        options: {
            debug: true,
            clientId: readFileSync('creds/clientid', 'utf8'),
        },
        identity: {
            username: readFileSync('creds/twitchchannel', 'utf8'),
            password: readFileSync('creds/oauth', 'utf8')
        },
        channels: [...channels]
    })

    return {
        Client: client
    }
}
