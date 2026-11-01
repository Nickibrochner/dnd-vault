<template>
  <div>
    <div class="flex items-baseline justify-between mb-2">
      <div class="text-sm font-medium text-gray-300">{{ label }}</div>
      <div class="text-xs font-mono" :class="modelValue.length >= max ? 'text-emerald-400' : 'text-yellow-400'">
        {{ modelValue.length }}/{{ max }}
      </div>
    </div>
    <p v-if="!visible.length" class="text-sm text-gray-500">{{ emptyText }}</p>
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      <button
        v-for="{ spell, owner } in visible"
        :key="spell.id"
        type="button"
        :disabled="isDisabled(spell.id, owner)"
        :title="owner ? `Har du allerede fra ${owner}` : undefined"
        class="text-left p-3 rounded border transition-colors disabled:cursor-not-allowed"
        :class="modelValue.includes(spell.id)
          ? 'bg-red-950/40 border-red-500'
          : isDisabled(spell.id, owner)
            ? 'bg-gray-900 border-gray-800 opacity-40'
            : 'bg-gray-900 border-gray-700 hover:border-gray-500'"
        @click="toggle(spell.id)"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-semibold text-gray-100 text-sm">{{ modelValue.includes(spell.id) ? '✓ ' : '' }}{{ spell.name }}</span>
          <span class="flex gap-1 shrink-0">
            <span v-if="spell.concentration" class="tag text-amber-300 border-amber-700/60" title="Concentration">C</span>
            <span v-if="spell.ritual" class="tag text-sky-300 border-sky-700/60" title="Ritual">R</span>
          </span>
        </div>
        <div class="text-[11px] text-gray-500 mt-0.5">{{ spell.level ? `Level ${spell.level} · ` : '' }}{{ spell.school }} · {{ spell.time }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ owner ? `🔒 ${owner}` : spell.text }}</div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { findSpell, type Spell } from '../../rules/spells'

const props = withDefaults(defineProps<{
  label: string
  modelValue: string[]
  /** Spell-id'er der kan vælges. */
  options: string[]
  max: number
  /** spell-id → kilde, for spells der allerede er givet andetsteds. */
  owners?: Map<string, string>
  search?: string
  emptyText?: string
}>(), { owners: () => new Map(), search: '', emptyText: 'Ingen spells matcher.' })

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const visible = computed(() => {
  const q = props.search.trim().toLowerCase()
  return props.options
    .map(id => findSpell(id))
    .filter((spell): spell is Spell => !!spell)
    // Valgte spells vises altid, også når de ikke matcher søgningen
    .filter(spell => !q || props.modelValue.includes(spell.id) || `${spell.name} ${spell.school} ${spell.text} level ${spell.level}`.toLowerCase().includes(q))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    .map(spell => ({ spell, owner: props.owners.get(spell.id) }))
})

const isDisabled = (id: string, owner?: string) =>
  !props.modelValue.includes(id) && (!!owner || (props.max > 1 && props.modelValue.length >= props.max))

function toggle(id: string) {
  const next = props.modelValue.includes(id)
    ? props.modelValue.filter(v => v !== id)
    : props.max === 1 ? [id] : [...props.modelValue, id]
  emit('update:modelValue', next)
}
</script>
