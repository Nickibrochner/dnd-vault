<template>
  <section v-if="x.spells.length || x.spellcasting" class="panel space-y-4">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h3 class="section-title !mb-0">Spells</h3>
      <div class="flex flex-wrap gap-2">
        <span v-for="st in x.spellStats" :key="st.ability" class="tag !text-xs !normal-case text-indigo-300 border-indigo-700/60" :title="st.sources.join(', ')">
          {{ abilityShort(st.ability) }}: DC {{ st.saveDc }} · {{ signed(st.attack) }} to hit
        </span>
      </div>
    </div>

    <!-- Spell slots -->
    <div v-if="x.spellcasting?.slots.length || x.spellcasting?.pact" class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
      <div v-for="(max, i) in x.spellcasting.slots" v-show="max" :key="i" class="flex items-center justify-between gap-2">
        <span class="text-sm text-gray-300">Level {{ i + 1 }}</span>
        <Pips :label="`Level ${i + 1}-slots`" :max="max" :used="play.used[slotKey(i + 1)] ?? 0" @update:used="setUsed(slotKey(i + 1), $event)" />
      </div>
      <div v-if="x.spellcasting.pact" class="flex items-center justify-between gap-2">
        <span class="text-sm text-gray-300">Pact slots (level {{ x.spellcasting.pact.level }}) <span class="text-[10px] uppercase text-gray-500">short rest</span></span>
        <Pips label="Pact slots" :max="x.spellcasting.pact.count" :used="play.used[PACT_KEY] ?? 0" @update:used="setUsed(PACT_KEY, $event)" />
      </div>
    </div>

    <div v-if="play.concentration" class="flex items-center justify-between gap-2 text-sm bg-amber-950/40 border border-amber-800/60 rounded px-3 py-2">
      <span class="text-amber-300">Concentration: <strong>{{ play.concentration }}</strong></span>
      <button type="button" class="text-gray-400 hover:text-gray-200" @click="store.play.concentration = null">Afslut</button>
    </div>

    <div v-for="lvl in levels" :key="lvl">
      <div class="label mb-1">{{ lvl === 0 ? 'Cantrips' : `Level ${lvl}` }}</div>
      <ul class="divide-y divide-gray-800">
        <li v-for="s in byLevel(lvl)" :key="`${s.source}-${s.spell.id}`" class="py-1.5">
          <details class="group">
            <summary class="flex items-center justify-between gap-2 cursor-pointer list-none">
              <span class="text-sm text-gray-100">
                {{ s.spell.name }}
                <span v-if="s.spell.concentration" class="text-amber-400 text-xs">C</span>
                <span v-if="s.spell.ritual" class="text-sky-400 text-xs">R</span>
                <span v-if="s.tag" class="text-xs text-gray-500"> · {{ s.tag }}</span>
              </span>
              <span class="flex items-center gap-2 shrink-0">
                <span class="text-[11px] text-gray-500">{{ s.spell.time }}</span>
                <button
                  type="button"
                  :disabled="!options(s).length"
                  class="text-[11px] px-2 py-0.5 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  :class="openKey === keyOf(s) ? 'border-red-500 bg-red-900/40 text-red-200' : 'border-gray-600 text-gray-200 hover:border-red-500'"
                  :title="options(s).length ? 'Cast spellen' : 'Ingen slots eller gratis casts tilbage'"
                  @click.prevent="castClick(s)"
                >{{ options(s).length ? (options(s).length === 1 ? castOptionLabel(options(s)[0]) : 'Cast ▾') : 'Ingen slots' }}</button>
              </span>
            </summary>
            <p class="text-xs text-gray-400 mt-1">{{ s.spell.school }} · {{ s.source }} – {{ s.spell.text }}</p>
          </details>
          <!-- Uden for <details>, så valgene ses, selvom beskrivelsen er klappet sammen -->
          <div v-if="openKey === keyOf(s)" class="flex flex-wrap items-center gap-1.5 mt-2">
            <span class="text-[11px] text-gray-500">Cast med:</span>
            <button
              v-for="(o, i) in options(s)"
              :key="i"
              type="button"
              class="text-xs px-2 py-1 rounded border border-gray-600 bg-gray-800 text-gray-100 hover:border-red-500"
              @click="cast(s, o)"
            >{{ castOptionLabel(o) }}</button>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { abilityShort } from '../../rules/data'
import { signed, type DerivedSpell } from '../../rules/engine'
import { PACT_KEY, castOptionLabel, castOptions, castSpell, slotKey, type CastOption } from '../../rules/play'
import Pips from '../ui/Pips.vue'

const store = useCharacterStore()
const x = computed(() => store.derived)
const play = computed(() => store.play)

const levels = computed(() => [...new Set(x.value.spells.map(s => s.spell.level))].sort((a, b) => a - b))
const byLevel = (lvl: number) => x.value.spells.filter(s => s.spell.level === lvl)

function setUsed(id: string, used: number) {
  store.play.used = { ...store.play.used, [id]: used }
}

// ---------- Casting: bruger automatisk slot, pact slot eller gratis cast ----------

const keyOf = (s: DerivedSpell) => `${s.source}-${s.spell.id}`
const options = (s: DerivedSpell) => castOptions(store.play, store.derived, s)
/** Spellen hvis cast-muligheder er foldet ud. */
const openKey = ref<string | null>(null)

function castClick(s: DerivedSpell) {
  const opts = options(s)
  if (opts.length === 1) cast(s, opts[0])
  else openKey.value = openKey.value === keyOf(s) ? null : keyOf(s)
}

function cast(s: DerivedSpell, o: CastOption) {
  store.play = castSpell(store.play, s, o)
  openKey.value = null
}
</script>
