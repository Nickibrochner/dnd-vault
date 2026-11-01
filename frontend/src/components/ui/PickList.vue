<template>
  <div>
    <div class="flex items-baseline justify-between mb-2">
      <div class="text-sm font-medium text-gray-300">{{ label }}</div>
      <div class="text-xs font-mono" :class="modelValue.length >= max ? 'text-emerald-400' : 'text-yellow-400'">
        {{ modelValue.length }}/{{ max }}
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="item in locked"
        :key="`locked-${item.value}`"
        class="px-3 py-1.5 text-sm rounded-full border border-gray-600 bg-gray-800 text-gray-400"
        :title="item.note"
      >
        🔒 {{ item.label }}
      </span>
      <button
        v-for="opt in options"
        :key="opt.value"
        type="button"
        :disabled="isDisabled(opt)"
        :title="opt.note"
        class="px-3 py-1.5 text-sm rounded-full border transition-colors disabled:cursor-not-allowed"
        :class="modelValue.includes(opt.value)
          ? 'bg-red-600 border-red-500 text-white'
          : isDisabled(opt)
            ? 'bg-gray-900 border-gray-800 text-gray-600'
            : 'bg-gray-900 border-gray-600 text-gray-200 hover:border-red-500'"
        @click="toggle(opt.value)"
      >
        {{ opt.label }}<span v-if="opt.hint" class="ml-1 text-xs opacity-70">{{ opt.hint }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
export interface PickOption { value: string; label: string; hint?: string; disabled?: boolean; note?: string }
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  label: string
  modelValue: string[]
  options: PickOption[]
  max: number
  /** Allerede givne valg, der vises men ikke kan ændres (fx baggrunds-skills). */
  locked?: PickOption[]
}>(), { locked: () => [] })

const emit = defineEmits<{ 'update:modelValue': [value: string[]] }>()

const isDisabled = (opt: PickOption) =>
  !props.modelValue.includes(opt.value) && (!!opt.disabled || (props.max > 1 && props.modelValue.length >= props.max))

function toggle(value: string) {
  const next = props.modelValue.includes(value)
    ? props.modelValue.filter(v => v !== value)
    // Ved max=1 erstatter et nyt valg det gamle i stedet for at blive blokeret
    : props.max === 1 ? [value] : [...props.modelValue, value]
  emit('update:modelValue', next)
}
</script>
