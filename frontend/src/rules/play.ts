// Spilletilstand ved bordet: nuværende HP, brugte ressourcer, conditions osv.
// Holdes adskilt fra draftet (bygget), så tracking aldrig påvirker regelmotorens valg.

import type { Derived, DerivedSpell, Gear } from './engine'
import { ARMOR, WEAPONS } from './data'
import { ITEM_KINDS, findCatalogItem, isArmorId, parseQuantity, type ItemKind } from './items'
import { upcastText } from './spellDetails'

export const CONDITIONS = [
  'Blinded', 'Charmed', 'Deafened', 'Frightened', 'Grappled', 'Incapacitated', 'Invisible',
  'Paralyzed', 'Petrified', 'Poisoned', 'Prone', 'Restrained', 'Stunned', 'Unconscious',
]
export const MAX_EXHAUSTION = 6

export interface Coins { cp: number; sp: number; ep: number; gp: number; pp: number }

export interface RestRecord { type: 'short' | 'long'; at: string }

export const MAX_ATTUNED = 3
export const COINS_PER_POUND = 50

export interface InventoryItem {
  id: string
  name: string
  qty: number
  /** Vægt pr. styk i lb. */
  weight: number
  kind: ItemKind
  /** Våben: vises under angreb. Rustning/skjold/magi: giver AC. */
  equipped: boolean
  attuned: boolean
  /** Magisk bonus: +angreb/damage for våben, +AC for rustning, skjold og magiske genstande. */
  bonus: number
  notes: string
  /** Våbnets navn eller rustningens id i regeldataene. */
  ref?: string
  /** Packs: indhold, der kan pakkes ud. */
  contents?: string[]
}

export interface PlayState {
  /** Nuværende HP; null = fuldt. */
  hp: number | null
  tempHp: number
  /** Brugte ressourcer: ressource-id, 'slot:<level>' for spell slots og 'pact' for pact slots. */
  used: Record<string, number>
  /** Brugte hit dice pr. terningstørrelse, fx { '10': 2 }. */
  hitDiceUsed: Record<string, number>
  deathSaves: { successes: number; failures: number }
  conditions: string[]
  exhaustion: number
  inspiration: boolean
  /** Navnet på den spell, der holdes concentration på. */
  concentration: string | null
  /** null = brug startguldet fra udstyret. */
  coins: Coins | null
  /** Ældre felt: ekstra våben fra før inventory fandtes – flyttes ind i items. */
  extraWeapons: string[]
  /** Inventory; null = endnu ikke oprettet (startudstyret bruges). */
  items: InventoryItem[] | null
  /** Fri tekst om udstyr (noter, loot der ikke er registreret). */
  inventory: string
  notes: string
  lastRest: RestRecord | null
  /** Short rests siden sidste long rest. */
  shortRests: number
  /** Arkets kolonner med panel-id'er; null = standardlayout. */
  layout: string[][] | null
  /** Kolonnelayout for de øvrige faner (fx 'udstyr', 'spells'); mangler en fane, bruges standarden. */
  tabLayouts: Record<string, string[][]>
  /** Seneste handlinger, så spilleren kan se hvad der blev brugt (nyeste først). */
  log: string[]
}

export function emptyPlay(): PlayState {
  return {
    hp: null, tempHp: 0, used: {}, hitDiceUsed: {},
    deathSaves: { successes: 0, failures: 0 },
    conditions: [], exhaustion: 0, inspiration: false, concentration: null,
    coins: null, extraWeapons: [], items: null, inventory: '', notes: '',
    lastRest: null, shortRests: 0, layout: null, tabLayouts: {}, log: [],
  }
}

export const slotKey = (level: number) => `slot:${level}`
export const PACT_KEY = 'pact'
const LOG_SIZE = 8

/** Alle sporbare ressourcer inkl. spell slots, med max og hvornår de genvindes. */
export function trackables(x: Derived): { id: string; max: number; reset: 'short' | 'long'; shortRegain?: number }[] {
  const out: { id: string; max: number; reset: 'short' | 'long'; shortRegain?: number }[] = x.resources.map(r => ({ id: r.id, max: r.max, reset: r.reset, shortRegain: r.shortRegain }))
  x.spellcasting?.slots.forEach((max, i) => out.push({ id: slotKey(i + 1), max, reset: 'long' }))
  if (x.spellcasting?.pact) out.push({ id: PACT_KEY, max: x.spellcasting.pact.count, reset: 'short' })
  return out
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)))

/** Holder tallene inden for karakterens aktuelle grænser (fx efter level-up eller ny klasse). */
export function sanitizePlay(input: Partial<PlayState> | null | undefined, x: Derived): PlayState {
  const raw = (input ? JSON.parse(JSON.stringify(input)) : {}) as Partial<PlayState> & { hitDiceUsed?: unknown }
  // Ældre tilstand talte brugte hit dice som ét tal – det lægges på den største terning
  if (typeof raw.hitDiceUsed === 'number') raw.hitDiceUsed = x.hitDice[0] ? { [x.hitDice[0].die]: raw.hitDiceUsed } : {}
  const p: PlayState = { ...emptyPlay(), ...raw } as PlayState
  const maxHp = x.hp
  p.hp = p.hp === null || !Number.isFinite(p.hp) || p.hp >= maxHp ? null : clamp(p.hp, 0, maxHp)
  p.tempHp = clamp(p.tempHp || 0, 0, 999)
  const used: Record<string, number> = {}
  for (const t of trackables(x)) {
    const n = clamp(p.used?.[t.id] ?? 0, 0, t.max)
    if (n) used[t.id] = n
  }
  p.used = used
  const dice: Record<string, number> = {}
  for (const { die, count } of x.hitDice) {
    const n = clamp((p.hitDiceUsed as Record<string, number>)?.[die] ?? 0, 0, count)
    if (n) dice[die] = n
  }
  p.hitDiceUsed = dice
  p.deathSaves = { successes: clamp(p.deathSaves?.successes ?? 0, 0, 3), failures: clamp(p.deathSaves?.failures ?? 0, 0, 3) }
  p.conditions = [...new Set((p.conditions ?? []).filter(c => CONDITIONS.includes(c)))]
  p.exhaustion = clamp(p.exhaustion || 0, 0, MAX_EXHAUSTION)
  p.inspiration = !!p.inspiration
  p.concentration = typeof p.concentration === 'string' && p.concentration ? p.concentration : null
  if (p.coins) {
    const c = p.coins
    p.coins = { cp: clamp(c.cp || 0, 0, 1e7), sp: clamp(c.sp || 0, 0, 1e7), ep: clamp(c.ep || 0, 0, 1e7), gp: clamp(c.gp || 0, 0, 1e7), pp: clamp(c.pp || 0, 0, 1e7) }
  }
  p.items = Array.isArray(p.items) ? sanitizeItems(p.items) : null
  p.extraWeapons = p.items ? [] : [...new Set(p.extraWeapons ?? [])]
  p.inventory = String(p.inventory ?? '')
  p.notes = String(p.notes ?? '')
  p.lastRest = p.lastRest && (p.lastRest.type === 'short' || p.lastRest.type === 'long') ? { type: p.lastRest.type, at: String(p.lastRest.at) } : null
  p.shortRests = clamp(p.shortRests || 0, 0, 99)
  p.layout = sanitizeLayout(p.layout)
  p.tabLayouts = Object.fromEntries(Object.entries(p.tabLayouts && typeof p.tabLayouts === 'object' ? p.tabLayouts : {})
    .map(([tab, l]) => [tab, sanitizeLayout(l)] as const)
    .filter((e): e is [string, string[][]] => !!e[1]))
  p.log = (Array.isArray(p.log) ? p.log : []).filter(l => typeof l === 'string').slice(0, LOG_SIZE)
  return p
}

function sanitizeLayout(l: unknown): string[][] | null {
  return Array.isArray(l) && l.every(c => Array.isArray(c)) ? l.map((c: unknown[]) => c.filter((id): id is string => typeof id === 'string')) : null
}

const withLog = (p: PlayState, entry: string): PlayState => ({ ...p, log: [entry, ...p.log].slice(0, LOG_SIZE) })
export const addLog = withLog

// ---------- Inventory ----------

export const newItemId = () => Math.random().toString(36).slice(2, 10)

/** Én rustning og ét skjold ad gangen; højst tre attunede genstande. */
function sanitizeItems(items: Partial<InventoryItem>[]): InventoryItem[] {
  let armorOn = false, shieldOn = false, attuned = 0
  return items.filter(i => i && typeof i.name === 'string').map(i => {
    const kind = ITEM_KINDS.some(k => k.id === i.kind) ? i.kind! : 'gear'
    let equipped = !!i.equipped
    if (equipped && kind === 'armor') { equipped = !armorOn; armorOn = true }
    if (equipped && kind === 'shield') { equipped = !shieldOn; shieldOn = true }
    const isAttuned = !!i.attuned && attuned < MAX_ATTUNED
    if (isAttuned) attuned++
    return {
      id: String(i.id || newItemId()), name: i.name!.slice(0, 120), kind, equipped, attuned: isAttuned,
      qty: clamp(Number(i.qty) || 0, 0, 9999),
      weight: Math.max(0, Math.round((Number(i.weight) || 0) * 100) / 100),
      bonus: clamp(Number(i.bonus) || 0, 0, 5),
      notes: String(i.notes ?? '').slice(0, 500),
      ...(i.ref ? { ref: String(i.ref) } : {}),
      ...(Array.isArray(i.contents) && i.contents.length ? { contents: i.contents.map(String) } : {}),
    }
  })
}

/** Opretter en genstand fra en tekst som '4 Handaxes' – med vægt og type fra kataloget, hvis den findes. */
export function itemFromText(text: string, equipDefaults = true): InventoryItem {
  const { qty, name } = parseQuantity(text)
  const hit = findCatalogItem(name)
  const kind = hit?.kind ?? 'gear'
  // '2 Daggers' → 'Dagger', men 'Arcane Focus (Quarterstaff)' beholder sit navn
  const plural = !!hit && name.toLowerCase().replace(/e?s$/, '') === hit.name.toLowerCase()
  return {
    id: newItemId(), name: plural ? hit!.name : name, qty, weight: hit?.weight ?? 0, kind,
    equipped: equipDefaults && (kind === 'weapon' || kind === 'armor' || kind === 'shield'),
    attuned: false, bonus: 0, notes: hit?.note ?? '',
    ...(hit?.ref ? { ref: hit.ref } : {}), ...(hit?.contents ? { contents: hit.contents } : {}),
  }
}

/** Inventory ud fra startudstyret (og ældre ekstra-våben). Ens genstande lægges sammen. */
export function startingItems(x: Derived, extraWeapons: string[] = []): InventoryItem[] {
  const out: InventoryItem[] = []
  for (const text of [...x.equipment, ...extraWeapons]) {
    const item = itemFromText(text)
    const same = out.find(o => o.name === item.name && o.kind === item.kind)
    if (same) same.qty += item.qty
    else out.push(item)
  }
  return sanitizeItems(out)
}

/** Det udrustede, som regelmotoren bruger til AC og angreb. */
export function gearFromItems(items: InventoryItem[]): Gear {
  const armor = items.find(i => i.kind === 'armor' && i.equipped && isArmorId(i.ref))
  const shield = items.find(i => i.kind === 'shield' && i.equipped)
  return {
    armor: armor ? { id: armor.ref as keyof typeof ARMOR, bonus: armor.bonus } : null,
    shield: shield ? { bonus: shield.bonus } : null,
    weapons: items
      .filter(i => i.kind === 'weapon' && i.equipped && i.qty > 0 && WEAPONS.some(w => w.name === i.ref))
      .map(i => ({ name: i.ref!, label: `${i.name}${i.bonus && !i.name.includes(`+${i.bonus}`) ? ` +${i.bonus}` : ''}`, bonus: i.bonus })),
    acBonus: items.filter(i => i.kind === 'magic' && i.equipped && i.bonus).reduce((s, i) => s + i.bonus, 0),
  }
}

export const coinsOf = (p: PlayState, x: Derived): Coins => p.coins ?? { cp: 0, sp: 0, ep: 0, gp: x.gold, pp: 0 }

/** Samlet vægt af genstande og mønter i lb. */
export function carriedWeight(p: PlayState, x: Derived, items: InventoryItem[]): number {
  const c = coinsOf(p, x)
  const coins = (c.cp + c.sp + c.ep + c.gp + c.pp) / COINS_PER_POUND
  return Math.round((items.reduce((s, i) => s + i.qty * i.weight, 0) + coins) * 10) / 10
}

/** Pakker en pack ud til enkelte genstande. */
export function unpackItem(items: InventoryItem[], id: string): InventoryItem[] {
  const target = items.find(i => i.id === id)
  if (!target?.contents) return items
  const added = target.contents.map(c => itemFromText(c, false))
  const rest = items.filter(i => i.id !== id)
  for (const item of added) {
    const same = rest.find(o => o.name === item.name && o.kind === item.kind)
    if (same) same.qty += item.qty
    else rest.push(item)
  }
  return rest
}

export const currentHp = (p: PlayState, x: Derived) => p.hp ?? x.hp
export const hitDiceLeft = (p: PlayState, die: number, count: number) => count - (p.hitDiceUsed[die] ?? 0)

/** Skade rammer temp HP først; på 0 HP starter death saves. */
export function takeDamage(p: PlayState, x: Derived, amount: number): PlayState {
  const fromTemp = Math.min(p.tempHp, amount)
  const hp = Math.max(0, currentHp(p, x) - (amount - fromTemp))
  return withLog({ ...p, tempHp: p.tempHp - fromTemp, hp }, `Tog ${amount} skade`)
}

/** Healing fra 0 HP nulstiller death saves. */
export function heal(p: PlayState, x: Derived, amount: number): PlayState {
  const hp = Math.min(x.hp, currentHp(p, x) + amount)
  return { ...p, hp: hp >= x.hp ? null : hp, deathSaves: hp > 0 ? { successes: 0, failures: 0 } : p.deathSaves }
}

/** Brug en hit die under en short rest: heal slaget + CON (min. 0). */
export function spendHitDie(p: PlayState, x: Derived, die: number, roll: number): PlayState {
  const pool = x.hitDice.find(h => h.die === die)
  if (!pool || hitDiceLeft(p, die, pool.count) <= 0) return p
  const healed = Math.max(0, roll + x.mods.con)
  return withLog({ ...heal(p, x, healed), hitDiceUsed: { ...p.hitDiceUsed, [die]: (p.hitDiceUsed[die] ?? 0) + 1 } }, `Brugte en d${die} hit die (+${healed} HP)`)
}

export function shortRest(p: PlayState, x: Derived): PlayState {
  const used = { ...p.used }
  for (const t of trackables(x)) {
    if (t.reset === 'short') delete used[t.id]
    else if (t.shortRegain && used[t.id]) used[t.id] = Math.max(0, used[t.id] - t.shortRegain)
  }
  return withLog({ ...p, used, lastRest: { type: 'short', at: new Date().toISOString() }, shortRests: p.shortRests + 1 }, 'Short rest')
}

/** Long rest: fuld HP, alle ressourcer og hit dice tilbage, og ét niveau exhaustion mindre. */
export function longRest(p: PlayState): PlayState {
  return withLog({
    ...p, hp: null, tempHp: 0, used: {}, hitDiceUsed: {},
    deathSaves: { successes: 0, failures: 0 },
    exhaustion: Math.max(0, p.exhaustion - 1), concentration: null,
    lastRest: { type: 'long', at: new Date().toISOString() }, shortRests: 0,
  }, 'Long rest')
}

// ---------- Casting ----------

export type CastOption =
  | { kind: 'cantrip' }
  | { kind: 'slot'; level: number; left: number }
  | { kind: 'pact'; level: number; left: number }
  | { kind: 'free'; resource: string; left: number }
  | { kind: 'ritual' }

/** De måder en spell kan castes på lige nu – kun muligheder med noget tilbage. */
export function castOptions(p: PlayState, x: Derived, s: DerivedSpell): CastOption[] {
  if (s.spell.level === 0) return [{ kind: 'cantrip' }]
  const out: CastOption[] = []
  if (s.freeResource) {
    const r = x.resources.find(res => res.id === s.freeResource)
    const left = r ? r.max - (p.used[r.id] ?? 0) : 0
    if (left > 0) out.push({ kind: 'free', resource: s.freeResource, left })
  }
  if (s.slotless) return out
  // "Kun i spellbook" og Pact of the Tome-ritualer kan kun castes som ritual
  const ritualOnly = s.tag === 'Kun i spellbook' || s.tag === 'Kun som ritual'
  if (!ritualOnly) {
    x.spellcasting?.slots.forEach((max, i) => {
      const left = max - (p.used[slotKey(i + 1)] ?? 0)
      if (i + 1 >= s.spell.level && left > 0) out.push({ kind: 'slot', level: i + 1, left })
    })
    const pact = x.spellcasting?.pact
    if (pact && pact.level >= s.spell.level) {
      const left = pact.count - (p.used[PACT_KEY] ?? 0)
      if (left > 0) out.push({ kind: 'pact', level: pact.level, left })
    }
  }
  if (s.spell.ritual) out.push({ kind: 'ritual' })
  return out
}

/** Knaptekst; tallet i parentes er hvor mange der er tilbage. */
export const castOptionLabel = (o: CastOption) =>
  o.kind === 'cantrip' ? 'Cast'
    : o.kind === 'slot' ? `Level ${o.level} (${o.left})`
    : o.kind === 'pact' ? `Pact L${o.level} (${o.left})`
    : o.kind === 'free' ? `Gratis (${o.left})`
    : 'Ritual (+10 min)'

/** Caster en spell: bruger slot/ressource og sætter concentration. */
export function castSpell(p: PlayState, s: DerivedSpell, o: CastOption): PlayState {
  const used = { ...p.used }
  if (o.kind === 'slot') used[slotKey(o.level)] = (used[slotKey(o.level)] ?? 0) + 1
  if (o.kind === 'pact') used[PACT_KEY] = (used[PACT_KEY] ?? 0) + 1
  if (o.kind === 'free') used[o.resource] = (used[o.resource] ?? 0) + 1
  const castLevel = o.kind === 'slot' || o.kind === 'pact' ? o.level : s.spell.level
  const upcast = castLevel > s.spell.level ? upcastText(s.spell, castLevel) : null
  const how = (o.kind === 'slot' ? ` (level ${o.level}-slot` : o.kind === 'pact' ? ` (pact slot, level ${o.level}` : o.kind === 'free' ? ' (gratis' : o.kind === 'ritual' ? ' (ritual' : '')
    + (upcast ? `: ${upcast}` : '') + (o.kind === 'cantrip' ? '' : ')')
  const dropped = s.spell.concentration && p.concentration && p.concentration !== s.spell.name ? ` – ${p.concentration} sluttede` : ''
  return withLog({ ...p, used, concentration: s.spell.concentration ? s.spell.name : p.concentration }, `Castede ${s.spell.name}${how}${dropped}`)
}

/** Bruger én af en ressource (fx Second Wind) og logger det. */
export function useResource(p: PlayState, id: string, name: string, used: number): PlayState {
  const before = p.used[id] ?? 0
  const next = { ...p, used: { ...p.used, [id]: used } }
  return used > before ? withLog(next, `Brugte ${name}`) : next
}
