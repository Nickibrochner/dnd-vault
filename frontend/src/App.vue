<template>
  <div class="min-h-screen text-gray-100 font-sans">
    <header class="wood p-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4">
        <router-link to="/" class="font-display text-2xl font-bold tracking-wider text-gold hover:text-white transition-colors [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
          DND Vault Maintainer
        </router-link>
        <SettingsMenu />
      </div>
    </header>

    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import SettingsMenu from './components/ui/SettingsMenu.vue'
</script>