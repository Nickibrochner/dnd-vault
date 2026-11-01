<template>
  <div class="max-w-5xl mx-auto p-8 mt-6 space-y-8">
    <div class="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-8 text-center">
      <h2 class="text-3xl font-bold mb-4">Velkommen til DND Vault</h2>
      <p class="text-gray-400 mb-8 text-lg">Byg din næste karakterer – trin for trin.</p>

      <div class="flex justify-center space-x-4">
        <button
          type="button"
          :disabled="creating"
          class="px-8 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-bold rounded shadow transition-colors"
          @click="createCharacter"
        >
          {{ creating ? 'Opretter…' : 'Opret Ny Karakter' }}
        </button>
      </div>
      <p v-if="error" class="mt-4 text-red-400">{{ error }}</p>
    </div>

    <section>
      <h3 class="section-title">Dine karakterer</h3>
      <p v-if="loading" class="text-gray-400">Henter…</p>
      <p v-else-if="!characters.length" class="text-gray-500">Ingen karakterer endnu.</p>
      <ul v-else class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <li
          v-for="c in characters"
          :key="c.id"
          class="relative bg-gray-800 border rounded-lg p-4 pr-14 flex"
          :class="[portraitUrl(c.id, c.portrait_at) ? 'border-yellow-600/70 min-h-[13rem] items-end shadow-md' : 'border-gray-700 items-start min-h-[6rem]', openMenu === c.id && 'z-20']"
        >
          <!-- Karakterbilledet som baggrund; en mørk toning nedefra gør navnet læsbart -->
          <div v-if="portraitUrl(c.id, c.portrait_at)" class="absolute inset-0 rounded-[inherit] overflow-hidden pointer-events-none">
            <img :src="portraitUrl(c.id, c.portrait_at)!" alt="" class="w-full h-full object-cover object-[center_20%]">
            <div class="absolute inset-0 bg-gradient-to-t from-[#1c130b]/90 via-[#1c130b]/45 to-transparent" />
          </div>
          <router-link :to="c.sheet_data?.summary?.completed ? `/character/${c.id}` : `/builder/${c.id}`" class="relative min-w-0 flex-1 group">
            <div
              class="font-bold truncate"
              :class="portraitUrl(c.id, c.portrait_at) ? 'font-display text-xl text-[#fbf6ea] group-hover:text-gold [text-shadow:0_1px_3px_rgb(0_0_0/0.7)]' : 'text-gray-100 group-hover:text-red-400'"
            >{{ c.name || 'Unavngiven' }}</div>
            <div class="text-sm" :class="portraitUrl(c.id, c.portrait_at) ? 'text-[#eadcbe] [text-shadow:0_1px_2px_rgb(0_0_0/0.7)]' : 'text-gray-400'">{{ describe(c) }}</div>
            <div
              class="text-xs mt-1"
              :class="[
                c.sheet_data?.summary?.completed ? 'text-emerald-400' : 'text-yellow-500',
                portraitUrl(c.id, c.portrait_at) && 'inline-block px-1.5 py-0.5 rounded bg-gray-900/90',
              ]"
            >
              {{ c.sheet_data?.summary?.completed ? 'Færdig' : 'Under oprettelse' }}
            </div>
          </router-link>
          <!-- Handlinger samlet bag et tandhjul nederst til højre -->
          <div class="card-menu absolute bottom-3 right-3">
            <button
              type="button"
              class="w-9 h-9 grid place-items-center rounded-full border transition-colors"
              :class="openMenu === c.id ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900/90 border-gray-600 text-gray-400 hover:text-gray-100 hover:border-red-500'"
              title="Handlinger"
              :aria-label="`Handlinger for ${c.name || 'karakteren'}`"
              :aria-expanded="openMenu === c.id"
              @click="toggleMenu(c.id)"
            >
              <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
            </button>
            <div v-if="openMenu === c.id" class="panel !p-1.5 absolute right-0 top-full mt-1 w-48 z-30 flex flex-col text-sm">
              <router-link v-if="c.sheet_data?.summary?.completed" :to="`/character/${c.id}/level-up`" class="menu-item text-gray-200">⬆ Level up</router-link>
              <router-link :to="`/builder/${c.id}`" class="menu-item text-gray-200">✎ Redigér</router-link>
              <template v-if="settings.manualEditing">
                <router-link v-if="!c.sheet_data?.summary?.completed" :to="`/character/${c.id}`" class="menu-item text-gray-200">📜 Ark</router-link>
                <router-link :to="`/character/${c.id}/rettelser`" class="menu-item text-yellow-300">✎ Rettelser</router-link>
              </template>
              <div class="my-1 border-t border-gray-700" />
              <button
                type="button"
                class="menu-item text-left"
                :class="pendingDelete === c.id ? '!bg-red-600 !text-white' : 'text-red-400'"
                @click="remove(c.id)"
              >{{ pendingDelete === c.id ? 'Bekræft sletning' : '✕ Slet' }}</button>
            </div>
          </div>
        </li>
      </ul>
    </section>  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, portraitUrl, type CharacterRecord } from '../api'
import { useSettings } from '../composables/useSettings'

const router = useRouter()
const settings = useSettings()
const characters = ref<CharacterRecord[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref<string | null>(null)
const pendingDelete = ref<number | null>(null)

const describe = (c: CharacterRecord) => {
  const s = c.sheet_data?.summary
  const parts = [s?.species, s?.className].filter(Boolean).join(' ')
  return `Level ${c.level}${parts ? ` ${parts}` : ''}${s?.subclass ? ` (${s.subclass})` : ''}${s?.className ? ` · HP ${s.hp} · AC ${s.ac}` : ''}`
}

async function refresh() {
  loading.value = true
  try {
    characters.value = await api.listCharacters()
  } catch (err) {
    error.value = `Kunne ikke hente karakterer: ${(err as Error).message}`
  } finally {
    loading.value = false
  }
}

async function createCharacter() {
  creating.value = true
  error.value = null
  try {
    const created = await api.createCharacter()
    router.push(`/builder/${created.id}/species`)
  } catch (err) {
    error.value = `Kunne ikke oprette karakter: ${(err as Error).message}`
    creating.value = false
  }
}

// To klik: første klik beder om bekræftelse
async function remove(id: number) {
  if (pendingDelete.value !== id) {
    pendingDelete.value = id
    return
  }
  pendingDelete.value = null
  try {
    await api.deleteCharacter(id)
    characters.value = characters.value.filter(c => c.id !== id)
  } catch (err) {
    error.value = `Kunne ikke slette: ${(err as Error).message}`
  }
}

// ---------- Tandhjulsmenu ----------

const openMenu = ref<number | null>(null)
function toggleMenu(id: number) {
  openMenu.value = openMenu.value === id ? null : id
  pendingDelete.value = null
}
// Lukkes ved klik udenfor eller Escape
const onClick = (e: MouseEvent) => { if (!(e.target as Element).closest('.card-menu')) openMenu.value = null }
const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') openMenu.value = null }
onMounted(() => { document.addEventListener('click', onClick); document.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { document.removeEventListener('click', onClick); document.removeEventListener('keydown', onKey) })

onMounted(refresh)
</script>

<style scoped>
.menu-item {
  @apply block px-3 py-1.5 rounded hover:bg-gray-800 transition-colors;
}
</style>
