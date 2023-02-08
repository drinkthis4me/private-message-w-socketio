import type { User } from './user'

export interface ServerToClientEvents {
  noArg: () => void
  basicEmit: (a: number, b: string, c: Buffer) => void
  withAck: (d: string, callback: (e: number) => void) => void
  session: (payload: SessionPayload) => void
  users: (newUsers: User[]) => void
  'user connected': (user: User) => void
  'user disconnected': (id: string) => void
  'private message': (payload: MessagePayload) => void
}

export interface ClientToServerEvents {
  hello: () => void
  'private message': (payload: MessagePayload) => void
}

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  name: string
  age: number
}

interface SessionPayload {
  sessionID: string
  userID: string
}

interface MessagePayload {
  content: string
  from?: string
  to: string
}
