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
            v-if="tab !== 'rettelser'"
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

      <InventoryTab v-if="tab === 'udstyr'" :edit-layout="editLayout" />
      <SpellsTab v-else-if="tab === 'spells'" :edit-layout="editLayout" />
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

      <PanelLayout
        v-model:stored="store.play.layout"
        :defaults="DEFAULT_LAYOUT"
        :names="PANEL_NAMES"
        :editing="editLayout"
        cols-class="lg:grid-cols-3"
      >
        <template #default="{ id }">
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
                  <span>
                    {{ s.proficient ? '●' : '○' }} {{ abilityShort(s.ability) }}
                    <span v-if="s.advantage.length" class="tag !text-[9px] !px-1 text-emerald-300 border-emerald-700/60" :title="`Advantage: ${s.advantage.join('; ')}`">Adv</span>
                  </span>
                  <span class="font-mono">{{ signed(s.bonus) }}</span>
                </li>
              </ul>
              <ul v-if="x.saves.some(s => s.advantage.length)" class="mt-2 space-y-0.5 text-[11px] text-gray-500">
                <template v-for="s in x.saves" :key="s.ability">
                  <li v-for="note in s.advantage" :key="note"><span class="text-emerald-300">Adv {{ abilityShort(s.ability) }}:</span> {{ note }}</li>
                </template>
              </ul>
              <h3 class="section-title mt-5">Skills</h3>
              <ul class="space-y-0.5 text-sm">
                <li
                  v-for="s in x.skills"
                  :key="s.id"
                  class="flex items-baseline gap-2"
                  :class="s.proficient ? 'text-gray-100' : 'text-gray-500'"
                  :title="`${abilityShort(s.ability)}-modifier ${signed(x.mods[s.ability])}${s.proficient ? ' + proficiency' : ''}${s.expertise ? ' (expertise)' : ''}`"
                >
                  <span class="flex-1 min-w-0 truncate">{{ s.expertise ? '◆' : s.proficient ? '●' : '○' }} {{ s.name }}</span>
                  <span class="w-8 text-xs opacity-60">{{ abilityShort(s.ability) }}</span>
                  <span class="w-8 text-right font-mono font-semibold">{{ signed(s.bonus) }}</span>
                  <span class="w-9 text-right font-mono opacity-70">({{ s.bonus - x.mods[s.ability] ? signed(s.bonus - x.mods[s.ability]) : '–' }})</span>
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
              <ul class="divide-y divide-gray-700">
                <li v-for="a in x.attacks" :key="a.name" class="py-2 flex items-center gap-3" :title="a.properties">
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-gray-100">
                      {{ a.name }}
                      <span v-if="a.mastery" class="tag text-emerald-300 border-emerald-700/60 ml-1">{{ a.mastery }}</span>
                    </div>
                    <div v-if="a.properties" class="text-[11px] text-gray-500">{{ a.properties }}</div>
                    <div v-if="!a.proficient" class="text-xs text-yellow-500">Ikke proficient</div>
                  </div>
                  <div class="text-center shrink-0 w-24 rounded border border-gray-600 bg-gray-950 px-1 py-1">
                    <div class="text-[9px] font-display uppercase tracking-wide text-gray-500">Hit</div>
                    <div class="text-lg font-bold font-mono leading-7 text-gray-100">{{ signed(a.toHit) }}</div>
                  </div>
                  <div class="text-center shrink-0 w-24 rounded border border-red-500/50 bg-red-950 px-1 py-1">
                    <div class="text-[9px] font-display uppercase tracking-wide text-red-500 truncate" :title="a.type">{{ a.type }}</div>
                    <div class="text-lg font-bold font-mono leading-7 text-red-500 whitespace-nowrap">{{ a.damage }}</div>
                  </div>
                </li>
              </ul>
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
        </template>
      </PanelLayout>
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
import PanelLayout from '../components/ui/PanelLayout.vue'
import { useSettings } from '../composables/useSettings'

const route = useRoute()
const { store, charId, ready } = useCharacterPage()
const x = computed(() => store.derived)

const ARMOR_NAMES = { light: 'Light', medium: 'Medium', heavy: 'Heavy', shield: 'Shields' } as const

const settings = useSettings()
/** Rettelser-fanen findes kun med manuel redigering slået til, og Spells kun når karakteren har spells. */
const tab = computed(() => {
  const t = (route.params.tab as string) || 'ark'
  return TABS.value.some(v => v.id === t) ? t : 'ark'
})
const TABS = computed(() => [
  { id: 'ark', name: 'Ark', count: 0 },
  { id: 'udstyr', name: 'Udstyr', count: store.items.length },
  ...(x.value.spells.length ? [{ id: 'spells', name: 'Spells', count: x.value.spells.length }] : []),
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

const editLayout = ref(false)

// ---------- Øvrigt ----------

function toggleCondition(c: string) {
  const list = store.play.conditions
  store.play.conditions = list.includes(c) ? list.filter(v => v !== c) : [...list, c]
}

</script>
