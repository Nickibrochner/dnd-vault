<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="w-9 h-9 grid place-items-center rounded-full text-gold/80 hover:text-white hover:bg-black/20 transition-colors"
      :class="open && 'text-white bg-black/20'"
      title="Indstillinger"
      aria-label="Indstillinger"
      :aria-expanded="open"
      @click="open = !open"
    >
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
      </svg>
    </button>

    <div v-if="open" class="panel !p-4 absolute right-0 top-full mt-2 w-80 z-50 space-y-3 text-left">
      <h3 class="section-title !mb-0">Indstillinger</h3>
      <label class="flex items-start gap-3 cursor-pointer">
        <input v-model="settings.manualEditing" type="checkbox" class="mt-1 w-4 h-4 shrink-0">
        <span>
          <span class="font-semibold text-gray-100">Manuel redigering</span>
          <span class="block text-xs text-gray-400">
            Til karakterer fra et andet system. Giver fanen <em>Rettelser</em> på arket, hvor beregnede værdier kan overstyres.
          </span>
        </span>
      </label>
      <div>
        <span class="font-semibold text-gray-100">Skrifttype</span>
        <div class="grid grid-cols-3 gap-1.5 mt-1">
          <button
            v-for="f in FONTS"
            :key="f.id"
            type="button"
            class="px-2 py-1.5 rounded border text-sm transition-colors"
            :class="settings.font === f.id ? 'border-red-500 bg-red-950 text-red-500' : 'border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-500'"
            :style="{ fontFamily: `'${f.family}'` }"
            @click="settings.font = f.id"
          >{{ f.name }}</button>
        </div>
      </div>
      <p class="text-[11px] text-gray-500">Gælder kun i denne browser.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { FONTS, useSettings } from '../../composables/useSettings'

const settings = useSettings()
const open = ref(false)
const root = ref<HTMLElement | null>(null)

// Lukkes ved klik udenfor eller Escape
const onClick = (e: MouseEvent) => { if (!root.value?.contains(e.target as Node)) open.value = false }
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') open.value = false }
onMounted(() => { document.addEventListener('click', onClick); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) })
</script>
