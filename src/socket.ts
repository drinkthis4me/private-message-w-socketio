import { io, Socket } from 'socket.io-client'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from '../types/socket'

const URL = 'http://localhost:3000'

const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
  io(URL, {
    autoConnect: false,
  })

socket.onAny((event, ...args) => {
  console.log(event, args)
})

export default socket
