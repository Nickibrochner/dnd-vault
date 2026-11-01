<template>
  <div class="relative group shrink-0 w-28 h-36 sm:w-32 sm:h-40">
    <button
      type="button"
      class="w-full h-full rounded-lg overflow-hidden border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      :class="url ? 'border-yellow-600/70 shadow-md' : 'border-dashed border-gray-600 bg-gray-900/60 hover:border-red-500'"
      :title="url ? 'Skift billede' : 'Tilføj et billede af karakteren'"
      :disabled="busy"
      @click="input?.click()"
    >
      <img v-if="url" :src="url" @error="broken = url" :alt="`Billede af ${name || 'karakteren'}`" class="w-full h-full object-cover">
      <span v-else class="flex flex-col items-center justify-center h-full gap-1 text-gray-500 text-xs px-2 text-center">
        <svg viewBox="0 0 24 24" class="w-10 h-10 opacity-60" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
        </svg>
        {{ busy ? 'Gemmer…' : 'Tilføj billede' }}
      </span>
      <span v-if="url" class="absolute inset-x-0 bottom-0 py-1 text-[11px] text-white bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity">
        {{ busy ? 'Gemmer…' : 'Skift billede' }}
      </span>
    </button>
    <button
      v-if="url && !busy"
      type="button"
      class="absolute -top-2 -right-2 px-1.5 h-6 rounded-full text-xs border transition-all"
      :class="confirmRemove ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100'"
      :title="confirmRemove ? 'Klik igen for at fjerne billedet' : 'Fjern billede'"
      @click="remove"
    >{{ confirmRemove ? 'Fjern?' : '✕' }}</button>
    <input ref="input" type="file" accept="image/*" class="hidden" @change="pick">
    <p v-if="error" class="absolute top-full left-0 mt-1 w-48 text-xs text-red-400">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { api, portraitUrl } from '../../api'
import { useCharacterStore } from '../../stores/character'

defineProps<{ name?: string }>()

const store = useCharacterStore()
/** Kan billedet ikke hentes (fx slettet et andet sted), vises feltet til at tilføje et nyt i stedet for et ødelagt billede. */
const broken = ref<string | null>(null)
const url = computed(() => {
  const u = store.characterId ? portraitUrl(store.characterId, store.portraitAt) : null
  return u && u !== broken.value ? u : null
})

const input = ref<HTMLInputElement | null>(null)
const busy = ref(false)
const error = ref<string | null>(null)
const confirmRemove = ref(false)

/** Største side i pixels – rigeligt til arket og kortet på forsiden. */
const MAX_SIDE = 800

/** Skalerer billedet ned i browseren og returnerer en data-URL (WebP, ellers JPEG). */
async function shrink(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const webp = canvas.toDataURL('image/webp', 0.85)
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85)
}

async function pick() {
  const file = input.value?.files?.[0]
  if (input.value) input.value.value = ''
  if (!file || !store.characterId) return
  busy.value = true
  error.value = null
  try {
    const record = await api.savePortrait(store.characterId, await shrink(file))
    store.portraitAt = record.portrait_at
  } catch (err) {
    error.value = `Kunne ikke gemme billedet: ${(err as Error).message}`
  } finally {
    busy.value = false
  }
}

async function remove() {
  if (!confirmRemove.value) { confirmRemove.value = true; return }
  confirmRemove.value = false
  if (!store.characterId) return
  busy.value = true
  error.value = null
  try {
    const record = await api.deletePortrait(store.characterId)
    store.portraitAt = record.portrait_at
  } catch (err) {
    error.value = `Kunne ikke fjerne billedet: ${(err as Error).message}`
  } finally {
    busy.value = false
  }
}
</script>
