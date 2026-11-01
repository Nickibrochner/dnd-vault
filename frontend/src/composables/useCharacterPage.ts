import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import { useCharacterStore } from '../stores/character'

/** Indlæser karakteren fra :charId og sørger for, at ændringer gemmes, før siden forlades. */
export function useCharacterPage(onLoaded?: () => void) {
  const route = useRoute()
  const store = useCharacterStore()
  const charId = computed(() => Number(route.params.charId))

  watch(charId, async (id) => {
    await store.load(id)
    onLoaded?.()
  }, { immediate: true })

  const onUnload = () => { store.flush() }
  onMounted(() => window.addEventListener('beforeunload', onUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', onUnload))
  onBeforeRouteLeave(() => store.flush())

  const ready = computed(() => !store.loading && !store.loadError && store.characterId === charId.value)
  return { store, charId, ready }
}
