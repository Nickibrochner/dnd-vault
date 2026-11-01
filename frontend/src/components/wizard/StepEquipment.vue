<template>
  <div class="space-y-8">
    <StepHeader title="Udstyr & Proficiencies" lead="Vælg startudstyr fra klasse og baggrund, og fordel de skills, værktøjer og sprog dine valg giver adgang til." />

    <p v-if="!cls || !bg" class="text-yellow-400">Vælg klasse og baggrund først.</p>

    <template v-else>
      <!-- Startudstyr -->
      <section class="space-y-3">
        <h3 class="section-title">{{ cls.name }}-startudstyr</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <OptionCard
            v-for="pkg in cls.equipment"
            :key="pkg.id"
            :title="`Mulighed ${pkg.id}`"
            :subtitle="`${pkg.gold} GP`"
            :selected="draft.classEquipment === equipmentKey(cls.id, pkg.id)"
            @click="draft.classEquipment = equipmentKey(cls.id, pkg.id)"
          >{{ pkg.items.length ? pkg.items.join(', ') : 'Kun guld – køb selv dit udstyr' }}</OptionCard>
        </div>
      </section>

      <section class="space-y-3">
        <h3 class="section-title">{{ bg.name }}-startudstyr</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <OptionCard title="Mulighed A" :subtitle="`${bg.equipment.gold} GP`" :selected="draft.backgroundEquipment === equipmentKey(bg.id, 'A')" @click="draft.backgroundEquipment = equipmentKey(bg.id, 'A')">
            {{ bg.equipment.items.join(', ') }}
          </OptionCard>
          <OptionCard title="Mulighed B" :subtitle="`${BACKGROUND_GOLD_OPTION} GP`" :selected="draft.backgroundEquipment === equipmentKey(bg.id, 'B')" @click="draft.backgroundEquipment = equipmentKey(bg.id, 'B')">
            Kun guld – køb selv dit udstyr
          </OptionCard>
        </div>
      </section>

      <p v-for="w in store.derived.warnings" :key="w" class="text-sm text-yellow-400">⚠️ {{ w }}</p>

      <!-- Skills -->
      <section class="panel space-y-5">
        <h3 class="text-lg font-bold text-red-500">Skills</h3>
        <p class="text-sm text-gray-400">
          Givet automatisk:
          <span v-for="s in fixed" :key="s.skill" class="tag text-gray-300 border-gray-600 mr-1">🔒 {{ skillName(s.skill) }} · {{ s.source }}</span>
        </p>
        <PickList
          v-for="slot in skillSlots"
          :key="slot.key"
          :label="slot.label"
          :max="slot.count"
          :model-value="draft.skillPicks[slot.key] ?? []"
          :options="skillOptions(slot.key, slot.from)"
          @update:model-value="draft.skillPicks[slot.key] = $event as SkillId[]"
        />
        <PickList
          v-for="slot in expertiseSlots"
          :key="slot.key"
          :label="`${slot.label} – dobbelt proficiency bonus`"
          :max="slot.count"
          :model-value="draft.expertisePicks[slot.key] ?? []"
          :options="expertiseOptions(slot.key, slot.from)"
          @update:model-value="draft.expertisePicks[slot.key] = $event as SkillId[]"
        />
      </section>

      <!-- Værktøj, sprog, våben -->
      <section class="panel space-y-5">
        <h3 class="text-lg font-bold text-red-500">Værktøj, sprog og våben</h3>
        <p v-if="fixedToolList.length" class="text-sm text-gray-400">
          Givet automatisk:
          <span v-for="t in fixedToolList" :key="t" class="tag text-gray-300 border-gray-600 mr-1">🔒 {{ t }}</span>
        </p>
        <PickList
          v-for="slot in toolSlots"
          :key="slot.key"
          :label="slot.label"
          :max="slot.count"
          :model-value="draft.toolPicks[slot.key] ?? []"
          :options="toolOptions(slot.key, slot.from)"
          @update:model-value="draft.toolPicks[slot.key] = $event"
        />
        <PickList
          :label="`Sprog (Common + ${languageCount(draft)} valgfri)`"
          :max="languageCount(draft)"
          :model-value="draft.languages"
          :options="STANDARD_LANGUAGES.map(l => ({ value: l, label: l }))"
          :locked="[{ value: 'Common', label: 'Common' }, ...(cls.extraLanguages ?? []).map(l => ({ value: l, label: l }))]"
          @update:model-value="draft.languages = $event"
        />
        <PickList
          v-if="cls.weaponMastery"
          :label="`Weapon Mastery (${weaponMasteryCount(draft)} slags våben${cls.weaponMastery.meleeOnly ? ', kun melee' : ''})`"
          :max="weaponMasteryCount(draft)"
          :model-value="draft.weaponMasteries"
          :options="masteryOptions(draft).map(w => ({ value: w, label: w }))"
          @update:model-value="draft.weaponMasteries = $event"
        />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { BACKGROUND_GOLD_OPTION, STANDARD_LANGUAGES, skillName, type SkillId } from '../../rules/data'
import {
  equipmentKey, expertiseSlots as getExpertiseSlots, findBackground, findClass, fixedSkills, fixedTools, languageCount,
  masteryOptions, skillSlots as getSkillSlots, toolSlots as getToolSlots, weaponMasteryCount,
} from '../../rules/engine'
import OptionCard from '../ui/OptionCard.vue'
import PickList from '../ui/PickList.vue'
import StepHeader from './StepHeader.vue'
import { expertiseOptions as getExpertiseOptions, skillOptions as getSkillOptions, toolOptions as getToolOptions } from './proficiencyOptions'

const store = useCharacterStore()
const draft = computed(() => store.draft)
const cls = computed(() => findClass(draft.value.classId))
const bg = computed(() => findBackground(draft.value.backgroundId))

const fixed = computed(() => fixedSkills(draft.value))
// Valg fra senere levels (fx College of Lore) foretages på level-up-siden
const skillSlots = computed(() => getSkillSlots(draft.value).filter(s => s.level === 1))
const expertiseSlots = computed(() => getExpertiseSlots(draft.value).filter(s => s.level === 1))
const toolSlots = computed(() => getToolSlots(draft.value).filter(s => s.level === 1))
const fixedToolList = computed(() => fixedTools(draft.value))

const skillOptions = (slotKey: string, from: SkillId[]) => getSkillOptions(draft.value, slotKey, from)
const expertiseOptions = (slotKey: string, from: SkillId[]) => getExpertiseOptions(draft.value, slotKey, from)
const toolOptions = (slotKey: string, from: string[]) => getToolOptions(draft.value, slotKey, from)
</script>
