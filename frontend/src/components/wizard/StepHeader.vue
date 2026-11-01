<template>
  <div class="border-b border-gray-700 pb-4">
    <h2 class="text-2xl font-bold text-gray-100">{{ title }}</h2>
    <p v-if="lead" class="text-gray-400 mt-1">{{ lead }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ title: string; lead?: string }>()
</script>
