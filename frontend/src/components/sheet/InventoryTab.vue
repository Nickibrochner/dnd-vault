<template>
  <div class="space-y-6">
    <!-- Overblik -->
    <section class="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div class="stat" :title="x.acBreakdown"><dt>Armor Class</dt><dd>{{ x.ac }}</dd><div class="text-xs text-gray-500 truncate">{{ x.acBreakdown }}</div></div>
      <div class="stat">
        <dt>Vægt</dt>
        <dd :class="overloaded ? 'text-red-400' : ''">{{ weight }} <span class="text-sm text-gray-500">/ {{ x.carryCapacity }} lb.</span></dd>
        <div class="h-1.5 mt-1 rounded bg-gray-700 overflow-hidden">
          <div class="h-full" :class="overloaded ? 'bg-red-500' : weight > x.carryCapacity * 0.66 ? 'bg-yellow-500' : 'bg-emerald-500'" :style="{ width: `${Math.min(100, (weight / Math.max(1, x.carryCapacity)) * 100)}%` }" />
        </div>
      </div>
      <div class="stat"><dt>Attunement</dt><dd :class="attunedCount >= MAX_ATTUNED ? 'text-yellow-400' : ''">{{ attunedCount }} / {{ MAX_ATTUNED }}</dd></div>
      <div class="stat"><dt>Angreb</dt><dd>{{ x.attacks.length - 1 }} <span class="text-sm text-gray-500">våben udrustet</span></dd></div>
    </section>

    <p v-if="overloaded" class="text-sm text-red-400">⚠️ Du bærer mere end din bæreevne (STR × 15). Du kan højst slæbe, løfte eller skubbe {{ x.carryCapacity * 2 }} lb. og bevæger dig kun 5 ft.</p>
    <p v-for="w in x.warnings" :key="w" class="text-sm text-yellow-400">⚠️ {{ w }}</p>

    <!-- Tilføj -->
    <section class="panel space-y-3">
      <h3 class="section-title !mb-0">Tilføj genstand</h3>
      <form class="flex flex-wrap items-end gap-2" @submit.prevent="add">
        <label class="flex-1 min-w-[12rem]">
          <span class="label">Navn</span>
          <input v-model="draftName" list="item-catalog" class="field !p-2 mt-1" placeholder="Fx Longsword, Rope, Potion of Healing…" @change="fillFromCatalog">
          <datalist id="item-catalog">
            <option v-for="c in CATALOG" :key="c.name" :value="c.name" />
          </datalist>
        </label>
        <label class="w-20"><span class="label">Antal</span><input v-model.number="draftQty" type="number" min="1" class="field !p-2 mt-1"></label>
        <label class="w-24"><span class="label">Vægt (lb.)</span><input v-model.number="draftWeight" type="number" min="0" step="0.1" class="field !p-2 mt-1"></label>
        <label>
          <span class="label">Type</span>
          <select v-model="draftKind" class="field !p-2 !w-auto mt-1">
            <option v-for="k in ITEM_KINDS" :key="k.id" :value="k.id">{{ k.name }}</option>
          </select>
        </label>
        <button type="submit" class="px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white text-sm disabled:opacity-40" :disabled="!draftName.trim()">Tilføj</button>
      </form>
      <p class="text-xs text-gray-500">Våben og rustning fra listen får automatisk regeldata (damage, AC). Egne genstande kan få en magisk bonus bagefter.</p>
    </section>

    <!-- Genstande pr. type -->
    <section v-for="group in groups" :key="group.kind" class="panel">
      <h3 class="section-title">{{ group.name }} <span class="normal-case text-gray-600">· {{ group.weight }} lb.</span></h3>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="text-left text-[10px] uppercase tracking-wide text-gray-500">
            <tr>
              <th v-if="equippable(group.kind)" class="pb-1 w-10" :title="group.kind === 'weapon' ? 'Vises under angreb' : 'Giver AC'">Brug</th>
              <th class="pb-1">Navn</th>
              <th class="pb-1 w-28">Antal</th>
              <th class="pb-1 w-16">lb.</th>
              <th v-if="hasBonus(group.kind)" class="pb-1 w-16" :title="group.kind === 'weapon' ? '+angreb og damage' : '+AC'">Bonus</th>
              <th class="pb-1 w-10" title="Attuned">Att.</th>
              <th class="pb-1">Noter</th>
              <th class="pb-1 w-24" />
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-800">
            <tr v-for="item in group.items" :key="item.id" :class="item.qty === 0 && 'opacity-50'">
              <td v-if="equippable(group.kind)" class="py-1.5">
                <input type="checkbox" :checked="item.equipped" class="w-4 h-4 accent-red-600" :aria-label="`Udrust ${item.name}`" @change="toggleEquip(item.id)">
              </td>
              <td class="py-1.5 pr-2">
                <input :value="item.name" class="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-red-500 focus:outline-none w-full text-gray-100" @change="update(item.id, { name: ($event.target as HTMLInputElement).value })">
                <div v-if="detail(item)" class="text-[11px] text-gray-500">{{ detail(item) }}</div>
              </td>
              <td class="py-1.5">
                <div class="flex items-center gap-1">
                  <button type="button" class="step-btn !w-6 !h-6" :disabled="item.qty <= 0" @click="update(item.id, { qty: item.qty - 1 })">−</button>
                  <span class="font-mono w-8 text-center">{{ item.qty }}</span>
                  <button type="button" class="step-btn !w-6 !h-6" @click="update(item.id, { qty: item.qty + 1 })">+</button>
                </div>
              </td>
              <td class="py-1.5 font-mono text-gray-400">{{ round(item.qty * item.weight) }}</td>
              <td v-if="hasBonus(group.kind)" class="py-1.5">
                <select :value="item.bonus" class="bg-gray-900 border border-gray-700 rounded px-1 py-0.5" @change="update(item.id, { bonus: Number(($event.target as HTMLSelectElement).value) })">
                  <option v-for="b in [0, 1, 2, 3]" :key="b" :value="b">{{ b ? `+${b}` : '–' }}</option>
                </select>
              </td>
              <td class="py-1.5">
                <input
                  type="checkbox" :checked="item.attuned" class="w-4 h-4 accent-indigo-500"
                  :disabled="!item.attuned && attunedCount >= MAX_ATTUNED"
                  :title="!item.attuned && attunedCount >= MAX_ATTUNED ? 'Du kan højst være attuned til 3 genstande' : 'Attuned'"
                  @change="update(item.id, { attuned: !item.attuned })"
                >
              </td>
              <td class="py-1.5 pr-2">
                <input :value="item.notes" class="bg-transparent border-b border-transparent hover:border-gray-600 focus:border-red-500 focus:outline-none w-full text-gray-400 text-xs" placeholder="—" @change="update(item.id, { notes: ($event.target as HTMLInputElement).value })">
              </td>
              <td class="py-1.5 text-right whitespace-nowrap space-x-1">
                <button v-if="item.kind === 'consumable' && item.qty > 0" type="button" class="text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-emerald-500" @click="consume(item.id)">Brug</button>
                <button v-if="item.contents" type="button" class="text-xs px-2 py-0.5 rounded border border-gray-600 hover:border-gray-400" :title="item.contents.join(', ')" @click="unpack(item.id)">Pak ud</button>
                <button
                  type="button"
                  class="text-xs px-2 py-0.5 rounded border transition-colors"
                  :class="pendingDelete === item.id ? 'border-red-500 bg-red-600 text-white' : 'border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-500'"
                  @click="remove(item.id)"
                >{{ pendingDelete === item.id ? 'Slet?' : '✕' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
    <p v-if="!items.length" class="text-gray-500">Inventory er tomt.</p>

    <!-- Mønter og noter -->
    <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="panel space-y-3">
        <h3 class="section-title !mb-0">Mønter <span class="normal-case text-gray-600">· {{ round(coinCount / COINS_PER_POUND) }} lb.</span></h3>
        <div class="grid grid-cols-5 gap-2">
          <label v-for="c in COIN_KEYS" :key="c" class="text-center">
            <span class="label">{{ c }}</span>
            <input type="number" min="0" :value="coins[c]" class="field !p-1.5 text-center font-mono text-sm" @input="setCoin(c, ($event.target as HTMLInputElement).value)">
          </label>
        </div>
        <p class="text-xs text-gray-500">I alt {{ round(totalGp) }} GP værdi.</p>
      </div>
      <div class="panel space-y-3">
        <h3 class="section-title !mb-0">Noter om udstyr</h3>
        <textarea v-model="store.play.inventory" rows="4" class="field text-sm" placeholder="Loot der skal deles, gemte genstande, lager…" />
      </div>
    </section>

    <div class="flex justify-end">
      <button
        type="button"
        class="text-sm px-3 py-1.5 rounded border transition-colors"
        :class="confirmReset ? 'border-red-500 bg-red-600 text-white' : 'border-gray-700 text-gray-400 hover:border-red-500'"
        @click="reset"
      >{{ confirmReset ? 'Bekræft: erstat inventory med startudstyret' : 'Nulstil til startudstyr' }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCharacterStore } from '../../stores/character'
import { ARMOR, WEAPONS } from '../../rules/data'
import { CATALOG, ITEM_KINDS, findCatalogItem, isArmorId, type ItemKind } from '../../rules/items'
import {
  COINS_PER_POUND, MAX_ATTUNED, addLog, carriedWeight, coinsOf, newItemId, startingItems, unpackItem,
  type Coins, type InventoryItem,
} from '../../rules/play'

const store = useCharacterStore()
const x = computed(() => store.derived)
const items = computed(() => store.items)

const COIN_KEYS = ['cp', 'sp', 'ep', 'gp', 'pp'] as const
const GP_VALUE: Record<keyof Coins, number> = { cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 }

const round = (n: number) => Math.round(n * 100) / 100
const weight = computed(() => carriedWeight(store.play, x.value, items.value))
const overloaded = computed(() => weight.value > x.value.carryCapacity)
const attunedCount = computed(() => items.value.filter(i => i.attuned).length)

const groups = computed(() => ITEM_KINDS
  .map(k => {
    const list = items.value.filter(i => i.kind === k.id)
    return { kind: k.id, name: k.name, items: list, weight: round(list.reduce((s, i) => s + i.qty * i.weight, 0)) }
  })
  .filter(g => g.items.length))

const equippable = (kind: ItemKind) => kind === 'weapon' || kind === 'armor' || kind === 'shield' || kind === 'magic'
const hasBonus = equippable

/** Kort regeldata under navnet, fx '1d8 Slashing · Versatile (1d10)' eller 'AC 16 · heavy'. */
function detail(item: InventoryItem): string {
  if (item.kind === 'weapon') {
    const w = WEAPONS.find(v => v.name === item.ref)
    return w ? [`${w.damage} ${w.damageType}`, w.properties, `Mastery: ${w.mastery}`].filter(Boolean).join(' · ') : ''
  }
  if (item.kind === 'armor' && isArmorId(item.ref)) {
    const a = ARMOR[item.ref]
    return `AC ${a.base + item.bonus}${a.dexCap === null ? ' + DEX' : a.dexCap ? ` + DEX (max ${a.dexCap})` : ''} · ${a.type}${a.strength ? ` · STR ${a.strength}` : ''}${a.stealthDisadvantage ? ' · Stealth disadv.' : ''}`
  }
  if (item.kind === 'shield') return `+${2 + item.bonus} AC`
  if (item.kind === 'magic' && item.bonus) return `+${item.bonus} AC, når den er i brug`
  return item.contents ? `Indhold: ${item.contents.join(', ')}` : ''
}

// ---------- Ændringer (inventory oprettes fra startudstyret ved første ændring) ----------

function update(id: string, patch: Partial<InventoryItem>) {
  const list = store.ensureItems()
  const item = list.find(i => i.id === id)
  if (item) Object.assign(item, patch)
}

/** Kun én rustning og ét skjold ad gangen. */
function toggleEquip(id: string) {
  const list = store.ensureItems()
  const item = list.find(i => i.id === id)
  if (!item) return
  const on = !item.equipped
  if (on && (item.kind === 'armor' || item.kind === 'shield')) list.forEach(i => { if (i.kind === item.kind) i.equipped = false })
  item.equipped = on
}

function consume(id: string) {
  const list = store.ensureItems()
  const item = list.find(i => i.id === id)
  if (!item || item.qty <= 0) return
  item.qty--
  store.play = addLog(store.play, `Brugte ${item.name}${item.notes ? ` (${item.notes})` : ''}`)
}

function unpack(id: string) {
  store.play.items = unpackItem(store.ensureItems(), id)
}

const pendingDelete = ref<string | null>(null)
function remove(id: string) {
  if (pendingDelete.value !== id) { pendingDelete.value = id; return }
  pendingDelete.value = null
  store.play.items = store.ensureItems().filter(i => i.id !== id)
}

const confirmReset = ref(false)
function reset() {
  if (!confirmReset.value) { confirmReset.value = true; return }
  confirmReset.value = false
  store.play.items = startingItems(x.value)
}

// ---------- Tilføj ----------

const draftName = ref('')
const draftQty = ref(1)
const draftWeight = ref(0)
const draftKind = ref<ItemKind>('gear')

function fillFromCatalog() {
  const hit = findCatalogItem(draftName.value)
  if (!hit) return
  draftWeight.value = hit.weight
  draftKind.value = hit.kind
}

function add() {
  const name = draftName.value.trim()
  if (!name) return
  const hit = findCatalogItem(name)
  const list = store.ensureItems()
  const qty = Math.max(1, Math.round(draftQty.value || 1))
  const same = list.find(i => i.name.toLowerCase() === name.toLowerCase() && i.kind === draftKind.value)
  if (same) same.qty += qty
  else {
    list.push({
      id: newItemId(), name, qty, weight: Math.max(0, draftWeight.value || 0), kind: draftKind.value,
      equipped: draftKind.value === 'weapon', attuned: false, bonus: 0, notes: hit?.note ?? '',
      ...(hit && hit.kind === draftKind.value && hit.ref ? { ref: hit.ref } : {}),
      ...(hit?.contents ? { contents: hit.contents } : {}),
    })
  }
  store.play = addLog(store.play, `Tilføjede ${qty} × ${name}`)
  draftName.value = ''
  draftQty.value = 1
  draftWeight.value = 0
  draftKind.value = 'gear'
}

// ---------- Mønter ----------

const coins = computed(() => coinsOf(store.play, x.value))
const coinCount = computed(() => COIN_KEYS.reduce((s, k) => s + coins.value[k], 0))
const totalGp = computed(() => COIN_KEYS.reduce((s, k) => s + coins.value[k] * GP_VALUE[k], 0))
function setCoin(key: keyof Coins, value: string) {
  const n = Number(value)
  if (value === '' || !Number.isFinite(n)) return
  store.play.coins = { ...coins.value, [key]: n }
}
</script>
