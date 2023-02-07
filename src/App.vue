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
  socket.auth = { username }
  socket.connect()
}

onMounted(() => {
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
