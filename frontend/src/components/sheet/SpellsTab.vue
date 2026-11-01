<template>
  <div class="space-y-6">
    <p v-if="!x.spells.length" class="panel text-gray-400">Karakteren har ingen spells.</p>

    <template v-else>
      <!-- Slots og stats -->
      <section class="panel space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            <span v-for="st in x.spellStats" :key="st.ability" class="tag !text-sm !normal-case text-indigo-300 border-indigo-700/60" :title="st.sources.join(', ')">
              {{ abilityShort(st.ability) }}: DC {{ st.saveDc }} · {{ signed(st.attack) }} to hit
            </span>
          </div>
          <div v-if="store.play.concentration" class="flex items-center gap-2 text-sm bg-amber-950/40 border border-amber-800/60 rounded px-3 py-1.5">
            <span class="text-amber-300">Concentration: <strong>{{ store.play.concentration }}</strong></span>
            <button type="button" class="text-gray-400 hover:text-gray-200" @click="store.play.concentration = null">Afslut</button>
          </div>
        </div>
        <div v-if="x.spellcasting?.slots.length || x.spellcasting?.pact" class="flex flex-wrap gap-x-6 gap-y-2">
          <div v-for="(max, i) in x.spellcasting.slots" :key="i" class="flex items-center gap-2">
            <span class="text-xs text-gray-400 w-12">Level {{ i + 1 }}</span>
            <Pips :label="`Level ${i + 1}-slots`" :max="max" :used="store.play.used[slotKey(i + 1)] ?? 0" @update:used="setUsed(slotKey(i + 1), $event)" />
          </div>
          <div v-if="x.spellcasting.pact" class="flex items-center gap-2">
            <span class="text-xs text-gray-400">Pact (L{{ x.spellcasting.pact.level }})</span>
            <Pips label="Pact slots" :max="x.spellcasting.pact.count" :used="store.play.used[PACT_KEY] ?? 0" @update:used="setUsed(PACT_KEY, $event)" />
          </div>
        </div>
      </section>

      <!-- Filtre -->
      <section class="flex flex-wrap items-center gap-2">
        <input v-model="search" type="search" placeholder="Søg…" class="field !p-2 !w-56">
        <button
          v-for="lvl in levels"
          :key="lvl"
          type="button"
          class="px-3 py-1.5 text-sm rounded-full border transition-colors"
          :class="levelFilter === lvl ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'"
          @click="levelFilter = levelFilter === lvl ? null : lvl"
        >{{ lvl === 0 ? 'Cantrips' : `Level ${lvl}` }}</button>
        <label class="flex items-center gap-1.5 text-sm text-gray-300 ml-2">
          <input v-model="onlyCastable" type="checkbox" class="accent-red-600"> Kun dem jeg kan caste nu
        </label>
      </section>

      <!-- Kort -->
      <section class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <article
          v-for="s in visible"
          :key="`${s.source}-${s.spell.id}`"
          class="rounded-lg border bg-gradient-to-b from-gray-900 to-gray-950 flex flex-col"
          :class="[SCHOOL_COLORS[s.spell.school], store.play.concentration === s.spell.name && 'ring-2 ring-amber-500']"
        >
          <header class="px-4 pt-3 pb-2 border-b border-gray-800">
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-bold text-gray-100 text-lg leading-tight">{{ s.spell.name }}</h4>
              <span class="flex gap-1 shrink-0 pt-1">
                <span v-if="s.spell.concentration" class="tag text-amber-300 border-amber-700/60" title="Concentration">C</span>
                <span v-if="s.spell.ritual" class="tag text-sky-300 border-sky-700/60" title="Ritual">R</span>
              </span>
            </div>
            <div class="text-xs text-gray-400 italic">
              {{ s.spell.level ? `Level ${s.spell.level} ${s.spell.school}` : `${s.spell.school} cantrip` }}
            </div>
          </header>

          <dl class="grid grid-cols-2 gap-px bg-gray-800 text-xs border-b border-gray-800">
            <div class="bg-gray-900 px-3 py-1.5"><dt class="text-[10px] uppercase tracking-wide text-gray-500">Casting time</dt><dd class="text-gray-200">{{ s.spell.time }}</dd></div>
            <div class="bg-gray-900 px-3 py-1.5"><dt class="text-[10px] uppercase tracking-wide text-gray-500">Rækkevidde</dt><dd class="text-gray-200">{{ details(s)?.range ?? '–' }}</dd></div>
            <div class="bg-gray-900 px-3 py-1.5"><dt class="text-[10px] uppercase tracking-wide text-gray-500">Komponenter</dt><dd class="text-gray-200">{{ details(s)?.components ?? '–' }}</dd></div>
            <div class="bg-gray-900 px-3 py-1.5"><dt class="text-[10px] uppercase tracking-wide text-gray-500">Varighed</dt><dd class="text-gray-200">{{ details(s) ? durationText(s.spell, details(s)!) : '–' }}</dd></div>
          </dl>

          <div class="px-4 py-3 space-y-3 flex-1">
            <p class="text-sm text-gray-300">{{ s.spell.text }}</p>

            <p v-if="s.spell.level === 0 && cantripScaling(s.spell, x.level)" class="text-xs text-emerald-300">
              På level {{ x.level }}: <strong>{{ cantripScaling(s.spell, x.level) }}</strong>
              <span class="text-gray-500"> (stiger på level 5, 11 og 17)</span>
            </p>

            <div v-if="upcastSummary(s.spell)" class="rounded bg-indigo-950/40 border border-indigo-900/60 px-3 py-2 space-y-1">
              <div class="text-[10px] uppercase tracking-wide text-indigo-300">Ved højere levels</div>
              <p class="text-xs text-gray-300">{{ upcastSummary(s.spell) }}</p>
              <ul v-if="upcastLevels(s).length" class="text-xs space-y-0.5 pt-1">
                <li v-for="lvl in upcastLevels(s)" :key="lvl" class="flex justify-between gap-2" :class="slotsLeftAt(lvl) ? 'text-gray-200' : 'text-gray-600'">
                  <span>Level {{ lvl }}-slot</span><span class="text-right">{{ upcastText(s.spell, lvl) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <footer class="px-4 py-2 border-t border-gray-800 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-500">
              <span>{{ s.source }}</span>
              <span v-if="s.tag" class="text-gray-400">{{ s.tag }}</span>
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="(o, i) in options(s)"
                :key="i"
                type="button"
                class="text-xs px-2.5 py-1 rounded border transition-colors"
                :class="isUpcast(s, o) ? 'border-indigo-600 bg-indigo-950/50 text-indigo-200 hover:border-indigo-400' : 'border-gray-600 bg-gray-800 text-gray-100 hover:border-red-500'"
                :title="isUpcast(s, o) ? `Upcast: ${upcastText(s.spell, levelOf(o)) ?? 'samme effekt'}` : undefined"
                @click="cast(s, o)"
              >{{ isUpcast(s, o) ? '↑ ' : '' }}{{ castOptionLabel(o) }}</button>
              <span v-if="!options(s).length" class="text-xs text-gray-600">Ingen slots eller gratis casts tilbage</span>
            </div>
          </footer>
        </article>
      </section>
      <p v-if="!visible.length" class="text-gray-500">Ingen spells matcher filtrene.</p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { abilityShort } from '../../rules/data'
import { signed, type DerivedSpell } from '../../rules/engine'
import { PACT_KEY, castOptionLabel, castOptions, castSpell, slotKey, type CastOption } from '../../rules/play'
import { cantripScaling, durationText, spellDetails, upcastSummary, upcastText } from '../../rules/spellDetails'
import Pips from '../ui/Pips.vue'

const store = useCharacterStore()
const x = computed(() => store.derived)

/** Kortets kant farves efter school, så de er nemme at kende fra hinanden. */
const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: 'border-sky-800', Conjuration: 'border-amber-800', Divination: 'border-slate-500', Enchantment: 'border-pink-800',
  Evocation: 'border-red-800', Illusion: 'border-violet-800', Necromancy: 'border-emerald-900', Transmutation: 'border-orange-800',
}

const search = ref('')
const levelFilter = ref<number | null>(null)
const onlyCastable = ref(false)

const levels = computed(() => [...new Set(x.value.spells.map(s => s.spell.level))].sort((a, b) => a - b))
const options = (s: DerivedSpell) => castOptions(store.play, x.value, s)
const details = (s: DerivedSpell) => spellDetails(s.spell.id)

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  return x.value.spells.filter(s =>
    (levelFilter.value === null || s.spell.level === levelFilter.value)
    && (!q || `${s.spell.name} ${s.spell.school} ${s.spell.text}`.toLowerCase().includes(q))
    && (!onlyCastable.value || options(s).length > 0))
})

/** Højeste slot-level karakteren har (inkl. pact slots). */
const maxSlot = computed(() => Math.max(x.value.spellcasting?.slots.length ?? 0, x.value.spellcasting?.pact?.level ?? 0))
const upcastLevels = (s: DerivedSpell) =>
  s.slotless || !s.spell.level ? [] : Array.from({ length: Math.max(0, maxSlot.value - s.spell.level) }, (_, i) => s.spell.level + i + 1)

function slotsLeftAt(level: number) {
  const regular = (x.value.spellcasting?.slots[level - 1] ?? 0) - (store.play.used[slotKey(level)] ?? 0)
  const pact = x.value.spellcasting?.pact
  const pactLeft = pact && pact.level === level ? pact.count - (store.play.used[PACT_KEY] ?? 0) : 0
  return regular + pactLeft > 0
}

const levelOf = (o: CastOption) => (o.kind === 'slot' || o.kind === 'pact' ? o.level : 0)
const isUpcast = (s: DerivedSpell, o: CastOption) => levelOf(o) > s.spell.level && s.spell.level > 0

function cast(s: DerivedSpell, o: CastOption) {
  store.play = castSpell(store.play, s, o)
}

function setUsed(id: string, used: number) {
  store.play.used = { ...store.play.used, [id]: used }
}
</script>
