<template>
  <div class="space-y-6">
    <div class="panel space-y-2 text-sm">
      <div class="flex flex-wrap items-baseline justify-between gap-3">
        <h3 class="section-title !mb-0">Manuelle rettelser</h3>
        <button
          type="button"
          class="text-sm px-3 py-1 rounded border transition-colors"
          :disabled="!x.overridden.length && !o.features?.length && !o.spells?.length"
          :class="confirmReset ? 'border-red-500 bg-red-600 text-white' : 'border-gray-600 text-gray-400 hover:border-red-500 disabled:opacity-40'"
          @click="reset"
        >{{ confirmReset ? 'Bekræft – fjern alle rettelser' : 'Fjern alle rettelser' }}</button>
      </div>
      <p class="text-gray-400">
        Overstyr regelmotorens værdier, så karakteren svarer til den originale kilde. Et tomt felt bruger den beregnede værdi,
        som står i feltet. Ability scores og proficiency bonus slår igennem på alt, der afledes af dem; de øvrige felter retter kun slutværdien.
      </p>
      <p v-if="x.overridden.length" class="text-yellow-400">✎ {{ x.overridden.length }} {{ x.overridden.length === 1 ? 'værdi er' : 'værdier er' }} rettet manuelt.</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <!-- Grundværdier -->
      <section class="panel space-y-4">
        <h3 class="section-title">Ability scores</h3>
        <div class="grid grid-cols-3 gap-2">
          <label v-for="a in ABILITIES" :key="a.key" class="block">
            <span class="label" :class="isSet(o.scores?.[a.key]) && '!text-yellow-400'">{{ a.short }}</span>
            <input
              type="number" class="field !p-2 font-mono" :min="L.score[0]" :max="L.score[1]"
              :value="o.scores?.[a.key] ?? ''" :placeholder="String(raw.scores[a.key])"
              @change="setIn('scores', a.key, $event)"
            >
          </label>
        </div>

        <h3 class="section-title">Kampværdier</h3>
        <div class="grid grid-cols-2 gap-2">
          <label v-for="f in TOP_FIELDS" :key="f.key" class="block">
            <span class="label" :class="isSet(o[f.key]) && '!text-yellow-400'">{{ f.name }}</span>
            <input
              type="number" class="field !p-2 font-mono" :min="L[f.limit][0]" :max="L[f.limit][1]"
              :value="o[f.key] ?? ''" :placeholder="String(f.calc())"
              @change="setTop(f.key, $event)"
            >
          </label>
        </div>
      </section>

      <!-- Saves og skills -->
      <section class="panel space-y-4">
        <h3 class="section-title">Saving throws</h3>
        <div class="grid grid-cols-3 gap-2">
          <label v-for="s in base.saves" :key="s.ability" class="block">
            <span class="label" :class="isSet(o.saves?.[s.ability]) && '!text-yellow-400'">{{ abilityShort(s.ability) }}{{ s.proficient ? ' ●' : '' }}</span>
            <input
              type="number" class="field !p-2 font-mono" :min="L.bonus[0]" :max="L.bonus[1]"
              :value="o.saves?.[s.ability] ?? ''" :placeholder="signed(s.bonus)"
              @change="setIn('saves', s.ability, $event)"
            >
          </label>
        </div>

        <h3 class="section-title">Skills</h3>
        <ul class="space-y-1">
          <li v-for="s in base.skills" :key="s.id" class="flex items-center justify-between gap-2 text-sm">
            <span :class="isSet(o.skills?.[s.id]) ? 'text-yellow-400' : s.proficient ? 'text-gray-100' : 'text-gray-500'">
              {{ s.expertise ? '◆' : s.proficient ? '●' : '○' }} {{ s.name }} <span class="text-xs opacity-60">{{ abilityShort(s.ability) }}</span>
            </span>
            <input
              type="number" class="field !w-20 !p-1.5 font-mono text-sm" :min="L.bonus[0]" :max="L.bonus[1]"
              :value="o.skills?.[s.id] ?? ''" :placeholder="signed(s.bonus)" :aria-label="s.name"
              @change="setIn('skills', s.id, $event)"
            >
          </li>
        </ul>
      </section>

      <!-- Spellcasting, features og spells -->
      <div class="space-y-6">
        <section class="panel space-y-4">
          <h3 class="section-title">Spellcasting</h3>
          <div class="grid grid-cols-2 gap-2">
            <label class="block">
              <span class="label" :class="isSet(o.spellSaveDc) && '!text-yellow-400'">Spell save DC</span>
              <input type="number" class="field !p-2 font-mono" :min="L.spellSaveDc[0]" :max="L.spellSaveDc[1]" :value="o.spellSaveDc ?? ''" :placeholder="base.spellcasting ? String(base.spellcasting.saveDc) : '–'" @change="setTop('spellSaveDc', $event)">
            </label>
            <label class="block">
              <span class="label" :class="isSet(o.spellAttack) && '!text-yellow-400'">Spell attack</span>
              <input type="number" class="field !p-2 font-mono" :min="L.spellAttack[0]" :max="L.spellAttack[1]" :value="o.spellAttack ?? ''" :placeholder="base.spellcasting ? signed(base.spellcasting.attack) : '–'" @change="setTop('spellAttack', $event)">
            </label>
          </div>
          <div>
            <div class="label mb-1">Spell slots pr. level</div>
            <div class="grid grid-cols-5 gap-1.5">
              <label v-for="lvl in 9" :key="lvl" class="block text-center">
                <span class="text-[10px] text-gray-500" :class="isSet(o.spellSlots?.[lvl - 1]) && '!text-yellow-400'">{{ lvl }}</span>
                <input
                  type="number" class="field !p-1.5 font-mono text-center text-sm" :min="L.slots[0]" :max="L.slots[1]"
                  :value="o.spellSlots?.[lvl - 1] ?? ''" :placeholder="String(base.spellcasting?.slots[lvl - 1] ?? 0)" :aria-label="`Level ${lvl}-slots`"
                  @change="setSlot(lvl - 1, $event)"
                >
              </label>
            </div>
            <p v-if="base.spellcasting?.pact" class="text-xs text-gray-500 mt-1">Pact Magic-slots ({{ base.spellcasting.pact.count }} × level {{ base.spellcasting.pact.level }}) styres af Warlock-levels.</p>
          </div>
        </section>

        <section class="panel space-y-3">
          <h3 class="section-title">Egne features</h3>
          <div v-for="(f, i) in o.features ?? []" :key="i" class="space-y-1.5 border-b border-gray-800 pb-3">
            <div class="flex gap-2">
              <input :value="f.name" class="field !p-2 text-sm" placeholder="Navn, fx Fey Ancestry" @change="setFeature(i, 'name', $event)">
              <button type="button" class="step-btn shrink-0 !h-auto" title="Fjern" @click="removeFeature(i)">×</button>
            </div>
            <textarea :value="f.text" rows="2" class="field !p-2 text-sm" placeholder="Kort beskrivelse" @change="setFeature(i, 'text', $event)" />
          </div>
          <button type="button" class="btn-secondary" @click="addFeature">+ Tilføj feature</button>
        </section>

        <section class="panel space-y-3">
          <h3 class="section-title">Ekstra spells</h3>
          <div v-if="o.spells?.length" class="flex flex-wrap gap-1.5">
            <button
              v-for="s in extraSpells" :key="s.id" type="button"
              class="px-2 py-0.5 text-xs rounded-full border border-red-700 bg-red-950/50 text-gray-100 hover:border-red-400"
              :title="`Fjern ${s.name}`" @click="removeSpell(s.id)"
            >{{ s.name }} <span class="opacity-60">{{ s.level || 'C' }}</span> ×</button>
          </div>
          <input v-model="spellQuery" class="field !p-2 text-sm" placeholder="Søg i alle spells…">
          <ul v-if="spellQuery.trim()" class="max-h-56 overflow-y-auto divide-y divide-gray-800 text-sm">
            <li v-for="s in spellResults" :key="s.id">
              <button type="button" class="w-full flex justify-between gap-2 py-1.5 text-left hover:text-red-400" @click="addSpell(s.id)">
                <span>{{ s.name }}</span><span class="text-xs text-gray-500">{{ s.level ? `Level ${s.level}` : 'Cantrip' }} · {{ s.school }}</span>
              </button>
            </li>
            <li v-if="!spellResults.length" class="py-1.5 text-gray-500">Ingen spells fundet.</li>
          </ul>
          <p class="text-xs text-gray-500">Spells, karakteren allerede har fra sine klasser, vises ikke her.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { ABILITIES, abilityShort } from '../../rules/data'
import { OVERRIDE_LIMITS as L, derive, signed, type Overrides } from '../../rules/engine'
import { SPELLS, findSpell } from '../../rules/spells'

const store = useCharacterStore()
const x = computed(() => store.derived)
const o = computed(() => store.draft.overrides)

/** Regelmotorens egne værdier – uden rettelser. */
const raw = computed(() => derive({ ...store.draft, overrides: {} }, store.gear))
/** Beregnet med de rettede scores og PB, så pladsholderne viser, hvad regelmotoren nu ville give. */
const base = computed(() => derive({ ...store.draft, overrides: { scores: o.value.scores, pb: o.value.pb } }, store.gear))

type TopKey = 'pb' | 'hp' | 'ac' | 'initiative' | 'speed' | 'passivePerception'
const TOP_FIELDS: { key: TopKey; name: string; limit: keyof typeof L; calc: () => number | string }[] = [
  { key: 'pb', name: 'Prof. bonus', limit: 'pb', calc: () => signed(raw.value.pb) },
  { key: 'hp', name: 'Max HP', limit: 'hp', calc: () => base.value.hp },
  { key: 'ac', name: 'AC', limit: 'ac', calc: () => base.value.ac },
  { key: 'initiative', name: 'Initiative', limit: 'initiative', calc: () => signed(base.value.initiative) },
  { key: 'speed', name: 'Speed', limit: 'speed', calc: () => base.value.speed },
  { key: 'passivePerception', name: 'Passiv Perc.', limit: 'passivePerception', calc: () => passive.value },
]
/** Passiv Perception følger en rettet Perception, så pladsholderen gør det også. */
const passive = computed(() => (o.value.skills?.perception !== undefined ? 10 + o.value.skills.perception : base.value.passivePerception))

const isSet = (v: unknown) => v !== undefined && v !== null

/** Tomt felt = fjern rettelsen; storens sanitize klemmer tallet ind i grænserne. */
const parse = (e: Event) => {
  const v = (e.target as HTMLInputElement).value.trim()
  return v === '' ? undefined : Number(v)
}
const update = (patch: Partial<Overrides>) => { store.draft.overrides = { ...o.value, ...patch } }

function setTop(key: TopKey | 'spellSaveDc' | 'spellAttack', e: Event) {
  update({ [key]: parse(e) })
}
function setIn(group: 'scores' | 'saves' | 'skills', key: string, e: Event) {
  update({ [group]: { ...o.value[group], [key]: parse(e) } })
}
function setSlot(index: number, e: Event) {
  const slots = Array.from({ length: 9 }, (_, i) => o.value.spellSlots?.[i] ?? null)
  slots[index] = parse(e) ?? null
  update({ spellSlots: slots })
}

// ---------- Features ----------

function addFeature() {
  update({ features: [...(o.value.features ?? []), { name: '', text: '' }] })
}
function setFeature(i: number, field: 'name' | 'text', e: Event) {
  const features = [...(o.value.features ?? [])]
  features[i] = { ...features[i], [field]: (e.target as HTMLInputElement).value }
  update({ features })
}
function removeFeature(i: number) {
  update({ features: (o.value.features ?? []).filter((_, j) => j !== i) })
}

// ---------- Spells ----------

const spellQuery = ref('')
const owned = computed(() => new Set(raw.value.spells.map(s => s.spell.id)))
const extraSpells = computed(() => (o.value.spells ?? []).map(id => findSpell(id)).filter((s): s is NonNullable<typeof s> => !!s))
const spellResults = computed(() => {
  const q = spellQuery.value.trim().toLowerCase()
  return SPELLS.filter(s => s.name.toLowerCase().includes(q) && !owned.value.has(s.id) && !o.value.spells?.includes(s.id)).slice(0, 30)
})
function addSpell(id: string) {
  update({ spells: [...(o.value.spells ?? []), id] })
  spellQuery.value = ''
}
function removeSpell(id: string) {
  update({ spells: (o.value.spells ?? []).filter(s => s !== id) })
}

// ---------- Nulstil ----------

const confirmReset = ref(false)
function reset() {
  if (!confirmReset.value) { confirmReset.value = true; return }
  confirmReset.value = false
  store.draft.overrides = {}
}
</script>
