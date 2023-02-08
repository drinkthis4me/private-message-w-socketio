<template>
  <div :class="[selected ? 'selected' : '', 'user']" @click="$emit('select')">
    <div class="description">
      <div class="name">
        {{ user.username }} {{ user.self ? ' (yourself)' : '' }}
      </div>
      <div class="status">
        <StatusIcon :connected="user.connected" />{{ status }}
      </div>
    </div>
    <div v-show="user.hasNewMessages" class="new-messages">!</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import StatusIcon from './StatusIcon.vue'
import type { User } from '@/types/user'
const props = defineProps<{
  selected: boolean
  user: User
}>()

defineEmits(['select'])

const status = computed(() => (props.user.connected ? 'online' : 'offline'))
</script>

<style scoped>
.selected {
  background-color: #1164a3;
}

.user {
  padding: 10px;
}

.description {
  display: inline-block;
}

.status {
  color: #92959e;
}

.new-messages {
  color: white;
  background-color: red;
  width: 20px;
  border-radius: 5px;
  text-align: center;
  float: right;
  margin-top: 10px;
}
</style>
