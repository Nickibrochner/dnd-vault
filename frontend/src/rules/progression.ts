// Klasseprogression for level 2–20 efter 2024-reglerne (PHB): features, spell-tabeller, valg og ressourcer.
// Level 1 ligger på DndClass i data.ts. Kun mekanik og korte resuméer med egne ord.

import {
  FIGHTING_STYLES, bardicDie, channelDivinityUses, favoredEnemyUses, martialArtsDie, rageDamage, rageUses,
  secondWindUses, unarmoredMovement, wildShapeUses,
  type ArmorTraining, type ChoiceDef, type ClassFeature, type FeatureCtx, type OptionEffects, type SkillId, type ToolGrant,
} from './data'

export const MAX_LEVEL = 20

export const proficiencyBonus = (level: number) => Math.ceil(level / 4) + 1

// ---------- Spell slots ----------

/** Full caster-tabellen: antal slots pr. spell-level (index 0 = level 1-slots). */
const FULL_SLOTS: number[][] = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]

export type CasterType = 'full' | 'half' | 'third' | 'pact'

/** Spell slots pr. spell-level for en caster-type på et givet klasselevel. */
export function slotTable(type: CasterType, level: number): number[] {
  if (type === 'full') return FULL_SLOTS[level - 1]
  if (type === 'half') return FULL_SLOTS[Math.ceil(level / 2) - 1]
  if (type === 'third') return level < 3 ? [] : FULL_SLOTS[Math.ceil(level / 3) - 1]
  return []
}

/** Warlockens Pact Magic: få slots, alle på samme (højeste) level, genvindes ved short rest. */
export function pactSlots(level: number) {
  return {
    count: level >= 17 ? 4 : level >= 11 ? 3 : level >= 2 ? 2 : 1,
    level: Math.min(5, Math.ceil(level / 2)),
  }
}

/** Mystic Arcanum: én spell af level 6–9 på klasselevel 11/13/15/17. */
export const MYSTIC_ARCANUM: [classLevel: number, spellLevel: number][] = [[11, 6], [13, 7], [15, 8], [17, 9]]

// ---------- Multiclassing ----------

/** Det man får, når klassen tages som ny klasse (ikke på level 1), plus kravet for at tage den. */
export interface MulticlassRules {
  armor?: ArmorTraining[]
  martialWeapons?: boolean
  skills?: { count: number; from: SkillId[] | 'any' }
  tools?: string[]
  toolGrant?: ToolGrant
  /** Fighter: STR eller DEX 13. Andre klasser kræver 13 i alle primære evner. */
  primaryAny?: boolean
}

export const MULTICLASS: Record<string, MulticlassRules> = {
  barbarian: { armor: ['shield'], martialWeapons: true },
  bard: { armor: ['light'], skills: { count: 1, from: 'any' }, toolGrant: { count: 1, from: ['instrument'], label: 'Bard (multiclass)' } },
  cleric: { armor: ['light', 'medium', 'shield'] },
  druid: { armor: ['light', 'shield'] },
  fighter: { armor: ['light', 'medium', 'shield'], martialWeapons: true, primaryAny: true },
  monk: {},
  paladin: { armor: ['light', 'medium', 'shield'], martialWeapons: true },
  ranger: { armor: ['light', 'medium', 'shield'], martialWeapons: true, skills: { count: 1, from: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'] } },
  rogue: { armor: ['light'], skills: { count: 1, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleight_of_hand', 'stealth'] }, tools: ["Thieves' Tools"] },
  sorcerer: {},
  warlock: { armor: ['light'] },
  wizard: {},
}

/** Spells der kan castes gratis via en ressource, nøglet med klasse- eller subclass-id (ressource-id uden klassepræfiks). */
export const FREE_CASTS: Record<string, Record<string, string>> = {
  ranger: { 'hunters-mark': 'favored-enemy' },
  stars: { 'guiding-bolt': 'star-map' },
  paladin: { 'divine-smite': 'paladins-smite', 'find-steed': 'faithful-steed' },
  warlock: { 'contact-other-plane': 'contact-patron' },
}

// ---------- Typer ----------

export interface LevelFeature extends ClassFeature {
  /** Et valg, der låses op med featuren (gemmes i draft.classChoices under choice.id). */
  choice?: ChoiceDef
}

export interface Resource {
  id: string
  name: string
  max: number
  /** 'short' = alt genvindes ved short rest; 'long' = kun ved long rest (evt. delvist ved short, se shortRegain). */
  reset: 'short' | 'long'
  shortRegain?: number
  /** Terningstørrelse for ressourcer, der bruges som terninger (superiority dice o.l.). */
  die?: string
}

export interface PickOption { id: string; name: string; text: string; minLevel?: number; requires?: string }

/** Flervalg der vokser med level, fx invocations, metamagic og maneuvers. */
export interface PickGrant {
  id: string
  label: string
  /** Antal valg pr. klasselevel (index 0 = level 1). */
  counts: number[]
  options: PickOption[]
}

export interface SkillGrantAt { level: number; count: number; from: SkillId[] | 'any'; label: string }
export interface ExpertiseGrantAt { level: number; count: number; from?: SkillId[]; label: string }

export interface ClassProgression {
  features: Record<number, LevelFeature[]>
  /** Levels med Ability Score Improvement (eller feat); 19 er Epic Boon. */
  asiLevels: number[]
  subclassLevels: number[]
  caster?: CasterType
  /** Cantrips pr. level (index 0 = level 1). */
  cantrips?: number[]
  /** Forberedte spells pr. level. */
  prepared?: number[]
  weaponMastery?: number[]
  skills?: SkillGrantAt[]
  expertise?: ExpertiseGrantAt[]
  languages?: { level: number; count: number }[]
  picks?: PickGrant[]
  /** Effekter der skalerer med level (fx Monk-speed). */
  scaling?: (level: number) => OptionEffects
  resources?: (ctx: FeatureCtx) => Resource[]
}

const ASI = [4, 8, 12, 16, 19]
/** Fra en liste af [level, værdi]-trin til en tabel med 20 værdier. */
const table = (steps: [number, number][]) =>
  Array.from({ length: MAX_LEVEL }, (_, i) => steps.reduce((v, [from, value]) => (i + 1 >= from ? value : v), 0))

const FULL_PREPARED = [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22]
const HALF_PREPARED = [2, 3, 4, 5, 6, 6, 7, 7, 9, 9, 10, 10, 11, 11, 12, 12, 14, 14, 15, 15]
const modUses = (mod: number) => Math.max(1, mod)

// ---------- Valg ----------

const fightingStyle = (id: string, extra: { id: string; name: string; text: string }): ChoiceDef => ({
  id, label: 'Fighting Style', options: [...FIGHTING_STYLES, extra],
})

export const BLESSED_WARRIOR = 'blessed-warrior'
export const DRUIDIC_WARRIOR = 'druidic-warrior'

export const INVOCATIONS: PickOption[] = [
  { id: 'agonizing-blast', name: 'Agonizing Blast', minLevel: 2, text: 'Læg CHA til damage med én af dine Warlock-cantrips.' },
  { id: 'armor-of-shadows', name: 'Armor of Shadows', text: 'Cast Mage Armor på dig selv uden spell slot.' },
  { id: 'ascendant-step', name: 'Ascendant Step', minLevel: 5, text: 'Cast Levitate på dig selv uden spell slot.' },
  { id: 'devils-sight', name: "Devil's Sight", minLevel: 2, text: 'Se normalt i mørke – også magisk – op til 120 ft.' },
  { id: 'devouring-blade', name: 'Devouring Blade', minLevel: 12, requires: 'thirsting-blade', text: 'Thirsting Blade giver to ekstra angreb.' },
  { id: 'eldritch-mind', name: 'Eldritch Mind', text: 'Advantage på CON-saves for at holde concentration.' },
  { id: 'eldritch-smite', name: 'Eldritch Smite', minLevel: 5, requires: 'pact-blade', text: 'Brug et pact slot på et hit: +force damage og prone.' },
  { id: 'eldritch-spear', name: 'Eldritch Spear', minLevel: 2, text: 'En damage-cantrip får rækkevidde på 30 × level ft.' },
  { id: 'fiendish-vigor', name: 'Fiendish Vigor', minLevel: 2, text: 'Cast False Life uden spell slot med maksimale temp HP.' },
  { id: 'gaze-of-two-minds', name: 'Gaze of Two Minds', minLevel: 5, text: 'Se og hør gennem en villig humanoids sanser.' },
  { id: 'gift-of-the-depths', name: 'Gift of the Depths', minLevel: 5, text: 'Ånd under vand og swim speed; Water Breathing gratis én gang pr. long rest.' },
  { id: 'gift-of-the-protectors', name: 'Gift of the Protectors', minLevel: 9, requires: 'pact-tome', text: 'Navne i din Book of Shadows går til 1 HP i stedet for 0.' },
  { id: 'investment-of-the-chain-master', name: 'Investment of the Chain Master', minLevel: 5, requires: 'pact-chain', text: 'Din familiar bliver stærkere og bruger din spell save DC.' },
  { id: 'lessons-of-the-first-ones', name: 'Lessons of the First Ones', minLevel: 2, text: 'Få et Origin Feat (noter det selv på arket).' },
  { id: 'lifedrinker', name: 'Lifedrinker', minLevel: 9, requires: 'pact-blade', text: 'Pagtvåbnet gør +1d6 necrotic/psychic/radiant; brug en hit die til healing.' },
  { id: 'mask-of-many-faces', name: 'Mask of Many Faces', minLevel: 2, text: 'Cast Disguise Self uden spell slot.' },
  { id: 'master-of-myriad-forms', name: 'Master of Myriad Forms', minLevel: 5, text: 'Cast Alter Self uden spell slot.' },
  { id: 'misty-visions', name: 'Misty Visions', minLevel: 2, text: 'Cast Silent Image uden spell slot.' },
  { id: 'one-with-shadows', name: 'One with Shadows', minLevel: 5, text: 'I mørke: bliv usynlig med Invisibility uden spell slot.' },
  { id: 'otherworldly-leap', name: 'Otherworldly Leap', minLevel: 2, text: 'Cast Jump på dig selv uden spell slot.' },
  { id: 'pact-blade', name: 'Pact of the Blade', text: 'Fremkald et pagtvåben; brug CHA til angreb og damage.' },
  { id: 'pact-chain', name: 'Pact of the Chain', text: 'Find Familiar med særlige former (imp, sprite, quasit m.fl.).' },
  { id: 'pact-tome', name: 'Pact of the Tome', text: 'Book of Shadows med 3 ekstra cantrips og 2 level 1-ritualer fra alle klasselister.' },
  { id: 'repelling-blast', name: 'Repelling Blast', minLevel: 2, text: 'Hits med en damage-cantrip skubber målet 10 ft.' },
  { id: 'thirsting-blade', name: 'Thirsting Blade', minLevel: 5, requires: 'pact-blade', text: 'Extra Attack med dit pagtvåben.' },
  { id: 'visions-of-distant-realms', name: 'Visions of Distant Realms', minLevel: 9, text: 'Cast Arcane Eye uden spell slot.' },
  { id: 'whispers-of-the-grave', name: 'Whispers of the Grave', minLevel: 7, text: 'Cast Speak with Dead uden spell slot.' },
  { id: 'witch-sight', name: 'Witch Sight', minLevel: 15, text: 'Truesight 30 ft.' },
]

export const METAMAGIC: PickOption[] = [
  { id: 'careful', name: 'Careful Spell', text: '1 SP: valgte væsener klarer automatisk saves mod din spell.' },
  { id: 'distant', name: 'Distant Spell', text: '1 SP: dobbelt rækkevidde (eller 30 ft. for berøring).' },
  { id: 'empowered', name: 'Empowered Spell', text: '1 SP: slå op til CHA-mod damage-terninger om.' },
  { id: 'extended', name: 'Extended Spell', text: '1 SP: dobbelt varighed og advantage på concentration.' },
  { id: 'heightened', name: 'Heightened Spell', text: '2 SP: ét mål får disadvantage på sit save.' },
  { id: 'quickened', name: 'Quickened Spell', text: '2 SP: cast en Action-spell som bonus action.' },
  { id: 'seeking', name: 'Seeking Spell', text: '1 SP: slå et misset spell attack om.' },
  { id: 'subtle', name: 'Subtle Spell', text: '1 SP: cast uden verbale, somatiske og materielle komponenter.' },
  { id: 'transmuted', name: 'Transmuted Spell', text: '1 SP: skift spellens elementtype.' },
  { id: 'twinned', name: 'Twinned Spell', text: '1 SP: ram ét ekstra mål med en spell, der kun rammer ét.' },
]

export const MANEUVERS: PickOption[] = [
  { id: 'ambush', name: 'Ambush', text: 'Læg en superiority die til Stealth eller initiative.' },
  { id: 'bait-and-switch', name: 'Bait and Switch', text: 'Byt plads med en allieret; en af jer får +die til AC.' },
  { id: 'commanders-strike', name: "Commander's Strike", text: 'Opgiv et angreb: en allieret angriber som reaction med +die.' },
  { id: 'commanding-presence', name: 'Commanding Presence', text: 'Læg en die til Intimidation, Performance eller Persuasion.' },
  { id: 'disarming-attack', name: 'Disarming Attack', text: '+die damage; STR save eller målet taber en genstand.' },
  { id: 'distracting-strike', name: 'Distracting Strike', text: '+die damage; næste angreb fra en allieret har advantage.' },
  { id: 'evasive-footwork', name: 'Evasive Footwork', text: 'Disengage og +die til AC, mens du bevæger dig.' },
  { id: 'feinting-attack', name: 'Feinting Attack', text: 'Bonus action: advantage på næste angreb og +die damage.' },
  { id: 'goading-attack', name: 'Goading Attack', text: '+die damage; WIS save eller disadvantage mod andre end dig.' },
  { id: 'lunging-attack', name: 'Lunging Attack', text: 'Dash som del af et angreb og +die damage.' },
  { id: 'maneuvering-attack', name: 'Maneuvering Attack', text: '+die damage; en allieret flytter uden opportunity attacks.' },
  { id: 'menacing-attack', name: 'Menacing Attack', text: '+die damage; WIS save eller frightened.' },
  { id: 'parry', name: 'Parry', text: 'Reaction: reducer melee-skade med die + STR/DEX.' },
  { id: 'precision-attack', name: 'Precision Attack', text: 'Læg en die til et angrebsslag.' },
  { id: 'pushing-attack', name: 'Pushing Attack', text: '+die damage; STR save eller skubbet 15 ft.' },
  { id: 'rally', name: 'Rally', text: 'Bonus action: en allieret får temp HP lig die + halvt level.' },
  { id: 'riposte', name: 'Riposte', text: 'Reaction når en fjende misser dig: modangreb med +die.' },
  { id: 'sweeping-attack', name: 'Sweeping Attack', text: 'Ved hit: skad et andet væsen ved siden af med die.' },
  { id: 'tactical-assessment', name: 'Tactical Assessment', text: 'Læg en die til History, Insight eller Investigation.' },
  { id: 'trip-attack', name: 'Trip Attack', text: '+die damage; STR save eller prone.' },
]

// ---------- Klasser ----------

const BARBARIAN_SKILLS: SkillId[] = ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival']

export const PROGRESSION: Record<string, ClassProgression> = {
  barbarian: {
    asiLevels: ASI, subclassLevels: [3, 6, 10, 14],
    weaponMastery: table([[1, 2], [4, 3], [10, 4]]),
    skills: [{ level: 3, count: 1, from: BARBARIAN_SKILLS, label: 'Primal Knowledge (Barbarian)' }],
    scaling: level => (level >= 5 ? { speedBonus: 10 } : {}),
    features: {
      2: [
        { name: 'Danger Sense', text: 'Advantage på DEX-saves, medmindre du er incapacitated.', effects: { saveAdvantage: { abilities: ['dex'], note: 'Danger Sense – medmindre du er incapacitated' } } },
        { name: 'Reckless Attack', text: 'Advantage på STR-angreb denne tur – men angreb mod dig har advantage til din næste tur.' },
      ],
      3: [{ name: 'Primal Knowledge', text: 'Én ekstra Barbarian-skill; under Rage kan du bruge STR til Acrobatics, Intimidation, Perception, Stealth og Survival.' }],
      5: [
        { name: 'Extra Attack', text: 'Angrib to gange med Attack-handlingen.' },
        { name: 'Fast Movement', text: '+10 ft. speed, når du ikke bærer heavy armor.' },
      ],
      7: [
        { name: 'Feral Instinct', text: 'Advantage på initiative.' },
        { name: 'Instinctive Pounce', text: 'Bevæg dig halv speed, når du går i Rage.' },
      ],
      9: [{ name: 'Brutal Strike', text: 'Opgiv advantage fra Reckless Attack: +1d10 damage og en effekt (Forceful Blow eller Hamstring Blow).' }],
      11: [{ name: 'Relentless Rage', text: 'Falder du til 0 HP i Rage: CON save (DC 10, +5 pr. gang) for at gå til 2 × level HP.' }],
      13: [{ name: 'Improved Brutal Strike', text: 'Nye effekter: Staggering Blow og Sundering Blow.' }],
      15: [{ name: 'Persistent Rage', text: 'Rage varer 10 minutter uden at skulle holdes i gang; genvind alle Rage ved initiative én gang pr. long rest.' }],
      17: [{ name: 'Improved Brutal Strike', text: 'Brutal Strike giver +2d10 og to effekter.' }],
      18: [{ name: 'Indomitable Might', text: 'Et STR-check eller -save er mindst din STR-score.' }],
      20: [{ name: 'Primal Champion', text: '+4 STR og CON (max 25).', effects: { abilityBonus: { abilities: ['str', 'con'], amount: 4, max: 25 } } }],
    },
    resources: ({ level }) => [{ id: 'rage', name: `Rage (+${rageDamage(level)})`, max: rageUses(level), reset: 'long', shortRegain: 1 }],
  },

  bard: {
    asiLevels: ASI, subclassLevels: [3, 6, 14], caster: 'full',
    cantrips: table([[1, 2], [4, 3], [10, 4]]), prepared: FULL_PREPARED,
    expertise: [{ level: 2, count: 2, label: 'Expertise (Bard, level 2)' }, { level: 9, count: 2, label: 'Expertise (Bard, level 9)' }],
    features: {
      2: [
        { name: 'Expertise', text: 'Dobbelt proficiency bonus i 2 skills.' },
        { name: 'Jack of All Trades', text: 'Læg halv proficiency bonus til ability checks uden proficiency.', effects: { jackOfAllTrades: true } },
      ],
      5: [{ name: 'Font of Inspiration', text: 'Bardic Inspiration genvindes ved short rest; brug en spell slot for at genvinde ét brug.' }],
      7: [{ name: 'Countercharm', text: 'Reaction: lad en allieret slå et mislykket save mod charmed eller frightened om med advantage.' }],
      9: [{ name: 'Expertise', text: 'Dobbelt proficiency bonus i 2 skills mere.' }],
      10: [{ name: 'Magical Secrets', text: 'Dine forberedte spells kan komme fra Bard-, Cleric-, Druid- og Wizard-listerne.' }],
      18: [{ name: 'Superior Inspiration', text: 'Har du færre end 2 Bardic Inspiration ved initiative, får du op til 2.' }],
      20: [{ name: 'Words of Creation', text: 'Power Word Heal og Power Word Kill er altid forberedt og kan ramme to væsener.', effects: { spells: ['power-word-heal', 'power-word-kill'] } }],
    },
    resources: ({ level, mods }) => [
      { id: 'bardic-inspiration', name: `Bardic Inspiration (${bardicDie(level)})`, max: modUses(mods.cha), reset: level >= 5 ? 'short' : 'long' },
    ],
  },

  cleric: {
    asiLevels: ASI, subclassLevels: [3, 6, 17], caster: 'full',
    cantrips: table([[1, 3], [4, 4], [10, 5]]), prepared: FULL_PREPARED,
    features: {
      2: [{ name: 'Channel Divinity', text: ({ level }) => `Divine Spark (hel eller skad ${level >= 18 ? 4 : level >= 13 ? 3 : level >= 7 ? 2 : 1}d8 + WIS) og Turn Undead. Ét brug genvindes ved short rest.` }],
      5: [{ name: 'Sear Undead', text: 'Turn Undead gør også WIS-mod × d8 radiant damage.' }],
      7: [{
        name: 'Blessed Strikes', text: 'Vælg Divine Strike eller Potent Spellcasting.',
        choice: {
          id: 'blessedStrikes', label: 'Blessed Strikes', options: [
            { id: 'divine-strike', name: 'Divine Strike', text: 'Én gang pr. tur: +1d8 necrotic eller radiant med et våbenangreb.' },
            { id: 'potent-spellcasting', name: 'Potent Spellcasting', text: 'Læg WIS til damage med Cleric-cantrips.' },
          ],
        },
      }],
      10: [{ name: 'Divine Intervention', text: 'Cast en Cleric-spell af level 5 eller lavere uden slot og komponenter, én gang pr. long rest.' }],
      14: [{ name: 'Improved Blessed Strikes', text: 'Divine Strike bliver 2d8; Potent Spellcasting giver også temp HP.' }],
      20: [{ name: 'Greater Divine Intervention', text: 'Divine Intervention kan cast Wish; derefter kan den ikke bruges i 2d4 long rests.' }],
    },
    resources: ({ level }) => [
      { id: 'channel-divinity', name: 'Channel Divinity', max: channelDivinityUses(level, 'cleric'), reset: 'long', shortRegain: 1 },
      ...(level >= 10 ? [{ id: 'divine-intervention', name: 'Divine Intervention', max: 1, reset: 'long' as const }] : []),
    ],
  },

  druid: {
    asiLevels: ASI, subclassLevels: [3, 6, 10, 14], caster: 'full',
    cantrips: table([[1, 2], [4, 3], [10, 4]]), prepared: FULL_PREPARED,
    features: {
      2: [
        { name: 'Wild Shape', text: ({ level }) => `Bonus action: antag en dyreform (max CR ${level >= 8 ? '1' : level >= 4 ? '1/2' : '1/4'}${level >= 8 ? ', også flyvende' : ''}) og få ${level} temp HP. Ét brug genvindes ved short rest.` },
        { name: 'Wild Companion', text: 'Brug Wild Shape eller en spell slot til at cast Find Familiar uden materialer.' },
      ],
      5: [{ name: 'Wild Resurgence', text: 'Byt en spell slot for Wild Shape – eller Wild Shape for en level 1-slot én gang pr. long rest.' }],
      7: [{
        name: 'Elemental Fury', text: 'Vælg Potent Spellcasting eller Primal Strike.',
        choice: {
          id: 'elementalFury', label: 'Elemental Fury', options: [
            { id: 'potent-spellcasting', name: 'Potent Spellcasting', text: 'Læg WIS til damage med Druid-cantrips.' },
            { id: 'primal-strike', name: 'Primal Strike', text: 'Én gang pr. tur: +1d8 cold, fire, lightning eller thunder med et angreb.' },
          ],
        },
      }],
      15: [{ name: 'Improved Elemental Fury', text: 'Potent Spellcasting-cantrips får +300 ft. rækkevidde; Primal Strike bliver 2d8.' }],
      18: [{ name: 'Beast Spells', text: 'Du kan cast spells i Wild Shape.' }],
      20: [{ name: 'Archdruid', text: 'Genvind Wild Shape ved initiative; byt Wild Shape for spell slots; du ældes langsommere.' }],
    },
    resources: ({ level }) => (level >= 2 ? [{ id: 'wild-shape', name: 'Wild Shape', max: wildShapeUses(level), reset: 'long', shortRegain: 1 }] : []),
  },

  fighter: {
    asiLevels: [4, 6, 8, 12, 14, 16, 19], subclassLevels: [3, 7, 10, 15, 18],
    weaponMastery: table([[1, 3], [4, 4], [10, 5], [16, 6]]),
    features: {
      2: [
        { name: 'Action Surge', text: ({ level }) => `Én ekstra handling på din tur (ikke Magic). ${level >= 17 ? 2 : 1} brug pr. short rest, kun ét pr. tur.` },
        { name: 'Tactical Mind', text: 'Mislykkes et ability check, kan du bruge Second Wind til at lægge 1d10 til.' },
      ],
      5: [
        { name: 'Extra Attack', text: 'Angrib to gange med Attack-handlingen.' },
        { name: 'Tactical Shift', text: 'Når du bruger Second Wind, kan du flytte halv speed uden opportunity attacks.' },
      ],
      9: [
        { name: 'Indomitable', text: ({ level }) => `Slå et mislykket save om med +${level}. ${level >= 17 ? 3 : level >= 13 ? 2 : 1} brug pr. long rest.` },
        { name: 'Tactical Master', text: 'Byt et våbens mastery-egenskab med Push, Sap eller Slow.' },
      ],
      11: [{ name: 'Two Extra Attacks', text: 'Angrib tre gange med Attack-handlingen.' }],
      13: [{ name: 'Studied Attacks', text: 'Misser du et angreb, har dit næste angreb mod målet advantage.' }],
      20: [{ name: 'Three Extra Attacks', text: 'Angrib fire gange med Attack-handlingen.' }],
    },
    resources: ({ level }) => [
      { id: 'second-wind', name: 'Second Wind', max: secondWindUses(level), reset: 'long', shortRegain: 1 },
      ...(level >= 2 ? [{ id: 'action-surge', name: 'Action Surge', max: level >= 17 ? 2 : 1, reset: 'short' as const }] : []),
      ...(level >= 9 ? [{ id: 'indomitable', name: 'Indomitable', max: level >= 17 ? 3 : level >= 13 ? 2 : 1, reset: 'long' as const }] : []),
    ],
  },

  monk: {
    asiLevels: ASI, subclassLevels: [3, 6, 11, 17],
    scaling: level => ({ unarmoredSpeed: unarmoredMovement(level) }),
    features: {
      2: [
        { name: "Monk's Focus", text: ({ level }) => `${level} Focus Points (genvindes ved short rest) til Flurry of Blows, Patient Defense og Step of the Wind.` },
        { name: 'Unarmored Movement', text: ({ level }) => `+${unarmoredMovement(level)} ft. speed uden rustning og skjold.` },
        { name: 'Uncanny Metabolism', text: ({ level }) => `Ved initiative: genvind alle Focus Points og hel ${martialArtsDie(level)} + ${level}. Én gang pr. long rest.` },
      ],
      3: [{ name: 'Deflect Attacks', text: ({ level, mods }) => `Reaction: reducer skade fra et angreb med 1d10 + ${mods.dex + level}; når den til 0, kan du kaste angrebet tilbage for 1 Focus Point.` }],
      4: [{ name: 'Slow Fall', text: ({ level }) => `Reaction: reducer faldskade med ${5 * level}.` }],
      5: [
        { name: 'Extra Attack', text: 'Angrib to gange med Attack-handlingen.' },
        { name: 'Stunning Strike', text: 'Én gang pr. tur ved hit: 1 Focus Point – CON save eller stunned til din næste tur.' },
      ],
      6: [{ name: 'Empowered Strikes', text: 'Unarmed strikes kan gøre force damage.' }],
      7: [{ name: 'Evasion', text: 'Klarer du et DEX-save mod en områdeeffekt, tager du ingen skade (halv ved fejl).' }],
      9: [{ name: 'Acrobatic Movement', text: 'Bevæg dig langs lodrette flader og hen over væsker på din tur.' }],
      10: [
        { name: 'Heightened Focus', text: 'Flurry of Blows giver tre angreb; Patient Defense og Step of the Wind bliver stærkere.' },
        { name: 'Self-Restoration', text: 'Fjern charmed, frightened eller poisoned ved slutningen af din tur; sult og tørst giver ikke exhaustion.' },
      ],
      13: [{ name: 'Deflect Energy', text: 'Deflect Attacks virker mod alle damage types.' }],
      14: [{ name: 'Disciplined Survivor', text: 'Proficiency i alle saving throws; slå et mislykket save om for 1 Focus Point.', effects: { saves: 'all' } }],
      15: [{ name: 'Perfect Focus', text: 'Har du 3 Focus Points eller færre ved initiative, får du op til 4.' }],
      18: [{ name: 'Superior Defense', text: '3 Focus Points: resistance mod alt undtagen force i et minut.' }],
      20: [{ name: 'Body and Mind', text: '+4 DEX og WIS (max 25).', effects: { abilityBonus: { abilities: ['dex', 'wis'], amount: 4, max: 25 } } }],
    },
    resources: ({ level }) => (level >= 2 ? [
      { id: 'focus', name: 'Focus Points', max: level, reset: 'short' },
      { id: 'uncanny-metabolism', name: 'Uncanny Metabolism', max: 1, reset: 'long' },
    ] : []),
  },

  paladin: {
    asiLevels: ASI, subclassLevels: [3, 7, 15, 20], caster: 'half', prepared: HALF_PREPARED,
    features: {
      2: [
        { name: 'Fighting Style', text: 'Et Fighting Style-feat eller Blessed Warrior.', choice: fightingStyle('fightingStyle', { id: BLESSED_WARRIOR, name: 'Blessed Warrior', text: '2 Cleric-cantrips, der castes med CHA.' }) },
        { name: "Paladin's Smite", text: 'Divine Smite er altid forberedt og kan castes uden slot én gang pr. long rest.', effects: { spells: ['divine-smite'] } },
      ],
      3: [{ name: 'Channel Divinity', text: 'Divine Sense: mærk celestials, fiends og undead inden for 60 ft. Ét brug genvindes ved short rest.' }],
      5: [
        { name: 'Extra Attack', text: 'Angrib to gange med Attack-handlingen.' },
        { name: 'Faithful Steed', text: 'Find Steed er altid forberedt og kan castes uden slot én gang pr. long rest.', effects: { spells: ['find-steed'] } },
      ],
      6: [{ name: 'Aura of Protection', text: 'Du og allierede inden for 10 ft. lægger din CHA-modifier (min. +1) til saving throws.', effects: { saveBonus: 'cha' } }],
      9: [{ name: 'Abjure Foes', text: 'Channel Divinity: op til CHA-mod fjender inden for 60 ft. skal klare et WIS save eller blive frightened.' }],
      10: [{ name: 'Aura of Courage', text: 'Du og allierede i din aura er immune over for frightened.' }],
      11: [{ name: 'Radiant Strikes', text: 'Dine melee-våbenangreb gør +1d8 radiant.' }],
      14: [{ name: 'Restoring Touch', text: 'Lay on Hands kan også fjerne blinded, charmed, deafened, frightened, paralyzed og stunned.' }],
      18: [{ name: 'Aura Expansion', text: 'Dine auraer når 30 ft.' }],
    },
    resources: ({ level }) => [
      { id: 'lay-on-hands', name: 'Lay on Hands (HP)', max: 5 * level, reset: 'long' },
      ...(level >= 2 ? [{ id: 'paladins-smite', name: "Paladin's Smite (gratis)", max: 1, reset: 'long' as const }] : []),
      ...(level >= 3 ? [{ id: 'channel-divinity', name: 'Channel Divinity', max: channelDivinityUses(level, 'paladin'), reset: 'long' as const, shortRegain: 1 }] : []),
      ...(level >= 5 ? [{ id: 'faithful-steed', name: 'Faithful Steed (gratis)', max: 1, reset: 'long' as const }] : []),
    ],
  },

  ranger: {
    asiLevels: ASI, subclassLevels: [3, 7, 11, 15], caster: 'half', prepared: HALF_PREPARED,
    expertise: [{ level: 2, count: 1, label: 'Deft Explorer (Expertise)' }, { level: 9, count: 2, label: 'Expertise (Ranger, level 9)' }],
    languages: [{ level: 2, count: 2 }],
    features: {
      2: [
        { name: 'Deft Explorer', text: 'Expertise i én skill og 2 ekstra sprog.' },
        { name: 'Fighting Style', text: 'Et Fighting Style-feat eller Druidic Warrior.', choice: fightingStyle('fightingStyle', { id: DRUIDIC_WARRIOR, name: 'Druidic Warrior', text: '2 Druid-cantrips, der castes med WIS.' }) },
      ],
      5: [{ name: 'Extra Attack', text: 'Angrib to gange med Attack-handlingen.' }],
      6: [{ name: 'Roving', text: '+10 ft. speed uden heavy armor, plus climb og swim speed lig din speed.', effects: { speedBonus: 10 } }],
      9: [{ name: 'Expertise', text: 'Dobbelt proficiency bonus i 2 skills mere.' }],
      10: [{ name: 'Tireless', text: 'Magic action: temp HP lig 1d8 + WIS, WIS-mod gange pr. long rest; short rests mindsker exhaustion.' }],
      13: [{ name: 'Relentless Hunter', text: "Skade bryder ikke din concentration på Hunter's Mark." }],
      14: [{ name: "Nature's Veil", text: 'Bonus action: bliv usynlig til slutningen af din næste tur, WIS-mod gange pr. long rest.' }],
      17: [{ name: 'Precise Hunter', text: "Advantage på angreb mod målet for dit Hunter's Mark." }],
      18: [{ name: 'Feral Senses', text: 'Blindsight 30 ft.' }],
      20: [{ name: 'Foe Slayer', text: "Hunter's Mark-damage bliver d10." }],
    },
    resources: ({ level, mods }) => [
      { id: 'favored-enemy', name: "Favored Enemy (gratis Hunter's Mark)", max: favoredEnemyUses(level), reset: 'long' },
      ...(level >= 10 ? [{ id: 'tireless', name: 'Tireless', max: modUses(mods.wis), reset: 'long' as const }] : []),
      ...(level >= 14 ? [{ id: 'natures-veil', name: "Nature's Veil", max: modUses(mods.wis), reset: 'long' as const }] : []),
    ],
  },

  rogue: {
    asiLevels: [4, 8, 10, 12, 16, 19], subclassLevels: [3, 9, 13, 17],
    expertise: [{ level: 6, count: 2, label: 'Expertise (Rogue, level 6)' }],
    features: {
      2: [{ name: 'Cunning Action', text: 'Dash, Disengage eller Hide som bonus action.' }],
      3: [{ name: 'Steady Aim', text: 'Bonus action: advantage på dit næste angreb, hvis du ikke har bevæget dig denne tur.' }],
      5: [
        { name: 'Cunning Strike', text: 'Byt Sneak Attack-terninger for effekter: Poison (1d6), Trip (1d6) eller Withdraw (1d6).' },
        { name: 'Uncanny Dodge', text: 'Reaction: halvér skaden fra et angreb, du kan se.' },
      ],
      6: [{ name: 'Expertise', text: 'Dobbelt proficiency bonus i 2 skills mere.' }],
      7: [
        { name: 'Evasion', text: 'Klarer du et DEX-save mod en områdeeffekt, tager du ingen skade (halv ved fejl).' },
        { name: 'Reliable Talent', text: 'Slår du under 10 på et check med proficiency, tæller det som 10.' },
      ],
      11: [{ name: 'Improved Cunning Strike', text: 'Brug to Cunning Strike-effekter på samme Sneak Attack.' }],
      14: [{ name: 'Devious Strikes', text: 'Nye effekter: Daze (2d6), Knock Out (6d6) og Obscure (3d6).' }],
      15: [{ name: 'Slippery Mind', text: 'Proficiency i WIS- og CHA-saves.', effects: { saves: ['wis', 'cha'] } }],
      18: [{ name: 'Elusive', text: 'Angreb mod dig kan ikke have advantage, medmindre du er incapacitated.' }],
      20: [{ name: 'Stroke of Luck', text: 'Gør en mislykket d20 Test til en 20. Én gang pr. short rest.' }],
    },
    resources: ({ level }) => (level >= 20 ? [{ id: 'stroke-of-luck', name: 'Stroke of Luck', max: 1, reset: 'short' }] : []),
  },

  sorcerer: {
    asiLevels: ASI, subclassLevels: [3, 6, 14, 18], caster: 'full',
    cantrips: table([[1, 4], [4, 5], [10, 6]]), prepared: [2, 4, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 17, 18, 18, 19, 20, 21, 22],
    picks: [{ id: 'metamagic', label: 'Metamagic', counts: table([[2, 2], [10, 4], [17, 6]]), options: METAMAGIC }],
    features: {
      2: [
        { name: 'Font of Magic', text: ({ level }) => `${level} Sorcery Points; byt dem til spell slots eller omvendt.` },
        { name: 'Metamagic', text: 'To Metamagic-muligheder (flere på level 10 og 17).' },
      ],
      5: [{ name: 'Sorcerous Restoration', text: 'Genvind Sorcery Points lig halvt level ved short rest, én gang pr. long rest.' }],
      7: [{ name: 'Sorcery Incarnate', text: 'Aktiver Innate Sorcery for 2 SP; brug to Metamagic-muligheder på samme spell under den.' }],
      20: [{ name: 'Arcane Apotheosis', text: 'Under Innate Sorcery: én Metamagic pr. tur uden at bruge Sorcery Points.' }],
    },
    resources: ({ level }) => [
      { id: 'innate-sorcery', name: 'Innate Sorcery', max: 2, reset: 'long' },
      ...(level >= 2 ? [{ id: 'sorcery-points', name: 'Sorcery Points', max: level, reset: 'long' as const }] : []),
      ...(level >= 5 ? [{ id: 'sorcerous-restoration', name: 'Sorcerous Restoration', max: 1, reset: 'long' as const }] : []),
    ],
  },

  warlock: {
    asiLevels: ASI, subclassLevels: [3, 6, 10, 14], caster: 'pact',
    cantrips: table([[1, 2], [4, 3], [10, 4]]), prepared: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
    // Den første invocation vælges på level 1 (classChoices.invocation); her er de ekstra
    picks: [{ id: 'invocations', label: 'Eldritch Invocations', counts: table([[2, 2], [5, 4], [7, 5], [9, 6], [12, 7], [15, 8], [18, 9]]), options: INVOCATIONS }],
    features: {
      2: [{ name: 'Magical Cunning', text: '1 minut: genvind op til halvdelen af dine pact slots (rundet op), én gang pr. long rest.' }],
      9: [{ name: 'Contact Patron', text: 'Contact Other Plane er altid forberedt og kan castes uden slot én gang pr. long rest; du klarer automatisk savet.', effects: { spells: ['contact-other-plane'] } }],
      11: [{ name: 'Mystic Arcanum', text: 'Vælg en level 6-spell, der kan castes uden slot én gang pr. long rest (level 7, 8 og 9 kommer på level 13, 15 og 17).' }],
      20: [{ name: 'Eldritch Master', text: 'Magical Cunning genvinder alle dine pact slots.' }],
    },
    resources: ({ level }) => [
      ...(level >= 2 ? [{ id: 'magical-cunning', name: 'Magical Cunning', max: 1, reset: 'long' as const }] : []),
      ...(level >= 9 ? [{ id: 'contact-patron', name: 'Contact Patron', max: 1, reset: 'long' as const }] : []),
      ...MYSTIC_ARCANUM.filter(([lvl]) => level >= lvl).map(([, spellLevel]) => ({ id: `arcanum-${spellLevel}`, name: `Mystic Arcanum (level ${spellLevel})`, max: 1, reset: 'long' as const })),
    ],
  },

  wizard: {
    asiLevels: ASI, subclassLevels: [3, 6, 10, 14], caster: 'full',
    cantrips: table([[1, 3], [4, 4], [10, 5]]), prepared: [4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 16, 17, 18, 19, 21, 22, 23, 24, 25],
    expertise: [{ level: 2, count: 1, from: ['arcana', 'history', 'investigation', 'medicine', 'nature', 'religion'], label: 'Scholar (Expertise)' }],
    features: {
      2: [{ name: 'Scholar', text: 'Expertise i Arcana, History, Investigation, Medicine, Nature eller Religion (som du har proficiency i).' }],
      5: [{ name: 'Memorize Spell', text: 'Efter en short rest kan du bytte én forberedt spell ud med en anden fra din spellbook.' }],
      18: [{ name: 'Spell Mastery', text: 'Vælg en level 1- og en level 2-spell fra din spellbook; de kan castes på laveste level uden slot.' }],
      20: [{ name: 'Signature Spells', text: 'To level 3-spells fra din spellbook er altid forberedt og kan castes uden slot én gang hver pr. short rest.' }],
    },
    resources: () => [{ id: 'arcane-recovery', name: 'Arcane Recovery', max: 1, reset: 'long' }],
  },
}
