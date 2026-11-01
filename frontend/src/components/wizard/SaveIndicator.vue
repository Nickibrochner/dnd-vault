<template>
  <span class="text-sm font-medium" :class="state.class" :title="store.saveError ?? undefined">{{ state.text }}</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'

const store = useCharacterStore()

const state = computed(() => ({
  idle: { text: '', class: '' },
  dirty: { text: 'Ikke gemt endnu…', class: 'text-gray-400' },
  saving: { text: 'Gemmer…', class: 'text-yellow-400 animate-pulse' },
  saved: { text: '✓ Gemt', class: 'text-green-400' },
  error: { text: `Kunne ikke gemme: ${store.saveError}`, class: 'text-red-400' },
}[store.saveStatus]))
</script>
