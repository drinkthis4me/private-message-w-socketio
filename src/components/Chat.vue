<template>
  <div>
    <div class="left-panel">
      <UserInPanel
        v-for="user in users"
        :key="user.userID"
        :user="user"
        :selected="selectedUser === user"
        @select="onSelectUser(user)" />
    </div>
    <MessagePanel
      v-if="selectedUser"
      :user="selectedUser"
      @submit-input="onMessage"
      class="right-panel" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import UserInPanel from './User.vue'
import MessagePanel from './MessagePanel.vue'
import type { User } from '@/types/user'
import socket from '@/socket'

const selectedUser = ref<User | null>(null)

const users = ref<User[]>([])

function onMessage(content: string) {
  if (selectedUser.value) {
    socket.emit('private message', {
      content,
      to: selectedUser.value.userID,
    })
    selectedUser.value.messages.push({
      content,
      fromSelf: true,
    })
  }
}

function onSelectUser(user: User) {
  selectedUser.value = user
  selectedUser.value.hasNewMessages = false
}

onMounted(() => {
  socket.on('connect', () => {
    users.value.forEach((user) => {
      if (user.self) user.connected = true
    })
  })

  socket.on('disconnect', () => {
    users.value.forEach((user) => {
      if (user.self) user.connected = false
    })
  })

  function initReactiveProperties(user: User) {
    user.messages = []
    user.hasNewMessages = false
  }

  socket.on('users', (newUsers) => {
    newUsers.forEach((user) => {
      for (let existingUser of users.value) {
        if (existingUser.userID === user.userID) {
          existingUser.connected = user.connected
          return
        }
      }
      user.self = user.userID === localStorage.getItem('sessionID')
      initReactiveProperties(user)
      users.value.push(user)
    })
    // put the current user first, and sort by username
    users.value.sort((a, b) => {
      if (a.self) return -1
      if (b.self) return 1
      if (a.username < b.username) return -1
      return a.username > b.username ? 1 : 0
    })
  })

  socket.on('user connected', (user) => {
    for (let existingUser of users.value) {
      if (existingUser.userID === user.userID) {
        existingUser.connected = true
        return
      }
    }
    initReactiveProperties(user)
    users.value.push(user)
  })

  socket.on('user disconnected', (id) => {
    for (let user of users.value) {
      if (user.userID === id) {
        user.connected = false
        break
      }
    }
  })

  socket.on('private message', ({ content, from, to }) => {
    for (let user of users.value) {
      const fromSelf = localStorage.getItem('sessionID') === from
      if (user.userID === (fromSelf ? to : from)) {
        user.messages.push({ content, fromSelf })
        if (user !== selectedUser.value) user.hasNewMessages = true
        break
      }
    }
  })
})

onUnmounted(() => {
  socket.off('connect')
  socket.off('disconnect')
  socket.off('users')
  socket.off('user connected')
  socket.off('user disconnected')
  socket.off('private message')
})
</script>

<style scoped>
.left-panel {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 260px;
  overflow-x: hidden;
  background-color: #3f0e40;
  color: white;
}

.right-panel {
  margin-left: 260px;
}
</style>
