<template>
  <div class="space-y-8">
    <StepHeader title="Baggrund" lead="I 2024-reglerne bestemmer baggrunden, hvilke evner du kan hæve, dit Origin Feat, to skills og et værktøj." />

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <OptionCard
        v-for="b in sortedBackgrounds"
        :key="b.id"
        :title="b.name"
        :subtitle="b.abilities.map(abilityShort).join(' · ')"
        :badge="isRecommended(b) ? 'Anbefalet' : undefined"
        :selected="draft.backgroundId === b.id"
        @click="draft.backgroundId = b.id"
      >
        {{ findFeat(b.feat)?.name }} · {{ b.skills.map(skillName).join(', ') }}
      </OptionCard>
    </div>

    <section v-if="bg" class="panel space-y-5">
      <h3 class="text-xl font-bold text-red-500">{{ bg.name }}</h3>

      <dl class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div class="stat"><dt>Ability Scores</dt><dd>{{ bg.abilities.map(abilityShort).join(', ') }}</dd></div>
        <div class="stat"><dt>Skill Proficiencies</dt><dd>{{ bg.skills.map(skillName).join(', ') }}</dd></div>
        <div class="stat"><dt>Tool Proficiency</dt><dd>{{ typeof bg.tool === 'string' ? bg.tool : `1 valgfri (${bg.tool.from.join('/')})` }}</dd></div>
      </dl>

      <div v-if="feat" class="bg-gray-800/60 rounded p-3 border border-gray-700">
        <div class="label">Origin Feat</div>
        <div class="font-semibold text-gray-200">{{ feat.name }}</div>
        <div class="text-sm text-gray-400">{{ feat.text }}</div>
      </div>

      <p v-if="cls && !isRecommended(bg)" class="text-sm text-yellow-400">
        ⚠️ {{ bg.name }} kan ikke hæve {{ cls.name }}s primære evne ({{ cls.primary.map(abilityShort).join('/') }}). Det er lovligt, men giver en svagere start.
      </p>
      <p v-for="issue in store.stepIssues.background" :key="issue" class="text-sm text-red-400">{{ issue }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { BACKGROUNDS, abilityShort, skillName, type Background } from '../../rules/data'
import { findBackground, findClass, findFeat } from '../../rules/engine'
import OptionCard from '../ui/OptionCard.vue'
import StepHeader from './StepHeader.vue'

const store = useCharacterStore()
const draft = computed(() => store.draft)
const cls = computed(() => findClass(draft.value.classId))
const bg = computed(() => findBackground(draft.value.backgroundId))
const feat = computed(() => findFeat(bg.value?.feat ?? null))

const isRecommended = (b: Background) => !!cls.value?.primary.some(a => b.abilities.includes(a))

// Anbefalede baggrunde først, ellers alfabetisk
const sortedBackgrounds = computed(() =>
  [...BACKGROUNDS].sort((a, b) => Number(isRecommended(b)) - Number(isRecommended(a)) || a.name.localeCompare(b.name)))
</script>
