<template>
  <div class="space-y-8">
    <StepHeader title="Ability Scores" lead="Fordel dine grundværdier, og læg derefter baggrundens bonusser oven i (+2/+1 eller +1/+1/+1, max 20)." />

    <section class="space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="m in METHODS"
          :key="m.id"
          type="button"
          class="px-4 py-2 rounded text-sm font-medium border transition-colors"
          :class="draft.abilityMethod === m.id ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-red-500'"
          @click="setMethod(m.id)"
        >{{ m.name }}</button>
        <button
          v-if="cls"
          type="button"
          class="ml-auto px-4 py-2 rounded text-sm font-medium border border-emerald-700 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
          @click="applySuggestion"
        >✨ Foreslå fordeling til {{ cls.name }}</button>
      </div>
      <p class="text-sm text-gray-400">{{ methodHelp }}</p>
    </section>

    <section class="overflow-x-auto">
      <table class="w-full text-sm border-separate border-spacing-y-1.5">
        <thead>
          <tr class="text-left text-gray-400 text-xs uppercase tracking-wide">
            <th class="px-3 font-medium">Evne</th>
            <th class="px-3 font-medium">Grundværdi</th>
            <th class="px-3 font-medium text-center">Bonus</th>
            <th class="px-3 font-medium text-center">Total</th>
            <th class="px-3 font-medium text-center">Modifier</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in ABILITIES" :key="a.key" class="bg-gray-900">
            <td class="px-3 py-2 rounded-l border-y border-l border-gray-700">
              <div class="font-semibold text-gray-100">{{ a.name }}</div>
              <div class="flex gap-1 mt-0.5">
                <span v-if="cls?.primary.includes(a.key)" class="tag text-amber-300 border-amber-700/60">Primær</span>
                <span v-if="cls?.saves.includes(a.key)" class="tag text-sky-300 border-sky-700/60">Save</span>
              </div>
            </td>
            <td class="px-3 py-2 border-y border-gray-700">
              <select v-if="draft.abilityMethod === 'standard'" v-model="draft.baseScores[a.key]" class="field !w-24 !p-2">
                <option :value="null">–</option>
                <option v-for="v in STANDARD_ARRAY" :key="v" :value="v" :disabled="isArrayValueUsed(v, a.key)">{{ v }}</option>
              </select>
              <div v-else-if="draft.abilityMethod === 'pointbuy'" class="flex items-center gap-2">
                <button type="button" class="step-btn" :disabled="!canDecrease(a.key)" @click="adjust(a.key, -1)">−</button>
                <span class="w-8 text-center font-mono text-lg">{{ draft.baseScores[a.key] }}</span>
                <button type="button" class="step-btn" :disabled="!canIncrease(a.key)" @click="adjust(a.key, 1)">+</button>
                <span class="text-xs text-gray-500 font-mono">{{ POINT_BUY_COST[draft.baseScores[a.key] ?? 8] }} pt</span>
              </div>
              <input
                v-else
                type="number"
                :min="MANUAL_MIN"
                :max="MANUAL_MAX"
                :value="draft.baseScores[a.key] ?? ''"
                class="field !w-24 !p-2"
                @change="setManual(a.key, ($event.target as HTMLInputElement).value)"
              >
            </td>
            <td class="px-3 py-2 border-y border-gray-700 text-center font-mono" :class="bonuses[a.key] ? 'text-emerald-400' : 'text-gray-600'">
              {{ bonuses[a.key] ? `+${bonuses[a.key]}` : '–' }}
            </td>
            <td class="px-3 py-2 border-y border-gray-700 text-center font-mono text-lg text-gray-100">
              {{ draft.baseScores[a.key] === null ? '–' : store.derived.scores[a.key] }}
            </td>
            <td class="px-3 py-2 rounded-r border-y border-r border-gray-700 text-center font-mono text-lg font-bold text-red-400">
              {{ draft.baseScores[a.key] === null ? '–' : signed(store.derived.mods[a.key]) }}
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="draft.abilityMethod === 'pointbuy'" class="mt-2 text-sm font-mono" :class="pointsLeft < 0 ? 'text-red-400' : 'text-gray-300'">
        Point tilbage: {{ pointsLeft }} / {{ POINT_BUY_BUDGET }}
      </div>
    </section>

    <section class="panel space-y-4">
      <h3 class="text-lg font-bold text-red-500">Baggrunds-bonus{{ bg ? ` (${bg.name})` : '' }}</h3>
      <p v-if="!bg" class="text-sm text-yellow-400">Vælg en baggrund først.</p>
      <template v-else>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="mode in BONUS_MODES"
            :key="mode.id"
            type="button"
            class="px-4 py-2 rounded text-sm font-medium border transition-colors"
            :class="draft.bonusMode === mode.id ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-600 text-gray-300 hover:border-red-500'"
            @click="draft.bonusMode = mode.id"
          >{{ mode.name }}</button>
        </div>
        <div v-if="draft.bonusMode === '2-1'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="space-y-1.5">
            <span class="block text-sm font-medium text-gray-300">+2 til</span>
            <select v-model="draft.bonusPlus2" class="field">
              <option :value="null" disabled>Vælg evne</option>
              <option v-for="a in bg.abilities" :key="a" :value="a" :disabled="a === draft.bonusPlus1">{{ abilityShort(a) }}</option>
            </select>
          </label>
          <label class="space-y-1.5">
            <span class="block text-sm font-medium text-gray-300">+1 til</span>
            <select v-model="draft.bonusPlus1" class="field">
              <option :value="null" disabled>Vælg evne</option>
              <option v-for="a in bg.abilities" :key="a" :value="a" :disabled="a === draft.bonusPlus2">{{ abilityShort(a) }}</option>
            </select>
          </label>
        </div>
        <p v-else class="text-sm text-gray-400">+1 til {{ bg.abilities.map(abilityShort).join(', ') }}.</p>
        <p v-for="a in cappedAbilities" :key="a" class="text-sm text-yellow-400">⚠️ {{ abilityShort(a) }} rammer loftet på 20 – en del af bonussen går tabt.</p>
      </template>
    </section>

    <ul v-if="store.derived.warnings.length" class="space-y-1">
      <li v-for="w in store.derived.warnings" :key="w" class="text-sm text-yellow-400">⚠️ {{ w }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { ABILITIES, abilityShort, type Ability } from '../../rules/data'
import {
  ABILITY_CAP, MANUAL_MAX, MANUAL_MIN, POINT_BUY_BUDGET, POINT_BUY_COST, STANDARD_ARRAY,
  abilityBonuses, findBackground, findClass, pointBuySpent, signed, suggestedBonus, suggestedScores,
  type AbilityMethod, type BonusMode,
} from '../../rules/engine'
import StepHeader from './StepHeader.vue'

const METHODS: { id: AbilityMethod; name: string }[] = [
  { id: 'standard', name: 'Standard Array' },
  { id: 'pointbuy', name: 'Point Buy' },
  { id: 'manual', name: 'Manuel / Terningslag' },
]
const BONUS_MODES: { id: BonusMode; name: string }[] = [
  { id: '2-1', name: '+2 / +1' },
  { id: '1-1-1', name: '+1 / +1 / +1' },
]

const store = useCharacterStore()
const draft = computed(() => store.draft)
const cls = computed(() => findClass(draft.value.classId))
const bg = computed(() => findBackground(draft.value.backgroundId))
const bonuses = computed(() => abilityBonuses(draft.value))
const pointsLeft = computed(() => POINT_BUY_BUDGET - pointBuySpent(draft.value.baseScores))

const methodHelp = computed(() => ({
  standard: `Fordel værdierne ${STANDARD_ARRAY.join(', ')} – hver værdi bruges én gang.`,
  pointbuy: `Alle starter på 8. Du har ${POINT_BUY_BUDGET} point; værdier fra 8 til 15 (14 og 15 koster ekstra).`,
  manual: `Indtast værdier fra ${MANUAL_MIN} til ${MANUAL_MAX}, fx fra 4d6 hvor den laveste terning droppes.`,
}[draft.value.abilityMethod]))

const cappedAbilities = computed(() =>
  ABILITIES.map(a => a.key).filter(k => bonuses.value[k] && (draft.value.baseScores[k] ?? 0) + bonuses.value[k] > ABILITY_CAP))

function setMethod(method: AbilityMethod) {
  if (method === draft.value.abilityMethod) return
  draft.value.abilityMethod = method
  for (const { key } of ABILITIES) draft.value.baseScores[key] = null
}

function applySuggestion() {
  if (!cls.value) return
  draft.value.abilityMethod = 'standard'
  Object.assign(draft.value.baseScores, suggestedScores(cls.value))
  if (bg.value) {
    const { plus2, plus1 } = suggestedBonus(cls.value, bg.value)
    draft.value.bonusMode = '2-1'
    draft.value.bonusPlus2 = plus2
    draft.value.bonusPlus1 = plus1
  }
}

const isArrayValueUsed = (value: number, self: Ability) => {
  const usedBy = ABILITIES.filter(a => a.key !== self && draft.value.baseScores[a.key] === value).length
  return usedBy >= STANDARD_ARRAY.filter(v => v === value).length
}

const scoreOf = (a: Ability) => draft.value.baseScores[a] ?? 8
const canDecrease = (a: Ability) => scoreOf(a) > 8
const canIncrease = (a: Ability) =>
  scoreOf(a) < 15 && POINT_BUY_COST[scoreOf(a) + 1] - POINT_BUY_COST[scoreOf(a)] <= pointsLeft.value
const adjust = (a: Ability, delta: number) => { draft.value.baseScores[a] = scoreOf(a) + delta }

function setManual(a: Ability, raw: string) {
  const n = Number.parseInt(raw, 10)
  draft.value.baseScores[a] = Number.isNaN(n) ? null : Math.min(MANUAL_MAX, Math.max(MANUAL_MIN, n))
}
</script>
