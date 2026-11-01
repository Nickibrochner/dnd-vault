import { reactive, watch } from 'vue'

// Indstillinger for denne browser – de følger ikke karaktererne, og de gemmes ikke i databasen.

export interface Settings {
  /** Viser fanen "Rettelser" på arket, så beregnede værdier kan overstyres (fx ved import fra et andet system). */
  manualEditing: boolean
  /** Brødtekstens skrifttype: læsevenlig serif, den gamle kalligrafiske eller en sans-serif. */
  font: FontChoice
}

export type FontChoice = 'readable' | 'classic' | 'sans'
export const FONTS: { id: FontChoice; name: string; family: string }[] = [
  { id: 'readable', name: 'Læsevenlig', family: 'Literata' },
  { id: 'classic', name: 'Klassisk', family: 'Alegreya' },
  { id: 'sans', name: 'Uden fødder', family: 'Source Sans 3' },
]

const KEY = 'dnd-vault:settings'
const DEFAULTS: Settings = { manualEditing: false, font: 'readable' }

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
watch(() => settings.font, font => { document.documentElement.dataset.font = font }, { immediate: true })

export const useSettings = () => settings
