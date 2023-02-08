<template>
  <div class="app">
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

const usernameAlreadySelected = ref(false)

function onUserNameSelection(username: string) {
  usernameAlreadySelected.value = true
  socket.auth = { username: username }
  socket.connect()
}

onMounted(() => {
  // fetch the session ID on app startup
  const sessionID = localStorage.getItem('sessionID')
  if (sessionID) {
    usernameAlreadySelected.value = true
    socket.auth = { sessionID: sessionID }
    socket.connect()
  }

  socket.on('session', ({ sessionID, userID }) => {
    // attach the session ID to the next reconnection attemps
    socket.auth = { sessionID: sessionID }
    // store it in the localStorage
    localStorage.setItem('sessionID', sessionID)
    // save the ID of the user
    // socket.userID = userID /**Property 'userID' does not exist on type 'Socket<ServerToClientEvents, ClientToServerEvents>'. */
  })

  // handler for connect_error
  socket.on('connect_error', (err: Error) => {
    if (err.message === 'invalid username')
      usernameAlreadySelected.value = false
  })
})

onUnmounted(() => {
  // remove error handler
  socket.off('connect_error')
})
</script>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
