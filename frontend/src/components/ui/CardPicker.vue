<template>
  <div>
    <div class="flex items-baseline justify-between mb-2">
      <div class="text-sm font-medium text-gray-300">{{ label }}</div>
      <div class="text-xs font-mono" :class="modelValue.length >= max ? 'text-emerald-400' : 'text-yellow-400'">
        {{ modelValue.length }}/{{ max }}
      </div>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
      <button
        v-for="opt in options"
        :key="opt.id"
        type="button"
        :disabled="isDisabled(opt)"
        class="text-left p-3 rounded border transition-colors disabled:cursor-not-allowed"
        :class="modelValue.includes(opt.id)
          ? 'bg-red-950/40 border-red-500'
          : isDisabled(opt)
            ? 'bg-gray-900 border-gray-800 opacity-40'
            : 'bg-gray-900 border-gray-700 hover:border-gray-500'"
        @click="toggle(opt.id)"
      >
        <div class="font-semibold text-gray-100 text-sm">{{ modelValue.includes(opt.id) ? '✓ ' : '' }}{{ opt.name }}</div>
        <div v-if="opt.note" class="text-[11px] text-yellow-500 mt-0.5">{{ opt.note }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ opt.text }}</div>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
export interface CardOption { id: string; name: string; text: string; disabled?: boolean; note?: string }
</script>

<script setup lang="ts">
/** Flervalg som kort med beskrivelse – fx invocations, metamagic og maneuvers. */
const props = defineProps<{ label: string; modelValue: string[]; options: CardOption[]; max: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const isDisabled = (opt: CardOption) =>
  !props.modelValue.includes(opt.id) && (!!opt.disabled || (props.max > 1 && props.modelValue.length >= props.max))

function toggle(id: string) {
  const next = props.modelValue.includes(id)
    ? props.modelValue.filter(v => v !== id)
    : props.max === 1 ? [id] : [...props.modelValue, id]
  emit('update:modelValue', next)
}
</script>
