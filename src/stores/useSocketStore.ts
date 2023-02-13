import { ref } from 'vue'
import { defineStore } from 'pinia'
import socket from '@/socket'
import type { User } from '../../types/socket'

export const useSocketStore = defineStore('socket', () => {
  const sessionID = ref<string>()

  const userID = ref<string>()

  const users = ref<User[]>([])

  const selectedUser = ref<User>()

  function getSessionID() {
    const sessionIDFromLocalStorage = localStorage.getItem('sessionID')
    if (sessionIDFromLocalStorage) {
      socket.auth = { sessionID: sessionIDFromLocalStorage }
      sessionID.value = sessionIDFromLocalStorage
    }
  }

  function setSessionID(id: string) {
    localStorage.setItem('sessionID', id)
  }

  function setUserID(id: string) {
    userID.value = id
  }

  return {
    sessionID,
    userID,
    users,
    selectedUser,

    getSessionID,
    setSessionID,
    setUserID,
  }
})
