const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {
  cors: {
    origin: "http://localhost:5173",
  },
});

const crypto = require('crypto')
const randomID = () => crypto.randomBytes(8).toString('hex')

const { InMemorySessionStore } = require("./sessionStore");
const sessionStore = new InMemorySessionStore();

// middleware checks the username and the session, and allows the connection
io.use((socket, next) => {
  // find existing session
  const sessionID = socket.handshake.auth.sessionID
  if(sessionID){
    const session = sessionStore.findSession(sessionID)
    if(session){
      socket.sessionID = sessionID
      socket.userID = session.userID
      socket.username = session.username
      return next()
    }
  }

  const username = socket.handshake.auth.username;
  if (!username) {
    return next(new Error("invalid username"));
  }

  // create a session ID, private, which will be used to authenticate the user upon reeconnection
  // create a user ID, public, which will be used as an identifier to exchange messages
  socket.sessionID = randomID()
  socket.userID = randomID()
  socket.username = username;
  next();
});

io.on("connection", (socket) => {
  // persist session
  sessionStore.saveSession(socket.sessionID, {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  })

  // emit session details
  socket.emit('session',{
    sessionID: socket.sessionID,
    userID: socket.userID,
  })

  // join the 'userID' room
  socket.join(socket.userID)

  // fetch existing users
  const users = [];
  sessionStore.findAllSessions().forEach((session)=>{
    users.push({
      userID: session.userID,
      username: session.username,
      connected: session.connected,
    });
  })
  socket.emit("users", users);

  // notify existing users
  socket.broadcast.emit("user connected", {
    userID: socket.userID,
    username: socket.username,
    connected: true,
  });

  // forward the private message to the right recipient (and to other tabs of the sender)
  socket.on("private message", ({ content, to }) => {
    socket.to(to).to(socket.userID).emit("private message", {
      content,
      from: socket.userID,
      to,
    });
  });

  // notify users upon disconnection
  socket.on("disconnect", async () => {
    const matchingSockets = await io.in(socket.userID).allSockets()
    const isDisconnected = matchingSockets.size === 0
    if(isDisconnected){
      // notify other users
      socket.broadcast.emit('user disconnected', socket.userID)
      // update the connection status of the session
      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username:socket.username,
        connected: false,
      })
    }
    socket.broadcast.emit("user disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () =>
  console.log(`server listening at http://localhost:${PORT}`)
);
