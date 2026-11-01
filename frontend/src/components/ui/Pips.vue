<template>
  <div class="flex flex-wrap gap-1" role="group" :aria-label="label">
    <button
      v-for="i in max"
      :key="i"
      type="button"
      :title="`${label}: ${i <= used ? 'brugt' : 'tilgængelig'}`"
      class="w-5 h-5 rounded-full border transition-colors"
      :class="i <= used ? 'bg-gray-700 border-gray-600' : 'bg-red-600 border-red-400 hover:bg-red-500'"
      @click="emit('update:used', i <= used ? i - 1 : i)"
    />
  </div>
</template>

<script setup lang="ts">
/** Afkrydsning af brug: røde prikker er tilgængelige, grå er brugt. */
defineProps<{ label: string; max: number; used: number }>()
const emit = defineEmits<{ 'update:used': [value: number] }>()
</script>
