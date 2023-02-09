<template>
  <div class="app">
    <div v-show="errorStatus.status" class="errorInfo">
      ERROR! {{ errorStatus.message }}
    </div>
    <SelectUsername
      v-if="!usernameAlreadySelected"
      @submit-input="onUserNameSelection" />
    <Chat v-else />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import SelectUsername from './components/SelectUsername.vue'
import Chat from './components/Chat.vue'
import socket from './socket'
import { useSocketStore } from './stores/useSocketStore'

const socketStore = useSocketStore()

const usernameAlreadySelected = ref(false)

const errorStatus = ref({ status: false, message: '' })

function onUserNameSelection(username: string) {
  usernameAlreadySelected.value = true
  errorStatus.value.status = false
  socket.auth = { username: username }
  socket.connect()
}

onMounted(() => {
  // fetch the session ID on app startup
  socketStore.getSessionID()
  const sessionID = socketStore.sessionID

  if (sessionID) {
    usernameAlreadySelected.value = true
    socket.auth = { sessionID: sessionID }
    socket.connect()
  }

  socket.on('session', ({ sessionID, userID }) => {
    // attach the session ID to the next reconnection attemps
    socket.auth = { sessionID: sessionID }
    // store it in the localStorage
    socketStore.setSessionID(sessionID)
    // save the ID of the user
    // socket.userID = userID /**Property 'userID' does not exist on type 'Socket<ServerToClientEvents, ClientToServerEvents>'. */
    socketStore.setUserID(userID)
  })

  // handler for connect_error
  socket.on('connect_error', (err: Error) => {
    if (err.message === 'invalid username') {
      usernameAlreadySelected.value = false
      errorStatus.value.status = true
      errorStatus.value.message = 'invalid username'
    }
  })
})

onUnmounted(() => {
  // remove error handler
  socket.off('connect_error')
})
</script>

<style scoped>
body {
  margin: 0;
}

#app {
  font-size: 14px;
}
</style>
