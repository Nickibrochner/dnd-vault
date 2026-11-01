<template>
  <aside class="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4 text-sm">
    <div>
      <div class="text-lg font-bold text-gray-100 truncate">{{ draft.name || 'Unavngiven' }}</div>
      <div class="text-gray-400">
        Level {{ x.level }} {{ [x.species?.name, x.classText].filter(Boolean).join(' ') || '–' }}
      </div>
      <div v-if="x.background" class="text-gray-500 text-xs">{{ x.background.name }}</div>
    </div>

    <dl class="grid grid-cols-3 gap-2 text-center">
      <div class="mini-stat" :title="x.hpBreakdown"><dt>HP</dt><dd>{{ x.cls ? x.hp : '–' }}</dd></div>
      <div class="mini-stat" :title="x.acBreakdown"><dt>AC</dt><dd>{{ x.ac }}</dd></div>
      <div class="mini-stat"><dt>Init</dt><dd>{{ signed(x.initiative) }}</dd></div>
      <div class="mini-stat"><dt>Speed</dt><dd>{{ x.speed }}</dd></div>
      <div class="mini-stat"><dt>Prof</dt><dd>+{{ x.pb }}</dd></div>
      <div class="mini-stat"><dt>Passiv</dt><dd>{{ x.passivePerception }}</dd></div>
    </dl>

    <dl class="grid grid-cols-3 gap-2 text-center">
      <div v-for="a in ABILITIES" :key="a.key" class="mini-stat" :class="x.cls?.saves.includes(a.key) && 'ring-1 ring-sky-700'">
        <dt>{{ a.short }}</dt>
        <dd>{{ draft.baseScores[a.key] === null ? '–' : signed(x.mods[a.key]) }}</dd>
        <div class="text-[10px] text-gray-500 font-mono">{{ draft.baseScores[a.key] === null ? '' : x.scores[a.key] }}</div>
      </div>
    </dl>

    <div v-if="proficient.length">
      <div class="label">Skills</div>
      <div class="text-gray-300">{{ proficient.map(s => `${s.name} ${signed(s.bonus)}`).join(', ') }}</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { ABILITIES } from '../../rules/data'
import { signed } from '../../rules/engine'

const store = useCharacterStore()
const draft = computed(() => store.draft)
const x = computed(() => store.derived)
const proficient = computed(() => x.value.skills.filter(s => s.proficient))
</script>
