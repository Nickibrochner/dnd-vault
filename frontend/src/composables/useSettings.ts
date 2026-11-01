import { reactive, watch } from 'vue'

// Indstillinger for denne browser – de følger ikke karaktererne, og de gemmes ikke i databasen.

export interface Settings {
  /** Viser fanen "Rettelser" på arket, så beregnede værdier kan overstyres (fx ved import fra et andet system). */
  manualEditing: boolean
}

const KEY = 'dnd-vault:settings'
const DEFAULTS: Settings = { manualEditing: false }

function load(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

const settings = reactive<Settings>(load())
watch(settings, s => {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* fx privat vindue – indstillingen gælder så kun nu */ }
})

export const useSettings = () => settings
