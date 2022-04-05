import { WebSocket } from 'ws'

export type StreamfunConnection = {
    socket: WebSocket
    onError: (message: Error) => void
    onMessage: (message: string) => void
}

export const connectToStreamfunServer = (address: string = 'ws://localhost:8080', onError: (message: Error) => void, onMessage: (message: string) => void): StreamfunConnection => {
    const result = {
        socket: new WebSocket(address),
        onError,
        onMessage
    }

    result.socket.on('open', () => console.log('Successfully connected to the Streamfun server!'))
    result.socket.on('close', (code, reason) => console.error(`Streamfun socket dropped. Reason: ${reason.toString()} (code ${code})`))
    result.socket.on('error', message => result.onError(message))
    result.socket.on('message', message => result.onMessage(message.toString()))

    return result
}

export const sendToStreamfunServer = (connection: StreamfunConnection, message: string) =>
    connection.socket.send(message, err => { if (err) connection.onError(err) })
