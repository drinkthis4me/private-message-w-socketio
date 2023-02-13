<template>
  <div class="container">
    <div class="header" v-if="selectedUser">
      <StatusIcon :connected="selectedUser.connected" />{{
        selectedUser.username
      }}
    </div>
    <ul class="messages" v-if="selectedUser && selectedUser.messages">
      <li
        v-for="(message, index) in selectedUser.messages"
        :key="index"
        class="message">
        <!-- <div>{{ index }} : {{ message }}</div> -->
        <div v-if="displaySender(message, index)" class="sender">
          {{ message.fromSelf ? '(yourself)' : selectedUser.username }}
        </div>
        {{ message.content }}
      </li>
    </ul>

    <form class="form">
      <textarea
        v-model="input"
        @keyup.enter.exact.prevent="onSubmit"
        placeholder="Your message..."
        class="input"
        autofocus></textarea>
      <button type="submit" :disabled="!isValid" class="send-button">
        Send
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusIcon from './StatusIcon.vue'
import type { User, Message } from '../../types/socket'
import { useSocketStore } from '@/stores/useSocketStore'
import { storeToRefs } from 'pinia'

const socketStore = useSocketStore()

const { selectedUser } = storeToRefs(socketStore)

const emits = defineEmits(['submitInput'])

const input = ref('')

function onSubmit() {
  emits('submitInput', input.value)
  input.value = ''
}

function displaySender(message: Message, index: number) {
  const msgArray = selectedUser.value?.messages
  if (index === 0) return true

  return msgArray && msgArray[index - 1].fromSelf !== msgArray[index].fromSelf
    ? true
    : false
}
const isValid = computed(() => input.value.length > 0)
</script>

<style scoped>
.container {
  display: grid;
}

.header {
  line-height: 40px;
  padding: 10px 20px;
  border-bottom: 1px solid #dddddd;
}

.messages {
  margin: 0;
  padding: 20px;
}

.message {
  list-style: none;
  white-space: pre-line;
}

.sender {
  font-weight: bold;
  margin-top: 5px;
}

.form {
  padding: 10px;
}

.input {
  width: 80%;
  resize: none;
  padding: 10px;
  line-height: 1.5;
  border-radius: 5px;
  border: 1px solid #000;
}

.send-button {
  vertical-align: top;
}
</style>
