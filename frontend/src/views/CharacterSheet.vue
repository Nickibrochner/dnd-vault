<template>
  <div class="max-w-7xl mx-auto px-4 py-6 space-y-6">
    <div v-if="store.loading" class="text-gray-400">Henter karakter…</div>

    <div v-else-if="store.loadError" class="panel text-red-400 space-y-3">
      <p>{{ store.loadError }}</p>
      <router-link to="/" class="text-gray-300 underline">Tilbage til oversigten</router-link>
    </div>

    <template v-else-if="ready">
      <!-- Hoved -->
      <header class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold">{{ store.draft.name || 'Unavngiven' }}</h2>
          <div class="text-gray-300">
            Level {{ x.level }} {{ [x.species?.name, x.classText].filter(Boolean).join(' ') }}
            <span v-if="subclassText" class="text-gray-400">({{ subclassText }})</span>
          </div>
          <div class="text-sm text-gray-500">{{ [x.background?.name, store.draft.alignment].filter(Boolean).join(' · ') }}</div>
          <component
            :is="settings.manualEditing ? 'router-link' : 'span'"
            v-if="x.overridden.length || store.draft.overrides.features?.length || store.draft.overrides.spells?.length"
            :to="`/character/${charId}/rettelser`"
            class="tag !normal-case !text-xs mt-1 text-yellow-300 border-yellow-600/60"
            title="Nogle værdier er sat manuelt i stedet for at blive beregnet"
          >✎ Manuelle rettelser</component>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <SaveIndicator />
          <button type="button" class="btn-secondary" title="Genvind short rest-ressourcer" @click="rest('short')">☕ Short rest</button>
          <button
            type="button"
            class="px-3 py-2 rounded text-sm border transition-colors"
            :class="confirmLong ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-200 hover:border-indigo-500'"
            @click="longRestClick"
          >{{ confirmLong ? 'Bekræft long rest' : '🌙 Long rest' }}</button>
          <router-link :to="`/character/${charId}/level-up`" class="px-3 py-2 rounded text-sm bg-red-600 hover:bg-red-500 text-white">Level up</router-link>
          <router-link :to="`/builder/${charId}`" class="btn-secondary">Redigér</router-link>
          <button
            type="button"
            class="btn-secondary"
            :class="editLayout && '!border-red-500 !text-red-300'"
            @click="editLayout = !editLayout"
          >{{ editLayout ? 'Færdig med layout' : '⠿ Tilpas layout' }}</button>
        </div>
      </header>

      <!-- Seneste rest: tydelig markering, der blinker lige efter et rest -->
      <div
        v-if="store.play.lastRest"
        class="rounded-lg border px-4 py-2 text-sm flex flex-wrap items-center gap-x-4 gap-y-1 transition-colors"
        :class="[
          store.play.lastRest.type === 'short' ? 'border-amber-700/70 bg-amber-950/40 text-amber-200' : 'border-indigo-700/70 bg-indigo-950/40 text-indigo-200',
          justRested && 'ring-2 ring-offset-2 ring-offset-sand animate-pulse',
          justRested && (store.play.lastRest.type === 'short' ? 'ring-amber-400' : 'ring-indigo-400'),
        ]"
      >
        <span class="font-semibold">
          {{ store.play.lastRest.type === 'short' ? '☕ Short rest taget' : '🌙 Long rest taget' }} {{ restTime }}
        </span>
        <span class="text-xs opacity-80">
          {{ store.play.shortRests === 0 ? 'Ingen short rests siden long rest' : `${store.play.shortRests} short rest${store.play.shortRests > 1 ? 's' : ''} siden sidste long rest` }}
        </span>
      </div>

      <p v-if="store.stepIssues.review.length || store.progressionIssues.length" class="panel border-yellow-700 text-sm text-yellow-400">
        ⚠️ Karakteren har ufærdige valg –
        <router-link :to="store.stepIssues.review.length ? `/builder/${charId}` : `/character/${charId}/level-up`" class="underline text-gray-200">gør dem færdige</router-link>.
      </p>

      <!-- Faner -->
      <nav class="flex gap-1 border-b border-gray-700">
        <router-link
          v-for="t in TABS"
          :key="t.id"
          :to="t.id === 'ark' ? `/character/${charId}` : `/character/${charId}/${t.id}`"
          class="px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 -mb-px transition-colors"
          :class="tab === t.id ? 'bg-gray-900 border-gray-600 text-red-500 font-display font-bold' : 'border-transparent font-display text-gray-400 hover:text-gray-200'"
        >{{ t.name }}<span v-if="t.count" class="ml-1.5 text-xs text-gray-500">{{ t.count }}</span></router-link>
      </nav>

      <InventoryTab v-if="tab === 'udstyr'" />
      <SpellsTab v-else-if="tab === 'spells'" />
      <OverridesTab v-else-if="tab === 'rettelser'" />

      <template v-else>
      <!-- Kampværdier -->
      <section class="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <div class="stat text-center" :title="x.acBreakdown"><dt>AC</dt><dd class="!text-2xl">{{ x.ac }}</dd></div>
        <div class="stat text-center"><dt>Initiative</dt><dd class="!text-2xl">{{ signed(x.initiative) }}</dd></div>
        <div class="stat text-center"><dt>Speed</dt><dd class="!text-2xl">{{ speed }}<span class="text-sm text-gray-500"> ft.</span></dd></div>
        <div class="stat text-center"><dt>Prof. Bonus</dt><dd class="!text-2xl">+{{ x.pb }}</dd></div>
        <div class="stat text-center"><dt>Passiv Perc.</dt><dd class="!text-2xl">{{ x.passivePerception }}</dd></div>
        <button
          type="button"
          class="stat text-center transition-colors"
          :class="store.play.inspiration ? '!border-amber-500 !bg-amber-950/40' : 'hover:border-gray-500'"
          @click="store.play.inspiration = !store.play.inspiration"
        >
          <span class="block font-display text-xs uppercase tracking-wide text-gray-500">Heroic Insp.</span>
          <span class="block text-2xl font-bold text-gray-100">{{ store.play.inspiration ? '★' : '☆' }}</span>
        </button>
      </section>

      <p v-if="editLayout" class="text-sm text-gray-400">
        Træk panelerne rundt – eller brug pilene. Layoutet gemmes med karakteren.
        <button type="button" class="underline text-gray-300 ml-2" @click="store.play.layout = null">Nulstil layout</button>
      </p>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div
          v-for="(column, ci) in layout"
          :key="ci"
          class="space-y-6 min-h-[4rem] rounded-lg"
          :class="editLayout && 'outline-dashed outline-1 outline-gray-700 p-2'"
          @dragover.prevent
          @drop="dropAt(ci, column.length)"
        >
          <div
            v-for="(id, pi) in column"
            :key="id"
            :draggable="editLayout"
            class="relative"
            :class="[editLayout && 'cursor-move ring-1 ring-gray-600 rounded-lg', dragging === id && 'opacity-40']"
            @dragstart="dragging = id"
            @dragend="dragging = null"
            @dragover.prevent
            @drop.stop="dropAt(ci, pi)"
          >
            <div v-if="editLayout" class="absolute -top-3 right-2 z-10 flex gap-1">
              <span class="tag bg-gray-900 text-gray-300 border-gray-600">⠿ {{ PANEL_NAMES[id] }}</span>
              <button v-for="m in MOVES" :key="m.label" type="button" class="tag bg-gray-900 text-gray-300 border-gray-600 hover:border-red-500" :title="m.title" @click="move(id, m.dc, m.dp)">{{ m.label }}</button>
            </div>

            <!-- Panelerne -->
            <section v-if="id === 'abilities'" class="panel">
              <div class="grid grid-cols-3 gap-2">
                <div v-for="a in ABILITIES" :key="a.key" class="mini-stat text-center">
                  <dt>{{ a.short }}</dt>
                  <dd class="!text-xl">{{ signed(x.mods[a.key]) }}</dd>
                  <div class="text-xs text-gray-500 font-mono">{{ x.scores[a.key] }}</div>
                </div>
              </div>
            </section>

            <section v-else-if="id === 'saves'" class="panel">
              <h3 class="section-title">Saving Throws</h3>
              <ul class="grid grid-cols-2 gap-1 text-sm">
                <li v-for="s in x.saves" :key="s.ability" class="flex justify-between" :class="s.proficient ? 'text-gray-100' : 'text-gray-500'">
                  <span>{{ s.proficient ? '●' : '○' }} {{ abilityShort(s.ability) }}</span><span class="font-mono">{{ signed(s.bonus) }}</span>
                </li>
              </ul>
              <h3 class="section-title mt-5">Skills</h3>
              <ul class="space-y-0.5 text-sm">
                <li v-for="s in x.skills" :key="s.id" class="flex justify-between" :class="s.proficient ? 'text-gray-100' : 'text-gray-500'">
                  <span>{{ s.expertise ? '◆' : s.proficient ? '●' : '○' }} {{ s.name }} <span class="text-xs opacity-60">{{ abilityShort(s.ability) }}</span></span>
                  <span class="font-mono">{{ signed(s.bonus) }}</span>
                </li>
              </ul>
            </section>

            <section v-else-if="id === 'proficiencies'" class="panel space-y-3 text-sm">
              <div><div class="label">Armor Training</div>{{ x.armorTraining.map(a => ARMOR_NAMES[a]).join(', ') || 'Ingen' }}</div>
              <div><div class="label">Våben</div>{{ x.weaponTraining }}</div>
              <div><div class="label">Værktøj</div>{{ x.tools.join(', ') || 'Ingen' }}</div>
              <div><div class="label">Sprog</div>{{ x.languages.join(', ') }}</div>
              <div v-if="x.resistances.length"><div class="label">Resistances</div>{{ x.resistances.join(', ') }}</div>
              <div v-if="x.darkvision"><div class="label">Sanser</div>Darkvision {{ x.darkvision }} ft.</div>
            </section>

            <HpTracker v-else-if="id === 'hp'" />

            <section v-else-if="id === 'conditions'" class="panel space-y-3">
              <h3 class="section-title !mb-1">Conditions</h3>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="c in CONDITIONS"
                  :key="c"
                  type="button"
                  class="px-2.5 py-1 text-xs rounded-full border transition-colors"
                  :class="store.play.conditions.includes(c) ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'"
                  @click="toggleCondition(c)"
                >{{ c }}</button>
              </div>
              <div class="flex items-center justify-between gap-3 text-sm">
                <span class="text-gray-300">Exhaustion <span class="text-xs text-gray-500">(−{{ 2 * store.play.exhaustion }} på d20 Tests, −{{ 5 * store.play.exhaustion }} ft. speed)</span></span>
                <div class="flex items-center gap-2">
                  <button type="button" class="step-btn" :disabled="store.play.exhaustion <= 0" @click="store.play.exhaustion--">−</button>
                  <span class="font-mono w-4 text-center">{{ store.play.exhaustion }}</span>
                  <button type="button" class="step-btn" :disabled="store.play.exhaustion >= MAX_EXHAUSTION" @click="store.play.exhaustion++">+</button>
                </div>
              </div>
            </section>

            <section v-else-if="id === 'attacks'" class="panel">
              <h3 class="section-title">Angreb</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="text-left text-[10px] uppercase tracking-wide text-gray-500">
                    <tr><th class="pb-1">Våben</th><th class="pb-1">Hit</th><th class="pb-1">Damage</th></tr>
                  </thead>
                  <tbody class="divide-y divide-gray-800">
                    <tr v-for="a in x.attacks" :key="a.name" :title="a.properties">
                      <td class="py-1.5 text-gray-100">
                        {{ a.name }}
                        <span v-if="a.mastery" class="tag text-emerald-300 border-emerald-700/60 ml-1">{{ a.mastery }}</span>
                        <span v-if="!a.proficient" class="text-xs text-yellow-500"> (ikke proficient)</span>
                        <div v-if="a.properties" class="text-[11px] text-gray-500">{{ a.properties }}</div>
                      </td>
                      <td class="py-1.5 font-mono">{{ signed(a.toHit) }}</td>
                      <td class="py-1.5 font-mono whitespace-nowrap">{{ a.damage }} <span class="text-xs text-gray-500">{{ a.type.slice(0, 5) }}.</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <router-link :to="`/character/${charId}/udstyr`" class="inline-block mt-3 text-xs text-gray-400 underline hover:text-gray-200">
                Vælg våben og rustning under Udstyr
              </router-link>
            </section>

            <ResourceList v-else-if="id === 'resources'" />

            <section v-else-if="id === 'log'" class="panel">
              <h3 class="section-title">Seneste handlinger</h3>
              <ol v-if="store.play.log.length" class="text-sm space-y-1">
                <li v-for="(entry, i) in store.play.log" :key="i" :class="i === 0 ? 'text-gray-100' : 'text-gray-500'">{{ entry }}</li>
              </ol>
              <p v-else class="text-sm text-gray-500">Intet endnu – cast en spell, brug en ressource eller tag et rest.</p>
            </section>

            <SpellsPanel v-else-if="id === 'spells'" />

            <section v-else-if="id === 'features'" class="panel space-y-3">
              <h3 class="section-title !mb-1">Features & Traits</h3>
              <details v-for="f in x.features" :key="`${f.level}-${f.source}-${f.name}`">
                <summary class="flex justify-between gap-2 cursor-pointer list-none text-sm">
                  <span class="text-gray-100">{{ f.name }}</span>
                  <span class="text-xs text-gray-500 shrink-0">{{ f.source }}{{ f.level > 1 ? ` · ${f.level}` : '' }}</span>
                </summary>
                <p class="text-xs text-gray-400 mt-1">{{ f.text }}</p>
              </details>
              <template v-if="x.feats.length">
                <div class="label pt-2">Feats</div>
                <details v-for="f in x.feats" :key="`${f.label}-${f.name}`">
                  <summary class="flex justify-between gap-2 cursor-pointer list-none text-sm">
                    <span class="text-gray-100">{{ f.name }}</span>
                    <span class="text-xs text-gray-500 shrink-0">{{ f.label }}</span>
                  </summary>
                  <p class="text-xs text-gray-400 mt-1">{{ f.text }}</p>
                </details>
              </template>
            </section>

            <section v-else-if="id === 'equipment'" class="panel space-y-3">
              <div class="flex items-baseline justify-between">
                <h3 class="section-title !mb-0">Udstyr</h3>
                <router-link :to="`/character/${charId}/udstyr`" class="text-xs text-gray-400 underline hover:text-gray-200">Åbn inventory</router-link>
              </div>
              <div v-if="equipped.length">
                <div class="label">I brug</div>
                <div class="flex flex-wrap gap-1.5 mt-1">
                  <span v-for="i in equipped" :key="i.id" class="tag !normal-case !text-xs text-gray-200 border-gray-600">{{ i.name }}{{ i.bonus ? ` +${i.bonus}` : '' }}</span>
                </div>
              </div>
              <div class="text-sm text-gray-400">
                {{ store.items.length }} genstande · {{ carried }} / {{ x.carryCapacity }} lb. · {{ coins.gp }} GP
              </div>
            </section>

            <section v-else-if="id === 'notes'" class="panel">
              <h3 class="section-title">Noter</h3>
              <textarea v-model="store.play.notes" rows="5" class="field text-sm" placeholder="Baggrundshistorie, NPC'er, quests…" />
            </section>
          </div>
        </div>
      </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useCharacterPage } from '../composables/useCharacterPage'
import { ABILITIES, abilityShort } from '../rules/data'
import { signed } from '../rules/engine'
import { CONDITIONS, MAX_EXHAUSTION, carriedWeight, coinsOf, longRest, shortRest } from '../rules/play'
import SaveIndicator from '../components/wizard/SaveIndicator.vue'
import HpTracker from '../components/sheet/HpTracker.vue'
import InventoryTab from '../components/sheet/InventoryTab.vue'
import ResourceList from '../components/sheet/ResourceList.vue'
import SpellsPanel from '../components/sheet/SpellsPanel.vue'
import SpellsTab from '../components/sheet/SpellsTab.vue'
import OverridesTab from '../components/sheet/OverridesTab.vue'
import { useSettings } from '../composables/useSettings'

const route = useRoute()
const { store, charId, ready } = useCharacterPage()
const x = computed(() => store.derived)

const ARMOR_NAMES = { light: 'Light', medium: 'Medium', heavy: 'Heavy', shield: 'Shields' } as const

const settings = useSettings()
/** Rettelser-fanen findes kun med manuel redigering slået til. */
const tab = computed(() => {
  const t = (route.params.tab as string) || 'ark'
  return t === 'rettelser' && !settings.manualEditing ? 'ark' : t
})
const TABS = computed(() => [
  { id: 'ark', name: 'Ark', count: 0 },
  { id: 'udstyr', name: 'Udstyr', count: store.items.length },
  { id: 'spells', name: 'Spells', count: x.value.spells.length },
  ...(settings.manualEditing ? [{ id: 'rettelser', name: '✎ Rettelser', count: x.value.overridden.length }] : []),
])

const equipped = computed(() => store.items.filter(i => i.equipped))
const carried = computed(() => carriedWeight(store.play, x.value, store.items))
const coins = computed(() => coinsOf(store.play, x.value))

const subclassText = computed(() => x.value.classes.map(c => c.subclass?.name).filter(Boolean).join(', '))

/** Exhaustion sænker speed med 5 ft. pr. niveau (2024-reglerne). */
const speed = computed(() => Math.max(0, x.value.speed - 5 * store.play.exhaustion))

// ---------- Rests ----------

const justRested = ref(false)
let restTimer: ReturnType<typeof setTimeout> | undefined
function flashRest() {
  justRested.value = true
  clearTimeout(restTimer)
  restTimer = setTimeout(() => { justRested.value = false }, 2500)
}
onBeforeUnmount(() => clearTimeout(restTimer))

function rest(type: 'short' | 'long') {
  store.play = type === 'short' ? shortRest(store.play, x.value) : longRest(store.play)
  flashRest()
}

const confirmLong = ref(false)
function longRestClick() {
  if (!confirmLong.value) { confirmLong.value = true; return }
  confirmLong.value = false
  rest('long')
}

const restTime = computed(() => {
  const at = store.play.lastRest?.at
  if (!at) return ''
  const date = new Date(at)
  const today = date.toDateString() === new Date().toDateString()
  return today
    ? `kl. ${date.toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
})

// ---------- Layout ----------

const PANEL_NAMES: Record<string, string> = {
  abilities: 'Evner', saves: 'Saves & skills', proficiencies: 'Proficiencies', hp: 'Hit Points', conditions: 'Conditions',
  attacks: 'Angreb', resources: 'Ressourcer', log: 'Log', spells: 'Spells', features: 'Features', equipment: 'Udstyr', notes: 'Noter',
}
const DEFAULT_LAYOUT = [
  ['abilities', 'saves', 'proficiencies'],
  ['hp', 'conditions', 'attacks', 'resources', 'log'],
  ['spells', 'features', 'equipment', 'notes'],
]
const MOVES = [
  { label: '↑', title: 'Flyt op', dc: 0, dp: -1 }, { label: '↓', title: 'Flyt ned', dc: 0, dp: 1 },
  { label: '←', title: 'Flyt til venstre kolonne', dc: -1, dp: 0 }, { label: '→', title: 'Flyt til højre kolonne', dc: 1, dp: 0 },
]

const editLayout = ref(false)
const dragging = ref<string | null>(null)

/** Det gemte layout – ukendte paneler fjernes, og nye paneler tilføjes, så intet forsvinder. */
const layout = computed<string[][]>(() => {
  const stored = store.play.layout
  if (!stored) return DEFAULT_LAYOUT
  const cols = DEFAULT_LAYOUT.map((_, i) => (stored[i] ?? []).filter(id => id in PANEL_NAMES))
  const seen = new Set<string>()
  const unique = cols.map(c => c.filter(id => !seen.has(id) && seen.add(id)))
  for (const [i, col] of DEFAULT_LAYOUT.entries()) for (const id of col) if (!seen.has(id)) unique[i].push(id)
  return unique
})

function placeAt(id: string, col: number, pos: number) {
  const cols = layout.value.map(c => c.filter(p => p !== id))
  const target = Math.max(0, Math.min(cols.length - 1, col))
  cols[target].splice(Math.max(0, Math.min(cols[target].length, pos)), 0, id)
  store.play.layout = cols
}

function dropAt(col: number, pos: number) {
  const id = dragging.value
  dragging.value = null
  if (!id) return
  // Flyttes et panel nedad i samme kolonne, rykker indexet én, når det selv fjernes
  const from = layout.value[col].indexOf(id)
  placeAt(id, col, from !== -1 && from < pos ? pos - 1 : pos)
}

function move(id: string, dc: number, dp: number) {
  const col = layout.value.findIndex(c => c.includes(id))
  const pos = layout.value[col].indexOf(id)
  placeAt(id, col + dc, dc ? layout.value[Math.max(0, Math.min(2, col + dc))].length : pos + dp)
}

// ---------- Øvrigt ----------

function toggleCondition(c: string) {
  const list = store.play.conditions
  store.play.conditions = list.includes(c) ? list.filter(v => v !== c) : [...list, c]
}

</script>
