// Regelmotor for karakterer på level 1–20, også med multiclass. Rene funktioner: draft (brugerens valg) ind → afledte værdier ud.
// Intet her må have side effects, så det kan genbruges i både UI, autosave og tests.

import {
  ABILITIES, ALL_SKILLS, ARMOR, BACKGROUNDS, BACKGROUND_GOLD_OPTION, CLASSES, SKILLS, SPECIES,
  STANDARD_LANGUAGES, TOOLS, WEAPONS, martialArtsDie,
  type Ability, type ArmorTraining, type Background, type ChoiceDef, type ChoiceOption, type DndClass, type Feat,
  type ArmorId, type FeatureCtx, type OptionEffects, type Size, type SkillId, type Species, type ToolGroup, type Weapon,
  SHIELD_AC, abilityShort,
} from './data'
import { ALL_FEATS, ASI_FEAT_ID, featCategory } from './feats'
import {
  BLESSED_WARRIOR, DRUIDIC_WARRIOR, FREE_CASTS, MAX_LEVEL, MULTICLASS, MYSTIC_ARCANUM, PROGRESSION, pactSlots,
  proficiencyBonus, slotTable,
  type CasterType, type ClassProgression, type LevelFeature, type PickGrant, type PickOption, type Resource,
} from './progression'
import { SPELLS, findSpell, spellsFor, spellsUpTo, type Spell, type SpellLevel } from './spells'
import { SUBCLASS_LEVEL, findSubclass, type Subclass } from './subclasses'

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8]
export const POINT_BUY_BUDGET = 27
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
export const MANUAL_MIN = 3
export const MANUAL_MAX = 18
export const ABILITY_CAP = 20
export const BONUS_LANGUAGES = 2
export const MULTICLASS_MIN_SCORE = 13

export type AbilityMethod = 'standard' | 'pointbuy' | 'manual'
export type BonusMode = '2-1' | '1-1-1'

/** Valgene for ét level over 1 (index 0 i draft.levels = level 2). */
export interface LevelUp {
  /** Klassen der får levelet; null = startklassen. */
  classId: string | null
  /** HP-slag for levelet; null = fast gennemsnit. */
  hpRoll: number | null
  /** Feat på ASI-levels – ASI_FEAT_ID for Ability Score Improvement. */
  featId: string | null
  /** Evner der hæves: ASI = to (samme to gange = +2), feats med forøgelse = én. */
  abilities: Ability[]
}

export interface CharacterDraft {
  name: string
  alignment: string
  speciesId: string | null
  size: Size | null
  speciesChoices: Record<string, string>
  speciesFeatId: string | null
  /** Startklassen (level 1). */
  classId: string | null
  /**
   * Klassernes enkeltvalg, fx 'fightingStyle', 'blessedStrikes', 'land'. Startklassens valg har
   * valg-id'et som nøgle; multiclass-klassers valg præfikses med klassen, fx 'paladin.fightingStyle'.
   */
  classChoices: Record<string, string>
  /** Startklassens subclass. */
  subclassId: string | null
  /** Subclasses for multiclass-klasser, nøglet med klasse-id. */
  subclasses: Record<string, string>
  /** Flervalg der vokser med level, fx 'invocations', 'metamagic', 'maneuvers'. */
  classPicks: Record<string, string[]>
  backgroundId: string | null
  abilityMethod: AbilityMethod
  baseScores: Record<Ability, number | null>
  bonusMode: BonusMode
  bonusPlus2: Ability | null
  bonusPlus1: Ability | null
  /** Skill-valg pr. kilde, fx 'class', 'species', 'feat:background', 'prog:3', 'mc:rogue'. */
  skillPicks: Record<string, SkillId[]>
  /** Expertise-valg pr. kilde, fx 'class', 'prog:2', 'feat:level:8'. */
  expertisePicks: Record<string, SkillId[]>
  /** Værktøjs-valg pr. kilde, fx 'class', 'background', 'feat:background'. */
  toolPicks: Record<string, string[]>
  languages: string[]
  weaponMasteries: string[]
  /** Spell-valg pr. slot, fx 'class:cantrips', 'class:spellbook', 'wizard:prepared', 'feat:background:spell'. */
  spellPicks: Record<string, string[]>
  /** Valgt spellcasting-evne for feats, fx { 'feat:background': 'wis' } for Magic Initiate. */
  spellAbilities: Record<string, Ability>
  /** Nøglet med klasse/baggrund (fx 'fighter:A'), så valget nulstilles når de skiftes. */
  classEquipment: string | null
  backgroundEquipment: string | null
  levels: LevelUp[]
  completed: boolean
}

export const equipmentKey = (ownerId: string, optionId: string) => `${ownerId}:${optionId}`

const nullScores = (): Record<Ability, number | null> =>
  ({ str: null, dex: null, con: null, int: null, wis: null, cha: null })

export function emptyDraft(): CharacterDraft {
  return {
    name: '', alignment: '',
    speciesId: null, size: null, speciesChoices: {}, speciesFeatId: null,
    classId: null, classChoices: {}, subclassId: null, subclasses: {}, classPicks: {},
    backgroundId: null,
    abilityMethod: 'standard', baseScores: nullScores(),
    bonusMode: '2-1', bonusPlus2: null, bonusPlus1: null,
    skillPicks: {}, expertisePicks: {}, toolPicks: {}, languages: [], weaponMasteries: [],
    spellPicks: {}, spellAbilities: {},
    classEquipment: null, backgroundEquipment: null,
    levels: [],
    completed: false,
  }
}

export const emptyLevelUp = (classId: string | null = null): LevelUp => ({ classId, hpRoll: null, featId: null, abilities: [] })

// ---------- Opslag ----------

export const findSpecies = (id: string | null) => SPECIES.find(s => s.id === id)
export const findClass = (id: string | null) => CLASSES.find(c => c.id === id)
export const findBackground = (id: string | null) => BACKGROUNDS.find(b => b.id === id)
export const findFeat = (id: string | null) => ALL_FEATS.find(f => f.id === id)

export const characterLevel = (d: CharacterDraft) => Math.min(MAX_LEVEL, 1 + d.levels.length)
/** Startklassens progression. */
export const progressionOf = (d: CharacterDraft) => (d.classId ? PROGRESSION[d.classId] : undefined)

// ---------- Klasser og levels ----------

/** Hvilken klasse hvert karakterlevel gik til (index 0 = level 1) og klassens level efter det. */
export function levelTimeline(d: CharacterDraft): { classId: string; classLevel: number }[] {
  if (!d.classId) return []
  const counts: Record<string, number> = {}
  const ids = [d.classId, ...d.levels.slice(0, MAX_LEVEL - 1).map(lu => lu.classId ?? d.classId!)]
  return ids.map(id => ({ classId: id, classLevel: (counts[id] = (counts[id] ?? 0) + 1) }))
}

/** Én klasse i karakterens build med dens nuværende klasselevel. */
export interface ClassEntry {
  cls: DndClass
  level: number
  primary: boolean
  prog?: ClassProgression
  /** Aktiv subclass (fra klasselevel 3). */
  sub?: Subclass
  /** Karakterlevel hvor klassen blev taget. */
  joinedAt: number
}

export const subclassIdOf = (d: CharacterDraft, classId: string) =>
  (classId === d.classId ? d.subclassId : d.subclasses[classId]) ?? null

export function classEntries(d: CharacterDraft, upToLevel = characterLevel(d)): ClassEntry[] {
  const out: ClassEntry[] = []
  levelTimeline(d).slice(0, upToLevel).forEach(({ classId, classLevel }, i) => {
    const cls = findClass(classId)
    if (!cls) return
    const existing = out.find(e => e.cls.id === classId)
    if (existing) existing.level = classLevel
    else out.push({ cls, level: classLevel, primary: classId === d.classId, prog: PROGRESSION[classId], joinedAt: i + 1 })
  })
  for (const e of out) {
    const sub = findSubclass(subclassIdOf(d, e.cls.id))
    if (sub && sub.classId === e.cls.id && e.level >= SUBCLASS_LEVEL) e.sub = sub
  }
  return out
}

export const classLevelOf = (d: CharacterDraft, classId: string) => classEntries(d).find(e => e.cls.id === classId)?.level ?? 0

/** Startklassens subclass, hvis den er aktiv. */
export const activeSubclass = (d: CharacterDraft) => classEntries(d).find(e => e.primary)?.sub

/** Nøgle i draft.classChoices for et valg hos en klasse. */
export const choiceKey = (e: { primary: boolean; cls: DndClass }, id: string) => (e.primary ? id : `${e.cls.id}.${id}`)
/** Præfiks for nøgler, der ellers kunne kollidere mellem klasser (ressourcer, skill-slots). */
const keyPrefix = (e: ClassEntry) => (e.primary ? '' : `${e.cls.id}:`)
/** Præfiks for klassens spell-slots: 'class' for startklassen, ellers klasse-id. */
const spellPrefix = (e: ClassEntry) => (e.primary ? 'class' : e.cls.id)

const featureText = (f: { text: string | ((ctx: FeatureCtx) => string) }, ctx: FeatureCtx) =>
  typeof f.text === 'function' ? f.text(ctx) : f.text

/** Klasse- og subclass-features op til og med et karakterlevel; `level` er karakterlevelet de kom på. */
export function classFeaturesUpTo(d: CharacterDraft, upToLevel = characterLevel(d)): { level: number; source: string; feature: LevelFeature; entry: ClassEntry }[] {
  const out: { level: number; source: string; feature: LevelFeature; entry: ClassEntry }[] = []
  const entries = classEntries(d, upToLevel)
  levelTimeline(d).slice(0, upToLevel).forEach(({ classId, classLevel }, i) => {
    const entry = entries.find(e => e.cls.id === classId)
    if (!entry) return
    const features = classLevel === 1 ? entry.cls.features : entry.prog?.features[classLevel] ?? []
    for (const feature of features) out.push({ level: i + 1, source: entry.cls.name, feature, entry })
    for (const feature of entry.sub?.features[classLevel] ?? []) out.push({ level: i + 1, source: entry.sub!.name, feature, entry })
  })
  return out
}

export interface ClassChoice { level: number; key: string; def: ChoiceDef; entry: ClassEntry }

/** Alle enkeltvalg klasserne har låst op: level 1-valg plus valg fra features og subclasses. */
export function classChoiceDefs(d: CharacterDraft): ClassChoice[] {
  const out: ClassChoice[] = []
  for (const entry of classEntries(d)) {
    for (const def of entry.cls.choices ?? []) out.push({ level: entry.joinedAt, key: choiceKey(entry, def.id), def, entry })
  }
  for (const { level, feature, entry } of classFeaturesUpTo(d)) {
    if (feature.choice) out.push({ level, key: choiceKey(entry, feature.choice.id), def: feature.choice, entry })
  }
  return out
}

const chosenOptions = (defs: ChoiceDef[] | undefined, picks: Record<string, string>): ChoiceOption[] =>
  (defs ?? []).flatMap(def => def.options.filter(o => o.id === picks[def.id]))

const chosenClassOption = (d: CharacterDraft, c: ClassChoice) => c.def.options.find(o => o.id === d.classChoices[c.key])

/** Feats karakteren har, med kilde-nøgle (bruges i 'feat:<kilde>'-slots) og visningsnavn. */
export interface OwnedFeat { source: string; label: string; feat: Feat; level: number; ability: Ability | null }

export function featsOf(d: CharacterDraft): OwnedFeat[] {
  const out: OwnedFeat[] = []
  const bg = findBackground(d.backgroundId)
  const bgFeat = findFeat(bg?.feat ?? null)
  if (bg && bgFeat) out.push({ source: 'background', label: `${bg.name} (background)`, feat: bgFeat, level: 1, ability: null })
  const sp = findSpecies(d.speciesId)
  const spFeat = sp?.originFeat ? findFeat(d.speciesFeatId) : undefined
  if (sp && spFeat) out.push({ source: 'species', label: `${sp.name} (Versatile)`, feat: spFeat, level: 1, ability: null })
  d.levels.slice(0, characterLevel(d) - 1).forEach((lu, i) => {
    const feat = lu.featId && lu.featId !== ASI_FEAT_ID ? findFeat(lu.featId) : undefined
    if (feat) out.push({ source: `level:${i + 2}`, label: `Level ${i + 2}`, feat, level: i + 2, ability: lu.abilities[0] ?? null })
  })
  return out
}

/** Navn til slots fra et feat: feats fra level-ups får levelet på, så to ens feats kan skelnes. */
const featName = (o: OwnedFeat) => (o.source.startsWith('level:') ? `${o.feat.name} (level ${o.level})` : o.feat.name)

/** Effekter fra én klasses valg, features og skalering. */
function entryEffects(d: CharacterDraft, entry: ClassEntry): OptionEffects[] {
  const choices = classChoiceDefs(d).filter(c => c.entry.cls.id === entry.cls.id)
  return [
    ...choices.flatMap(c => chosenClassOption(d, c)?.effects ?? []),
    ...classFeaturesUpTo(d).filter(f => f.entry.cls.id === entry.cls.id).flatMap(({ feature }) => (feature.effects ? [feature.effects] : [])),
    ...(entry.prog?.scaling ? [entry.prog.scaling(entry.level)] : []),
  ]
}

/** Alle mekaniske effekter fra species, klasser og feats. */
function activeEffects(d: CharacterDraft): OptionEffects[] {
  return [
    ...chosenOptions(findSpecies(d.speciesId)?.choices, d.speciesChoices).flatMap(o => (o.effects ? [o.effects] : [])),
    ...classEntries(d).flatMap(e => entryEffects(d, e)),
    ...featsOf(d).flatMap(({ feat }) => (feat.effects ? [feat.effects] : [])),
  ]
}

// ---------- Ability scores ----------

export const modifier = (score: number) => Math.floor((score - 10) / 2)
export const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)

export function abilityBonuses(d: CharacterDraft): Record<Ability, number> {
  const bonus: Record<Ability, number> = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }
  const bg = findBackground(d.backgroundId)
  if (!bg) return bonus
  if (d.bonusMode === '1-1-1') {
    bg.abilities.forEach(a => (bonus[a] += 1))
  } else {
    if (d.bonusPlus2) bonus[d.bonusPlus2] += 2
    if (d.bonusPlus1) bonus[d.bonusPlus1] += 1
  }
  return bonus
}

/**
 * Ability scores efter alle forøgelser til og med `upToLevel`: baggrund, ASI og feats (max 20),
 * Epic Boons (max 30) og capstones som Primal Champion (max 25).
 */
export function abilityScores(d: CharacterDraft, upToLevel = characterLevel(d)): Record<Ability, number> {
  const bonuses = abilityBonuses(d)
  const scores = {} as Record<Ability, number>
  for (const { key } of ABILITIES) scores[key] = Math.min(ABILITY_CAP, (d.baseScores[key] ?? 10) + bonuses[key])
  d.levels.slice(0, upToLevel - 1).forEach(lu => {
    const feat = findFeat(lu.featId)
    if (!feat) return
    const max = feat.abilityMax ?? ABILITY_CAP
    const raises = lu.featId === ASI_FEAT_ID ? lu.abilities.slice(0, 2) : lu.abilities.slice(0, 1)
    for (const a of raises) scores[a] = Math.min(max, scores[a] + 1)
  })
  for (const { feature } of classFeaturesUpTo(d, upToLevel)) {
    const b = feature.effects?.abilityBonus
    if (!b) continue
    for (const a of b.abilities) scores[a] = Math.max(scores[a], Math.min(b.max, scores[a] + b.amount))
  }
  return scores
}

export function pointBuySpent(scores: Record<Ability, number | null>) {
  return ABILITIES.reduce((sum, { key }) => sum + (POINT_BUY_COST[scores[key] ?? 8] ?? 0), 0)
}

/** PHB-forslaget for klassen, mappet til ability-nøgler. */
export function suggestedScores(cls: DndClass): Record<Ability, number> {
  return Object.fromEntries(ABILITIES.map(({ key }, i) => [key, cls.suggestedArray[i]])) as Record<Ability, number>
}

/** Foreslår +2/+1 ud fra klassens primære evner og PHB-fordelingen. */
export function suggestedBonus(cls: DndClass, bg: Background): { plus2: Ability; plus1: Ability } {
  const suggested = suggestedScores(cls)
  const ranked = [...bg.abilities].sort((a, b) =>
    Number(cls.primary.includes(b)) - Number(cls.primary.includes(a)) || suggested[b] - suggested[a])
  return { plus2: ranked[0], plus1: ranked[1] }
}

/** Opfylder scores kravet for at multiclasse ind i (eller ud af) en klasse? */
export function meetsMulticlassReq(cls: DndClass, scores: Record<Ability, number>) {
  const ok = (a: Ability) => scores[a] >= MULTICLASS_MIN_SCORE
  return MULTICLASS[cls.id]?.primaryAny ? cls.primary.some(ok) : cls.primary.every(ok)
}

const primaryText = (cls: DndClass) => cls.primary.map(abilityShort).join(MULTICLASS[cls.id]?.primaryAny ? ' eller ' : ' og ')

/** Klasser man kan stige i på næste level, med grunden til at en klasse er låst. */
export function levelUpOptions(d: CharacterDraft): { cls: DndClass; blocked?: string }[] {
  const entries = classEntries(d)
  const scores = abilityScores(d)
  return CLASSES.map(cls => {
    if (entries.some(e => e.cls.id === cls.id)) return { cls }
    const missing = [cls, ...entries.map(e => e.cls)].filter(c => !meetsMulticlassReq(c, scores))
    return { cls, blocked: missing.length ? `kræver ${missing.map(c => `${primaryText(c)} ${MULTICLASS_MIN_SCORE} (${c.name})`).join(', ')}` : undefined }
  })
}

// ---------- Skills, værktøj, våben ----------

/** `level` = det karakterlevel valget hører til; wizarden validerer kun level 1, level-up resten. */
export interface SkillSlot { key: string; label: string; count: number; from: SkillId[]; level: number }
export interface ToolSlot { key: string; label: string; count: number; from: string[]; level: number }

export function fixedSkills(d: CharacterDraft): { skill: SkillId; source: string }[] {
  const bg = findBackground(d.backgroundId)
  return bg ? bg.skills.map(skill => ({ skill, source: `${bg.name} (background)` })) : []
}

/** Skills givet af features og feats (fx Implements of Mercy). De fjerner ikke andre valg. */
export function grantedSkills(d: CharacterDraft): SkillId[] {
  return [...new Set(activeEffects(d).flatMap(e => e.skillProficiencies ?? []))]
}

const resolveSkills = (from: SkillId[] | 'any') => (from === 'any' ? ALL_SKILLS : from)

/** Karakterlevelet hvor en klasse nåede et bestemt klasselevel. */
function levelReached(d: CharacterDraft, classId: string, classLevel: number) {
  return levelTimeline(d).findIndex(t => t.classId === classId && t.classLevel === classLevel) + 1
}

export function skillSlots(d: CharacterDraft): SkillSlot[] {
  const slots: SkillSlot[] = []
  const sp = findSpecies(d.speciesId)
  for (const e of classEntries(d)) {
    const p = keyPrefix(e)
    if (e.primary) slots.push({ key: 'class', label: e.cls.skillGrant.label, count: e.cls.skillGrant.count, from: resolveSkills(e.cls.skillGrant.from), level: 1 })
    else if (MULTICLASS[e.cls.id]?.skills) {
      const g = MULTICLASS[e.cls.id].skills!
      slots.push({ key: `mc:${e.cls.id}`, label: `${e.cls.name} (multiclass)`, count: g.count, from: resolveSkills(g.from), level: e.joinedAt })
    }
    for (const g of e.prog?.skills ?? []) {
      if (e.level >= g.level) slots.push({ key: `prog:${p}${g.level}`, label: g.label, count: g.count, from: resolveSkills(g.from), level: levelReached(d, e.cls.id, g.level) })
    }
    for (const g of e.sub?.skills ?? []) {
      if (e.level >= g.level) slots.push({ key: `subclass:${p}${g.level}`, label: g.label, count: g.count, from: resolveSkills(g.from), level: levelReached(d, e.cls.id, g.level) })
    }
  }
  if (sp?.skillGrant) slots.splice(1, 0, { key: 'species', label: sp.skillGrant.label, count: sp.skillGrant.count, from: resolveSkills(sp.skillGrant.from), level: 1 })
  for (const o of featsOf(d)) {
    if (o.feat.skillGrant) slots.push({ key: `feat:${o.source}`, label: `${featName(o)} (feat)`, count: o.feat.skillGrant, from: ALL_SKILLS, level: o.level })
  }
  return slots
}

export function proficientSkills(d: CharacterDraft): Set<SkillId> {
  return new Set([...fixedSkills(d).map(s => s.skill), ...grantedSkills(d), ...Object.values(d.skillPicks).flat()])
}

export interface ExpertiseSlot { key: string; label: string; count: number; from: SkillId[]; level: number }

/** Expertise-valg; kan kun gives til skills, karakteren har proficiency i. */
export function expertiseSlots(d: CharacterDraft): ExpertiseSlot[] {
  const slots: ExpertiseSlot[] = []
  const proficient = [...proficientSkills(d)]
  for (const e of classEntries(d)) {
    const p = keyPrefix(e)
    if (e.cls.expertise) slots.push({ key: e.primary ? 'class' : `class:${e.cls.id}`, label: `Expertise (${e.cls.name})`, count: e.cls.expertise, from: proficient, level: e.joinedAt })
    for (const g of e.prog?.expertise ?? []) {
      if (e.level >= g.level) slots.push({ key: `prog:${p}${g.level}`, label: g.label, count: g.count, from: g.from ? proficient.filter(s => g.from!.includes(s)) : proficient, level: levelReached(d, e.cls.id, g.level) })
    }
  }
  for (const o of featsOf(d)) {
    if (o.feat.expertiseGrant) slots.push({ key: `feat:${o.source}`, label: `Expertise (${featName(o)})`, count: o.feat.expertiseGrant, from: proficient, level: o.level })
  }
  return slots
}

const toolsIn = (groups: ToolGroup[]) => groups.flatMap(g => TOOLS[g])

export function fixedTools(d: CharacterDraft): string[] {
  const bg = findBackground(d.backgroundId)
  const fromClasses = classEntries(d).flatMap(e => (e.primary ? e.cls.tools : MULTICLASS[e.cls.id]?.tools ?? []))
  return [...new Set([...fromClasses, ...(bg && typeof bg.tool === 'string' ? [bg.tool] : [])])]
}

export function toolSlots(d: CharacterDraft): ToolSlot[] {
  const slots: ToolSlot[] = []
  const bg = findBackground(d.backgroundId)
  for (const e of classEntries(d)) {
    const grant = e.primary ? e.cls.toolGrant : MULTICLASS[e.cls.id]?.toolGrant
    if (grant) slots.push({ key: e.primary ? 'class' : `mc:${e.cls.id}`, label: grant.label, count: grant.count, from: toolsIn(grant.from), level: e.joinedAt })
  }
  if (bg && typeof bg.tool !== 'string') slots.push({ key: 'background', label: bg.tool.label, count: bg.tool.count, from: toolsIn(bg.tool.from), level: 1 })
  for (const o of featsOf(d)) {
    const grant = o.feat.toolGrant
    if (grant) slots.push({ key: `feat:${o.source}`, label: o.level > 1 ? `${featName(o)} (feat)` : grant.label, count: grant.count, from: toolsIn(grant.from), level: o.level })
  }
  return slots
}

export const languageCount = (d: CharacterDraft) =>
  BONUS_LANGUAGES + classEntries(d).reduce((s, e) => s + (e.prog?.languages ?? []).filter(g => e.level >= g.level).reduce((n, g) => n + g.count, 0), 0)

function hasMartialTraining(d: CharacterDraft) {
  return activeEffects(d).some(e => e.martialWeapons)
    || classEntries(d).some(e => e.primary ? e.cls.martial === 'all' : !!MULTICLASS[e.cls.id]?.martialWeapons)
}

export function isWeaponProficient(d: CharacterDraft, weapon: Weapon) {
  const cls = findClass(d.classId)
  if (!cls) return false
  if (!weapon.martial) return true
  if (hasMartialTraining(d)) return true
  if (cls.martial === 'finesse-or-light') return !!(weapon.finesse || weapon.light)
  if (cls.martial === 'light') return !!weapon.light
  return false
}

/** Weapon Mastery stakker ikke mellem klasser – den bedste tæller. */
export function weaponMasteryCount(d: CharacterDraft) {
  return Math.max(0, ...classEntries(d).filter(e => e.cls.weaponMastery).map(e => e.prog?.weaponMastery?.[e.level - 1] ?? e.cls.weaponMastery!.count))
}

export function masteryOptions(d: CharacterDraft): string[] {
  const masters = classEntries(d).filter(e => e.cls.weaponMastery)
  if (!masters.length) return []
  const meleeOnly = masters.every(e => e.cls.weaponMastery!.meleeOnly)
  return WEAPONS.filter(w => isWeaponProficient(d, w) && (!meleeOnly || w.melee)).map(w => w.name)
}

export function armorTraining(d: CharacterDraft): ArmorTraining[] {
  const fromClasses = classEntries(d).flatMap(e => (e.primary ? e.cls.armor : MULTICLASS[e.cls.id]?.armor ?? []))
  const all = new Set<ArmorTraining>([...fromClasses, ...activeEffects(d).flatMap(e => e.armor ?? [])])
  return (['light', 'medium', 'heavy', 'shield'] as ArmorTraining[]).filter(a => all.has(a))
}

export function weaponTrainingText(d: CharacterDraft): string {
  const cls = findClass(d.classId)
  if (!cls) return '–'
  if (hasMartialTraining(d)) return 'Simple og Martial'
  if (cls.martial === 'finesse-or-light') return 'Simple; Martial med Finesse eller Light'
  if (cls.martial === 'light') return 'Simple; Martial med Light'
  return 'Simple'
}

/** Fighting Styles fra klassevalg (Fighter, Paladin, Ranger, Champion) og Fighting Style-feats. */
export function fightingStyles(d: CharacterDraft): string[] {
  const fromChoices = classChoiceDefs(d)
    .filter(c => c.def.id === 'fightingStyle' || c.def.id === 'fightingStyle2')
    .map(c => d.classChoices[c.key]).filter(Boolean)
  const fromFeats = featsOf(d).filter(f => featCategory(f.feat) === 'fighting-style').map(f => f.feat.id.replace(/^fs-/, ''))
  return [...fromChoices, ...fromFeats]
}

const hasFightingStyleFeature = (d: CharacterDraft) =>
  classEntries(d).some(e => e.cls.id === 'fighter' || ((e.cls.id === 'paladin' || e.cls.id === 'ranger') && e.level >= 2))

// ---------- Klassernes flervalg (invocations, metamagic, maneuvers) ----------

export interface PickSlot { key: string; label: string; count: number; options: PickOption[] }

/** Level 1-invocationen (valgt i klassetrinnet eller ved multiclass ind i Warlock). */
const firstInvocation = (d: CharacterDraft) => {
  const e = classEntries(d).find(x => x.cls.id === 'warlock')
  return e ? d.classChoices[choiceKey(e, 'invocation')] : undefined
}

export const invocationsOf = (d: CharacterDraft) =>
  [firstInvocation(d), ...(d.classPicks.invocations ?? [])].filter((x): x is string => !!x)

export function pickSlots(d: CharacterDraft): PickSlot[] {
  const first = firstInvocation(d)
  return classEntries(d).flatMap(e => {
    const grants: PickGrant[] = [...(e.prog?.picks ?? []), ...(e.sub?.picks ?? [])]
    return grants.map(g => ({
      key: g.id, label: g.label, count: g.counts[e.level - 1] ?? 0,
      // Level 1-invocationen vælges for sig og kan ikke vælges igen her
      options: g.options.filter(o => (o.minLevel ?? 1) <= e.level && !(g.id === 'invocations' && o.id === first)),
    }))
  }).filter(s => s.count > 0)
}

// ---------- Spellcasting ----------

export const MAGIC_INITIATE_ABILITIES: Ability[] = ['int', 'wis', 'cha']

export interface Caster { ability: Ability; type: CasterType; source: string; level: number; entry: ClassEntry }

/** Alle klasser (eller third caster-subclasses) med Spellcasting eller Pact Magic. */
export function casters(d: CharacterDraft): Caster[] {
  return classEntries(d).flatMap((entry): Caster[] => {
    const sc = entry.cls.spellcasting
    if (sc) return [{ ability: sc.ability, type: entry.prog?.caster ?? 'full', source: entry.cls.name, level: entry.level, entry }]
    if (entry.sub?.spellcasting) return [{ ability: entry.sub.spellcasting.ability, type: 'third', source: entry.sub.name, level: entry.level, entry }]
    return []
  })
}

export const casterOf = (d: CharacterDraft): Caster | undefined => casters(d)[0]

/**
 * Spell slots pr. spell-level (Pact Magic regnes separat). Én caster-klasse bruger sin egen tabel;
 * flere lægges sammen efter multiclass-reglen: fulde levels + halvdelen af Paladin/Ranger (rundet op)
 * + en tredjedel af Eldritch Knight/Arcane Trickster (rundet ned).
 */
export function spellSlotCounts(d: CharacterDraft): number[] {
  const slotted = casters(d).filter(c => c.type !== 'pact')
  if (!slotted.length) return []
  if (slotted.length === 1) return slotTable(slotted[0].type, slotted[0].level)
  const combined = slotted.reduce((s, c) => s + (c.type === 'full' ? c.level : c.type === 'half' ? Math.ceil(c.level / 2) : Math.floor(c.level / 3)), 0)
  return combined ? slotTable('full', Math.min(MAX_LEVEL, combined)) : []
}

/** Højeste spell-level en klasse kan forberede – regnes som om den var eneste klasse. */
const casterMaxLevel = (c: Caster) => (c.type === 'pact' ? pactSlots(c.level).level : slotTable(c.type, c.level).length)

/** Højeste spell-level karakteren kan caste. */
export function maxSpellLevel(d: CharacterDraft): number {
  const pact = casters(d).find(c => c.type === 'pact')
  return Math.max(spellSlotCounts(d).length, pact ? pactSlots(pact.level).level : 0)
}

export interface SpellSlot {
  key: string
  label: string
  /** 0 = cantrips, 1 = spells med level. */
  level: 0 | 1
  count: number
  from: string[]
  /** Valgene skal komme fra en anden slot (Wizard: forberedte spells fra spellbook). */
  subsetOf?: string
  /** Evnen spells fra denne slot castes med – null hvis den endnu ikke er valgt. */
  ability: Ability | null
  /** Nøgle i draft.spellAbilities, hvis brugeren selv vælger evnen. */
  abilityKey?: string
  /** Tag der vises på spells fra denne slot. */
  tag?: string
  /** Ressource der giver et gratis cast af spellen. */
  freeResource?: string
  /** Kan kun castes via freeResource (Mystic Arcanum). */
  slotless?: boolean
}

export interface GrantedSpell {
  spell: string; source: string; ability: Ability | null; alwaysPrepared?: boolean; tag?: string
  freeResource?: string
}

const spellsAtLevel = (table: Record<number, string[]> | undefined, level: number) =>
  Object.entries(table ?? {}).filter(([lvl]) => level >= Number(lvl)).flatMap(([, ids]) => ids)

/** Ressource-id for en klasse – multiclass-klasser får klassepræfiks, så fx to Channel Divinity ikke deler tæller. */
const resourceId = (e: ClassEntry, id: string) => `${keyPrefix(e)}${id}`

/** Spells der følger automatisk med species, klasser, subclasses og feats. */
export function grantedSpells(d: CharacterDraft): GrantedSpell[] {
  const out: GrantedSpell[] = []
  const level = characterLevel(d)
  const sp = findSpecies(d.speciesId)
  if (sp) {
    const ability = sp.spellAbility ?? (d.speciesChoices.castingAbility as Ability | undefined) ?? null
    const options = chosenOptions(sp.choices, d.speciesChoices)
    const ids = [...(sp.spells ?? []), ...options.flatMap(o => [...(o.effects?.spells ?? []), ...spellsAtLevel(o.effects?.spellsAt, level)])]
    for (const spell of ids) {
      const free = d.speciesChoices.lineage === 'forest' && spell === 'speak-with-animals' ? 'speak-with-animals' : undefined
      out.push({ spell, source: sp.name, ability, tag: findSpell(spell)?.level ? '1× gratis pr. long rest' : undefined, freeResource: free })
    }
  }
  const features = classFeaturesUpTo(d)
  for (const e of classEntries(d)) {
    const ability = e.cls.spellcasting?.ability ?? null
    const free = (owner: string, spell: string) => (FREE_CASTS[owner]?.[spell] ? resourceId(e, FREE_CASTS[owner][spell]) : undefined)
    for (const spell of e.cls.spellcasting?.alwaysPrepared ?? []) out.push({ spell, source: e.cls.name, ability, alwaysPrepared: true, freeResource: free(e.cls.id, spell) })
    for (const { feature, source } of features.filter(f => f.entry.cls.id === e.cls.id)) {
      for (const spell of feature.effects?.spells ?? []) out.push({ spell, source, ability, alwaysPrepared: true, freeResource: free(e.cls.id, spell) })
    }
    const sub = e.sub
    if (sub) {
      const subAbility = ability ?? sub.spellcasting?.ability ?? sub.spellAbility ?? 'wis'
      const byChoice = sub.spellsByChoice ? sub.spellsByChoice.table[d.classChoices[choiceKey(e, sub.spellsByChoice.choice)]] : undefined
      for (const spell of [...spellsAtLevel(sub.spells, e.level), ...spellsAtLevel(byChoice, e.level)]) {
        out.push({ spell, source: sub.name, ability: subAbility, alwaysPrepared: true, freeResource: free(sub.id, spell) })
      }
    }
  }
  for (const { feat, label, ability, source } of featsOf(d)) {
    for (const spell of feat.spells ?? []) {
      const leveled = !!findSpell(spell)?.level
      out.push({ spell, source: `${feat.name} (${label})`, ability, tag: leveled ? '1× gratis pr. long rest' : undefined, freeResource: leveled ? `feat-spells:${source}` : undefined })
    }
  }
  // Samme spell fra flere kilder vises kun én gang
  return out.filter((g, i) => out.findIndex(o => o.spell === g.spell) === i)
}

export function spellSlots(d: CharacterDraft): SpellSlot[] {
  const slots: SpellSlot[] = []
  for (const c of casters(d)) {
    const e = c.entry
    const sc = e.cls.spellcasting
    const p = spellPrefix(e)
    const maxLevel = casterMaxLevel(c)
    if (sc) {
      const extra = entryEffects(d, e).reduce((s, x) => s + (x.extraCantrips ?? 0), 0)
      const cantrips = (e.prog?.cantrips?.[e.level - 1] ?? sc.cantrips) + extra
      const prepared = e.prog?.prepared?.[e.level - 1] ?? sc.prepared
      // Magical Secrets (Bard 10): forberedte spells fra fire lister
      const lists = e.cls.id === 'bard' && e.level >= 10 ? ['bard', 'cleric', 'druid', 'wizard'] : [e.cls.id]
      if (cantrips) slots.push({ key: `${p}:cantrips`, label: `${e.cls.name}: cantrips`, level: 0, count: cantrips, from: spellsFor(e.cls.id, 0), ability: sc.ability })
      if (sc.spellbook) {
        slots.push({ key: `${p}:spellbook`, label: `${e.cls.name}: spellbook`, level: 1, count: sc.spellbook + 2 * (e.level - 1), from: spellsUpTo(e.cls.id, maxLevel), ability: sc.ability })
        slots.push({ key: `${p}:prepared`, label: `${e.cls.name}: forberedte spells (fra din spellbook)`, level: 1, count: prepared, from: d.spellPicks[`${p}:spellbook`] ?? [], subsetOf: `${p}:spellbook`, ability: sc.ability })
      } else if (prepared) {
        slots.push({ key: `${p}:prepared`, label: `${e.cls.name}: forberedte spells`, level: 1, count: prepared, from: spellsUpTo(lists, maxLevel), ability: sc.ability })
      }
      if (e.cls.id === 'warlock') {
        if (invocationsOf(d).includes('pact-tome')) {
          slots.push({ key: 'pact:cantrips', label: 'Pact of the Tome: cantrips (alle lister)', level: 0, count: 3, from: SPELLS.filter(s => s.level === 0 && s.classes.length).map(s => s.id), ability: sc.ability })
          slots.push({ key: 'pact:rituals', label: 'Pact of the Tome: ritualer (alle lister)', level: 1, count: 2, from: SPELLS.filter(s => s.level === 1 && s.ritual).map(s => s.id), ability: sc.ability, tag: 'Kun som ritual' })
        }
        for (const [lvl, spellLevel] of MYSTIC_ARCANUM) {
          if (e.level >= lvl) slots.push({ key: `arcanum:${spellLevel}`, label: `Mystic Arcanum: level ${spellLevel}-spell`, level: 1, count: 1, from: spellsFor('warlock', spellLevel as SpellLevel), ability: sc.ability, tag: 'Mystic Arcanum, 1× pr. long rest', freeResource: resourceId(e, `arcanum-${spellLevel}`), slotless: true })
        }
      }
    }
    if (e.sub?.spellcasting) {
      const ssc = e.sub.spellcasting
      const sp = e.primary ? 'subclass' : `subclass:${e.cls.id}`
      const cantrips = ssc.cantrips[e.level - 1]
      if (cantrips) slots.push({ key: `${sp}:cantrips`, label: `${e.sub.name}: cantrips`, level: 0, count: cantrips, from: spellsFor(ssc.list, 0), ability: ssc.ability })
      slots.push({ key: `${sp}:prepared`, label: `${e.sub.name}: forberedte spells`, level: 1, count: ssc.prepared[e.level - 1], from: spellsUpTo(ssc.list, maxLevel), ability: ssc.ability })
    }
    if (e.sub?.id === 'lore' && e.level >= 6 && sc) {
      const lists = ['cleric', 'druid', 'wizard']
      slots.push({ key: e.primary ? 'subclass:discoveries' : `subclass:${e.cls.id}:discoveries`, label: 'Magical Discoveries: spells fra Cleric, Druid eller Wizard', level: 1, count: 2, from: [...spellsFor(lists, 0), ...spellsUpTo(lists, maxLevel)], ability: sc.ability, tag: 'Altid forberedt' })
    }
  }
  // Blessed Warrior / Druidic Warrior (Paladin, Ranger)
  for (const e of classEntries(d)) {
    const style = d.classChoices[choiceKey(e, 'fightingStyle')]
    if ((e.cls.id === 'paladin' && style === BLESSED_WARRIOR) || (e.cls.id === 'ranger' && style === DRUIDIC_WARRIOR)) {
      const [list, ability] = style === BLESSED_WARRIOR ? ['cleric', 'cha' as Ability] : ['druid', 'wis' as Ability]
      slots.push({ key: e.primary ? 'style:cantrips' : `style:${e.cls.id}:cantrips`, label: `${style === BLESSED_WARRIOR ? 'Blessed' : 'Druidic'} Warrior: cantrips`, level: 0, count: 2, from: spellsFor(list, 0), ability })
    }
  }
  for (const o of featsOf(d)) {
    const { feat } = o
    const abilityKey = `feat:${o.source}`
    const name = featName(o)
    if (feat.magicInitiate) {
      const ability = d.spellAbilities[abilityKey] ?? null
      slots.push({ key: `${abilityKey}:cantrips`, label: `${name}: cantrips`, level: 0, count: 2, from: spellsFor(feat.magicInitiate, 0), ability, abilityKey })
      slots.push({ key: `${abilityKey}:spell`, label: `${name}: level 1-spell`, level: 1, count: 1, from: spellsFor(feat.magicInitiate, 1), ability, abilityKey, tag: '1× gratis pr. long rest', freeResource: `mi:${o.source}` })
    }
    if (feat.spellPick) {
      const from = SPELLS.filter(s => s.level === 1 && feat.spellPick!.schools.includes(s.school)).map(s => s.id)
      slots.push({ key: `${abilityKey}:pick`, label: `${name}: level 1-spell (${feat.spellPick.schools.join('/')})`, level: 1, count: feat.spellPick.count, from, ability: o.ability, tag: '1× gratis pr. long rest', freeResource: `feat-spells:${o.source}` })
    }
  }
  return slots
}

/** Spells der er låst for en given slot, fordi de allerede kommer fra en anden kilde. */
export function spellsTakenElsewhere(d: CharacterDraft, slot: SpellSlot): Map<string, string> {
  const owners = new Map<string, string>()
  for (const g of grantedSpells(d)) owners.set(g.spell, g.source)
  for (const other of spellSlots(d)) {
    if (other.key === slot.key || other.key === slot.subsetOf || other.subsetOf === slot.key) continue
    for (const id of d.spellPicks[other.key] ?? []) if (!owners.has(id)) owners.set(id, other.label)
  }
  return owners
}

const hasSpellChoices = (d: CharacterDraft) => spellSlots(d).length > 0

// ---------- Sanitize ----------

/** Vælger de første `count` gyldige værdier, som ikke allerede er taget. */
function keepValid<T>(picks: T[] | undefined, allowed: T[], taken: Set<T>, count: number): T[] {
  const out: T[] = []
  for (const p of picks ?? []) {
    if (out.length >= count) break
    if (allowed.includes(p) && !taken.has(p) && !out.includes(p)) out.push(p)
  }
  out.forEach(p => taken.add(p))
  return out
}

function keepChoices(defs: { key: string; def: ChoiceDef }[], picks: Record<string, string>) {
  const out: Record<string, string> = {}
  for (const { key, def } of defs) {
    if (def.options.some(o => o.id === picks[key])) out[key] = picks[key]
  }
  return out
}

/** Hvilke feats der må vælges på et level (uden prerequisites – dem tjekker valideringen). */
export function featOptionsAt(d: CharacterDraft, level: number): Feat[] {
  return ALL_FEATS.filter(f => {
    const cat = featCategory(f)
    if (cat === 'epic-boon') return level >= 19
    if (cat === 'fighting-style') return hasFightingStyleFeature(d)
    return true
  })
}

/** Giver karakterlevelet en ASI? Det afhænger af klassen, der fik levelet, og dens klasselevel. */
export function isAsiLevel(d: CharacterDraft, level: number) {
  const t = levelTimeline(d)[level - 1]
  return !!t && !!PROGRESSION[t.classId]?.asiLevels.includes(t.classLevel)
}

/** Klasse og HP-slag; feat-valget ryddes bagefter, når alle levels' klasser er kendt. */
function sanitizeLevelUp(d: CharacterDraft, lu: Partial<LevelUp> | undefined): LevelUp {
  const out = emptyLevelUp()
  const cls = findClass(lu?.classId ?? null)
  if (cls && cls.id !== d.classId) out.classId = cls.id
  const hitDie = findClass(out.classId ?? d.classId)?.hitDie
  const roll = lu?.hpRoll
  if (typeof roll === 'number' && Number.isFinite(roll) && hitDie) out.hpRoll = Math.min(hitDie, Math.max(1, Math.round(roll)))
  out.featId = lu?.featId ?? null
  out.abilities = (lu?.abilities ?? []).filter(a => ABILITIES.some(x => x.key === a))
  return out
}

/** Rydder ASI/feat på levels, der (efter klasseskift) ikke længere giver ASI. */
function sanitizeFeat(d: CharacterDraft, lu: LevelUp, level: number): LevelUp {
  const out: LevelUp = { ...lu, featId: null, abilities: [] }
  if (!isAsiLevel(d, level)) return out
  const feat = featOptionsAt(d, level).find(f => f.id === lu.featId)
  if (!feat) return out
  out.featId = feat.id
  if (feat.id === ASI_FEAT_ID) out.abilities = lu.abilities.slice(0, 2)
  else if (feat.abilityIncrease) out.abilities = lu.abilities.filter(a => feat.abilityIncrease!.includes(a)).slice(0, 1)
  return out
}

/**
 * Fjerner valg der ikke længere er gyldige efter en ændring – fx subclass-afhængige felter når klassen
 * skiftes, eller et skill-valg der nu gives gratis af baggrunden. Returnerer et nyt draft.
 */
export function sanitize(input: CharacterDraft): CharacterDraft {
  // JSON-kloning frem for structuredClone: input kan være en reaktiv Vue-proxy, som structuredClone afviser
  const raw = JSON.parse(JSON.stringify(input)) as CharacterDraft & { expertise?: SkillId[] }
  // Ældre drafts havde ét fladt expertise-felt
  if (Array.isArray(raw.expertise)) {
    raw.expertisePicks = { class: raw.expertise, ...raw.expertisePicks }
    delete raw.expertise
  }
  const d: CharacterDraft = { ...emptyDraft(), ...raw }
  const sp = findSpecies(d.speciesId)
  const cls = findClass(d.classId)
  const bg = findBackground(d.backgroundId)

  if (!sp) d.speciesId = null
  if (!cls) d.classId = null
  if (!bg) d.backgroundId = null

  // Levels: højst 19 level-ups; uden klasse kan der ikke levels op
  d.levels = cls ? (Array.isArray(d.levels) ? d.levels : []).slice(0, MAX_LEVEL - 1) : []
  d.levels = d.levels.map(lu => sanitizeLevelUp(d, lu))
  d.levels = d.levels.map((lu, i) => sanitizeFeat(d, lu, i + 2))

  // Subclasses: kun for klasser med mindst 3 levels
  const entries = classEntries(d)
  const validSub = (classId: string, id: string | null | undefined) => {
    const sub = findSubclass(id ?? null)
    return !!sub && sub.classId === classId && (entries.find(e => e.cls.id === classId)?.level ?? 0) >= SUBCLASS_LEVEL
  }
  if (!d.classId || !validSub(d.classId, d.subclassId)) d.subclassId = null
  d.subclasses = Object.fromEntries(Object.entries(d.subclasses ?? {}).filter(([classId, id]) => classId !== d.classId && validSub(classId, id)))

  if (!sp || !d.size || !sp.sizes.includes(d.size)) d.size = sp?.sizes.length === 1 ? sp.sizes[0] : null
  d.speciesChoices = keepChoices((sp?.choices ?? []).map(def => ({ key: def.id, def })), d.speciesChoices)
  const speciesFeat = findFeat(d.speciesFeatId)
  if (!sp?.originFeat || !speciesFeat || featCategory(speciesFeat) !== 'origin') d.speciesFeatId = null
  d.classChoices = keepChoices(classChoiceDefs(d), d.classChoices)

  // Ability scores efter metode
  for (const { key } of ABILITIES) {
    const v = d.baseScores[key]
    if (v === null || !Number.isFinite(v)) { d.baseScores[key] = null; continue }
    const n = Math.round(v)
    if (d.abilityMethod === 'pointbuy') d.baseScores[key] = n in POINT_BUY_COST ? n : null
    else if (d.abilityMethod === 'manual') d.baseScores[key] = Math.min(MANUAL_MAX, Math.max(MANUAL_MIN, n))
    else d.baseScores[key] = n
  }
  if (d.abilityMethod === 'standard') {
    const remaining = [...STANDARD_ARRAY]
    for (const { key } of ABILITIES) {
      const idx = remaining.indexOf(d.baseScores[key] ?? -1)
      if (idx === -1) d.baseScores[key] = null
      else remaining.splice(idx, 1)
    }
  }
  if (d.abilityMethod === 'pointbuy') {
    for (const { key } of ABILITIES) d.baseScores[key] ??= 8
  }

  // Baggrunds-bonus
  if (!bg || !d.bonusPlus2 || !bg.abilities.includes(d.bonusPlus2)) d.bonusPlus2 = null
  if (!bg || !d.bonusPlus1 || !bg.abilities.includes(d.bonusPlus1) || d.bonusPlus1 === d.bonusPlus2) d.bonusPlus1 = null

  // Klassernes flervalg; krav (fx Thirsting Blade → Pact of the Blade) tjekkes til listen er stabil
  const classPicks: Record<string, string[]> = {}
  const first = firstInvocation(d)
  for (const slot of pickSlots(d)) {
    let picks = keepValid(d.classPicks[slot.key], slot.options.map(o => o.id), new Set(), slot.count)
    for (let changed = true; changed;) {
      const have = new Set([first, ...picks])
      const next = picks.filter(id => { const req = slot.options.find(o => o.id === id)?.requires; return !req || have.has(req) })
      changed = next.length !== picks.length
      picks = next
    }
    classPicks[slot.key] = picks
  }
  d.classPicks = classPicks

  // Skills: et skill kan kun komme fra én kilde
  const takenSkills = new Set(fixedSkills(d).map(s => s.skill))
  const skillPicks: Record<string, SkillId[]> = {}
  for (const slot of skillSlots(d)) skillPicks[slot.key] = keepValid(d.skillPicks[slot.key], slot.from, takenSkills, slot.count)
  d.skillPicks = skillPicks
  const takenExpertise = new Set<SkillId>()
  const expertisePicks: Record<string, SkillId[]> = {}
  for (const slot of expertiseSlots(d)) expertisePicks[slot.key] = keepValid(d.expertisePicks[slot.key], slot.from, takenExpertise, slot.count)
  d.expertisePicks = expertisePicks

  const takenTools = new Set(fixedTools(d))
  const toolPicks: Record<string, string[]> = {}
  for (const slot of toolSlots(d)) toolPicks[slot.key] = keepValid(d.toolPicks[slot.key], slot.from, takenTools, slot.count)
  d.toolPicks = toolPicks

  d.languages = keepValid(d.languages, STANDARD_LANGUAGES, new Set(), languageCount(d))
  d.weaponMasteries = keepValid(d.weaponMasteries, masteryOptions(d), new Set(), weaponMasteryCount(d))

  // Spells: Magic Initiate-evner først (de påvirker ikke slots), derefter slots i rækkefølge,
  // så Wizardens forberedte spells valideres mod den allerede rensede spellbook
  const spellAbilities: Record<string, Ability> = {}
  for (const { source, feat } of featsOf(d)) {
    const key = `feat:${source}`
    if (feat.magicInitiate && MAGIC_INITIATE_ABILITIES.includes(d.spellAbilities[key])) spellAbilities[key] = d.spellAbilities[key]
  }
  d.spellAbilities = spellAbilities
  const granted = new Set(grantedSpells(d).map(g => g.spell))
  const spellPicks: Record<string, string[]> = {}
  for (const slot of spellSlots(d)) {
    const from = slot.subsetOf ? (spellPicks[slot.subsetOf] ?? []) : slot.from
    const taken = new Set([...granted, ...Object.entries(spellPicks).filter(([k]) => k !== slot.subsetOf).flatMap(([, v]) => v)])
    spellPicks[slot.key] = keepValid(d.spellPicks[slot.key], from, taken, slot.count)
  }
  d.spellPicks = spellPicks

  if (!cls?.equipment.some(e => equipmentKey(cls.id, e.id) === d.classEquipment)) d.classEquipment = null
  if (!bg || ![equipmentKey(bg.id, 'A'), equipmentKey(bg.id, 'B')].includes(d.backgroundEquipment ?? '')) d.backgroundEquipment = null

  return d
}

// ---------- Validering pr. trin ----------

export const STEPS = [
  { id: 'species', name: 'Species & Identitet' },
  { id: 'class', name: 'Klasse' },
  { id: 'background', name: 'Baggrund' },
  { id: 'abilities', name: 'Ability Scores' },
  { id: 'equipment', name: 'Udstyr & Proficiencies' },
  { id: 'spells', name: 'Spells' },
  { id: 'review', name: 'Oversigt' },
] as const

export type StepId = (typeof STEPS)[number]['id']
export type Step = (typeof STEPS)[number]

/** Trin der er relevante for karakteren – Spells springes over, hvis der ikke er noget at vælge. */
export function activeSteps(d: CharacterDraft): Step[] {
  return STEPS.filter(s => s.id !== 'spells' || hasSpellChoices(d))
}

const missingChoices = (defs: { key: string; def: ChoiceDef }[], picks: Record<string, string>) =>
  defs.filter(({ key }) => !picks[key]).map(({ def }) => `Vælg ${def.label}`)

/** Feats der er valgt mere end én gang uden at være repeatable. */
function duplicateFeatIssues(d: CharacterDraft): string[] {
  const owned = featsOf(d)
  return owned
    .filter((f, i) => !f.feat.repeatable && owned.findIndex(o => o.feat.id === f.feat.id) < i)
    .map(f => `${f.feat.name} kan kun vælges én gang (${f.label})`)
}

/** Hvor mange valg en slot kræver – færre hvis der ikke er nok ledige muligheder tilbage. */
function requiredPicks(slot: { key: string; count: number; from: string[] }, fixed: string[], picks: Record<string, string[]>) {
  const takenElsewhere = new Set([...fixed, ...Object.entries(picks).filter(([k]) => k !== slot.key).flatMap(([, v]) => v)])
  return Math.min(slot.count, slot.from.filter(o => !takenElsewhere.has(o)).length)
}

function skillIssues(d: CharacterDraft, onlyLevel1: boolean): string[] {
  const issues: string[] = []
  const inScope = (lvl: number) => (onlyLevel1 ? lvl === 1 : lvl > 1)
  const fixedS = fixedSkills(d).map(s => s.skill)
  for (const slot of skillSlots(d).filter(s => inScope(s.level))) {
    const need = requiredPicks(slot, fixedS, d.skillPicks)
    if ((d.skillPicks[slot.key]?.length ?? 0) < need) issues.push(`${slot.label}: vælg ${need} skills`)
  }
  for (const slot of expertiseSlots(d).filter(s => inScope(s.level))) {
    const need = requiredPicks(slot, [], d.expertisePicks)
    if ((d.expertisePicks[slot.key]?.length ?? 0) < need) issues.push(`${slot.label}: vælg ${need} skills`)
  }
  for (const slot of toolSlots(d).filter(s => inScope(s.level))) {
    const need = requiredPicks(slot, fixedTools(d), d.toolPicks)
    if ((d.toolPicks[slot.key]?.length ?? 0) < need) issues.push(`${slot.label}: vælg ${need} værktøj/instrumenter`)
  }
  return issues
}

export function spellIssues(d: CharacterDraft): string[] {
  const issues: string[] = []
  for (const slot of spellSlots(d)) {
    if (slot.abilityKey && !slot.ability) issues.push(`${slot.label.split(':')[0]}: vælg spellcasting-evne`)
    const owners = spellsTakenElsewhere(d, slot)
    const need = Math.min(slot.count, slot.from.filter(id => !owners.has(id)).length)
    const have = d.spellPicks[slot.key]?.length ?? 0
    if (have < need) issues.push(`${slot.label}: vælg ${need} (${have} valgt)`)
  }
  return [...new Set(issues)]
}

export function validateStep(step: StepId, d: CharacterDraft): string[] {
  const sp = findSpecies(d.speciesId)
  const cls = findClass(d.classId)
  const bg = findBackground(d.backgroundId)
  const issues: string[] = []

  switch (step) {
    case 'species':
      if (!d.name.trim()) issues.push('Giv karakteren et navn')
      if (!sp) { issues.push('Vælg en species'); break }
      if (!d.size) issues.push('Vælg størrelse')
      issues.push(...missingChoices((sp.choices ?? []).map(def => ({ key: def.id, def })), d.speciesChoices))
      if (sp.originFeat && !d.speciesFeatId) issues.push('Vælg et Origin Feat (Versatile)')
      break
    case 'class':
      if (!cls) { issues.push('Vælg en klasse'); break }
      issues.push(...missingChoices((cls.choices ?? []).map(def => ({ key: def.id, def })), d.classChoices))
      break
    case 'background':
      if (!bg) { issues.push('Vælg en baggrund'); break }
      issues.push(...duplicateFeatIssues(d).filter(i => !i.includes('(Level')))
      break
    case 'abilities': {
      if (ABILITIES.some(({ key }) => d.baseScores[key] === null)) issues.push('Tildel en værdi til alle seks evner')
      if (d.abilityMethod === 'pointbuy' && pointBuySpent(d.baseScores) > POINT_BUY_BUDGET) issues.push(`Du har brugt mere end ${POINT_BUY_BUDGET} point`)
      if (!bg) issues.push('Vælg en baggrund før du fordeler bonusser')
      else if (d.bonusMode === '2-1' && (!d.bonusPlus2 || !d.bonusPlus1)) issues.push('Fordel baggrundens +2 og +1')
      break
    }
    case 'equipment': {
      if (!cls || !bg) { issues.push('Vælg klasse og baggrund først'); break }
      if (!d.classEquipment) issues.push(`Vælg ${cls.name}-startudstyr`)
      if (!d.backgroundEquipment) issues.push(`Vælg ${bg.name}-startudstyr`)
      issues.push(...skillIssues(d, true))
      if (d.languages.length < BONUS_LANGUAGES) issues.push(`Vælg ${BONUS_LANGUAGES} sprog`)
      if (cls.weaponMastery && d.weaponMasteries.length < cls.weaponMastery.count) issues.push(`Vælg ${cls.weaponMastery.count} våben til Weapon Mastery`)
      break
    }
    case 'spells':
      issues.push(...spellIssues(d))
      break
    case 'review':
      for (const s of activeSteps(d)) {
        if (s.id !== 'review' && validateStep(s.id, d).length) issues.push(`Trinnet "${s.name}" er ikke færdigt`)
      }
      break
  }
  return issues
}

// ---------- Validering af level-ups ----------

/** Hvorfor et feat ikke kan vælges på et level – undefined hvis det er i orden. */
export function featPrereqIssue(d: CharacterDraft, feat: Feat, level: number): string | undefined {
  const p = feat.prereq
  if (!p) return
  if (p.level && level < p.level) return `kræver level ${p.level}`
  if (p.abilities) {
    const scores = abilityScores(d, level - 1)
    if (!p.abilities.some(a => scores[a] >= 13)) return `kræver ${p.abilities.map(abilityShort).join(' eller ')} 13`
  }
  if (p.armor && !armorTraining(d).includes(p.armor)) return `kræver training med ${p.armor === 'shield' ? 'skjolde' : `${p.armor} armor`}`
  if (p.spellcasting && !casters(d).length) return 'kræver Spellcasting eller Pact Magic'
  if (p.fightingStyle && !hasFightingStyleFeature(d)) return 'kræver featuren Fighting Style'
}

/** Valg der hører til ét bestemt level (multiclass-krav, HP og ASI/feat). */
export function validateLevelUp(d: CharacterDraft, level: number): string[] {
  const issues: string[] = []
  const lu = d.levels[level - 2]
  if (!lu) return issues
  const t = levelTimeline(d)[level - 1]
  if (lu.classId && t?.classLevel === 1) {
    const scores = abilityScores(d, level - 1)
    const before = classEntries(d, level - 1).map(e => e.cls)
    const missing = [findClass(lu.classId)!, ...before].filter(c => !meetsMulticlassReq(c, scores))
    if (missing.length) issues.push(`Level ${level}: multiclass kræver ${missing.map(c => `${primaryText(c)} ${MULTICLASS_MIN_SCORE} (${c.name})`).join(', ')}`)
  }
  if (isAsiLevel(d, level)) {
    const feat = findFeat(lu.featId)
    if (!feat) issues.push(`Level ${level}: vælg Ability Score Improvement eller et feat`)
    else {
      if (feat.id === ASI_FEAT_ID && lu.abilities.length < 2) issues.push(`Level ${level}: fordel +2 (eller +1/+1) på evnerne`)
      if (feat.abilityIncrease && !lu.abilities.length) issues.push(`Level ${level}: vælg hvilken evne ${feat.name} hæver`)
      const prereq = featPrereqIssue(d, feat, level)
      if (prereq) issues.push(`Level ${level}: ${feat.name} ${prereq}`)
    }
  }
  return issues
}

/** Valg der afhænger af karakterens nuværende level: subclasses, klassevalg, flervalg, skills og spells. */
export function validateProgression(d: CharacterDraft): string[] {
  const issues: string[] = []
  const level = characterLevel(d)
  if (level < 2) return issues
  for (let lvl = 2; lvl <= level; lvl++) issues.push(...validateLevelUp(d, lvl))
  for (const e of classEntries(d)) {
    if (e.level >= SUBCLASS_LEVEL && !subclassIdOf(d, e.cls.id)) issues.push(`Vælg en subclass for ${e.cls.name}`)
  }
  // Startklassens level 1-valg valideres i klassetrinnet
  issues.push(...missingChoices(classChoiceDefs(d).filter(c => !(c.entry.primary && c.level === 1)), d.classChoices))
  for (const slot of pickSlots(d)) {
    const have = d.classPicks[slot.key]?.length ?? 0
    const need = Math.min(slot.count, slot.options.length)
    if (have < need) issues.push(`${slot.label}: vælg ${need} (${have} valgt)`)
  }
  issues.push(...skillIssues(d, false))
  // Level 1-antallet valideres i udstyrstrinnet; her kun det, der er kommet til siden
  if (languageCount(d) > BONUS_LANGUAGES && d.languages.length < languageCount(d)) issues.push(`Vælg ${languageCount(d)} sprog i alt`)
  const masteries = weaponMasteryCount(d)
  if (masteries > (findClass(d.classId)?.weaponMastery?.count ?? 0) && d.weaponMasteries.length < masteries) issues.push(`Vælg ${masteries} våben til Weapon Mastery`)
  issues.push(...duplicateFeatIssues(d).filter(i => i.includes('(Level')))
  issues.push(...spellIssues(d))
  return [...new Set(issues)]
}

/** Gennemsnitligt HP pr. level over 1. */
export const averageHp = (hitDie: number) => hitDie / 2 + 1

/** Klassen der fik et bestemt karakterlevel. */
export const classAtLevel = (d: CharacterDraft, level: number) => findClass(levelTimeline(d)[level - 1]?.classId ?? null)

// ---------- Afledt character sheet ----------

export interface Attack { name: string; toHit: number; damage: string; type: string; properties: string; mastery?: string; proficient: boolean }

/** Det karakteren har udrustet fra sit inventory. Uden gear bruges startudstyret. */
export interface Gear {
  armor: { id: ArmorId; bonus: number } | null
  shield: { bonus: number } | null
  /** `name` er våbnets navn i WEAPONS; `label` kan være fx 'Longsword +1'. */
  weapons: { name: string; label: string; bonus: number }[]
  /** AC fra magiske genstande som Ring of Protection. */
  acBonus: number
}

export interface DerivedSpell {
  spell: Spell; source: string; ability: Ability | null; tag?: string
  /** Ressource der giver et gratis cast. */
  freeResource?: string
  /** Kan kun castes via freeResource. */
  slotless?: boolean
}

export interface Derived {
  level: number
  species?: Species
  /** Startklassen. */
  cls?: DndClass
  /** Startklassens subclass. */
  subclass?: Subclass
  classes: { cls: DndClass; level: number; subclass?: Subclass }[]
  /** Fx 'Fighter 3 / Wizard 2' – eller bare 'Fighter' uden multiclass. */
  classText: string
  background?: Background
  scores: Record<Ability, number>
  mods: Record<Ability, number>
  bonuses: Record<Ability, number>
  abilitiesComplete: boolean
  pb: number
  hp: number
  hpBreakdown: string
  /** Hit dice pr. terningstørrelse (største først). */
  hitDice: { die: number; count: number }[]
  ac: number
  acBreakdown: string
  initiative: number
  speed: number
  darkvision: number
  resistances: string[]
  saves: { ability: Ability; proficient: boolean; bonus: number }[]
  skills: { id: SkillId; name: string; ability: Ability; bonus: number; proficient: boolean; expertise: boolean }[]
  passivePerception: number
  armorTraining: ArmorTraining[]
  weaponTraining: string
  tools: string[]
  languages: string[]
  features: { level: number; source: string; name: string; text: string }[]
  feats: { label: string; name: string; text: string }[]
  equipment: string[]
  gold: number
  /** Bæreevne i lb.: STR × 15 (dobbelt med Powerful Build). */
  carryCapacity: number
  attacks: Attack[]
  spellcasting?: {
    ability: Ability; saveDc: number; attack: number; cantrips: number; prepared: number
    /** Antal slots pr. spell-level (index 0 = level 1). */
    slots: number[]
    pact?: { count: number; level: number }
    note?: string
  }
  /** Alle spells karakteren har, uanset kilde. */
  spells: DerivedSpell[]
  /** Save DC og spell attack pr. evne der bruges til spells. */
  spellStats: { ability: Ability; saveDc: number; attack: number; sources: string[] }[]
  /** Ressourcer med begrænset brug (Rage, Ki, Channel Divinity …) – spell slots og hit dice er separate. */
  resources: Resource[]
  warnings: string[]
}

/** Species-ressourcer, der skal kunne krydses af på arket. */
function speciesResources(d: CharacterDraft, level: number, pb: number): Resource[] {
  const id = d.speciesId
  const out: Resource[] = []
  if (id === 'dragonborn') {
    out.push({ id: 'breath-weapon', name: `Breath Weapon (${level >= 17 ? 4 : level >= 11 ? 3 : level >= 5 ? 2 : 1}d10)`, max: pb, reset: 'long' })
    if (level >= 5) out.push({ id: 'draconic-flight', name: 'Draconic Flight', max: 1, reset: 'long' })
  }
  if (id === 'aasimar') {
    out.push({ id: 'healing-hands', name: 'Healing Hands', max: 1, reset: 'long' })
    if (level >= 3) out.push({ id: 'celestial-revelation', name: 'Celestial Revelation', max: 1, reset: 'long' })
  }
  if (id === 'dwarf') out.push({ id: 'stonecunning', name: 'Stonecunning', max: pb, reset: 'long' })
  if (id === 'goliath') {
    out.push({ id: 'giant-ancestry', name: 'Giant Ancestry', max: pb, reset: 'long' })
    if (level >= 5) out.push({ id: 'large-form', name: 'Large Form', max: 1, reset: 'long' })
  }
  if (id === 'orc') {
    out.push({ id: 'adrenaline-rush', name: 'Adrenaline Rush', max: pb, reset: 'short' })
    out.push({ id: 'relentless-endurance', name: 'Relentless Endurance', max: 1, reset: 'long' })
  }
  if (id === 'gnome' && d.speciesChoices.lineage === 'forest') out.push({ id: 'speak-with-animals', name: 'Speak with Animals (gratis)', max: pb, reset: 'long' })
  return out
}

function featResources(feats: OwnedFeat[], pb: number): Resource[] {
  const out: Resource[] = []
  for (const o of feats) {
    const { feat, source } = o
    if (feat.id === 'lucky') out.push({ id: `luck:${source}`, name: 'Luck Points', max: pb, reset: 'long' })
    if (feat.magicInitiate) out.push({ id: `mi:${source}`, name: `${featName(o)} (gratis spell)`, max: 1, reset: 'long' })
    // Telekinetic giver kun en cantrip, som ikke bruger ressourcer
    const free = (feat.spells?.length ?? 0) + (feat.spellPick?.count ?? 0)
    if (free && feat.id !== 'telekinetic') out.push({ id: `feat-spells:${source}`, name: `${featName(o)} (gratis casts)`, max: free, reset: 'long' })
  }
  return out
}

/** Finder våben i en udstyrsliste, fx '4 Handaxes' eller 'Arcane Focus (Quarterstaff)'. */
export function weaponsIn(items: string[]): Weapon[] {
  const byLength = [...WEAPONS].sort((a, b) => b.name.length - a.name.length)
  const found: Weapon[] = []
  for (const item of items) {
    const weapon = byLength.find(w => new RegExp(`\\b${w.name}(e?s)?\\b`, 'i').test(item))
    if (weapon && !found.includes(weapon)) found.push(weapon)
  }
  return found
}

/** Startudstyrets rustning, skjold og våben – bruges indtil spilleren har et inventory. */
export function startingGear(d: CharacterDraft): Gear {
  const cls = findClass(d.classId)
  const pkg = cls?.equipment.find(e => equipmentKey(cls.id, e.id) === d.classEquipment)
  const bg = findBackground(d.backgroundId)
  const bgItems = bg && d.backgroundEquipment === equipmentKey(bg.id, 'A') ? bg.equipment.items : []
  return {
    armor: pkg?.armor ? { id: pkg.armor, bonus: 0 } : null,
    shield: pkg?.shield ? { bonus: 0 } : null,
    weapons: weaponsIn([...(pkg?.items ?? []), ...bgItems]).map(w => ({ name: w.name, label: w.name, bonus: 0 })),
    acBonus: 0,
  }
}

export function derive(d: CharacterDraft, gear: Gear = startingGear(d)): Derived {
  const level = characterLevel(d)
  const species = findSpecies(d.speciesId)
  const cls = findClass(d.classId)
  const entries = classEntries(d)
  const subclass = entries.find(e => e.primary)?.sub
  const background = findBackground(d.backgroundId)
  const effects = activeEffects(d)
  const feats = featsOf(d)
  const pb = proficiencyBonus(level)
  const warnings: string[] = []

  const bonuses = abilityBonuses(d)
  const abilitiesComplete = ABILITIES.every(({ key }) => d.baseScores[key] !== null)
  const scores = abilityScores(d)
  const mods = {} as Record<Ability, number>
  for (const { key } of ABILITIES) mods[key] = modifier(scores[key])
  /** Tekster og ressourcer skalerer med klassens eget level. */
  const ctxFor = (e: ClassEntry): FeatureCtx => ({ level: e.level, mods, pb })

  // HP: max på level 1, derefter slag eller gennemsnit med hit die fra klassen, der fik levelet
  const hpPerLevel = (species?.hpPerLevel ?? 0) + feats.reduce((s, f) => s + (f.feat.hpPerLevel ?? 0), 0)
  const featureHp = entries.reduce((s, e) => s + entryEffects(d, e).reduce((n, x) => n + (x.hpPerLevel ?? 0), 0) * e.level, 0)
  const flatBonus = feats.reduce((s, f) => s + (f.feat.hpBonus ?? 0), 0)
  let hp = 0
  const hpParts: string[] = []
  const timeline = levelTimeline(d)
  if (cls) {
    const ups = d.levels.slice(0, level - 1)
    const dieOf = (i: number) => findClass(timeline[i + 1]?.classId ?? null)?.hitDie ?? cls.hitDie
    const rolls = ups.map((lu, i) => lu.hpRoll ?? averageHp(dieOf(i)))
    hp = Math.max(1, cls.hitDie + mods.con) + rolls.reduce((s, r) => s + Math.max(1, r + mods.con), 0) + hpPerLevel * level + featureHp + flatBonus
    hpParts.push(`d${cls.hitDie} max (${cls.hitDie})`)
    if (ups.length) hpParts.push(`${ups.length} level-ups (${rolls.reduce((s, r) => s + r, 0)})`)
    hpParts.push(`CON ${signed(mods.con)} × ${level}`)
    if (species?.hpPerLevel) hpParts.push(`${species.name} +${species.hpPerLevel * level}`)
    for (const f of feats) if (f.feat.hpPerLevel) hpParts.push(`${f.feat.name} +${f.feat.hpPerLevel * level}`)
    if (featureHp) hpParts.push(`Features +${featureHp}`)
    if (flatBonus) hpParts.push(`Feats +${flatBonus}`)
  }
  const diceMap = new Map<number, number>()
  for (const e of entries) diceMap.set(e.cls.hitDie, (diceMap.get(e.cls.hitDie) ?? 0) + e.level)
  const hitDice = [...diceMap].map(([die, count]) => ({ die, count })).sort((a, b) => b.die - a.die)

  // AC – vælger den bedste mulighed med det udstyr karakteren har
  const training = armorTraining(d)
  const pkg = cls?.equipment.find(e => equipmentKey(cls.id, e.id) === d.classEquipment)
  const armor = gear.armor ? ARMOR[gear.armor.id] : undefined
  const armorBonus = gear.armor?.bonus ?? 0
  const shieldBonus = gear.shield && training.includes('shield') ? SHIELD_AC + gear.shield.bonus : 0
  if (gear.shield && !training.includes('shield')) warnings.push('Du har ikke training med skjolde – skjoldet giver ingen AC.')
  const styles = fightingStyles(d)
  const defenseStyle = styles.includes('defense') ? 1 : 0
  const candidates: { ac: number; text: string }[] = [
    { ac: 10 + mods.dex + shieldBonus, text: `10 + DEX${shieldBonus ? ' + Shield' : ''}` },
  ]
  const unarmored = [...entries.flatMap(e => (e.cls.unarmoredDefense ? [e.cls.unarmoredDefense] : [])), ...effects.flatMap(e => (e.unarmoredDefense ? [e.unarmoredDefense] : []))]
  for (const ud of unarmored) {
    const shield = ud.allowShield ? shieldBonus : 0
    candidates.push({ ac: 10 + mods.dex + mods[ud.ability] + shield, text: `Unarmored Defense: 10 + DEX + ${abilityShort(ud.ability)}${shield ? ' + Shield' : ''}` })
  }
  if (armor) {
    if (!training.includes(armor.type)) {
      warnings.push(`Du har ikke training med ${armor.name} – den giver ingen AC og disadvantage på STR/DEX.`)
    } else {
      const dex = armor.dexCap === null ? mods.dex : Math.min(mods.dex, armor.dexCap)
      candidates.push({
        ac: armor.base + armorBonus + dex + shieldBonus + defenseStyle,
        text: `${armor.name}${armorBonus ? ` +${armorBonus}` : ''} ${armor.base + armorBonus}${armor.dexCap === 0 ? '' : ` + DEX${armor.dexCap ? ` (max ${armor.dexCap})` : ''}`}${shieldBonus ? ' + Shield' : ''}${defenseStyle ? ' + Defense' : ''}`,
      })
      if (armor.strength && scores.str < armor.strength) warnings.push(`${armor.name} kræver STR ${armor.strength} – din speed falder med 10 ft.`)
      if (armor.stealthDisadvantage) warnings.push(`${armor.name} giver disadvantage på Stealth.`)
    }
  }
  const bestRaw = candidates.reduce((a, b) => (b.ac > a.ac ? b : a))
  const bestAc = gear.acBonus ? { ac: bestRaw.ac + gear.acBonus, text: `${bestRaw.text} + magi ${gear.acBonus}` } : bestRaw
  const wearsArmor = !!armor && bestAc.text.startsWith(armor.name)

  // Speed, sanser, resistances
  const speedOverride = effects.map(e => e.speed).find(s => s !== undefined)
  const heavyPenalty = armor?.strength && scores.str < armor.strength && training.includes(armor.type) ? 10 : 0
  const speedBonus = effects.reduce((s, e) => s + (e.speedBonus ?? 0), 0)
  const unarmoredSpeed = !wearsArmor && !shieldBonus ? effects.reduce((s, e) => s + (e.unarmoredSpeed ?? 0), 0) : 0
  const speed = (speedOverride ?? species?.speed ?? 30) + speedBonus + unarmoredSpeed - heavyPenalty
  const darkvision = Math.max(species?.darkvision ?? 0, ...effects.map(e => e.darkvision ?? 0))
  const resistances = [...new Set([...(species?.resistances ?? []), ...effects.flatMap(e => e.resistances ?? [])])]

  // Saves (kun startklassens) og skills
  const allSaves = effects.some(e => e.saves === 'all')
  const extraSaves = new Set([...effects.flatMap(e => (Array.isArray(e.saves) ? e.saves : [])), ...feats.filter(f => f.feat.saveFromAbility && f.ability).map(f => f.ability!)])
  const saveBonus = effects.reduce((s, e) => s + (e.saveBonus ? Math.max(1, mods[e.saveBonus]) : 0), 0)
  const saves = ABILITIES.map(({ key }) => {
    const proficient = allSaves || !!cls?.saves.includes(key) || extraSaves.has(key)
    return { ability: key, proficient, bonus: mods[key] + (proficient ? pb : 0) + saveBonus }
  })
  const profSkills = proficientSkills(d)
  const expertise = new Set(Object.values(d.expertisePicks).flat())
  const jack = effects.some(e => e.jackOfAllTrades)
  const skillBonuses = effects.flatMap(e => (e.skillBonus ? [e.skillBonus] : []))
  const skills = SKILLS.map(s => {
    const proficient = profSkills.has(s.id)
    const isExpert = proficient && expertise.has(s.id)
    const extra = skillBonuses.filter(b => b.skills.includes(s.id)).reduce((sum, b) => sum + Math.max(1, mods[b.ability]), 0)
    const prof = isExpert ? 2 * pb : proficient ? pb : jack ? Math.floor(pb / 2) : 0
    return { id: s.id, name: s.name, ability: s.ability as Ability, proficient, expertise: isExpert, bonus: mods[s.ability] + prof + extra }
  })
  const perception = skills.find(s => s.id === 'perception')!

  // Værktøj og sprog
  const tools = [...new Set([...fixedTools(d), ...Object.values(d.toolPicks).flat(), ...effects.flatMap(e => e.toolProficiencies ?? [])])]
  const languages = [...new Set(['Common', ...d.languages, ...entries.flatMap(e => e.cls.extraLanguages ?? []), ...effects.flatMap(e => e.languages ?? [])])]

  // Features
  const features: Derived['features'] = []
  if (species) {
    for (const t of species.traits) if ((t.level ?? 1) <= level) features.push({ level: t.level ?? 1, source: species.name, name: t.name, text: t.text })
    for (const o of chosenOptions(species.choices, d.speciesChoices)) {
      const def = species.choices!.find(c => c.options.includes(o))!
      features.push({ level: 1, source: species.name, name: `${def.label}: ${o.name}`, text: o.text ?? '' })
    }
  }
  for (const { level: lvl, source, feature, entry } of classFeaturesUpTo(d)) features.push({ level: lvl, source, name: feature.name, text: featureText(feature, ctxFor(entry)) })
  for (const c of classChoiceDefs(d)) {
    const o = chosenClassOption(d, c)
    if (o) features.push({ level: c.level, source: c.entry.cls.name, name: `${c.def.label}: ${o.name}`, text: o.text ?? '' })
  }
  for (const slot of pickSlots(d)) {
    for (const id of d.classPicks[slot.key] ?? []) {
      const o = slot.options.find(opt => opt.id === id)
      if (o) features.push({ level, source: slot.label, name: o.name, text: o.text })
    }
  }
  if (d.weaponMasteries.length) features.push({ level: 1, source: cls?.name ?? '', name: 'Weapon Mastery-våben', text: d.weaponMasteries.join(', ') })
  features.sort((a, b) => a.level - b.level)

  const featList: Derived['feats'] = feats.map(({ feat, label, ability }) =>
    ({ label, name: feat.name, text: `${feat.text}${ability ? ` (+1 ${abilityShort(ability)})` : ''}` }))
  d.levels.slice(0, level - 1).forEach((lu, i) => {
    if (lu.featId === ASI_FEAT_ID && lu.abilities.length) {
      const counts = lu.abilities.reduce((m, a) => m.set(a, (m.get(a) ?? 0) + 1), new Map<Ability, number>())
      featList.push({ label: `Level ${i + 2}`, name: 'Ability Score Improvement', text: [...counts].map(([a, n]) => `+${n} ${abilityShort(a)}`).join(', ') })
    }
  })

  // Udstyr
  const bgPkg = !background ? undefined
    : d.backgroundEquipment === equipmentKey(background.id, 'A') ? background.equipment
    : d.backgroundEquipment === equipmentKey(background.id, 'B') ? { items: [], gold: BACKGROUND_GOLD_OPTION }
    : undefined
  const equipment = [...(pkg?.items ?? []), ...(bgPkg?.items ?? [])]
  const gold = (pkg?.gold ?? 0) + (bgPkg?.gold ?? 0)

  // Angreb med de våben karakteren har
  const monkLevel = entries.find(e => e.cls.id === 'monk')?.level ?? 0
  const maDie = martialArtsDie(monkLevel || 1)
  const dieSize = (dmg: string) => Number(dmg.split('d')[1] ?? 0)
  const attacks: Attack[] = gear.weapons.flatMap(({ name, label, bonus }) => {
    const weapon = WEAPONS.find(w => w.name === name)
    if (!weapon) return []
    const proficient = isWeaponProficient(d, weapon)
    const monkWeapon = !!monkLevel && weapon.melee && (!weapon.martial || !!weapon.light)
    const ability: Ability = weapon.finesse || monkWeapon ? (mods.dex >= mods.str ? 'dex' : 'str') : weapon.melee ? 'str' : 'dex'
    const archery = !weapon.melee && styles.includes('archery') ? 2 : 0
    const die = monkWeapon && dieSize(`1${maDie}`) > dieSize(weapon.damage) ? `1${maDie}` : weapon.damage
    const dmgMod = mods[ability] + bonus
    return [{
      name: label, proficient,
      toHit: mods[ability] + (proficient ? pb : 0) + archery + bonus,
      damage: `${die}${dmgMod ? ` ${signed(dmgMod)}` : ''}`,
      type: weapon.damageType, properties: weapon.properties,
      mastery: d.weaponMasteries.includes(weapon.name) ? weapon.mastery : undefined,
    }]
  })
  const unarmedAbility: Ability = monkLevel && mods.dex > mods.str ? 'dex' : 'str'
  attacks.push({
    name: 'Unarmed Strike', proficient: true, toHit: mods[unarmedAbility] + pb,
    damage: monkLevel ? `1${maDie} ${signed(mods[unarmedAbility])}` : `${Math.max(0, 1 + mods.str)}`,
    type: 'Bludgeoning', properties: '',
  })

  // Spellcasting
  let spellcasting: Derived['spellcasting']
  const casterList = casters(d)
  const slots = spellSlots(d)
  if (casterList.length) {
    const m = mods[casterList[0].ability]
    const pactCaster = casterList.find(c => c.type === 'pact')
    const classSlots = slots.filter(s => !s.key.startsWith('feat:') && !s.key.startsWith('style:') && !s.key.startsWith('pact:') && !s.key.startsWith('arcanum:'))
    const wizard = entries.find(e => e.cls.spellcasting?.spellbook)
    const bookKey = wizard ? `${spellPrefix(wizard)}:spellbook` : ''
    spellcasting = {
      ability: casterList[0].ability, saveDc: 8 + pb + m, attack: pb + m,
      cantrips: classSlots.filter(s => s.level === 0).reduce((n, s) => n + s.count, 0),
      prepared: classSlots.filter(s => s.key.endsWith(':prepared')).reduce((n, s) => n + s.count, 0),
      slots: spellSlotCounts(d), pact: pactCaster ? pactSlots(pactCaster.level) : undefined,
      note: wizard ? `Spellbook: ${(d.spellPicks[bookKey] ?? []).length}/${wizard.cls.spellcasting!.spellbook! + 2 * (wizard.level - 1)} spells` : undefined,
    }
  }

  const spells: DerivedSpell[] = []
  for (const g of grantedSpells(d)) {
    const spell = findSpell(g.spell)
    if (spell) spells.push({ spell, source: g.source, ability: g.ability, tag: g.tag ?? (g.alwaysPrepared ? 'Altid forberedt' : undefined), freeResource: g.freeResource })
  }
  for (const slot of slots) {
    if (slot.subsetOf) continue // forberedte Wizard-spells vises som tag på spellbook-spells
    const prepared = slot.key.endsWith(':spellbook') ? new Set(d.spellPicks[slot.key.replace(':spellbook', ':prepared')] ?? []) : undefined
    for (const id of d.spellPicks[slot.key] ?? []) {
      const spell = findSpell(id)
      if (!spell) continue
      const tag = prepared ? (prepared.has(id) ? 'Forberedt' : 'Kun i spellbook') : slot.level === 1 ? slot.tag : undefined
      spells.push({ spell, source: slot.label.split(':')[0], ability: slot.ability, tag, freeResource: slot.freeResource, slotless: slot.slotless })
    }
  }
  spells.sort((a, b) => a.spell.level - b.spell.level || a.spell.name.localeCompare(b.spell.name))

  const statMap = new Map<Ability, Set<string>>()
  for (const s of spells) if (s.ability) (statMap.get(s.ability) ?? statMap.set(s.ability, new Set()).get(s.ability)!).add(s.source)
  const spellStats = [...statMap].map(([ability, sources]) =>
    ({ ability, saveDc: 8 + pb + mods[ability], attack: pb + mods[ability], sources: [...sources] }))

  const multi = entries.length > 1
  const resources = [
    ...entries.flatMap(e => [...(e.prog?.resources?.(ctxFor(e)) ?? []), ...(e.sub?.resources?.(ctxFor(e)) ?? [])]
      .map(r => (e.primary ? r : { ...r, id: resourceId(e, r.id), name: multi ? `${r.name} (${e.cls.name})` : r.name }))),
    ...speciesResources(d, level, pb),
    ...featResources(feats, pb),
  ].filter(r => r.max > 0)

  if (cls && abilitiesComplete && cls.primary.every(a => scores[a] < 13)) {
    warnings.push(`${cls.name} bruger primært ${cls.primary.map(abilityShort).join('/')} – overvej en højere værdi der.`)
  }

  const classes = entries.map(e => ({ cls: e.cls, level: e.level, subclass: e.sub }))
  return {
    level, species, cls, subclass, classes,
    classText: multi ? classes.map(c => `${c.cls.name} ${c.level}`).join(' / ') : (cls?.name ?? ''),
    background, scores, mods, bonuses, abilitiesComplete, pb,
    hp, hpBreakdown: hpParts.join(' + '), hitDice,
    ac: bestAc.ac, acBreakdown: bestAc.text,
    initiative: mods.dex + (feats.some(f => f.feat.initiativeProf) ? pb : 0)
      + effects.reduce((s, e) => s + (e.initiativeBonus ? mods[e.initiativeBonus] : 0), 0)
      + (jack && !feats.some(f => f.feat.initiativeProf) ? Math.floor(pb / 2) : 0),
    speed, darkvision, resistances, saves, skills,
    passivePerception: 10 + perception.bonus,
    armorTraining: training, weaponTraining: weaponTrainingText(d),
    tools, languages, features, feats: featList, equipment, gold, attacks,
    carryCapacity: scores.str * 15 * (species?.id === 'goliath' ? 2 : 1),
    spellcasting, spells, spellStats, resources, warnings,
  }
}

/** Kort resumé, som gemmes ved siden af draftet, så lister kan vises uden at køre regelmotoren. */
export function summarize(d: CharacterDraft) {
  const x = derive(d)
  return {
    level: x.level,
    species: x.species?.name ?? null,
    className: x.classText || null,
    subclass: x.classes.map(c => c.subclass?.name).filter(Boolean).join(', ') || null,
    background: x.background?.name ?? null,
    hp: x.hp, ac: x.ac, completed: d.completed,
  }
}
