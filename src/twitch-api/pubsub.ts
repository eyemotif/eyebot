import { WebSocket } from 'ws'
import { delay } from '../utils'

const cancelableDelay = async (ms: number, checkCancel: () => boolean, resolution: number = 100) => {
    for (let timeWaited = 0; timeWaited <= ms; timeWaited += resolution) {
        await delay(resolution)
        if (checkCancel()) return
    }
}

export class TwitchPubSub {
    private socket: WebSocket
    private queue: string[]
    private pingResponse = true
    private open = false
    private reconnecting = false
    protected queueSenderPromise: Promise<void>
    protected pingSenderPromise: Promise<void>

    private queueSenderFn = () => {
        if (this.open) {
            if (!this.reconnecting && this.socket.readyState === this.socket.OPEN && this.queue.length > 0) {
                const next = this.queue.pop()
                this.socket.send(next)
            }
            this.queueSenderPromise = delay(10).then(this.queueSenderFn)
        }
    }

    private pingSender = async (): Promise<void> => {
        if (this.open) {
            await cancelableDelay(300000 + Math.floor(Math.random() * 10000), () => !this.open)

            this.pingResponse = false
            this.sendPriority(JSON.stringify({ type: 'PING' }))
            await cancelableDelay(10000, () => !this.open)
            if (!this.pingResponse)
                this.sendPriority(JSON.stringify({ type: 'RECONNECT' }))
            return await (this.pingSenderPromise = this.pingSender())
        }
    }

    private connectSocket = (onMessage: (message: string) => void, onError: (err: Error) => void) => {
        this.socket = new WebSocket('wss://pubsub-edge.twitch.tv')

        this.socket.on('open', () => { this.reconnecting = false })
        this.socket.on('message', message => {
            const messageJSON = JSON.parse(message.toString())
            switch (messageJSON['type']) {
                case 'PONG':
                    this.pingResponse = true
                    break
                case 'RECONNECT':
                    this.reconnecting = true
                    this.socket.close()
                    delay(20000).then(() => this.connectSocket(onMessage, onError))
                    break
                default:
                    onMessage(message.toString())
                    break
            }
        })
        this.socket.on('error', onError)
        this.socket.on('close', (code, reason) => {
            this.open = false
            console.log(`Twitch API connection closed. Reason: "${reason.toString()}" (code ${code})`)
        })
    }

    public constructor(onMessage: (message: string) => void, onError: (err: Error) => void) {
        this.queue = []

        this.socket = new WebSocket(null)
        this.connectSocket(onMessage, onError)

        this.queueSenderPromise = new Promise<void>(() => void 0)
        this.pingSenderPromise = new Promise<void>(() => void 0)
    }

    private sendPriority(data: string) {
        this.queue.unshift(data)
    }

    public start() {
        this.open = true
        this.queueSenderPromise = delay(10).then(this.queueSenderFn)
        this.pingSenderPromise = delay(10).then(this.pingSender)
    }

    public send(data: string) {
        this.queue.push(data)
    }

    public close(reason: string, code: number = 1000) {
        this.socket.close(code, reason)
        this.open = false
    }
}
