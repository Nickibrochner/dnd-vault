// Genstandskatalog til inventory: våben, rustning og almindeligt eventyrudstyr (2024-reglerne, vægt i lb.).
// Bruges til at oprette inventory fra startudstyret og til at tilføje nye genstande.

import { ARMOR, SHIELD_WEIGHT, WEAPONS, type ArmorId } from './data'

export type ItemKind = 'weapon' | 'armor' | 'shield' | 'gear' | 'consumable' | 'treasure' | 'magic'

export const ITEM_KINDS: { id: ItemKind; name: string }[] = [
  { id: 'weapon', name: 'Våben' },
  { id: 'armor', name: 'Rustning' },
  { id: 'shield', name: 'Skjold' },
  { id: 'magic', name: 'Magiske genstande' },
  { id: 'consumable', name: 'Forbrugsvarer' },
  { id: 'gear', name: 'Udstyr' },
  { id: 'treasure', name: 'Skatte' },
]

export interface CatalogItem {
  name: string
  kind: ItemKind
  weight: number
  /** Våbnets eller rustningens navn i regeldataene. */
  ref?: string
  /** Indhold for packs, som kan pakkes ud. */
  contents?: string[]
  note?: string
}

const WEAPON_WEIGHT: Record<string, number> = {
  Club: 2, Dagger: 1, Greatclub: 10, Handaxe: 2, Javelin: 2, 'Light Hammer': 2, Mace: 4, Quarterstaff: 4, Sickle: 2, Spear: 3,
  Dart: 0.25, 'Light Crossbow': 5, Shortbow: 2, Sling: 0, Battleaxe: 4, Flail: 2, Glaive: 6, Greataxe: 7, Greatsword: 6,
  Halberd: 6, Lance: 6, Longsword: 3, Maul: 10, Morningstar: 4, Pike: 18, Rapier: 2, Scimitar: 3, Shortsword: 2, Trident: 4,
  Warhammer: 5, 'War Pick': 2, Whip: 3, Blowgun: 1, 'Hand Crossbow': 3, 'Heavy Crossbow': 18, Longbow: 2, Musket: 10, Pistol: 3,
}

const gear = (name: string, weight: number, kind: ItemKind = 'gear', note?: string): CatalogItem => ({ name, kind, weight, note })
const pack = (name: string, weight: number, contents: string[]): CatalogItem => ({ name, kind: 'gear', weight, contents })

export const GEAR: CatalogItem[] = [
  pack("Burglar's Pack", 42, ['Backpack', 'Ball Bearings', 'Bell', '10 Candles', 'Crowbar', 'Hooded Lantern', '7 Oil', '5 Rations', 'Rope', 'Tinderbox', 'Waterskin']),
  pack("Diplomat's Pack", 39, ['Chest', 'Fine Clothes', 'Ink', '5 Ink Pens', 'Lamp', '2 Map or Scroll Cases', '4 Oil', '5 Paper', '5 Parchment', 'Perfume', 'Tinderbox']),
  pack("Dungeoneer's Pack", 55, ['Backpack', 'Caltrops', 'Crowbar', '2 Oil', '10 Rations', 'Rope', 'Tinderbox', '10 Torches', 'Waterskin']),
  pack("Entertainer's Pack", 58, ['Backpack', 'Bedroll', 'Bell', 'Bullseye Lantern', '3 Costumes', 'Mirror', '8 Oil', '9 Rations', 'Tinderbox', 'Waterskin']),
  pack("Explorer's Pack", 55, ['Backpack', 'Bedroll', '2 Oil', '10 Rations', 'Rope', 'Tinderbox', '10 Torches', 'Waterskin']),
  pack("Priest's Pack", 29, ['Backpack', 'Blanket', 'Holy Water', 'Lamp', '7 Rations', 'Robe', 'Tinderbox']),
  pack("Scholar's Pack", 22, ['Backpack', 'Book', 'Ink', 'Ink Pen', 'Lamp', '10 Oil', '10 Parchment', 'Tinderbox']),
  gear('Arrows', 0.05, 'gear', '20 pr. quiver'), gear('Bolts', 0.075, 'gear', '20 pr. case'), gear('Sling Bullets', 0.075), gear('Needles', 0.02),
  gear('Acid', 1, 'consumable'), gear("Alchemist's Fire", 1, 'consumable'), gear('Antitoxin', 0, 'consumable'), gear('Holy Water', 1, 'consumable'),
  gear('Oil', 1, 'consumable'), gear('Rations', 2, 'consumable'), gear('Torches', 1, 'consumable'), gear('Candles', 0, 'consumable'),
  gear('Potion of Healing', 0.5, 'consumable', 'Hel 2d4 + 2'), gear('Potion of Greater Healing', 0.5, 'magic', 'Hel 4d4 + 4'),
  gear('Potion of Superior Healing', 0.5, 'magic', 'Hel 8d4 + 8'), gear('Potion of Supreme Healing', 0.5, 'magic', 'Hel 10d4 + 20'),
  gear('Spell Scroll', 0, 'magic'), gear('Poison (Basic)', 0, 'consumable'), gear('Ball Bearings', 2), gear('Caltrops', 2),
  gear('Backpack', 5), gear('Bedroll', 7), gear('Bell', 0), gear('Blanket', 3), gear('Book', 5), gear('Bottle', 2), gear('Bucket', 2),
  gear('Chain', 10), gear('Chest', 25), gear("Climber's Kit", 12), gear('Costume', 4), gear('Costumes', 4), gear('Crowbar', 5),
  gear('Fine Clothes', 6), gear('Flask', 1), gear('Grappling Hook', 4), gear("Healer's Kit", 3), gear('Holy Symbol', 1),
  gear('Arcane Focus', 1), gear('Druidic Focus', 1), gear('Hooded Lantern', 2), gear('Bullseye Lantern', 2), gear('Ink', 0), gear('Ink Pen', 0),
  gear('Lamp', 1), gear('Manacles', 6), gear('Map', 0), gear('Map or Scroll Cases', 1), gear('Mirror', 0.5), gear('Paper', 0), gear('Parchment', 0),
  gear('Perfume', 0), gear('Piton', 0.25), gear('Pole', 7), gear('Pouch', 1), gear('Pouches', 1), gear('Quiver', 1), gear('Robe', 4), gear('Rope', 5),
  gear('Sack', 0.5), gear('Shovel', 5), gear('Signal Whistle', 0), gear('Spellbook', 3), gear('Spyglass', 1), gear('Tent', 20),
  gear('Tinderbox', 1), gear("Traveler's Clothes", 4), gear('Waterskin', 5), gear('Iron Pot', 10), gear('Musical Instrument', 3),
  gear("Thieves' Tools", 1), gear('Forgery Kit', 5), gear('Disguise Kit', 3), gear('Herbalism Kit', 3), gear("Poisoner's Kit", 2),
  gear("Navigator's Tools", 2), gear("Calligrapher's Supplies", 5), gear("Carpenter's Tools", 6), gear("Cartographer's Tools", 6),
  gear("Artisan's Tools", 5), gear('Gaming Set', 0), gear('Sickle', 2),
]

export const CATALOG: CatalogItem[] = [
  ...WEAPONS.map(w => ({ name: w.name, kind: 'weapon' as const, weight: WEAPON_WEIGHT[w.name] ?? 0, ref: w.name })),
  ...Object.entries(ARMOR).map(([id, a]) => ({ name: a.name, kind: 'armor' as const, weight: a.weight, ref: id })),
  { name: 'Shield', kind: 'shield', weight: SHIELD_WEIGHT },
  ...GEAR.filter(g => !WEAPONS.some(w => w.name === g.name)),
]

/** Slår et navn op i kataloget; tåler flertal ('2 Daggers') og tilføjelser i parentes. */
export function findCatalogItem(name: string): CatalogItem | undefined {
  const clean = name.trim().toLowerCase()
  // 'Arcane Focus (Quarterstaff)' er både focus og våben – våbnet tæller, så det kan bruges til angreb
  const inner = clean.match(/\((.*)\)/)?.[1]
  const weapon = inner && CATALOG.find(i => i.kind === 'weapon' && i.name.toLowerCase() === inner)
  if (weapon) return weapon
  const bare = clean.replace(/\s*\(.*\)$/, '')
  const candidates = [clean, bare, bare.replace(/es$/, ''), bare.replace(/s$/, '')]
  for (const c of candidates) {
    const hit = CATALOG.find(i => i.name.toLowerCase() === c)
    if (hit) return hit
  }
}

/** Splitter '4 Handaxes' i antal og navn. */
export function parseQuantity(text: string): { qty: number; name: string } {
  const m = text.trim().match(/^(\d+)\s+(.*)$/)
  return m ? { qty: Number(m[1]), name: m[2] } : { qty: 1, name: text.trim() }
}

export const isArmorId = (id: string | undefined): id is ArmorId => !!id && id in ARMOR
