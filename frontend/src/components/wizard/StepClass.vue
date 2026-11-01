<template>
  <div class="space-y-8">
    <StepHeader title="Klasse" lead="Klassen bestemmer din hit die, saving throws, træning og level 1-features. Alt herunder tildeles automatisk." />

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <OptionCard
        v-for="c in CLASSES"
        :key="c.id"
        :title="c.name"
        :subtitle="`d${c.hitDie} · ${c.primary.map(abilityShort).join(' / ')}`"
        :selected="draft.classId === c.id"
        @click="draft.classId = c.id"
      >{{ c.blurb }}</OptionCard>
    </div>

    <section v-if="cls" class="panel space-y-6">
      <h3 class="text-xl font-bold text-red-500">{{ cls.name }} – level 1</h3>

      <dl class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div class="stat"><dt>Hit Points</dt><dd>{{ cls.hitDie }} + CON</dd></div>
        <div class="stat"><dt>Hit Die</dt><dd>d{{ cls.hitDie }}</dd></div>
        <div class="stat"><dt>Saving Throws</dt><dd>{{ cls.saves.map(abilityShort).join(', ') }}</dd></div>
        <div class="stat"><dt>Primær evne</dt><dd>{{ cls.primary.map(abilityShort).join(' / ') }}</dd></div>
      </dl>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div class="label">Armor Training</div>
          <div class="text-gray-200">{{ armorText }}</div>
        </div>
        <div>
          <div class="label">Weapon Proficiencies</div>
          <div class="text-gray-200">{{ store.derived.weaponTraining }}</div>
        </div>
        <div>
          <div class="label">Skill-muligheder (vælg {{ cls.skillGrant.count }})</div>
          <div class="text-gray-200">{{ skillOptionsText }}</div>
        </div>
        <div v-if="toolText">
          <div class="label">Værktøj</div>
          <div class="text-gray-200">{{ toolText }}</div>
        </div>
      </div>

      <div v-for="choice in cls.choices" :key="choice.id" class="space-y-2">
        <div class="label">{{ choice.label }}</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <OptionCard
            v-for="o in choice.options"
            :key="o.id"
            :title="o.name"
            :selected="draft.classChoices[choice.id] === o.id"
            @click="draft.classChoices[choice.id] = o.id"
          >{{ o.text }}</OptionCard>
        </div>
      </div>

      <div>
        <div class="label mb-2">Class Features</div>
        <ul class="space-y-2">
          <li v-for="f in classFeatures" :key="f.name" class="bg-gray-800/60 rounded p-3 border border-gray-700">
            <div class="font-semibold text-gray-200 text-sm">{{ f.name }}</div>
            <div class="text-sm text-gray-400">{{ f.text }}</div>
          </li>
        </ul>
      </div>

      <div v-if="cls.spellcasting" class="text-sm text-gray-300 bg-indigo-950/40 border border-indigo-800/60 rounded p-3">
        ✨ <strong>Spellcasting ({{ abilityShort(cls.spellcasting.ability) }})</strong>:
        {{ store.derived.spellcasting?.cantrips }} cantrips, {{ cls.spellcasting.prepared }} forberedte spells,
        {{ cls.spellcasting.slots }} {{ cls.spellcasting.pact ? 'pact slot' : 'level 1-slots' }}.
        <span class="text-gray-400">Du vælger dine spells i trinnet <em>Spells</em>.</span>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { CLASSES, abilityShort, skillName } from '../../rules/data'
import { findClass } from '../../rules/engine'
import OptionCard from '../ui/OptionCard.vue'
import StepHeader from './StepHeader.vue'

const store = useCharacterStore()
const draft = computed(() => store.draft)
const cls = computed(() => findClass(draft.value.classId))

const ARMOR_NAMES = { light: 'Light', medium: 'Medium', heavy: 'Heavy', shield: 'Shields' } as const
const armorText = computed(() => store.derived.armorTraining.map(a => ARMOR_NAMES[a]).join(', ') || 'Ingen')

const skillOptionsText = computed(() => {
  const from = cls.value?.skillGrant.from
  return from === 'any' ? 'Alle skills' : from?.map(skillName).join(', ')
})

const toolText = computed(() => {
  const c = cls.value
  if (!c) return ''
  const parts = [...c.tools]
  if (c.toolGrant) parts.push(`${c.toolGrant.count} valgfri (vælges senere)`)
  return parts.join(', ')
})

const classFeatures = computed(() => (cls.value?.features ?? []).map(f => ({
  name: f.name,
  // Teksterne skalerer med startklassens eget level (ikke karakterlevel ved multiclass)
  text: typeof f.text === 'function' ? f.text({ mods: store.derived.mods, level: store.derived.classes[0]?.level ?? 1, pb: store.derived.pb }) : f.text,
})))
</script>
