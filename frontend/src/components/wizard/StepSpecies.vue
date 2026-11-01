<template>
  <div class="space-y-8">
    <StepHeader title="Species & Identitet" lead="Hvem er din karakter? Species giver størrelse, speed og medfødte traits – i 2024-reglerne kommer ability-bonusser fra baggrunden, ikke species." />

    <section class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <label class="space-y-1.5">
        <span class="block text-sm font-medium text-gray-300">Karakterens navn</span>
        <input v-model="draft.name" type="text" placeholder="Eks. Thorin Oakenshield" class="field">
      </label>
      <label class="space-y-1.5">
        <span class="block text-sm font-medium text-gray-300">Alignment <span class="text-gray-500">(valgfri)</span></span>
        <select v-model="draft.alignment" class="field">
          <option value="">Ikke valgt</option>
          <option v-for="a in ALIGNMENTS" :key="a" :value="a">{{ a }}</option>
        </select>
      </label>
    </section>

    <section>
      <h3 class="section-title">Species</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        <OptionCard
          v-for="s in SPECIES"
          :key="s.id"
          :title="s.name"
          :subtitle="`${s.sizes.join(' / ')} · ${s.speed} ft.${s.darkvision ? ` · Darkvision ${s.darkvision} ft.` : ''}`"
          :selected="draft.speciesId === s.id"
          @click="draft.speciesId = s.id"
        >{{ s.blurb }}</OptionCard>
      </div>
    </section>

    <section v-if="species" class="panel space-y-5">
      <h3 class="text-xl font-bold text-red-500">{{ species.name }}</h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label v-if="species.sizes.length > 1" class="space-y-1.5">
          <span class="block text-sm font-medium text-gray-300">Størrelse</span>
          <select v-model="draft.size" class="field">
            <option :value="null" disabled>Vælg størrelse</option>
            <option v-for="sz in species.sizes" :key="sz" :value="sz">{{ sz }}</option>
          </select>
        </label>

        <label v-for="choice in species.choices" :key="choice.id" class="space-y-1.5">
          <span class="block text-sm font-medium text-gray-300">{{ choice.label }}</span>
          <select v-model="draft.speciesChoices[choice.id]" class="field">
            <option :value="undefined" disabled>Vælg…</option>
            <option v-for="o in choice.options" :key="o.id" :value="o.id">{{ o.name }}</option>
          </select>
          <span v-if="optionText(choice.id)" class="block text-xs text-gray-400">{{ optionText(choice.id) }}</span>
        </label>

        <label v-if="species.originFeat" class="space-y-1.5 md:col-span-2">
          <span class="block text-sm font-medium text-gray-300">Versatile: Origin Feat</span>
          <select v-model="draft.speciesFeatId" class="field">
            <option :value="null" disabled>Vælg feat…</option>
            <option v-for="f in ORIGIN_FEATS" :key="f.id" :value="f.id">{{ f.name }}</option>
          </select>
          <span v-if="speciesFeat" class="block text-xs text-gray-400">{{ speciesFeat.text }}</span>
        </label>
      </div>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <li v-for="t in species.traits" :key="t.name" class="bg-gray-800/60 rounded p-3 border border-gray-700">
          <div class="font-semibold text-gray-200 text-sm">{{ t.name }}</div>
          <div class="text-sm text-gray-400">{{ t.text }}</div>
        </li>
      </ul>
      <p v-if="species.skillGrant" class="text-sm text-gray-400">
        ℹ️ Skill-valget fra <strong>{{ species.skillGrant.label }}</strong> træffes i trinnet <em>Udstyr & Proficiencies</em>, så det ikke kolliderer med klasse og baggrund.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { ALIGNMENTS, ORIGIN_FEATS, SPECIES } from '../../rules/data'
import { findFeat, findSpecies } from '../../rules/engine'
import OptionCard from '../ui/OptionCard.vue'
import StepHeader from './StepHeader.vue'

const store = useCharacterStore()
const draft = computed(() => store.draft)
const species = computed(() => findSpecies(draft.value.speciesId))
const speciesFeat = computed(() => findFeat(draft.value.speciesFeatId))

const optionText = (choiceId: string) =>
  species.value?.choices?.find(c => c.id === choiceId)?.options.find(o => o.id === draft.value.speciesChoices[choiceId])?.text
</script>
