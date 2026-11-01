<template>
  <div class="space-y-8">
    <StepHeader title="Oversigt" :lead="`${draft.name || 'Unavngiven'} – level ${x.level} ${[x.species?.name, x.classText].filter(Boolean).join(' ')}${x.background ? `, ${x.background.name}` : ''}`" />

    <ul v-if="store.stepIssues.review.length" class="panel space-y-1">
      <li v-for="i in store.stepIssues.review" :key="i" class="text-sm text-yellow-400">⚠️ {{ i }}</li>
    </ul>

    <section class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      <div v-for="a in ABILITIES" :key="a.key" class="stat text-center">
        <dt>{{ a.short }}</dt>
        <dd class="!text-2xl">{{ signed(x.mods[a.key]) }}</dd>
        <div class="text-xs text-gray-500 font-mono">{{ x.scores[a.key] }}</div>
      </div>
    </section>

    <section class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
      <div class="stat" :title="x.hpBreakdown"><dt>Hit Points</dt><dd>{{ x.hp }}</dd><div class="text-xs text-gray-500">{{ x.hpBreakdown }}</div></div>
      <div class="stat"><dt>Armor Class</dt><dd>{{ x.ac }}</dd><div class="text-xs text-gray-500">{{ x.acBreakdown }}</div></div>
      <div class="stat"><dt>Initiative</dt><dd>{{ signed(x.initiative) }}</dd></div>
      <div class="stat"><dt>Speed</dt><dd>{{ x.speed }} ft.</dd><div class="text-xs text-gray-500">{{ draft.size }}{{ x.darkvision ? ` · Darkvision ${x.darkvision} ft.` : '' }}</div></div>
      <div class="stat"><dt>Proficiency Bonus</dt><dd>+{{ x.pb }}</dd></div>
      <div class="stat"><dt>Passive Perception</dt><dd>{{ x.passivePerception }}</dd></div>
      <div class="stat"><dt>Hit Dice</dt><dd>{{ x.hitDice.map(h => `${h.count}d${h.die}`).join(' + ') || '–' }}</dd></div>
      <div class="stat"><dt>Guld</dt><dd>{{ x.gold }} GP</dd></div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="panel">
        <h3 class="section-title">Saving Throws</h3>
        <ul class="grid grid-cols-2 gap-1 text-sm">
          <li v-for="s in x.saves" :key="s.ability" class="flex justify-between" :class="s.proficient ? 'text-gray-100' : 'text-gray-500'">
            <span>{{ s.proficient ? '●' : '○' }} {{ abilityShort(s.ability) }}</span><span class="font-mono">{{ signed(s.bonus) }}</span>
          </li>
        </ul>
        <h3 class="section-title mt-5">Skills</h3>
        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <li v-for="s in x.skills" :key="s.id" class="flex justify-between" :class="s.proficient ? 'text-gray-100' : 'text-gray-500'">
            <span>{{ s.expertise ? '◆' : s.proficient ? '●' : '○' }} {{ s.name }} <span class="text-xs opacity-60">{{ abilityShort(s.ability) }}</span></span>
            <span class="font-mono">{{ signed(s.bonus) }}</span>
          </li>
        </ul>
      </div>

      <div class="panel space-y-4 text-sm">
        <div><div class="label">Armor Training</div>{{ x.armorTraining.join(', ') || 'Ingen' }}</div>
        <div><div class="label">Våben</div>{{ x.weaponTraining }}</div>
        <div><div class="label">Værktøj</div>{{ x.tools.join(', ') || 'Ingen' }}</div>
        <div><div class="label">Sprog</div>{{ x.languages.join(', ') }}</div>
        <div v-if="x.resistances.length"><div class="label">Resistances</div>{{ x.resistances.join(', ') }}</div>
        <div v-if="x.spellcasting">
          <div class="label">Spellcasting ({{ abilityShort(x.spellcasting.ability) }})</div>
          Save DC {{ x.spellcasting.saveDc }} · Spell attack {{ signed(x.spellcasting.attack) }} ·
          {{ x.spellcasting.cantrips }} cantrips · {{ x.spellcasting.prepared }} spells ·
          {{ slotText(x.spellcasting) }}<span v-if="x.spellcasting.note"> · {{ x.spellcasting.note }}</span>
        </div>
        <div><div class="label">Udstyr</div>{{ x.equipment.join(', ') || 'Intet – kun guld' }}</div>
      </div>
    </section>

    <section v-if="x.spells.length" class="panel space-y-4">
      <h3 class="section-title">Spells</h3>
      <div class="flex flex-wrap gap-2 text-sm">
        <span v-for="st in x.spellStats" :key="st.ability" class="tag !text-xs !normal-case text-indigo-300 border-indigo-700/60">
          {{ abilityShort(st.ability) }}: DC {{ st.saveDc }}, {{ signed(st.attack) }} to hit ({{ st.sources.join(', ') }})
        </span>
      </div>
      <div v-for="level in spellLevels" :key="level">
        <template v-if="x.spells.some(s => s.spell.level === level)">
          <div class="label mb-1">{{ level === 0 ? 'Cantrips' : `Level ${level}` }}</div>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <li v-for="s in x.spells.filter(s => s.spell.level === level)" :key="`${s.source}-${s.spell.id}`" class="flex justify-between gap-2">
              <span class="text-gray-100">
                {{ s.spell.name }}
                <span v-if="s.spell.concentration" class="text-amber-400 text-xs">C</span>
                <span v-if="s.spell.ritual" class="text-sky-400 text-xs">R</span>
                <span v-if="s.tag" class="text-xs text-gray-500"> · {{ s.tag }}</span>
              </span>
              <span class="text-xs text-gray-500 shrink-0">{{ s.source }}</span>
            </li>
          </ul>
        </template>
      </div>
    </section>

    <section class="panel">
      <h3 class="section-title">Features & Traits</h3>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <li v-for="f in x.features" :key="`${f.level}-${f.source}-${f.name}`" class="bg-gray-800/60 rounded p-3 border border-gray-700">
          <div class="flex justify-between gap-2">
            <span class="font-semibold text-gray-200 text-sm">{{ f.name }}</span>
            <span class="text-xs text-gray-500 shrink-0">{{ f.source }}{{ f.level > 1 ? ` · lvl ${f.level}` : '' }}</span>
          </div>
          <div class="text-sm text-gray-400">{{ f.text }}</div>
        </li>
        <li v-for="f in x.feats" :key="`feat-${f.label}-${f.name}`" class="bg-gray-800/60 rounded p-3 border border-gray-700">
          <div class="flex justify-between gap-2">
            <span class="font-semibold text-gray-200 text-sm">{{ f.name }}</span>
            <span class="text-xs text-gray-500 shrink-0">Feat · {{ f.label }}</span>
          </div>
          <div class="text-sm text-gray-400">{{ f.text }}</div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { ABILITIES, abilityShort } from '../../rules/data'
import { signed, type Derived } from '../../rules/engine'
import StepHeader from './StepHeader.vue'

const store = useCharacterStore()
const draft = computed(() => store.draft)
const x = computed(() => store.derived)
const spellLevels = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

const slotText = (sc: NonNullable<Derived['spellcasting']>) => sc.pact
  ? `${sc.pact.count} pact slots (level ${sc.pact.level})`
  : sc.slots.map((n, i) => `${n}× level ${i + 1}`).join(', ') || 'ingen slots endnu'
</script>
