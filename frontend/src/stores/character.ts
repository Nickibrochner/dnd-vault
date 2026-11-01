import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { api, type SheetData } from '../api'
import {
  activeSteps, characterLevel, derive, emptyDraft, emptyLevelUp, sanitize, summarize, validateProgression, validateStep,
  STEPS, startingGear, type CharacterDraft, type Gear, type StepId,
} from '../rules/engine'
import { MAX_LEVEL } from '../rules/progression'
import { WEAPONS } from '../rules/data'
import { emptyPlay, gearFromItems, sanitizePlay, startingItems, type InventoryItem, type PlayState } from '../rules/play'

const SHEET_VERSION = 2
const AUTOSAVE_DELAY = 1000

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

export const useCharacterStore = defineStore('character', () => {
  const characterId = ref<number | null>(null)
  const draft = ref<CharacterDraft>(emptyDraft())
  /** Tracking ved bordet (HP, brugte slots …) – adskilt fra selve bygget. */
  const play = ref<PlayState>(emptyPlay())
  const loading = ref(false)
  const loadError = ref<string | null>(null)
  const saveStatus = ref<SaveStatus>('idle')
  const saveError = ref<string | null>(null)

  // Alt der kan udledes af valgene beregnes – det gemmes aldrig som "sandhed".
  // AC og angreb kommer fra det udrustede i inventory; uden inventory fra startudstyret.
  const gear = computed<Gear>(() => {
    if (play.value.items) return gearFromItems(play.value.items)
    const start = startingGear(draft.value)
    const extra = play.value.extraWeapons.filter(n => WEAPONS.some(w => w.name === n)).map(n => ({ name: n, label: n, bonus: 0 }))
    return { ...start, weapons: [...start.weapons, ...extra] }
  })
  const derived = computed(() => derive(draft.value, gear.value))
  /** Inventory – startudstyret, indtil spilleren ændrer noget. */
  const items = computed<InventoryItem[]>(() => play.value.items ?? startingItems(derived.value, play.value.extraWeapons))

  /** Opretter inventory fra startudstyret før første ændring. */
  function ensureItems(): InventoryItem[] {
    if (!play.value.items) play.value.items = startingItems(derived.value, play.value.extraWeapons)
    return play.value.items
  }
  const level = computed(() => characterLevel(draft.value))
  const stepIssues = computed(() =>
    Object.fromEntries(STEPS.map(s => [s.id, validateStep(s.id, draft.value)])) as Record<StepId, string[]>)
  const progressionIssues = computed(() => validateProgression(draft.value))

  /** Trinene for netop denne karakter (fx uden Spells for en Fighter). */
  const steps = computed(() => activeSteps(draft.value))

  /** Et trin er tilgængeligt, når det er aktivt og alle trin før det er gyldige. */
  const isStepUnlocked = (step: StepId) => {
    const idx = steps.value.findIndex(s => s.id === step)
    return idx !== -1 && steps.value.slice(0, idx).every(s => stepIssues.value[s.id].length === 0)
  }
  const firstOpenStep = computed<StepId>(() =>
    steps.value.find(s => stepIssues.value[s.id].length > 0)?.id ?? 'review')

  // ---------- Autosave ----------

  let timer: ReturnType<typeof setTimeout> | undefined
  let inFlight: Promise<void> | null = null
  /** JSON af det serveren senest har (draft + play) – ændringer måles mod dette. */
  let persisted = ''
  const snapshot = () => JSON.stringify({ draft: draft.value, play: play.value })

  const payload = () => ({
    name: draft.value.name.trim() || 'Unavngiven',
    level: level.value,
    sheet_data: { version: SHEET_VERSION, draft: draft.value, play: play.value, summary: summarize(draft.value) } satisfies SheetData,
  })

  async function save(keepalive = false) {
    clearTimeout(timer)
    if (!characterId.value) return
    // Gemninger køres én ad gangen, så et langsomt svar aldrig overskriver en nyere ændring
    if (inFlight) await inFlight
    if (saveStatus.value !== 'dirty') return
    saveStatus.value = 'saving'
    saveError.value = null
    const body = payload()
    const sent = JSON.stringify({ draft: body.sheet_data.draft, play: body.sheet_data.play })
    inFlight = api.saveCharacter(characterId.value, body, keepalive)
      .then(() => {
        persisted = sent
        if (saveStatus.value === 'saving') saveStatus.value = 'saved'
      })
      .catch((err: Error) => {
        saveStatus.value = 'error'
        saveError.value = err.message
      })
      .finally(() => { inFlight = null })
    await inFlight
    // Blev der ændret noget mens vi gemte, gemmer vi igen (watcheren kan have sat status under await)
    if ((saveStatus.value as SaveStatus) === 'dirty') scheduleSave()
  }

  function scheduleSave() {
    clearTimeout(timer)
    timer = setTimeout(() => save(), AUTOSAVE_DELAY)
  }

  /** Gem straks det der venter (fx ved navigation eller lukning af fanen). */
  const flush = () => (saveStatus.value === 'dirty' ? save(true) : inFlight ?? Promise.resolve())

  function markChanged() {
    if (snapshot() === persisted) {
      if (saveStatus.value === 'dirty') saveStatus.value = 'saved'
      return
    }
    saveStatus.value = 'dirty'
    scheduleSave()
  }

  watch(draft, (value) => {
    const clean = sanitize(value)
    if (JSON.stringify(clean) !== JSON.stringify(value)) {
      // Ugyldige afhængige valg blev ryddet – watcheren kører igen med det rene draft
      draft.value = clean
      return
    }
    // Grænserne for tracking kan have ændret sig (fx færre spell slots)
    const cleanPlay = sanitizePlay(play.value, derived.value)
    if (JSON.stringify(cleanPlay) !== JSON.stringify(play.value)) play.value = cleanPlay
    markChanged()
  }, { deep: true })

  watch(play, (value) => {
    const clean = sanitizePlay(value, derived.value)
    if (JSON.stringify(clean) !== JSON.stringify(value)) {
      play.value = clean
      return
    }
    markChanged()
  }, { deep: true })

  // ---------- Indlæsning ----------

  async function load(id: number) {
    if (characterId.value === id && !loadError.value) return
    await flush()
    loading.value = true
    loadError.value = null
    try {
      const record = await api.getCharacter(id)
      const stored: Partial<CharacterDraft> = record.sheet_data?.version === SHEET_VERSION ? record.sheet_data.draft : {}
      const loaded = sanitize({ ...emptyDraft(), ...stored, name: stored.name ?? record.name })
      const storedPlay = record.sheet_data?.play
      const loadedPlay = sanitizePlay(storedPlay, derive(loaded, storedPlay?.items ? gearFromItems(storedPlay.items) : undefined))
      persisted = JSON.stringify({ draft: loaded, play: loadedPlay })
      characterId.value = record.id
      draft.value = loaded
      play.value = loadedPlay
      saveStatus.value = 'idle'
    } catch (err) {
      loadError.value = (err as Error).message
      characterId.value = null
    } finally {
      loading.value = false
    }
  }

  async function complete() {
    draft.value.completed = true
    await flush()
  }

  // ---------- Level-up ----------

  /** Stiger ét level i den valgte klasse (startklassen, hvis intet angives). */
  function levelUp(classId: string | null = null) {
    if (level.value >= MAX_LEVEL) return
    draft.value.levels.push(emptyLevelUp(classId === draft.value.classId ? null : classId))
  }

  /** Fjerner det seneste level og de valg, der hører til det. */
  function levelDown() {
    draft.value.levels.pop()
  }

  return {
    characterId, draft, play, gear, derived, items, ensureItems, level, loading, loadError, saveStatus, saveError,
    steps, stepIssues, progressionIssues, isStepUnlocked, firstOpenStep,
    load, flush, complete, levelUp, levelDown,
  }
})
