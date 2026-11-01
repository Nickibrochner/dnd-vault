<template>
  <div class="space-y-3">
    <label class="block">
      <span class="label">Ability Score Improvement eller feat</span>
      <select v-model="featId" class="field mt-1">
        <option :value="null" disabled>Vælg…</option>
        <optgroup v-for="g in groups" :key="g.label" :label="g.label">
          <option v-for="f in g.feats" :key="f.id" :value="f.id" :disabled="!!blocked(f)">
            {{ f.name }}{{ blocked(f) ? ` – ${blocked(f)}` : '' }}
          </option>
        </optgroup>
      </select>
    </label>

    <p v-if="feat" class="text-sm text-gray-300">{{ feat.text }}</p>
    <p v-if="feat && prereq" class="text-sm text-yellow-400">⚠️ {{ feat.name }} {{ prereq }}</p>

    <div v-if="isAsi" class="flex flex-wrap items-end gap-3">
      <label v-for="i in [0, 1]" :key="i" class="block">
        <span class="label">{{ i === 0 ? '+1' : '+1 (samme evne = +2)' }}</span>
        <select :value="lu.abilities[i] ?? null" class="field !w-auto mt-1" @change="setAbility(i, ($event.target as HTMLSelectElement).value as Ability)">
          <option :value="null" disabled>Vælg evne…</option>
          <option v-for="a in ABILITIES" :key="a.key" :value="a.key" :disabled="before[a.key] >= ABILITY_CAP">{{ a.short }} ({{ before[a.key] }})</option>
        </select>
      </label>
    </div>
    <label v-else-if="feat?.abilityIncrease" class="block">
      <span class="label">Hæv én evne med +1 (max {{ feat.abilityMax ?? ABILITY_CAP }})</span>
      <select :value="lu.abilities[0] ?? null" class="field !w-auto mt-1" @change="setAbility(0, ($event.target as HTMLSelectElement).value as Ability)">
        <option :value="null" disabled>Vælg evne…</option>
        <option v-for="a in feat.abilityIncrease" :key="a" :value="a">{{ abilityShort(a) }} ({{ before[a] }})</option>
      </select>
    </label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { ABILITIES, abilityShort, type Ability, type Feat } from '../../rules/data'
import { ASI_FEAT_ID, featCategory } from '../../rules/feats'
import { ABILITY_CAP, abilityScores, featOptionsAt, featPrereqIssue, featsOf, findFeat } from '../../rules/engine'

const props = defineProps<{ level: number }>()
const store = useCharacterStore()
const lu = computed(() => store.draft.levels[props.level - 2])

const CATEGORY_LABELS = { general: 'General feats', origin: 'Origin feats', 'fighting-style': 'Fighting Style', 'epic-boon': 'Epic Boons' } as const

const groups = computed(() => {
  const options = featOptionsAt(store.draft, props.level)
  return (['epic-boon', 'general', 'origin', 'fighting-style'] as const)
    .map(cat => ({ label: CATEGORY_LABELS[cat], feats: options.filter(f => featCategory(f) === cat) }))
    .filter(g => g.feats.length)
})

/** Scores før dette level – det er dem, krav og loft måles mod. */
const before = computed(() => abilityScores(store.draft, props.level - 1))

/** Feats man allerede har fra en anden kilde, kan ikke vælges igen, medmindre de er repeatable. */
function blocked(f: Feat): string | undefined {
  const owned = featsOf(store.draft).some(o => o.feat.id === f.id && o.source !== `level:${props.level}`)
  if (owned && !f.repeatable) return 'har du allerede'
  return featPrereqIssue(store.draft, f, props.level)
}

const featId = computed({
  get: () => lu.value.featId,
  set: (id: string | null) => {
    const f = findFeat(id)
    lu.value.featId = id
    // En enkelt mulig evne vælges automatisk
    lu.value.abilities = f?.abilityIncrease?.length === 1 ? [f.abilityIncrease[0]] : []
  },
})
const feat = computed(() => findFeat(lu.value.featId))
const isAsi = computed(() => lu.value.featId === ASI_FEAT_ID)
const prereq = computed(() => (feat.value ? featPrereqIssue(store.draft, feat.value, props.level) : undefined))

function setAbility(index: number, a: Ability) {
  const next = [...lu.value.abilities]
  next[index] = a
  lu.value.abilities = next.filter(Boolean)
}
</script>
