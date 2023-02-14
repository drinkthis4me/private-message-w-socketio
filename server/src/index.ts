import { createServer } from 'http'
import { Server } from 'socket.io'
import crypto from 'crypto'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  User,
  MessagePayload,
} from '../../types/socket'

const httpServer = createServer()
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
  },
})

const randomID = () => crypto.randomBytes(8).toString('hex')

import { InMemorySessionStore } from '../src/sessionStore'
const sessionStore = new InMemorySessionStore()

import { InMemoryMessageStore } from '../src/messageStore'
const messageStore = new InMemoryMessageStore()

// middleware checks the username and the session, and allows the connection
io.use((socket, next) => {
  // find existing session
  const sessionID = socket.handshake.auth.sessionID
  if (sessionID) {
    const session = sessionStore.findSession(sessionID)
    if (session) {
      socket.data.sessionID = sessionID
      socket.data.userID = session.userID
      socket.data.username = session.username
      return next()
    }
  }

  const username = socket.handshake.auth.username
  const isDuplicatedName = sessionStore.findDuplicateName(username)
  if (!username || isDuplicatedName) {
    return next(new Error('invalid username'))
  }

  // create a session ID, private, which will be used to authenticate the user upon reeconnection
  // create a user ID, public, which will be used as an identifier to exchange messages
  socket.data.sessionID = randomID()
  socket.data.userID = randomID()
  socket.data.username = username
  next()
})

io.on('connection', (socket) => {
  // persist session
  if (socket.data.sessionID && socket.data.userID && socket.data.username)
    sessionStore.saveSession(socket.data.sessionID, {
      userID: socket.data.userID,
      username: socket.data.username,
      connected: true,
    })
  else console.log('>>> Save session failed.')

  // emit session details
  if (socket.data.sessionID && socket.data.userID)
    socket.emit('session', {
      sessionID: socket.data.sessionID,
      userID: socket.data.userID,
    })
  else console.log('>>> Emit session failed.')

  // join the 'userID' room
  if (socket.data.userID) socket.join(socket.data.userID)
  else console.log('>>> Join room failed.')

  // fetch existing users and persist messages
  const users: User[] = []
  const messagePerUser = new Map<string, MessagePayload[]>()
  if (socket.data.userID)
    messageStore.findMessagesForUser(socket.data.userID).forEach((message) => {
      const { from, to } = message
      // Assign otherUserID by 'to' or 'from'
      const otherUser = socket.data.userID === from ? to : from
      // Get otherUserID's array and push its messages
      // else set a new messages array
      if (messagePerUser.has(otherUser)) {
        messagePerUser.get(otherUser)!.push(message)
      } else messagePerUser.set(otherUser, [message])
    })
  else console.log('>>> Cannot find user.')
  sessionStore.findAllSessions().forEach((session) => {
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
      messages: messagePerUser.get(session.userID) || [],
    })
  })
  socket.emit('users', users)

  // notify existing users
  if (socket.data.userID && socket.data.username)
    socket.broadcast.emit('user connected', {
      userID: socket.data.userID,
      username: socket.data.username,
      connected: true,
      messages: messageStore.findMessagesForUser(socket.data.userID) || []
    })
  else console.log(">>> Emit 'user connected' failed.")

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on('private message', ({ content, to }) => {
    if (socket.data.userID) {
      const message = {
        content,
        from: socket.data.userID,
        to: to,
      }
      socket.to(to).to(socket.data.userID).emit('private message', message)
      messageStore.saveMessage(message)
    } else console.log('>>> Error at event private message.')
  })

  // notify users upon disconnection
  socket.on('disconnect', async () => {
    if (socket.data.userID && socket.data.sessionID && socket.data.username) {
      const matchingSockets = await io.in(socket.data.userID).fetchSockets()
      const isDisconnected = matchingSockets.length === 0
      if (isDisconnected) {
        // notify other users
        socket.broadcast.emit('user disconnected', socket.data.userID)
        // update the connection status of the session
        sessionStore.saveSession(socket.data.sessionID, {
          userID: socket.data.userID,
          username: socket.data.username,
          connected: false,
        })
      } else console.log('>>> User is still connected. Abort emit.')
    } else console.log('>>> Error at event disconnect. Some data is undefined.')
  })
})

const PORT = process.env.PORT || 3000

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
)
