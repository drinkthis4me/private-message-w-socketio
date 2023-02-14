export interface ServerToClientEvents {
  noArg: () => void
  basicEmit: (a: number, b: string, c: Buffer) => void
  withAck: (d: string, callback: (e: number) => void) => void
  session: (payload: SessionPayload) => void
  users: (newUsers: User[]) => void
  'user connected': (user: User) => void
  'user disconnected': (userID: string) => void
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
  sessionID: string;
  userID: string;
  username: string;
}

/** --- Custom types --- */
interface SessionPayload {
  sessionID: string
  userID: string
}

export interface MessagePayload {
  content: string
  from: SocketData['userID']
  to: SocketData['userID']
  fromSelf?: boolean
}

export interface User {
  username: string
  userID: string
  connected: boolean
  self?: boolean
  hasNewMessages?: boolean
  messages?: MessagePayload[]
}


