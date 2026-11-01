<template>
  <div class="space-y-4">
    <p v-if="editing" class="text-sm text-gray-400">
      Træk kasserne rundt – eller brug pilene. Layoutet gemmes med karakteren.
      <button type="button" class="underline text-gray-300 ml-2" @click="emit('update:stored', null)">Nulstil layout</button>
    </p>

    <div class="grid grid-cols-1 gap-6 items-start" :class="colsClass">
      <div
        v-for="(column, ci) in layout"
        :key="ci"
        class="space-y-6 min-h-[4rem] rounded-lg"
        :class="editing && 'outline-dashed outline-1 outline-gray-700 p-2'"
        @dragover.prevent
        @drop="dropAt(ci, column.length)"
      >
        <template v-for="(id, pi) in column" :key="id">
          <div
            v-if="!show || show.has(id)"
            :draggable="editing"
            class="relative"
            :class="[editing && 'cursor-move ring-1 ring-gray-600 rounded-lg', dragging === id && 'opacity-40']"
            @dragstart="dragging = id"
            @dragend="dragging = null"
            @dragover.prevent
            @drop.stop="dropAt(ci, pi)"
          >
            <div v-if="editing" class="absolute -top-3 right-2 z-10 flex gap-1">
              <span class="tag bg-gray-900 text-gray-300 border-gray-600 max-w-[10rem] truncate">⠿ {{ names[id] ?? id }}</span>
              <button v-for="m in moves" :key="m.label" type="button" class="tag bg-gray-900 text-gray-300 border-gray-600 hover:border-red-500" :title="m.title" @click="move(id, m.dc, m.dp)">{{ m.label }}</button>
            </div>
            <slot :id="id" />
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

// Kolonner med kasser, der kan trækkes rundt. Layoutet ejes af forælderen (gemmes typisk i store.play).

const props = defineProps<{
  /** Standardplacering af alle kendte kasser – bestemmer også hvilke id'er der findes. */
  defaults: string[][]
  /** Det gemte layout; null = standard. */
  stored: string[][] | null | undefined
  names: Record<string, string>
  editing: boolean
  /** Kun disse kasser vises (fx ved filtrering); udeladt = alle. */
  show?: Set<string>
  colsClass?: string
}>()
const emit = defineEmits<{ 'update:stored': [layout: string[][] | null] }>()

const MOVES = [
  { label: '↑', title: 'Flyt op', dc: 0, dp: -1 }, { label: '↓', title: 'Flyt ned', dc: 0, dp: 1 },
  { label: '←', title: 'Flyt til venstre kolonne', dc: -1, dp: 0 }, { label: '→', title: 'Flyt til højre kolonne', dc: 1, dp: 0 },
]

/** Med kun én kolonne giver venstre/højre ingen mening. */
const moves = computed(() => (layout.value.length > 1 ? MOVES : MOVES.filter(m => !m.dc)))

const dragging = ref<string | null>(null)

/** Det gemte layout – ukendte kasser fjernes, og nye kasser tilføjes, så intet forsvinder. */
const layout = computed<string[][]>(() => {
  const stored = props.stored
  if (!stored) return props.defaults
  const known = new Set(props.defaults.flat())
  const seen = new Set<string>()
  const cols = props.defaults.map((_, i) => (stored[i] ?? []).filter(id => known.has(id) && !seen.has(id) && seen.add(id)))
  for (const [i, col] of props.defaults.entries()) for (const id of col) if (!seen.has(id)) cols[i].push(id)
  return cols
})

function placeAt(id: string, col: number, pos: number) {
  const cols = layout.value.map(c => c.filter(p => p !== id))
  const target = Math.max(0, Math.min(cols.length - 1, col))
  cols[target].splice(Math.max(0, Math.min(cols[target].length, pos)), 0, id)
  emit('update:stored', cols)
}

function dropAt(col: number, pos: number) {
  const id = dragging.value
  dragging.value = null
  if (!id) return
  // Flyttes en kasse nedad i samme kolonne, rykker indexet én, når den selv fjernes
  const from = layout.value[col].indexOf(id)
  placeAt(id, col, from !== -1 && from < pos ? pos - 1 : pos)
}

function move(id: string, dc: number, dp: number) {
  const col = layout.value.findIndex(c => c.includes(id))
  const pos = layout.value[col].indexOf(id)
  const last = layout.value.length - 1
  placeAt(id, col + dc, dc ? layout.value[Math.max(0, Math.min(last, col + dc))].length : pos + dp)
}
</script>
