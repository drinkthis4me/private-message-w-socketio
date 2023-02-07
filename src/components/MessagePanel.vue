<template>
  <div>
    <div class="header">
      <StatusIcon :connected="user.connected" />{{ user.username }}
    </div>

    <ul class="messages">
      <li
        v-for="(message, index) in user.messages"
        :key="index"
        class="message">
        <div v-if="displaySender(message, index)" class="sender">
          {{ message.fromSelf ? '(yourself)' : user.username }}
        </div>
        {{ message.content }}
      </li>
    </ul>

    <form @submit.prevent="onSubmit" class="form">
      <textarea v-model="input" placeholder="Your message..." class="input" />
      <button type="submit" :disabled="!isValid" class="send-button">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import StatusIcon from './StatusIcon.vue'
import type { User, Message } from '../types/user'
const props = defineProps<{
  user: User
}>()

const emits = defineEmits(['submitInput'])

const input = ref('')

function onSubmit() {
  emits('submitInput', input.value)
  input.value = ''
}

function displaySender(message: Message, index: number) {
  return (
    index === 0 ||
    props.user.messages[index - 1].fromSelf !==
      props.user.messages[index].fromSelf
  )
}
const isValid = computed(() => input.value.length > 0)
</script>

<style scoped>
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
