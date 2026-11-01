<template>
  <button
    type="button"
    :aria-pressed="selected"
    class="w-full text-left p-4 rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
    :class="selected
      ? 'bg-red-950/40 border-red-500 shadow-[0_0_0_1px_theme(colors.red.500)]'
      : 'bg-gray-900 border-gray-700 hover:border-gray-500'"
  >
    <div class="flex items-start justify-between gap-2">
      <div class="font-bold text-gray-100">{{ title }}</div>
      <span v-if="badge" class="shrink-0 text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300 border border-emerald-700/60">
        {{ badge }}
      </span>
    </div>
    <div v-if="subtitle" class="text-xs text-gray-400 mt-0.5">{{ subtitle }}</div>
    <div v-if="$slots.default" class="text-sm text-gray-300 mt-2"><slot /></div>
  </button>
</template>

<script setup lang="ts">
defineProps<{ title: string; subtitle?: string; badge?: string; selected?: boolean }>()
</script>
