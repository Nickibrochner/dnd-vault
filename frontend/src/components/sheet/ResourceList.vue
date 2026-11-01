<template>
  <section v-if="x.resources.length" class="panel space-y-3">
    <h3 class="section-title !mb-1">Ressourcer</h3>
    <div v-for="r in x.resources" :key="r.id" class="flex flex-wrap items-center justify-between gap-2">
      <div class="text-sm text-gray-200">
        {{ r.name }}
        <span class="text-[10px] uppercase tracking-wide text-gray-500 ml-1">{{ resetText(r) }}</span>
      </div>
      <Pips v-if="r.max <= MAX_PIPS" :label="r.name" :max="r.max" :used="play.used[r.id] ?? 0" @update:used="setUsed(r.id, $event)" />
      <!-- Store puljer (fx Lay on Hands) trackes som et tal -->
      <div v-else class="flex items-center gap-2 text-sm">
        <span class="text-gray-500">tilbage</span>
        <input
          type="number" min="0" :max="r.max"
          :value="r.max - (play.used[r.id] ?? 0)"
          class="field !w-20 !p-1.5 font-mono"
          @input="setUsed(r.id, r.max - Number(($event.target as HTMLInputElement).value))"
        >
        <span class="text-gray-500 font-mono">/ {{ r.max }}</span>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import type { Resource } from '../../rules/progression'
import { useResource } from '../../rules/play'
import Pips from '../ui/Pips.vue'

const MAX_PIPS = 20

const store = useCharacterStore()
const x = computed(() => store.derived)
const play = computed(() => store.play)

const resetText = (r: Resource) =>
  r.reset === 'short' ? 'short rest' : r.shortRegain ? `long rest (${r.shortRegain} ved short)` : 'long rest'

function setUsed(id: string, used: number) {
  if (!Number.isFinite(used)) return
  store.play = useResource(store.play, id, x.value.resources.find(r => r.id === id)?.name ?? id, used)
}
</script>
