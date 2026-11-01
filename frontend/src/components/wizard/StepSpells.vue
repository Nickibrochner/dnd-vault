<template>
  <div class="space-y-8">
    <StepHeader title="Spells" lead="Vælg cantrips og spells fra de kilder, din karakter har. Spells du allerede får fra en anden kilde, er låst." />

    <!-- Samlet oversigt øverst; bliver hængende, mens man scroller gennem listerne -->
    <section class="panel sticky top-2 z-20 shadow-xl shadow-black/40 space-y-3 max-h-[45vh] overflow-y-auto">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="section-title !mb-0">Dine spells</h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="st in x.spellStats" :key="st.ability" class="tag !text-xs !normal-case text-indigo-300 border-indigo-700/60" :title="st.sources.join(', ')">
            {{ abilityShort(st.ability) }}: DC {{ st.saveDc }} · {{ signed(st.attack) }} to hit
          </span>
        </div>
      </div>
      <div v-if="granted.length" class="flex flex-wrap items-center gap-1.5">
        <span class="label mr-1">Givet automatisk</span>
        <span v-for="g in granted" :key="`${g.source}-${g.spell}`" class="px-2 py-0.5 text-xs rounded-full border border-gray-600 bg-gray-800 text-gray-300" :title="`${g.source}${g.alwaysPrepared ? ' · altid forberedt' : ''}`">
          🔒 {{ findSpell(g.spell)?.name }}
        </span>
      </div>
      <div v-for="slot in allSlots" :key="slot.key" class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-mono mr-1" :class="(draft.spellPicks[slot.key]?.length ?? 0) >= slot.count ? 'text-emerald-400' : 'text-yellow-400'">
          {{ draft.spellPicks[slot.key]?.length ?? 0 }}/{{ slot.count }}
        </span>
        <span class="text-xs text-gray-400 mr-1">{{ slot.label }}</span>
        <button
          v-for="id in draft.spellPicks[slot.key] ?? []"
          :key="id"
          type="button"
          class="px-2 py-0.5 text-xs rounded-full border border-red-700 bg-red-950/50 text-gray-100 hover:border-red-400"
          title="Fjern"
          @click="remove(slot.key, id)"
        >{{ findSpell(id)?.name }} ✕</button>
      </div>
      <div class="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-800">
        <input v-model="search" type="search" placeholder="Søg i navn, school, effekt eller 'level 3'…" class="field !p-2 sm:!w-80">
        <span class="text-xs text-gray-500"><span class="tag text-amber-300 border-amber-700/60">C</span> Concentration · <span class="tag text-sky-300 border-sky-700/60">R</span> Ritual</span>
      </div>
    </section>

    <section v-for="group in groups" :key="group.title" class="panel space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-lg font-bold text-red-500">{{ group.title }}</h3>
        <label v-if="group.abilityKey" class="flex items-center gap-2 text-sm text-gray-300">
          Spellcasting-evne
          <select v-model="draft.spellAbilities[group.abilityKey]" class="field !w-auto !p-2">
            <option :value="undefined" disabled>Vælg…</option>
            <option v-for="a in MAGIC_INITIATE_ABILITIES" :key="a" :value="a">{{ abilityShort(a) }} ({{ signed(x.mods[a]) }})</option>
          </select>
        </label>
      </div>
      <p v-if="group.note" class="text-sm text-gray-400">{{ group.note }}</p>
      <SpellPicker
        v-for="slot in group.slots"
        :key="slot.key"
        :label="slot.label.split(': ')[1] ?? slot.label"
        :max="slot.count"
        :options="slot.from"
        :owners="spellsTakenElsewhere(draft, slot)"
        :search="search"
        :empty-text="slot.subsetOf ? 'Vælg først spells til din spellbook.' : undefined"
        :model-value="draft.spellPicks[slot.key] ?? []"
        @update:model-value="draft.spellPicks[slot.key] = $event"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { abilityShort } from '../../rules/data'
import { findSpell } from '../../rules/spells'
import { MAGIC_INITIATE_ABILITIES, grantedSpells, signed, spellSlots, spellsTakenElsewhere, type SpellSlot } from '../../rules/engine'
import SpellPicker from '../ui/SpellPicker.vue'
import StepHeader from './StepHeader.vue'

const store = useCharacterStore()
const draft = computed(() => store.draft)
const x = computed(() => store.derived)
const search = ref('')

const granted = computed(() => grantedSpells(draft.value))
const allSlots = computed(() => spellSlots(draft.value))

function remove(slotKey: string, id: string) {
  draft.value.spellPicks[slotKey] = (draft.value.spellPicks[slotKey] ?? []).filter(s => s !== id)
}

const NOTES: Record<string, string> = {
  'class:spellbook': 'Din spellbook starter med 6 level 1-spells og får 2 nye pr. level. Du forbereder et antal af dem ad gangen og kan skifte efter en long rest.',
  'pact:cantrips': 'Pact of the Tome giver spells fra alle klasselister; de tæller som Warlock-spells.',
}

/** Slots grupperet efter kilde, fx "Wizard" eller "Magic Initiate (Cleric)". */
const groups = computed(() => {
  const map = new Map<string, { title: string; slots: SpellSlot[]; abilityKey?: string; note?: string }>()
  for (const slot of spellSlots(draft.value)) {
    const title = slot.label.split(': ')[0]
    const group = map.get(title) ?? map.set(title, { title, slots: [], abilityKey: slot.abilityKey }).get(title)!
    group.slots.push(slot)
    group.note ??= NOTES[slot.key]
  }
  return [...map.values()]
})
</script>
