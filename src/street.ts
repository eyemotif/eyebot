import { WebSocket, WebSocketServer } from 'ws'
import { Bot } from './bot'

type StreetClient = {
    socket: WebSocket
    id: string
    waiting: boolean
    cachedUsers: Set<string>
}

export class StreetServer {
    private clients: Record<string, StreetClient[]> = {}
    private waitQueue: Record<string, StreetClient> = {}
    private server: WebSocketServer
    private onMessage: (channel: string, message: string) => void
    private onError: (channel: string, err: Error) => void
    private validChannels: string[]

    constructor(validChannels: string[], onMessage: (channel: string, message: string) => void, onError: (channel: string, err: Error) => void, port: number = 8000) {
        this.onMessage = onMessage
        this.onError = onError
        this.validChannels = validChannels

        this.server = new WebSocketServer({ port })
        this.server.on('connection', socket => {
            let client: StreetClient = {
                socket,
                id: '',
                waiting: true,
                cachedUsers: new Set(),
            }

            for (let i = 0; ; i++) {
                const strI = i.toString()
                if (!this.waitQueue[strI]) {
                    client.id = strI
                    this.waitQueue[strI] = client
                    break
                }
            }

            client.socket.once('message', response => {
                const message = response.toString()
                if (this.validChannels.includes(message)) {
                    console.debug(`Street client for channel "${message}".`)

                    if (!this.clients[message]) this.clients[message] = []

                    this.clients[message].unshift(this.waitQueue[client.id])
                    delete this.waitQueue[client.id]
                    this.clients[message][0].id = message
                    this.clients[message][0].waiting = false

                    socket.on('message', response => this.onMessage(client.id, response.toString()))
                    socket.on('error', err => this.onError(client.id, err))
                }
                else {
                    socket.close(1008, 'Unknown channel.')
                    setTimeout(() => {
                        socket.terminate()
                    }, 1000)
                }
            })
            client.socket.on('close', () => {
                if (client.waiting) delete this.waitQueue[client.id]
                else {
                    const index = this.clients[client.id].indexOf(client)
                    this.clients[client.id].splice(index, 1)
                }
            })
            client.socket.send(`~channel`)
        })
    }

    public validChannel(channel: string): boolean { return this.clients[channel] !== undefined }
    public send(channel: string, message: string) {
        if (!this.validChannel(channel)) throw `Unknown street channel "${channel}".`

        this.clients[channel].forEach(client => client.socket.send(message))
    }
    public getSockets(channel: string): WebSocket[] {
        if (!this.validChannel(channel)) throw `Unknown street channel "${channel}".`

        return this.clients[channel].map(client => client.socket)
    }
    public cacheUser(channel: string, username: string, displayName: string, color: string, badgesRaw: string, badgeInfoRaw: string) {
        if (!this.validChannel(channel)) throw `Unknown street channel "${channel}".`
        if (this.clients[channel][0].cachedUsers.has(username.toLowerCase())) return

        this.clients[channel].forEach(client => client.cachedUsers.add(username.toLowerCase()))
        this.clients[channel].forEach(client => client.socket.send(`chat.user ${username} ${displayName} ${color.startsWith('#') ? color : '#' + color} ${badgesRaw} ${badgeInfoRaw}`))
    }
    public close() {
        for (const waiting in this.waitQueue) {
            this.waitQueue[waiting].socket.close(1001, 'Server is stopping.')
            delete this.waitQueue[waiting]
        }
        for (const client in this.clients) {
            this.clients[client].forEach(c => c.socket.close(1001, 'Server is stopping.'))
            delete this.clients[client]
        }
        this.server.close()
        console.log('Street server closed.')
    }
}
