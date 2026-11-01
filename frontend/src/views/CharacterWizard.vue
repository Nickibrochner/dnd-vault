<template>
  <div class="max-w-7xl mx-auto px-4 py-6">
    <div v-if="store.loading" class="text-gray-400">Henter karakter…</div>

    <div v-else-if="store.loadError" class="panel text-red-400 space-y-3">
      <p>{{ store.loadError }}</p>
      <router-link to="/" class="text-gray-300 underline">Tilbage til oversigten</router-link>
    </div>

    <template v-else>
      <!-- Stepper -->
      <nav class="mb-6 overflow-x-auto">
        <ol class="flex gap-2 min-w-max">
          <li v-for="(s, i) in store.steps" :key="s.id">
            <button
              type="button"
              :disabled="!store.isStepUnlocked(s.id)"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              :class="s.id === currentStep
                ? 'bg-red-600 border-red-500 text-white'
                : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'"
              @click="goTo(s.id)"
            >
              <span
                class="w-6 h-6 rounded-full grid place-items-center text-xs"
                :class="isDone(s.id) ? 'bg-emerald-600 text-white' : 'bg-gray-900 text-gray-400'"
              >{{ isDone(s.id) ? '✓' : i + 1 }}</span>
              {{ s.name }}
            </button>
          </li>
        </ol>
      </nav>

      <div class="grid grid-cols-1 lg:grid-cols-[1fr_18rem] gap-6 items-start">
        <div class="bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col min-w-0">
          <div class="p-6 flex-grow">
            <component :is="STEP_COMPONENTS[currentStep]" />
          </div>

          <div class="bg-gray-900 p-4 border-t border-gray-700 rounded-b-lg space-y-3">
            <ul v-if="currentIssues.length" class="text-sm text-yellow-400 space-y-0.5">
              <li v-for="issue in currentIssues" :key="issue">• {{ issue }}</li>
            </ul>
            <div class="flex items-center justify-between gap-4">
              <button
                type="button"
                :disabled="stepIndex <= 0"
                class="px-6 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="goTo(store.steps[stepIndex - 1].id)"
              >Tilbage</button>

              <SaveIndicator />

              <button
                v-if="stepIndex < store.steps.length - 1"
                type="button"
                :disabled="currentIssues.length > 0"
                class="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="goTo(store.steps[stepIndex + 1].id)"
              >Næste</button>
              <button
                v-else
                type="button"
                :disabled="currentIssues.length > 0"
                class="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                @click="finish"
              >Færdiggør karakter</button>
            </div>
          </div>
        </div>

        <CharacterSummary class="lg:sticky lg:top-4" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch, type Component } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useCharacterStore } from '../stores/character'
import { STEPS, type StepId } from '../rules/engine'
import CharacterSummary from '../components/wizard/CharacterSummary.vue'
import SaveIndicator from '../components/wizard/SaveIndicator.vue'
import StepSpecies from '../components/wizard/StepSpecies.vue'
import StepClass from '../components/wizard/StepClass.vue'
import StepBackground from '../components/wizard/StepBackground.vue'
import StepAbilities from '../components/wizard/StepAbilities.vue'
import StepEquipment from '../components/wizard/StepEquipment.vue'
import StepSpells from '../components/wizard/StepSpells.vue'
import StepReview from '../components/wizard/StepReview.vue'

const STEP_COMPONENTS: Record<StepId, Component> = {
  species: StepSpecies,
  class: StepClass,
  background: StepBackground,
  abilities: StepAbilities,
  equipment: StepEquipment,
  spells: StepSpells,
  review: StepReview,
}

const route = useRoute()
const router = useRouter()
const store = useCharacterStore()

const charId = computed(() => Number(route.params.charId))
const currentStep = computed<StepId>(() => {
  const step = route.params.step as StepId
  return STEPS.some(s => s.id === step) ? step : 'species'
})
const stepIndex = computed(() => store.steps.findIndex(s => s.id === currentStep.value))
const currentIssues = computed(() => store.stepIssues[currentStep.value])
const isDone = (step: StepId) => step !== 'review' && store.stepIssues[step].length === 0

const goTo = (step: StepId) => router.push(`/builder/${charId.value}/${step}`)

// Send brugeren til første ufærdige trin, hvis URL'en peger på et låst eller ukendt trin
function guardStep() {
  if (store.loading || store.loadError || store.characterId !== charId.value) return
  const requested = route.params.step as StepId
  if (!STEPS.some(s => s.id === requested) || !store.isStepUnlocked(requested)) {
    router.replace(`/builder/${charId.value}/${store.firstOpenStep}`)
  }
}

watch(charId, async (id) => {
  await store.load(id)
  guardStep()
}, { immediate: true })
watch(() => route.params.step, guardStep)
// Hvis Spells-trinnet forsvinder (fx klasse skiftet til Fighter) mens man står på det
watch(() => store.steps.length, guardStep)

async function finish() {
  await store.complete()
  router.push(`/character/${charId.value}`)
}

const onUnload = () => { store.flush() }
onMounted(() => window.addEventListener('beforeunload', onUnload))
onBeforeUnmount(() => window.removeEventListener('beforeunload', onUnload))
onBeforeRouteLeave(() => store.flush())
</script>
