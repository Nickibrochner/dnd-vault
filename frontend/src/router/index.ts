import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '../views/Dashboard.vue'
import CharacterWizard from '../views/CharacterWizard.vue'
import CharacterSheet from '../views/CharacterSheet.vue'
import LevelUp from '../views/LevelUp.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    // Trinene defineres ét sted (STEPS i rules/engine.ts); wizarden validerer :step selv
    { path: '/builder/:charId(\\d+)/:step?', component: CharacterWizard },
    { path: '/character/:charId(\\d+)/level-up', component: LevelUp },
    // Arkets faner: /character/1, /character/1/udstyr, /character/1/spells – og /rettelser med manuel redigering
    { path: '/character/:charId(\\d+)/:tab(udstyr|spells|rettelser)?', component: CharacterSheet },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ]
})

export default router
