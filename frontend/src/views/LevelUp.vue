<template>
  <div class="max-w-6xl mx-auto px-4 py-6 space-y-6">
    <div v-if="store.loading" class="text-gray-400">Henter karakter…</div>

    <div v-else-if="store.loadError" class="panel text-red-400 space-y-3">
      <p>{{ store.loadError }}</p>
      <router-link to="/" class="text-gray-300 underline">Tilbage til oversigten</router-link>
    </div>

    <template v-else-if="ready">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-100">{{ store.draft.name || 'Unavngiven' }}</h2>
          <div class="text-gray-400">Level {{ store.level }} {{ [x.species?.name, x.classText].filter(Boolean).join(' ') }}{{ x.subclass && x.classes.length === 1 ? ` · ${x.subclass.name}` : '' }}</div>
        </div>
        <div class="flex items-center gap-3">
          <SaveIndicator />
          <router-link :to="`/character/${charId}`" class="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm">Til karakterarket</router-link>
        </div>
      </header>

      <div v-if="store.stepIssues.review.length" class="panel border-yellow-700 text-sm text-yellow-400 space-y-2">
        <p>Karakteren er ikke færdigbygget på level 1 endnu.</p>
        <router-link :to="`/builder/${charId}`" class="underline text-gray-200">Fortsæt i wizarden</router-link>
      </div>

      <!-- Level op / ned -->
      <section class="panel flex flex-wrap items-center gap-3">
        <label v-if="store.level < MAX_LEVEL" class="flex items-center gap-2 text-sm text-gray-300">
          Næste level i
          <select v-model="nextClass" class="field !w-auto !p-2">
            <option v-for="o in classOptions" :key="o.cls.id" :value="o.cls.id" :disabled="!!o.blocked">
              {{ o.cls.name }}{{ currentLevelOf(o.cls.id) ? ` (${currentLevelOf(o.cls.id)} → ${currentLevelOf(o.cls.id) + 1})` : ' – multiclass' }}{{ o.blocked ? ` – ${o.blocked}` : '' }}
            </option>
          </select>
        </label>
        <button
          type="button"
          :disabled="!canLevelUp"
          class="px-6 py-2 bg-red-600 text-white font-semibold rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="levelUp"
        >{{ store.level >= MAX_LEVEL ? 'Level 20 er max' : `Stig til level ${store.level + 1}` }}</button>
        <button
          v-if="store.level > 1"
          type="button"
          class="px-4 py-2 rounded border text-sm transition-colors"
          :class="confirmDown ? 'border-red-500 bg-red-600 text-white' : 'border-gray-600 text-gray-300 hover:border-red-500'"
          @click="levelDown"
        >{{ confirmDown ? `Bekræft: fjern level ${store.level} og dets valg` : `Fortryd level ${store.level}` }}</button>
        <span v-if="!canLevelUp && store.level < MAX_LEVEL" class="text-sm text-yellow-400">Gør valgene herunder færdige først.</span>
      </section>

      <ul v-if="store.progressionIssues.length" class="panel space-y-1">
        <li v-for="i in store.progressionIssues" :key="i" class="text-sm text-yellow-400">• {{ i }}</li>
      </ul>

      <!-- Valg pr. level -->
      <section v-if="store.level > 1" class="panel space-y-5">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="lvl in levelList"
            :key="lvl"
            type="button"
            class="w-10 h-10 rounded font-mono text-sm border transition-colors"
            :class="lvl === selected ? 'bg-red-600 border-red-500 text-white'
              : validateLevelUp(store.draft, lvl).length ? 'bg-gray-800 border-yellow-600 text-yellow-300' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'"
            :title="classAtLevel(store.draft, lvl)?.name"
            @click="selected = lvl"
          >{{ lvl }}</button>
        </div>

        <template v-if="selectedLevelUp">
          <h3 class="text-xl font-bold text-red-500">
            Level {{ selected }}
            <span class="text-base font-normal text-gray-400">· {{ classAtLevel(store.draft, selected)?.name }} {{ levelTimeline(store.draft)[selected - 1]?.classLevel }}</span>
          </h3>

          <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <li v-for="f in featuresAt(selected)" :key="`${f.source}-${f.name}`" class="bg-gray-800/60 rounded p-3 border border-gray-700">
              <div class="flex justify-between gap-2">
                <span class="font-semibold text-gray-200 text-sm">{{ f.name }}</span>
                <span class="text-xs text-gray-500 shrink-0">{{ f.source }}</span>
              </div>
              <div class="text-sm text-gray-400">{{ f.text }}</div>
            </li>
            <li v-if="!featuresAt(selected).length" class="text-sm text-gray-500">Ingen nye features på dette level ud over HP{{ isAsiLevel(selected) ? ' og ASI/feat' : '' }}.</li>
          </ul>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <div class="label">Hit Points (d{{ hitDie }} + CON {{ signed(x.mods.con) }})</div>
              <div class="flex flex-wrap items-center gap-3 text-sm">
                <label class="flex items-center gap-2">
                  <input type="radio" :checked="selectedLevelUp.hpRoll === null" @change="selectedLevelUp.hpRoll = null">
                  Gennemsnit ({{ averageHp(hitDie) }})
                </label>
                <label class="flex items-center gap-2">
                  <input type="radio" :checked="selectedLevelUp.hpRoll !== null" @change="selectedLevelUp.hpRoll = rollDie()">
                  Slag:
                </label>
                <input
                  type="number" :min="1" :max="hitDie"
                  :value="selectedLevelUp.hpRoll ?? ''"
                  class="field !w-20 !p-2"
                  @input="setRoll(($event.target as HTMLInputElement).value)"
                >
                <button type="button" class="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600" @click="selectedLevelUp.hpRoll = rollDie()">🎲 Slå d{{ hitDie }}</button>
              </div>
            </div>
            <FeatChoice v-if="isAsiLevel(selected)" :key="selected" :level="selected" />
          </div>
        </template>
      </section>

      <!-- Subclass pr. klasse med mindst 3 levels -->
      <section v-for="e in subclassEntries" :key="e.cls.id" class="panel space-y-4">
        <h3 class="text-lg font-bold text-red-500">{{ e.cls.name }}-subclass</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <OptionCard
            v-for="s in subclassesFor(e.cls.id)"
            :key="s.id"
            :title="s.name"
            :selected="subclassIdOf(store.draft, e.cls.id) === s.id"
            @click="setSubclass(e.cls.id, s.id)"
          >{{ s.blurb }}</OptionCard>
        </div>
      </section>

      <!-- Klassevalg fra senere levels og fra multiclass-klasser -->
      <section v-if="choiceDefs.length" class="panel space-y-5">
        <h3 class="text-lg font-bold text-red-500">Klassevalg</h3>
        <div v-for="{ def, level, key, entry } in choiceDefs" :key="key" class="space-y-2">
          <div class="label">{{ def.label }} <span class="normal-case text-gray-600">· {{ entry.cls.name }}, level {{ level }}</span></div>
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
            <OptionCard
              v-for="o in def.options"
              :key="o.id"
              :title="o.name"
              :selected="store.draft.classChoices[key] === o.id"
              @click="store.draft.classChoices[key] = o.id"
            >{{ o.text }}</OptionCard>
          </div>
        </div>
      </section>

      <!-- Invocations, metamagic, maneuvers -->
      <section v-for="slot in picks" :key="slot.key" class="panel">
        <CardPicker
          :label="slot.label"
          :max="slot.count"
          :options="pickOptions(slot)"
          :model-value="store.draft.classPicks[slot.key] ?? []"
          @update:model-value="store.draft.classPicks[slot.key] = $event"
        />
      </section>

      <!-- Skills, expertise, værktøj, sprog og våben fra senere levels -->
      <section v-if="hasProficiencyChoices" class="panel space-y-5">
        <h3 class="text-lg font-bold text-red-500">Proficiencies</h3>
        <PickList
          v-for="slot in skillSlotsLater"
          :key="slot.key"
          :label="slot.label"
          :max="slot.count"
          :model-value="store.draft.skillPicks[slot.key] ?? []"
          :options="skillOptions(store.draft, slot.key, slot.from)"
          @update:model-value="store.draft.skillPicks[slot.key] = $event as SkillId[]"
        />
        <PickList
          v-for="slot in expertiseSlotsLater"
          :key="slot.key"
          :label="`${slot.label} – dobbelt proficiency bonus`"
          :max="slot.count"
          :model-value="store.draft.expertisePicks[slot.key] ?? []"
          :options="expertiseOptions(store.draft, slot.key, slot.from)"
          @update:model-value="store.draft.expertisePicks[slot.key] = $event as SkillId[]"
        />
        <PickList
          v-for="slot in toolSlotsLater"
          :key="slot.key"
          :label="slot.label"
          :max="slot.count"
          :model-value="store.draft.toolPicks[slot.key] ?? []"
          :options="toolOptions(store.draft, slot.key, slot.from)"
          @update:model-value="store.draft.toolPicks[slot.key] = $event"
        />
        <PickList
          v-if="languageCount(store.draft) > BONUS_LANGUAGES"
          :label="`Sprog (Common + ${languageCount(store.draft)} valgfri)`"
          :max="languageCount(store.draft)"
          :model-value="store.draft.languages"
          :options="STANDARD_LANGUAGES.map(l => ({ value: l, label: l }))"
          @update:model-value="store.draft.languages = $event"
        />
        <PickList
          v-if="masteryIncreased"
          :label="`Weapon Mastery (${weaponMasteryCount(store.draft)} slags våben)`"
          :max="weaponMasteryCount(store.draft)"
          :model-value="store.draft.weaponMasteries"
          :options="masteryOptions(store.draft).map(w => ({ value: w, label: w }))"
          @update:model-value="store.draft.weaponMasteries = $event"
        />
      </section>

      <!-- Spells (samme komponent som i wizarden) -->
      <section v-if="spellSlots(store.draft).length" class="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <StepSpells />
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useCharacterPage } from '../composables/useCharacterPage'
import { STANDARD_LANGUAGES, type SkillId } from '../rules/data'
import {
  BONUS_LANGUAGES, averageHp, classAtLevel, classChoiceDefs, classEntries, expertiseSlots, findClass, invocationsOf,
  isAsiLevel as asiAt, languageCount, levelTimeline, levelUpOptions, masteryOptions, pickSlots, signed, skillSlots,
  spellSlots, subclassIdOf, toolSlots, validateLevelUp, weaponMasteryCount, type PickSlot,
} from '../rules/engine'
import { MAX_LEVEL } from '../rules/progression'
import { SUBCLASS_LEVEL, subclassesFor } from '../rules/subclasses'
import CardPicker, { type CardOption } from '../components/ui/CardPicker.vue'
import OptionCard from '../components/ui/OptionCard.vue'
import PickList from '../components/ui/PickList.vue'
import SaveIndicator from '../components/wizard/SaveIndicator.vue'
import StepSpells from '../components/wizard/StepSpells.vue'
import FeatChoice from '../components/levelup/FeatChoice.vue'
import { expertiseOptions, skillOptions, toolOptions } from '../components/wizard/proficiencyOptions'

const selected = ref(1)
/** Klassen næste level går til – starter på den klasse, det seneste level gik til. */
const nextClass = ref<string | null>(null)
const { store, charId, ready } = useCharacterPage(() => {
  selected.value = store.level
  nextClass.value = levelTimeline(store.draft).at(-1)?.classId ?? store.draft.classId
})
const x = computed(() => store.derived)

const hitDie = computed(() => classAtLevel(store.draft, selected.value)?.hitDie ?? 8)
const classOptions = computed(() => levelUpOptions(store.draft))
const currentLevelOf = (classId: string) => x.value.classes.find(c => c.cls.id === classId)?.level ?? 0
const levelList = computed(() => Array.from({ length: store.level - 1 }, (_, i) => i + 2))
const selectedLevelUp = computed(() => store.draft.levels[selected.value - 2])
// Fortrydes et level, mens det er valgt, hopper vi til det nye øverste level
watch(() => store.level, (lvl) => { if (selected.value > lvl || selected.value < 2) selected.value = lvl })

const canLevelUp = computed(() =>
  store.level < MAX_LEVEL && !store.stepIssues.review.length && !store.progressionIssues.length
  && !classOptions.value.find(o => o.cls.id === nextClass.value)?.blocked)

function levelUp() {
  store.levelUp(nextClass.value)
  selected.value = store.level
}

const confirmDown = ref(false)
function levelDown() {
  if (!confirmDown.value) { confirmDown.value = true; return }
  confirmDown.value = false
  store.levelDown()
}

const isAsiLevel = (lvl: number) => asiAt(store.draft, lvl)
const featuresAt = (lvl: number) => x.value.features.filter(f => f.level === lvl)

const rollDie = () => 1 + Math.floor(Math.random() * hitDie.value)
function setRoll(value: string) {
  const n = Number(value)
  if (value !== '' && Number.isFinite(n)) selectedLevelUp.value.hpRoll = n
}

const subclassEntries = computed(() => classEntries(store.draft).filter(e => e.level >= SUBCLASS_LEVEL))
function setSubclass(classId: string, subclassId: string) {
  if (classId === store.draft.classId) store.draft.subclassId = subclassId
  else store.draft.subclasses = { ...store.draft.subclasses, [classId]: subclassId }
}
// Startklassens level 1-valg hører til wizarden; alt andet vælges her
const choiceDefs = computed(() => classChoiceDefs(store.draft).filter(c => !(c.entry.primary && c.level === 1)))
const picks = computed(() => pickSlots(store.draft))

/** Invocations med krav (fx Pact of the Blade) er låst, til kravet er valgt. */
function pickOptions(slot: PickSlot): CardOption[] {
  const have = new Set(invocationsOf(store.draft))
  return slot.options.map(o => {
    const missing = o.requires && !have.has(o.requires) ? slot.options.find(r => r.id === o.requires)?.name ?? o.requires : undefined
    return {
      id: o.id, name: o.name, text: o.text, disabled: !!missing,
      note: [o.minLevel && o.minLevel > 1 ? `Level ${o.minLevel}+` : '', missing ? `Kræver ${missing}` : ''].filter(Boolean).join(' · ') || undefined,
    }
  })
}

const skillSlotsLater = computed(() => skillSlots(store.draft).filter(s => s.level > 1))
const expertiseSlotsLater = computed(() => expertiseSlots(store.draft).filter(s => s.level > 1))
const toolSlotsLater = computed(() => toolSlots(store.draft).filter(s => s.level > 1))
const masteryIncreased = computed(() => weaponMasteryCount(store.draft) > (findClass(store.draft.classId)?.weaponMastery?.count ?? 0))
const hasProficiencyChoices = computed(() =>
  skillSlotsLater.value.length + expertiseSlotsLater.value.length + toolSlotsLater.value.length > 0
  || languageCount(store.draft) > BONUS_LANGUAGES || masteryIncreased.value)
</script>
