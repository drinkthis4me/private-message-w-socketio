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
    <div class="right-panel">
      <MessagePanel v-if="selectedUser" @submit-input="onMessage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import UserInPanel from './User.vue'
import MessagePanel from './MessagePanel.vue'
import type { User } from '../../types/socket'
import socket from '@/socket'
import { useSocketStore } from '../stores/useSocketStore'
import { storeToRefs } from 'pinia'

const socketStore = useSocketStore()

const { users, selectedUser, userID } = storeToRefs(socketStore)

function onMessage(content: string) {
  if (selectedUser.value && selectedUser.value.messages && userID.value) {
    //  send 'private message' event to recipient'
    socket.emit('private message', {
      content,
      to: selectedUser.value.userID,
      from: userID.value,
    })
    // push content to selectedUser's message[]. (to be rendered)
    selectedUser.value.messages.push({
      content,
      to: selectedUser.value.userID,
      from: userID.value,
      fromSelf: true,
    })
  } else {
    console.log('>>> Error at onMessage')
    console.log('>>> selectedUser is: ' + JSON.stringify(selectedUser.value))
    console.log('>>> selectedUser.messages is: ' + selectedUser.value?.messages)
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

  socket.on('users', (usersListFromServer) => {
    usersListFromServer.forEach((userFromServer) => {
      // initiate messagePayload.fromSelf
      if (userFromServer.messages && userFromServer.messages.length > 0)
        userFromServer.messages.forEach((message) => {
          message.fromSelf = message.from === socketStore.userID
        })
      // For already existing user in the list: toggle-on connected user and initiate user.messages
      const targetInLocalList = users.value.find(
        (u) => u.userID === userFromServer.userID
      )
      if (targetInLocalList) {
        targetInLocalList.connected = userFromServer.connected
        targetInLocalList.messages = userFromServer.messages
      }

      // initiate user.hasNewMessages and user.self
      if (socketStore.userID)
        userFromServer.self = userFromServer.userID === socketStore.userID
      userFromServer.hasNewMessages = false
      // update the current user list with the user list from server
      users.value.push(userFromServer)
      console.log(
        '>>> new user in user list: ' + JSON.stringify(userFromServer)
      )
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
    const target = users.value.find((u) => u.userID === user.userID)
    if (target) target.connected = true
    else {
      user.hasNewMessages = false
      user.self = false
      users.value.push(user)
    }
  })

  socket.on('user disconnected', (id) => {
    const target = users.value.find((u) => u.userID === id)
    if (target) target.connected = false
  })

  // receive a message payload and iterate all users to find the sender
  socket.on('private message', ({ content, from, to }) => {
    // if the sender is self, our 'userID' should equal to 'from' ; else return false
    const fromSelf = socketStore.userID === from
    // if the message is from self, the sender ID should match 'to'; else should match 'from'
    const senderID = fromSelf ? to : from
    // find and update the sender
    const sender = users.value.find((u) => u.userID === senderID)
    if (sender && sender.messages) {
      sender.messages.push({
        content,
        from: from,
        to: to,
        fromSelf: fromSelf,
      })
      // show new message icon next to sender if not selected
      if (sender !== selectedUser.value) sender.hasNewMessages = true
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
