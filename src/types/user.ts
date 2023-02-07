export interface User {
  username: string
  userID: string
  self: boolean
  hasNewMessages: boolean
  connected: boolean
  messages: Message[]
}

export type Message = {
  content: string
  fromSelf: boolean
}
