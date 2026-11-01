<template>
  <div class="max-w-5xl mx-auto p-8 mt-6 space-y-8">
    <div class="bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-8 text-center">
      <h2 class="text-3xl font-bold mb-4 text-gray-100">Velkommen til DND Vault</h2>
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
        <li v-for="c in characters" :key="c.id" class="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-start justify-between gap-4">
          <router-link :to="c.sheet_data?.summary?.completed ? `/character/${c.id}` : `/builder/${c.id}`" class="min-w-0 flex-1 group">
            <div class="font-bold text-gray-100 group-hover:text-red-400 truncate">{{ c.name || 'Unavngiven' }}</div>
            <div class="text-sm text-gray-400">{{ describe(c) }}</div>
            <div class="text-xs mt-1" :class="c.sheet_data?.summary?.completed ? 'text-emerald-400' : 'text-yellow-500'">
              {{ c.sheet_data?.summary?.completed ? 'Færdig' : 'Under oprettelse' }}
            </div>
          </router-link>
          <div class="flex flex-col items-end gap-1.5 shrink-0">
            <div v-if="c.sheet_data?.summary?.completed" class="flex gap-1.5">
              <router-link :to="`/character/${c.id}/level-up`" class="text-sm px-3 py-1 rounded border border-gray-600 text-gray-300 hover:border-red-500">Level up</router-link>
              <router-link :to="`/builder/${c.id}`" class="text-sm px-3 py-1 rounded border border-gray-600 text-gray-300 hover:border-gray-400">Redigér</router-link>
            </div>
            <button
              type="button"
              class="text-sm px-3 py-1 rounded border transition-colors"
              :class="pendingDelete === c.id ? 'border-red-500 bg-red-600 text-white' : 'border-gray-600 text-gray-400 hover:text-red-400 hover:border-red-500'"
              @click="remove(c.id)"
            >{{ pendingDelete === c.id ? 'Bekræft sletning' : 'Slet' }}</button>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, type CharacterRecord } from '../api'

const router = useRouter()
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

onMounted(refresh)
</script>
