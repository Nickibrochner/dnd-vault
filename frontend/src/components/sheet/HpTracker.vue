<template>
  <section class="panel space-y-4">
    <div class="flex items-end justify-between gap-4">
      <div>
        <div class="label">Hit Points</div>
        <div class="text-4xl font-bold font-mono" :class="hp === 0 ? 'text-red-500' : hp <= x.hp / 2 ? 'text-yellow-400' : 'text-gray-100'">
          {{ hp }}<span class="text-xl text-gray-500"> / {{ x.hp }}</span>
        </div>
        <div v-if="play.tempHp" class="text-sm text-sky-400">+{{ play.tempHp }} temp HP</div>
      </div>
      <div class="text-right text-xs text-gray-500 max-w-[12rem]" :title="x.hpBreakdown">{{ x.hpBreakdown }}</div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <input v-model.number="amount" type="number" min="0" class="field !w-24 !p-2 font-mono" aria-label="Antal HP" @keydown.enter="apply('damage')">
      <button type="button" class="px-3 py-2 rounded bg-red-700 hover:bg-red-600 text-white text-sm" @click="apply('damage')">Skade</button>
      <button type="button" class="px-3 py-2 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-sm" @click="apply('heal')">Heal</button>
      <button type="button" class="px-3 py-2 rounded bg-sky-800 hover:bg-sky-700 text-white text-sm" title="Temp HP lægges ikke sammen – den højeste gælder" @click="apply('temp')">Temp HP</button>
    </div>

    <div v-if="hp === 0" class="space-y-2">
      <div class="label">Death Saves</div>
      <div class="flex flex-wrap gap-6 text-sm">
        <div class="flex items-center gap-2">
          <span class="text-emerald-400">Succes</span>
          <Pips label="Succes" :max="3" :used="play.deathSaves.successes" @update:used="play.deathSaves.successes = $event" />
        </div>
        <div class="flex items-center gap-2">
          <span class="text-red-400">Fejl</span>
          <Pips label="Fejl" :max="3" :used="play.deathSaves.failures" @update:used="play.deathSaves.failures = $event" />
        </div>
      </div>
      <p v-if="play.deathSaves.failures >= 3" class="text-sm text-red-400">Karakteren er død.</p>
      <p v-else-if="play.deathSaves.successes >= 3" class="text-sm text-emerald-400">Stabil – genvinder 1 HP efter 1d4 timer.</p>
    </div>

    <div class="border-t border-gray-800 pt-3 space-y-2">
      <div class="flex items-baseline justify-between">
        <div class="label">Hit Dice</div>
        <div class="font-mono text-sm text-gray-300">
          {{ x.hitDice.map(h => `${hitDiceLeft(play, h.die, h.count)}/${h.count} d${h.die}`).join(' · ') }}
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-2 text-sm">
        <select v-if="x.hitDice.length > 1" v-model.number="die" class="field !w-auto !p-2" aria-label="Terning">
          <option v-for="h in x.hitDice" :key="h.die" :value="h.die">d{{ h.die }}</option>
        </select>
        <input v-model.number="hitDieRoll" type="number" :min="1" :max="activeDie" class="field !w-20 !p-2 font-mono" aria-label="Hit die-slag">
        <button type="button" class="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600" @click="hitDieRoll = 1 + Math.floor(Math.random() * activeDie)">🎲 d{{ activeDie }}</button>
        <button
          type="button"
          :disabled="!diceLeft || !hitDieRoll"
          class="px-3 py-2 rounded bg-emerald-800 hover:bg-emerald-700 text-white disabled:opacity-40 disabled:cursor-not-allowed"
          @click="useHitDie"
        >Brug hit die (+CON {{ signed(x.mods.con) }})</button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { signed } from '../../rules/engine'
import { currentHp, heal, hitDiceLeft, spendHitDie, takeDamage } from '../../rules/play'
import Pips from '../ui/Pips.vue'

const store = useCharacterStore()
const x = computed(() => store.derived)
const play = computed(() => store.play)
const hp = computed(() => currentHp(store.play, store.derived))

const amount = ref<number | ''>('')
const hitDieRoll = ref<number | ''>('')
/** Valgt terningstørrelse ved multiclass; ellers den eneste. */
const die = ref<number | null>(null)
const activeDie = computed(() => x.value.hitDice.find(h => h.die === die.value)?.die ?? x.value.hitDice[0]?.die ?? 8)
const diceLeft = computed(() => {
  const pool = x.value.hitDice.find(h => h.die === activeDie.value)
  return pool ? hitDiceLeft(store.play, pool.die, pool.count) : 0
})

function apply(kind: 'damage' | 'heal' | 'temp') {
  const n = Number(amount.value)
  if (!Number.isFinite(n) || n <= 0) return
  if (kind === 'damage') store.play = takeDamage(store.play, store.derived, n)
  else if (kind === 'heal') store.play = heal(store.play, store.derived, n)
  else store.play.tempHp = Math.max(store.play.tempHp, n)
  amount.value = ''
}

function useHitDie() {
  store.play = spendHitDie(store.play, store.derived, activeDie.value, Number(hitDieRoll.value))
  hitDieRoll.value = ''
}
</script>
