<template>
  <div class="min-h-screen bg-gray-900 text-gray-100 font-sans">
    <header class="bg-gray-950 border-b border-gray-800 p-4">
      <div class="max-w-6xl mx-auto">
        <router-link to="/" class="text-2xl font-bold text-red-600 hover:text-red-500 transition-colors">
          DND Vault Maintainer
        </router-link>
      </div>
    </header>
    
    <main>
      <router-view />
    </main>
  </div>
</template>