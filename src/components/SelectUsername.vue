<template>
  <div class="select-username">
    <form @submit.prevent="onSubmit">
      <input
        v-model="username"
        type="text"
        placeholder="What is your username?" />
      <button :disabled="!isValid">Send</button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
const username = ref('')

const isValid = computed(() => username.value.length > 2)

const emits = defineEmits(['SubmitInput'])

function onSubmit() {
  emits('SubmitInput', username.value)
}
</script>

<style scoped>
.select-username {
  width: 300px;
  margin: 200px auto 0;
}
</style>
