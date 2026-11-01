// De 48 subclasses fra 2024-reglerne (PHB), fire pr. klasse. Alle vælges på level 3.
// Kun mekanik og korte resuméer med egne ord – slå den fulde tekst op i PHB.

import { FIGHTING_STYLES, bardicDie, psionicDice, type Ability, type ChoiceDef } from './data'
import { MANEUVERS, type LevelFeature, type PickGrant, type Resource, type SkillGrantAt } from './progression'
import type { FeatureCtx } from './data'

export const SUBCLASS_LEVEL = 3

export interface Subclass {
  id: string
  classId: string
  name: string
  blurb: string
  features: Record<number, LevelFeature[]>
  /** Altid forberedte spells pr. klasselevel. */
  spells?: Record<number, string[]>
  /** Circle of the Land: spells afhænger af et valg (choice-id → option-id → level → spells). */
  spellsByChoice?: { choice: string; table: Record<string, Record<number, string[]>> }
  /** Evne til subclass-spells, når klassen ikke selv caster (fx Monk). */
  spellAbility?: Ability
  /** Third casters (Eldritch Knight, Arcane Trickster): egen spell-liste og tabeller pr. klasselevel. */
  spellcasting?: { ability: Ability; list: string; cantrips: number[]; prepared: number[] }
  skills?: SkillGrantAt[]
  picks?: PickGrant[]
  resources?: (ctx: FeatureCtx) => Resource[]
}

const table = (steps: [number, number][]) =>
  Array.from({ length: 20 }, (_, i) => steps.reduce((v, [from, value]) => (i + 1 >= from ? value : v), 0))

const THIRD_PREPARED = [0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13]
const modUses = (mod: number) => Math.max(1, mod)
const psionicResource = (level: number): Resource[] => {
  const { count, die } = psionicDice(level)
  return [{ id: 'psionic-energy', name: `Psionic Energy (${die})`, max: count, reset: 'long', shortRegain: 1, die }]
}

const choice = (id: string, label: string, options: [string, string, string][]): ChoiceDef =>
  ({ id, label, options: options.map(([oid, name, text]) => ({ id: oid, name, text })) })

const DRACONIC_TYPES = ['Acid', 'Cold', 'Fire', 'Lightning', 'Poison']

export const SUBCLASSES: Subclass[] = [
  // ---------- Barbarian ----------
  {
    id: 'berserker', classId: 'barbarian', name: 'Path of the Berserker', blurb: 'Ustyrligt raseri, der knuser alt.',
    features: {
      3: [{ name: 'Frenzy', text: 'Bruger du Reckless Attack i Rage, gør dit første hit ekstra d6\'ere lig din Rage-bonus.' }],
      6: [{ name: 'Mindless Rage', text: 'Immun over for charmed og frightened under Rage.' }],
      10: [{ name: 'Retaliation', text: 'Reaction: et melee-angreb mod den, der skader dig inden for 5 ft.' }],
      14: [{ name: 'Intimidating Presence', text: 'Bonus action: fjender inden for 30 ft. skal klare et WIS save eller blive frightened. Én gang pr. long rest.' }],
    },
  },
  {
    id: 'wild-heart', classId: 'barbarian', name: 'Path of the Wild Heart', blurb: 'Raseri forbundet med dyrenes ånder.',
    spells: { 3: ['beast-sense', 'speak-with-animals'], 10: ['commune-with-nature'] }, spellAbility: 'wis',
    features: {
      3: [
        { name: 'Animal Speaker', text: 'Cast Beast Sense og Speak with Animals som ritualer (WIS).' },
        { name: 'Rage of the Wilds', text: 'Når du går i Rage, vælger du Bear (resistance mod næsten alt), Eagle (Dash/Disengage som bonus action) eller Wolf (allierede får advantage).' },
      ],
      6: [{
        name: 'Aspect of the Wilds', text: 'Vælg et dyreaspekt (kan skiftes ved long rest).',
        choice: { id: 'aspectOfTheWilds', label: 'Aspect of the Wilds', options: [
          { id: 'owl', name: 'Owl', text: 'Darkvision 60 ft. (eller +60 ft.).', effects: { darkvision: 60 } },
          { id: 'panther', name: 'Panther', text: 'Climb speed lig din speed.' },
          { id: 'salmon', name: 'Salmon', text: 'Swim speed lig din speed.' },
        ] },
      }],
      10: [{ name: 'Nature Speaker', text: 'Cast Commune with Nature som ritual.' }],
      14: [{ name: 'Power of the Wilds', text: 'I Rage: Falcon (flyvning), Lion (fjender får disadvantage mod andre) eller Ram (slå prone).' }],
    },
  },
  {
    id: 'world-tree', classId: 'barbarian', name: 'Path of the World Tree', blurb: 'Raseri fra livets træ, der binder planerne sammen.',
    features: {
      3: [{ name: 'Vitality of the Tree', text: 'Når du går i Rage, får du temp HP lig dit level; giv allierede temp HP hver tur.' }],
      6: [{ name: 'Branches of the Tree', text: 'Reaction: teleportér et væsen inden for 30 ft. hen til dig og sænk dets speed (STR save).' }],
      10: [{ name: 'Battering Roots', text: '+10 ft. reach med Heavy- og Versatile-våben; brug Push eller Topple ved hit.' }],
      14: [{ name: 'Travel along the Tree', text: 'Teleportér 60 ft. når du går i Rage – eller 150 ft. med allierede én gang pr. Rage.' }],
    },
  },
  {
    id: 'zealot', classId: 'barbarian', name: 'Path of the Zealot', blurb: 'Raseri som guddommelig vrede.',
    features: {
      3: [
        { name: 'Divine Fury', text: ({ level }) => `I Rage: dit første hit hver tur gør +1d6 + ${Math.floor(level / 2)} necrotic eller radiant.` },
        { name: 'Warrior of the Gods', text: 'En pulje af d12\'ere, du kan bruge til at hele dig selv som bonus action.' },
      ],
      6: [{ name: 'Fanatical Focus', text: 'Én gang pr. Rage: slå et mislykket save om med bonus lig din Rage-bonus.' }],
      10: [{ name: 'Zealous Presence', text: 'Bonus action: op til 10 allierede får advantage på angreb og saves. Én gang pr. long rest.' }],
      14: [{ name: 'Rage of the Gods', text: 'Én gang pr. long rest i et minut: flyvning, resistance og genopliv allierede, der falder.' }],
    },
    resources: ({ level }) => [{ id: 'warrior-of-the-gods', name: 'Warrior of the Gods (d12)', max: level >= 17 ? 7 : level >= 12 ? 6 : level >= 6 ? 5 : 4, reset: 'long', die: 'd12' }],
  },

  // ---------- Bard ----------
  {
    id: 'dance', classId: 'bard', name: 'College of Dance', blurb: 'Magi i bevægelse og rytme.',
    features: {
      3: [{ name: 'Dazzling Footwork', text: ({ level }) => `Uden rustning og skjold: AC 10 + DEX + CHA; unarmed strikes med DEX og ${bardicDie(level)} + DEX bludgeoning.`, effects: { unarmoredDefense: { ability: 'cha', allowShield: false } } }],
      6: [
        { name: 'Inspiring Movement', text: 'Reaction når en fjende ender sin tur tæt på: du og en allieret flytter uden opportunity attacks.' },
        { name: 'Tandem Footwork', text: 'Ved initiative: brug Bardic Inspiration til at give dig og allierede en bonus.' },
      ],
      14: [{ name: 'Leading Evasion', text: 'Evasion, som du også giver allierede tæt på.' }],
    },
  },
  {
    id: 'glamour', classId: 'bard', name: 'College of Glamour', blurb: 'Feywild-charme og overjordisk nærvær.',
    spells: { 3: ['charm-person', 'mirror-image'], 6: ['command'] },
    features: {
      3: [
        { name: 'Beguiling Magic', text: 'Charm Person og Mirror Image altid forberedt; efter en enchantment/illusion-spell kan du charme eller skræmme et væsen.' },
        { name: 'Mantle of Inspiration', text: 'Bonus action: brug Bardic Inspiration til at give allierede temp HP og en gratis bevægelse.' },
      ],
      6: [{ name: 'Mantle of Majesty', text: 'Command altid forberedt; cast den som bonus action hver tur i et minut. Én gang pr. long rest.' }],
      14: [{ name: 'Unbreakable Majesty', text: 'Bonus action: fjender skal klare et CHA save for at angribe dig.' }],
    },
  },
  {
    id: 'lore', classId: 'bard', name: 'College of Lore', blurb: 'Viden, hemmeligheder og skarpe ord.',
    skills: [{ level: 3, count: 3, from: 'any', label: 'Bonus Proficiencies (College of Lore)' }],
    features: {
      3: [
        { name: 'Bonus Proficiencies', text: '3 skills efter eget valg.' },
        { name: 'Cutting Words', text: 'Reaction: træk en Bardic Inspiration-terning fra en fjendes angreb, check eller damage.' },
      ],
      6: [{ name: 'Magical Discoveries', text: '2 spells fra Cleric-, Druid- eller Wizard-listen; de er altid forberedt.' }],
      14: [{ name: 'Peerless Skill', text: 'Læg en Bardic Inspiration-terning til et mislykket check eller angreb.' }],
    },
  },
  {
    id: 'valor', classId: 'bard', name: 'College of Valor', blurb: 'Krigerbarder, der synger heltenes sange.',
    features: {
      3: [
        { name: 'Combat Inspiration', text: 'Bardic Inspiration kan også lægges til damage eller AC.' },
        { name: 'Martial Training', text: 'Martial weapons, medium armor og skjolde; brug et våben som spellcasting focus.', effects: { armor: ['medium', 'shield'], martialWeapons: true } },
      ],
      6: [{ name: 'Extra Attack', text: 'Angrib to gange; ét angreb kan erstattes af en cantrip.' }],
      14: [{ name: 'Battle Magic', text: 'Efter at have castet en spell kan du angribe som bonus action.' }],
    },
  },

  // ---------- Cleric ----------
  {
    id: 'life', classId: 'cleric', name: 'Life Domain', blurb: 'Helbredelse og livets kraft.',
    spells: { 3: ['aid', 'bless', 'cure-wounds', 'lesser-restoration'], 5: ['mass-healing-word', 'revivify'], 7: ['aura-of-life', 'death-ward'], 9: ['greater-restoration', 'mass-cure-wounds'] },
    features: {
      3: [
        { name: 'Disciple of Life', text: 'Healing-spells heler 2 + spellens level ekstra.' },
        { name: 'Preserve Life', text: ({ level }) => `Channel Divinity: fordel ${5 * level} HP healing mellem væsener under halv HP.` },
      ],
      6: [{ name: 'Blessed Healer', text: 'Når du heler andre med en spell, heler du selv 2 + spellens level.' }],
      17: [{ name: 'Supreme Healing', text: 'Healing-terninger giver altid maksimum.' }],
    },
  },
  {
    id: 'light', classId: 'cleric', name: 'Light Domain', blurb: 'Ild, lys og åbenbaring.',
    spells: { 3: ['burning-hands', 'faerie-fire', 'scorching-ray', 'see-invisibility'], 5: ['daylight', 'fireball'], 7: ['arcane-eye', 'wall-of-fire'], 9: ['flame-strike', 'scrying'] },
    features: {
      3: [
        { name: 'Radiance of the Dawn', text: ({ level }) => `Channel Divinity: fjern magisk mørke og gør 2d10 + ${level} radiant mod fjender inden for 30 ft. (CON save).` },
        { name: 'Warding Flare', text: 'Reaction: giv disadvantage på et angreb mod dig eller en allieret.' },
      ],
      6: [{ name: 'Improved Warding Flare', text: 'Warding Flare genvindes ved short rest og giver temp HP.' }],
      17: [{ name: 'Corona of Light', text: 'Aura af sollys: fjender har disadvantage på saves mod fire og radiant.' }],
    },
    resources: ({ mods }) => [{ id: 'warding-flare', name: 'Warding Flare', max: modUses(mods.wis), reset: 'long' }],
  },
  {
    id: 'trickery', classId: 'cleric', name: 'Trickery Domain', blurb: 'List, illusioner og bedrag.',
    spells: { 3: ['charm-person', 'disguise-self', 'invisibility', 'pass-without-trace'], 5: ['hypnotic-pattern', 'nondetection'], 7: ['confusion', 'dimension-door'], 9: ['dominate-person', 'modify-memory'] },
    features: {
      3: [
        { name: 'Blessing of the Trickster', text: 'Giv en allieret advantage på Stealth i en time.' },
        { name: 'Invoke Duplicity', text: 'Channel Divinity: en illusorisk kopi, du kan caste fra og få advantage ved.' },
      ],
      6: [{ name: "Trickster's Transposition", text: 'Byt plads med din illusoriske kopi.' }],
      17: [{ name: 'Improved Duplicity', text: 'Allierede får advantage ved kopien; den heler, når den forsvinder.' }],
    },
  },
  {
    id: 'war', classId: 'cleric', name: 'War Domain', blurb: 'Krig, mod og sejr.',
    spells: { 3: ['guiding-bolt', 'magic-weapon', 'shield-of-faith', 'spiritual-weapon'], 5: ['crusaders-mantle', 'spirit-guardians'], 7: ['fire-shield', 'freedom-of-movement'], 9: ['hold-monster', 'steel-wind-strike'] },
    features: {
      3: [
        { name: 'Guided Strike', text: 'Channel Divinity: +10 på et angreb fra dig eller en allieret.' },
        { name: 'War Priest', text: 'Bonus action: ét våbenangreb eller unarmed strike, WIS-mod gange pr. short rest.' },
      ],
      6: [{ name: "War God's Blessing", text: 'Channel Divinity: cast Shield of Faith eller Spiritual Weapon uden slot og concentration.' }],
      17: [{ name: 'Avatar of Battle', text: 'Resistance mod bludgeoning, piercing og slashing.', effects: { resistances: ['Bludgeoning', 'Piercing', 'Slashing'] } }],
    },
    resources: ({ mods }) => [{ id: 'war-priest', name: 'War Priest', max: modUses(mods.wis), reset: 'short' }],
  },

  // ---------- Druid ----------
  {
    id: 'land', classId: 'druid', name: 'Circle of the Land', blurb: 'Magi fra landskabet, du er knyttet til.',
    spellsByChoice: {
      choice: 'land',
      table: {
        arid: { 3: ['blur', 'burning-hands', 'fire-bolt'], 5: ['fireball'], 7: ['blight'], 9: ['wall-of-stone'] },
        polar: { 3: ['fog-cloud', 'hold-person', 'ray-of-frost'], 5: ['sleet-storm'], 7: ['ice-storm'], 9: ['cone-of-cold'] },
        temperate: { 3: ['misty-step', 'shocking-grasp', 'sleep'], 5: ['lightning-bolt'], 7: ['freedom-of-movement'], 9: ['tree-stride'] },
        tropical: { 3: ['acid-splash', 'ray-of-sickness', 'web'], 5: ['stinking-cloud'], 7: ['polymorph'], 9: ['insect-plague'] },
      },
    },
    features: {
      3: [
        { name: 'Circle of the Land Spells', text: 'Spells efter din valgte landtype er altid forberedt (kan skiftes ved long rest).', choice: choice('land', 'Landtype', [
          ['arid', 'Arid', 'Ørken og stepper: ild og sten.'], ['polar', 'Polar', 'Is og sne: kulde og tåge.'],
          ['temperate', 'Temperate', 'Skove og enge: lyn og søvn.'], ['tropical', 'Tropical', 'Jungle: syre, gift og spind.'],
        ]) },
        { name: "Land's Aid", text: ({ level }) => `Wild Shape: ${level >= 14 ? 4 : level >= 10 ? 3 : 2}d6 necrotic i en 10 ft. kugle (CON save) og hel en allieret samme mængde.` },
      ],
      6: [{ name: 'Natural Recovery', text: 'Cast én circle spell uden slot pr. long rest; genvind spell slots ved short rest.' }],
      10: [{ name: "Nature's Ward", text: 'Immun over for poisoned; resistance efter din landtype.' }],
      14: [{ name: "Nature's Sanctuary", text: 'Wild Shape: spektrale træer giver dig og allierede half cover og resistance.' }],
    },
  },
  {
    id: 'moon', classId: 'druid', name: 'Circle of the Moon', blurb: 'Mester i dyreformer under månens lys.',
    spells: { 3: ['cure-wounds', 'moonbeam', 'starry-wisp'], 5: ['conjure-animals'], 7: ['fount-of-moonlight'], 9: ['mass-cure-wounds'] },
    features: {
      3: [{ name: 'Circle Forms', text: ({ level }) => `Wild Shape i former op til CR ${Math.max(1, Math.floor(level / 3))}; AC mindst 13 + WIS og ${3 * level} temp HP.` }],
      6: [{ name: 'Improved Circle Forms', text: 'Dine angreb i Wild Shape kan gøre radiant damage; læg WIS til CON-saves.' }],
      10: [{ name: 'Moonlight Step', text: 'Bonus action: teleportér 30 ft. og få advantage på dit næste angreb.' }],
      14: [{ name: 'Lunar Form', text: '+2d10 radiant én gang pr. tur i Wild Shape; Moonlight Step kan tage en allieret med.' }],
    },
  },
  {
    id: 'sea', classId: 'druid', name: 'Circle of the Sea', blurb: 'Havets storme og tidevand.',
    spells: { 3: ['fog-cloud', 'gust-of-wind', 'ray-of-frost', 'shatter', 'thunderwave'], 5: ['lightning-bolt', 'water-breathing'], 7: ['control-water', 'ice-storm'], 9: ['conjure-elemental', 'hold-monster'] },
    features: {
      3: [{ name: 'Wrath of the Sea', text: 'Wild Shape: en aura af havsprøjt; som bonus action CON save eller cold damage og skub.' }],
      6: [{ name: 'Aquatic Affinity', text: 'Auraen bliver 10 ft. større; swim speed lig din speed.' }],
      10: [{ name: 'Stormborn', text: 'Under Wrath of the Sea: fly speed og resistance mod cold, lightning og thunder.' }],
      14: [{ name: 'Oceanic Gift', text: 'Giv Wrath of the Sea til en allieret – eller begge jer.' }],
    },
  },
  {
    id: 'stars', classId: 'druid', name: 'Circle of the Stars', blurb: 'Stjernebilleder og kosmisk magi.',
    spells: { 3: ['guidance', 'guiding-bolt'] },
    features: {
      3: [
        { name: 'Star Map', text: 'Guidance og Guiding Bolt altid forberedt; Guiding Bolt uden slot WIS-mod gange pr. long rest.' },
        { name: 'Starry Form', text: 'Wild Shape: bliv til et stjernebillede – Archer (ranged angreb), Chalice (ekstra healing) eller Dragon (minimum 10 på checks).' },
      ],
      6: [{ name: 'Cosmic Omen', text: 'Reaction: læg 1d6 til eller træk 1d6 fra et slag, WIS-mod gange pr. long rest.' }],
      10: [{ name: 'Twinkling Constellations', text: 'Starry Form bliver stærkere; Dragon giver flyvning; skift form hver tur.' }],
      14: [{ name: 'Full of Stars', text: 'Resistance mod bludgeoning, piercing og slashing i Starry Form.' }],
    },
    resources: ({ mods, level }) => [
      { id: 'star-map', name: 'Star Map (Guiding Bolt)', max: modUses(mods.wis), reset: 'long' },
      ...(level >= 6 ? [{ id: 'cosmic-omen', name: 'Cosmic Omen', max: modUses(mods.wis), reset: 'long' as const }] : []),
    ],
  },

  // ---------- Fighter ----------
  {
    id: 'battle-master', classId: 'fighter', name: 'Battle Master', blurb: 'Taktiker med kampmanøvrer.',
    skills: [{ level: 3, count: 1, from: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'persuasion', 'perception', 'survival'], label: 'Student of War (Battle Master)' }],
    picks: [{ id: 'maneuvers', label: 'Maneuvers', counts: table([[3, 3], [7, 5], [10, 7], [15, 9]]), options: MANEUVERS }],
    features: {
      3: [
        { name: 'Combat Superiority', text: 'Manøvrer drevet af superiority dice (genvindes ved short rest). Save DC 8 + PB + STR/DEX.' },
        { name: 'Student of War', text: "Proficiency med ét Artisan's Tool og én Fighter-skill." },
      ],
      7: [{ name: 'Know Your Enemy', text: 'Bonus action: lær et væsens immuniteter, resistances og vulnerabilities.' }],
      10: [{ name: 'Improved Combat Superiority', text: 'Superiority dice bliver d10.' }],
      15: [{ name: 'Relentless', text: 'Én gang pr. tur: brug en d8 i stedet for en superiority die.' }],
      18: [{ name: 'Ultimate Combat Superiority', text: 'Superiority dice bliver d12.' }],
    },
    resources: ({ level }) => [{ id: 'superiority', name: `Superiority Dice (d${level >= 18 ? 12 : level >= 10 ? 10 : 8})`, max: level >= 15 ? 6 : level >= 7 ? 5 : 4, reset: 'short', die: `d${level >= 18 ? 12 : level >= 10 ? 10 : 8}` }],
  },
  {
    id: 'champion', classId: 'fighter', name: 'Champion', blurb: 'Rå atletik og ødelæggende kritiske slag.',
    features: {
      3: [
        { name: 'Improved Critical', text: 'Crit på 19–20.' },
        { name: 'Remarkable Athlete', text: 'Advantage på initiative og Athletics; efter en crit kan du flytte halv speed.' },
      ],
      7: [{ name: 'Additional Fighting Style', text: 'Et ekstra Fighting Style-feat.', choice: { id: 'fightingStyle2', label: 'Additional Fighting Style', options: FIGHTING_STYLES } }],
      10: [{ name: 'Heroic Warrior', text: 'Har du ikke Heroic Inspiration ved starten af din tur, får du den.' }],
      15: [{ name: 'Superior Critical', text: 'Crit på 18–20.' }],
      18: [{ name: 'Survivor', text: 'Advantage på death saves; under halv HP heler du 5 + CON hver tur.' }],
    },
  },
  {
    id: 'eldritch-knight', classId: 'fighter', name: 'Eldritch Knight', blurb: 'Kriger, der blander våben og Wizard-magi.',
    spellcasting: { ability: 'int', list: 'wizard', cantrips: table([[3, 2], [10, 3]]), prepared: THIRD_PREPARED },
    features: {
      3: [
        { name: 'Spellcasting', text: 'Wizard-spells med INT.' },
        { name: 'War Bond', text: 'Bind op til to våben til dig; kald dem til din hånd som bonus action.' },
      ],
      7: [{ name: 'War Magic', text: 'Erstat ét angreb med en Wizard-cantrip.' }],
      10: [{ name: 'Eldritch Strike', text: 'Et hit giver målet disadvantage på næste save mod dine spells.' }],
      15: [{ name: 'Arcane Charge', text: 'Teleportér 30 ft. når du bruger Action Surge.' }],
      18: [{ name: 'Improved War Magic', text: 'Erstat to angreb med en level 1- eller 2-spell.' }],
    },
  },
  {
    id: 'psi-warrior', classId: 'fighter', name: 'Psi Warrior', blurb: 'Kriger med psionisk telekinese.',
    features: {
      3: [{ name: 'Psionic Power', text: 'Psionic Energy-terninger: Protective Field (reducer skade), Psionic Strike (+force damage) og Telekinetic Movement.' }],
      7: [{ name: 'Telekinetic Adept', text: 'Psi-Powered Leap (fly speed) og Telekinetic Thrust (skub eller prone).' }],
      10: [{ name: 'Guarded Mind', text: 'Resistance mod psychic; brug en terning til at fjerne charmed eller frightened.', effects: { resistances: ['Psychic'] } }],
      15: [{ name: 'Bulwark of Force', text: 'Bonus action: giv dig og allierede half cover i et minut.' }],
      18: [{ name: 'Telekinetic Master', text: 'Cast Telekinesis uden slot; angrib som bonus action mens du holder den.' }],
    },
    resources: ({ level }) => psionicResource(level),
  },

  // ---------- Monk ----------
  {
    id: 'mercy', classId: 'monk', name: 'Warrior of Mercy', blurb: 'Healer og dræber med samme hånd.',
    features: {
      3: [
        { name: 'Hand of Harm', text: 'Ved hit, 1 Focus Point: +martial arts-terning + WIS necrotic.' },
        { name: 'Hand of Healing', text: 'Erstat et angreb i Flurry of Blows, 1 Focus Point: hel martial arts-terning + WIS.' },
        { name: 'Implements of Mercy', text: 'Proficiency i Insight, Medicine og Herbalism Kit.', effects: { skillProficiencies: ['insight', 'medicine'], toolProficiencies: ['Herbalism Kit'] } },
      ],
      6: [{ name: "Physician's Touch", text: 'Hand of Healing fjerner conditions; Hand of Harm gør målet poisoned.' }],
      11: [{ name: 'Flurry of Healing and Harm', text: 'Brug Hand of Harm og Hand of Healing gratis under Flurry of Blows.' }],
      17: [{ name: 'Hand of Ultimate Mercy', text: '5 Focus Points: genopliv et væsen, der døde inden for 24 timer. Én gang pr. long rest.' }],
    },
  },
  {
    id: 'shadow', classId: 'monk', name: 'Warrior of Shadow', blurb: 'Skyggernes snigende kæmper.',
    spells: { 3: ['darkness', 'minor-illusion'] }, spellAbility: 'wis',
    features: {
      3: [{ name: 'Shadow Arts', text: 'Cast Darkness for 1 Focus Point og se igennem det; kend Minor Illusion; darkvision 60 ft.', effects: { darkvision: 60 } }],
      6: [{ name: 'Shadow Step', text: 'Bonus action: teleportér 60 ft. mellem skygger og få advantage på næste melee-angreb.' }],
      11: [{ name: 'Improved Shadow Step', text: 'Shadow Step virker også i lys for 1 Focus Point; angrib efter teleporten.' }],
      17: [{ name: 'Cloak of Shadows', text: '3 Focus Points: bliv usynlig i dæmpet lys og mørke, og gå gennem væsener.' }],
    },
  },
  {
    id: 'elements', classId: 'monk', name: 'Warrior of the Elements', blurb: 'Kampkunst med elementernes kraft.',
    spells: { 3: ['elementalism'] }, spellAbility: 'wis',
    features: {
      3: [
        { name: 'Elemental Attunement', text: '1 Focus Point: +10 ft. reach og elementær damage, der kan skubbe eller trække.' },
        { name: 'Manipulate Elements', text: 'Du kender Elementalism-cantrip (WIS).' },
      ],
      6: [{ name: 'Elemental Burst', text: '2 Focus Points: 20 ft. kugle af elementær energi, 3 × martial arts-terning.' }],
      11: [{ name: 'Stride of the Elements', text: 'Under Elemental Attunement: fly og swim speed lig din speed.' }],
      17: [{ name: 'Elemental Epitome', text: 'Under Attunement: resistance, ekstra damage og bevægelse, der skader.' }],
    },
  },
  {
    id: 'open-hand', classId: 'monk', name: 'Warrior of the Open Hand', blurb: 'Mester i ubevæbnet kamp.',
    features: {
      3: [{ name: 'Open Hand Technique', text: 'Hits med Flurry of Blows kan fjerne reactions, skubbe 15 ft. eller slå prone.' }],
      6: [{ name: 'Wholeness of Body', text: 'Bonus action: hel martial arts-terning + WIS, WIS-mod gange pr. long rest.' }],
      11: [{ name: 'Fleet Step', text: 'Brug Step of the Wind straks efter en anden bonus action.' }],
      17: [{ name: 'Quivering Palm', text: '4 Focus Points: dødelige vibrationer – CON save eller 10d12 force.' }],
    },
    resources: ({ mods, level }) => (level >= 6 ? [{ id: 'wholeness-of-body', name: 'Wholeness of Body', max: modUses(mods.wis), reset: 'long' }] : []),
  },

  // ---------- Paladin ----------
  {
    id: 'devotion', classId: 'paladin', name: 'Oath of Devotion', blurb: 'Ærlighed, mod og retfærdighed.',
    spells: { 3: ['protection-from-evil-and-good', 'shield-of-faith'], 5: ['aid', 'zone-of-truth'], 9: ['beacon-of-hope', 'dispel-magic'], 13: ['freedom-of-movement', 'guardian-of-faith'], 17: ['commune', 'flame-strike'] },
    features: {
      3: [{ name: 'Sacred Weapon', text: 'Channel Divinity: læg CHA til angreb med et våben i 10 minutter; det lyser og kan gøre radiant.' }],
      7: [{ name: 'Aura of Devotion', text: 'Du og allierede i din aura er immune over for charmed.' }],
      15: [{ name: 'Smite of Protection', text: 'Når du caster Divine Smite, får allierede i auraen half cover.' }],
      20: [{ name: 'Holy Nimbus', text: 'Bonus action i 10 minutter: sollys-aura, advantage mod fiends og undead, radiant damage. Én gang pr. long rest.' }],
    },
  },
  {
    id: 'glory', classId: 'paladin', name: 'Oath of Glory', blurb: 'Heroiske dåder og legendarisk styrke.',
    spells: { 3: ['guiding-bolt', 'heroism'], 5: ['enhance-ability', 'magic-weapon'], 9: ['haste', 'protection-from-energy'], 13: ['compulsion', 'freedom-of-movement'], 17: ['legend-lore', 'yolandes-regal-presence'] },
    features: {
      3: [
        { name: 'Inspiring Smite', text: ({ level }) => `Efter Divine Smite: fordel 2d8 + ${level} temp HP blandt væsener inden for 30 ft.` },
        { name: 'Peerless Athlete', text: 'Channel Divinity: advantage på Athletics og Acrobatics og længere spring i en time.' },
      ],
      7: [{ name: 'Aura of Alacrity', text: '+10 ft. speed; allierede, der starter turen i auraen, får også +10 ft.', effects: { speedBonus: 10 } }],
      15: [{ name: 'Glorious Defense', text: 'Reaction: læg CHA til AC mod et angreb; misser det, kan du modangribe.' }],
      20: [{ name: 'Living Legend', text: 'I 10 minutter: advantage på CHA-checks, gør et miss til hit og slå saves om. Én gang pr. long rest.' }],
    },
  },
  {
    id: 'ancients', classId: 'paladin', name: 'Oath of the Ancients', blurb: 'Lys, liv og naturens skønhed.',
    spells: { 3: ['ensnaring-strike', 'speak-with-animals'], 5: ['misty-step', 'moonbeam'], 9: ['plant-growth', 'protection-from-energy'], 13: ['ice-storm', 'stoneskin'], 17: ['commune-with-nature', 'tree-stride'] },
    features: {
      3: [{ name: "Nature's Wrath", text: 'Channel Divinity: spektrale ranker restrainer fjender inden for 15 ft. (STR save).' }],
      7: [{ name: 'Aura of Warding', text: 'Du og allierede i auraen har resistance mod necrotic, psychic og radiant.', effects: { resistances: ['Necrotic', 'Psychic', 'Radiant'] } }],
      15: [{ name: 'Undying Sentinel', text: 'Gå til 1 HP i stedet for 0 én gang pr. long rest; du ældes ikke synligt.' }],
      20: [{ name: 'Elder Champion', text: 'I et minut: regenerér HP, cast som bonus action, og fjender har disadvantage på saves. Én gang pr. long rest.' }],
    },
  },
  {
    id: 'vengeance', classId: 'paladin', name: 'Oath of Vengeance', blurb: 'Uforsonlig straf over de skyldige.',
    spells: { 3: ['bane', 'hunters-mark'], 5: ['hold-person', 'misty-step'], 9: ['haste', 'protection-from-energy'], 13: ['banishment', 'dimension-door'], 17: ['hold-monster', 'scrying'] },
    features: {
      3: [{ name: 'Vow of Enmity', text: 'Channel Divinity: advantage på angreb mod ét væsen i et minut.' }],
      7: [{ name: 'Relentless Avenger', text: 'Efter en opportunity attack: sænk målets speed til 0 og flyt halv speed.' }],
      15: [{ name: 'Soul of Vengeance', text: 'Reaction: angrib målet for din Vow of Enmity, når det angriber.' }],
      20: [{ name: 'Avenging Angel', text: 'I 10 minutter: fly speed 60 ft. og en frygt-aura. Én gang pr. long rest.' }],
    },
  },

  // ---------- Ranger ----------
  {
    id: 'beast-master', classId: 'ranger', name: 'Beast Master', blurb: 'Jæger med et trofast dyr ved sin side.',
    features: {
      3: [{ name: 'Primal Companion', text: 'Et dyr fra land, hav eller himmel, der handler på din tur og angriber på kommando.' }],
      7: [{ name: 'Exceptional Training', text: 'Dyret kan Dash/Disengage/Dodge/Help som bonus action; dets angreb kan gøre force damage.' }],
      11: [{ name: 'Bestial Fury', text: "Dyret angriber to gange og kan udløse Hunter's Mark-damage." }],
      15: [{ name: 'Share Spells', text: 'Spells, du caster på dig selv, kan også ramme dit dyr.' }],
    },
  },
  {
    id: 'fey-wanderer', classId: 'ranger', name: 'Fey Wanderer', blurb: 'Vandrer med Feywildens glimmer.',
    spells: { 3: ['charm-person'], 5: ['misty-step'], 9: ['summon-fey'], 13: ['dimension-door'], 17: ['mislead'] },
    skills: [{ level: 3, count: 1, from: ['deception', 'performance', 'persuasion'], label: 'Otherworldly Glamour (Fey Wanderer)' }],
    features: {
      3: [
        { name: 'Dreadful Strikes', text: ({ level }) => `Én gang pr. tur pr. mål: +1d${level >= 11 ? 6 : 4} psychic med et våbenhit.` },
        { name: 'Otherworldly Glamour', text: 'Læg WIS (min. +1) til CHA-checks; proficiency i Deception, Performance eller Persuasion.' },
      ],
      7: [{ name: 'Beguiling Twist', text: 'Advantage mod charmed/frightened; reaction: charm eller skræm et væsen, når nogen klarer et sådant save.' }],
      11: [{ name: 'Fey Reinforcements', text: 'Summon Fey uden materialer og uden slot én gang pr. long rest.' }],
      15: [{ name: 'Misty Wanderer', text: 'Misty Step uden slot WIS-mod gange; tag en allieret med.' }],
    },
  },
  {
    id: 'gloom-stalker', classId: 'ranger', name: 'Gloom Stalker', blurb: 'Jæger, der hører hjemme i mørket.',
    spells: { 3: ['disguise-self'], 5: ['rope-trick'], 9: ['fear'], 13: ['greater-invisibility'], 17: ['seeming'] },
    features: {
      3: [
        { name: 'Dread Ambusher', text: '+WIS på initiative; første tur +10 ft. speed og +2d6 psychic ved hit, WIS-mod gange pr. long rest.', effects: { initiativeBonus: 'wis' } },
        { name: 'Umbral Sight', text: 'Darkvision 60 ft. (eller +60 ft.); usynlig for væsener, der ser med darkvision.', effects: { darkvision: 60 } },
      ],
      7: [{ name: 'Iron Mind', text: 'Proficiency i WIS-saves.', effects: { saves: ['wis'] } }],
      11: [{ name: "Stalker's Flurry", text: 'Dread Ambusher kan i stedet give et ekstra angreb eller skræmme fjender omkring målet.' }],
      15: [{ name: 'Shadowy Dodge', text: 'Reaction: giv disadvantage på et angreb mod dig og teleportér 30 ft.' }],
    },
  },
  {
    id: 'hunter', classId: 'ranger', name: 'Hunter', blurb: 'Specialist i at nedlægge farlige bæster.',
    features: {
      3: [
        { name: "Hunter's Lore", text: "Du kender immuniteter, resistances og vulnerabilities hos målet for dit Hunter's Mark." },
        { name: "Hunter's Prey", text: 'Vælg Colossus Slayer eller Horde Breaker (kan skiftes ved rest).', choice: choice('huntersPrey', "Hunter's Prey", [
          ['colossus-slayer', 'Colossus Slayer', '+1d8 damage én gang pr. tur mod et såret mål.'],
          ['horde-breaker', 'Horde Breaker', 'Ét ekstra angreb mod et andet væsen ved siden af målet.'],
        ]) },
      ],
      7: [{ name: 'Defensive Tactics', text: 'Vælg Escape the Horde eller Multiattack Defense (kan skiftes ved rest).', choice: choice('defensiveTactics', 'Defensive Tactics', [
        ['escape-the-horde', 'Escape the Horde', 'Opportunity attacks mod dig har disadvantage.'],
        ['multiattack-defense', 'Multiattack Defense', 'Efter et hit har det væsens øvrige angreb disadvantage.'],
      ]) }],
      11: [{ name: "Superior Hunter's Prey", text: "Hunter's Mark-damage kan også ramme et andet væsen tæt på." }],
      15: [{ name: "Superior Hunter's Defense", text: 'Reaction: resistance mod skaden og den samme type resten af turen.' }],
    },
  },

  // ---------- Rogue ----------
  {
    id: 'arcane-trickster', classId: 'rogue', name: 'Arcane Trickster', blurb: 'Tyv med illusioner og fortryllelser.',
    spells: { 3: ['mage-hand'] },
    spellcasting: { ability: 'int', list: 'wizard', cantrips: table([[3, 2], [10, 3]]), prepared: THIRD_PREPARED },
    features: {
      3: [
        { name: 'Spellcasting', text: 'Wizard-spells med INT; du kender Mage Hand.' },
        { name: 'Mage Hand Legerdemain', text: 'Usynlig Mage Hand, der kan stjæle og dirke låse med Sleight of Hand.' },
      ],
      9: [{ name: 'Magical Ambush', text: 'Er du skjult, har målet disadvantage på saves mod dine spells.' }],
      13: [{ name: 'Versatile Trickster', text: 'Mage Hand distraherer et væsen og giver dig advantage.' }],
      17: [{ name: 'Spell Thief', text: 'Reaction: stjæl en spell, der castes mod dig, i 8 timer.' }],
    },
  },
  {
    id: 'assassin', classId: 'rogue', name: 'Assassin', blurb: 'Dødbringende baghold og forklædning.',
    features: {
      3: [
        { name: 'Assassinate', text: 'Advantage på initiative; første runde har du advantage mod væsener, der ikke har haft en tur, og +level damage.' },
        { name: "Assassin's Tools", text: "Proficiency med Disguise Kit og Poisoner's Kit.", effects: { toolProficiencies: ['Disguise Kit', "Poisoner's Kit"] } },
      ],
      9: [{ name: 'Infiltration Expertise', text: 'Falske identiteter; Steady Aim sænker ikke din speed.' }],
      13: [{ name: 'Envenom Weapons', text: 'Cunning Strike: Poison gør også 2d6 poison damage.' }],
      17: [{ name: 'Death Strike', text: 'Første runde: CON save eller dobbelt skade fra dit hit.' }],
    },
  },
  {
    id: 'soulknife', classId: 'rogue', name: 'Soulknife', blurb: 'Psioniske klinger fra sindet.',
    features: {
      3: [
        { name: 'Psionic Power', text: 'Psionic Energy-terninger: Psi-Bolstered Knack (+terning på mislykket check) og Psychic Whispers (telepati).' },
        { name: 'Psychic Blades', text: 'Klinger af psykisk energi: 1d6 psychic (1d4 for det ekstra angreb), Finesse og Thrown (60 ft.).' },
      ],
      9: [{ name: 'Soul Blades', text: 'Homing Strikes (+terning på et miss) og Psychic Teleportation.' }],
      13: [{ name: 'Psychic Veil', text: 'Bliv usynlig i en time. Én gang pr. long rest (eller for en terning).' }],
      17: [{ name: 'Rend Mind', text: 'Sneak Attack med Psychic Blades: WIS save eller stunned i et minut.' }],
    },
    resources: ({ level }) => psionicResource(level),
  },
  {
    id: 'thief', classId: 'rogue', name: 'Thief', blurb: 'Indbrud, akrobatik og fingerfærdighed.',
    features: {
      3: [
        { name: 'Fast Hands', text: 'Cunning Action: Sleight of Hand, dirke en lås eller Use an Object.' },
        { name: 'Second-Story Work', text: 'Climb speed lig din speed; spring længere med DEX.' },
      ],
      9: [{ name: 'Supreme Sneak', text: 'Cunning Strike: Stealth Attack – forbliv skjult efter angrebet.' }],
      13: [{ name: 'Use Magic Device', text: 'Fire attunement-pladser; brug scrolls og ladninger mere effektivt.' }],
      17: [{ name: "Thief's Reflexes", text: 'To ture i første runde af en kamp.' }],
    },
  },

  // ---------- Sorcerer ----------
  {
    id: 'aberrant', classId: 'sorcerer', name: 'Aberrant Sorcery', blurb: 'Magi fra en fremmed, psionisk påvirkning.',
    spells: { 3: ['arms-of-hadar', 'calm-emotions', 'detect-thoughts', 'dissonant-whispers', 'mind-sliver'], 5: ['hunger-of-hadar', 'sending'], 7: ['evards-black-tentacles', 'summon-aberration'], 9: ['rarys-telepathic-bond', 'telekinesis'] },
    features: {
      3: [
        { name: 'Psionic Spells', text: 'Aberrante spells er altid forberedt.' },
        { name: 'Telepathic Speech', text: 'Telepati med et væsen inden for en mil i et antal minutter lig dit level.' },
      ],
      6: [
        { name: 'Psionic Sorcery', text: 'Cast psionic spells for Sorcery Points uden komponenter.' },
        { name: 'Psychic Defenses', text: 'Resistance mod psychic; advantage mod charmed og frightened.', effects: { resistances: ['Psychic'] } },
      ],
      14: [{ name: 'Revelation in Flesh', text: 'Sorcery Points: flyvning, swim speed, se usynligt eller glid gennem små åbninger.' }],
      18: [{ name: 'Warping Implosion', text: 'Teleportér og træk væsener ind: STR save eller 3d10 force. Én gang pr. long rest.' }],
    },
  },
  {
    id: 'clockwork', classId: 'sorcerer', name: 'Clockwork Sorcery', blurb: 'Orden fra Mechanus.',
    spells: { 3: ['aid', 'alarm', 'lesser-restoration', 'protection-from-evil-and-good'], 5: ['dispel-magic', 'protection-from-energy'], 7: ['freedom-of-movement', 'summon-construct'], 9: ['greater-restoration', 'wall-of-force'] },
    features: {
      3: [
        { name: 'Clockwork Spells', text: 'Ordenens spells er altid forberedt.' },
        { name: 'Restore Balance', text: 'Reaction: ophæv advantage eller disadvantage på et slag, CHA-mod gange pr. long rest.' },
      ],
      6: [{ name: 'Bastion of Law', text: '1–5 Sorcery Points: et skjold af d8\'ere, der absorberer skade.' }],
      14: [{ name: 'Trance of Order', text: 'I et minut: angreb mod dig har ikke advantage, og dine d20-slag under 10 tæller som 10.' }],
      18: [{ name: 'Clockwork Cavalcade', text: 'Hel 100 HP fordelt, reparér genstande og afslut spells. Én gang pr. long rest.' }],
    },
    resources: ({ mods }) => [{ id: 'restore-balance', name: 'Restore Balance', max: modUses(mods.cha), reset: 'long' }],
  },
  {
    id: 'draconic', classId: 'sorcerer', name: 'Draconic Sorcery', blurb: 'Drageblod i dine årer.',
    spells: { 3: ['alter-self', 'chromatic-orb', 'command', 'dragons-breath'], 5: ['fear', 'fly'], 7: ['arcane-eye', 'charm-monster'], 9: ['legend-lore', 'summon-dragon'] },
    features: {
      3: [
        { name: 'Draconic Resilience', text: '+1 max HP pr. Sorcerer-level; uden rustning er din AC 10 + DEX + CHA.', effects: { hpPerLevel: 1, unarmoredDefense: { ability: 'cha', allowShield: true } } },
        { name: 'Draconic Spells', text: 'Drage-spells er altid forberedt.' },
      ],
      6: [{
        name: 'Elemental Affinity', text: 'Resistance mod din drages damage type, og læg CHA til spell-damage af den type.',
        choice: { id: 'elementalAffinity', label: 'Elemental Affinity', options: DRACONIC_TYPES.map(type => ({ id: type.toLowerCase(), name: type, text: `Resistance mod ${type.toLowerCase()}; +CHA på ${type.toLowerCase()}-spell-damage.`, effects: { resistances: [type] } })) },
      }],
      14: [{ name: 'Dragon Wings', text: 'Bonus action: fly speed 60 ft. i en time. Én gang pr. long rest (eller 3 SP).' }],
      18: [{ name: 'Dragon Companion', text: 'Summon Dragon uden materialer og uden slot én gang pr. long rest.' }],
    },
  },
  {
    id: 'wild-magic', classId: 'sorcerer', name: 'Wild Magic Sorcery', blurb: 'Kaotisk, uforudsigelig magi.',
    features: {
      3: [
        { name: 'Wild Magic Surge', text: 'Når du caster en spell med slot, kan en tilfældig surge udløses.' },
        { name: 'Tides of Chaos', text: 'Advantage på én d20 Test; genvindes ved long rest eller en surge.' },
      ],
      6: [{ name: 'Bend Luck', text: 'Reaction, 1 SP: læg 1d4 til eller træk 1d4 fra et andet væsens slag.' }],
      14: [{ name: 'Controlled Chaos', text: 'Slå to gange på Wild Magic Surge-tabellen og vælg.' }],
      18: [{ name: 'Tamed Surge', text: 'Vælg en effekt fra surge-tabellen. Én gang pr. long rest.' }],
    },
    resources: () => [{ id: 'tides-of-chaos', name: 'Tides of Chaos', max: 1, reset: 'long' }],
  },

  // ---------- Warlock ----------
  {
    id: 'archfey', classId: 'warlock', name: 'Archfey Patron', blurb: 'En pagt med en fyrste fra Feywild.',
    spells: { 3: ['calm-emotions', 'faerie-fire', 'misty-step', 'phantasmal-force', 'sleep'], 5: ['blink', 'plant-growth'], 7: ['dominate-beast', 'greater-invisibility'], 9: ['dominate-person', 'seeming'] },
    features: {
      3: [{ name: 'Steps of the Fey', text: 'Misty Step uden slot CHA-mod gange pr. long rest, med Refreshing Step eller Taunting Step.' }],
      6: [{ name: 'Misty Escape', text: 'Reaction når du tager skade: cast Misty Step; ekstra effekter (usynlig eller psychic damage).' }],
      10: [{ name: 'Beguiling Defenses', text: 'Immun over for charmed; reaction: reflektér skade som psychic.' }],
      14: [{ name: 'Bewitching Magic', text: 'Når du caster en enchantment- eller illusion-spell, kan du cast Misty Step gratis.' }],
    },
    resources: ({ mods }) => [{ id: 'steps-of-the-fey', name: 'Steps of the Fey', max: modUses(mods.cha), reset: 'long' }],
  },
  {
    id: 'celestial', classId: 'warlock', name: 'Celestial Patron', blurb: 'En pagt med et væsen af himmelsk lys.',
    spells: { 3: ['aid', 'cure-wounds', 'guiding-bolt', 'lesser-restoration', 'light', 'sacred-flame'], 5: ['daylight', 'revivify'], 7: ['guardian-of-faith', 'wall-of-fire'], 9: ['greater-restoration', 'summon-celestial'] },
    features: {
      3: [{ name: 'Healing Light', text: ({ level }) => `Bonus action: hel med terninger fra en pulje på ${1 + level}d6.` }],
      6: [{ name: 'Radiant Soul', text: 'Resistance mod radiant; læg CHA til fire- og radiant-damage.', effects: { resistances: ['Radiant'] } }],
      10: [{ name: 'Celestial Resilience', text: 'Efter en rest får du og op til fem allierede temp HP.' }],
      14: [{ name: 'Searing Vengeance', text: 'Ved et death save: rejs dig med halv HP og blind fjender omkring dig. Én gang pr. long rest.' }],
    },
    resources: ({ level }) => [{ id: 'healing-light', name: 'Healing Light (d6)', max: 1 + level, reset: 'long', die: 'd6' }],
  },
  {
    id: 'fiend', classId: 'warlock', name: 'Fiend Patron', blurb: 'En pagt med en djævel eller dæmon.',
    spells: { 3: ['burning-hands', 'command', 'scorching-ray', 'suggestion'], 5: ['fireball', 'stinking-cloud'], 7: ['fire-shield', 'wall-of-fire'], 9: ['geas', 'insect-plague'] },
    features: {
      3: [{ name: "Dark One's Blessing", text: ({ level, mods }) => `Når en fjende falder til 0 HP tæt på dig: ${Math.max(1, mods.cha + level)} temp HP.` }],
      6: [{ name: "Dark One's Own Luck", text: 'Læg 1d10 til et check eller save, CHA-mod gange pr. long rest.' }],
      10: [{ name: 'Fiendish Resilience', text: 'Vælg en damage type efter hver rest; du har resistance mod den.' }],
      14: [{ name: 'Hurl Through Hell', text: 'Ved hit: send målet gennem de nedre planer – 8d10 psychic (CHA save). Én gang pr. long rest.' }],
    },
    resources: ({ mods, level }) => (level >= 6 ? [{ id: 'dark-ones-luck', name: "Dark One's Own Luck", max: modUses(mods.cha), reset: 'long' }] : []),
  },
  {
    id: 'great-old-one', classId: 'warlock', name: 'Great Old One Patron', blurb: 'En pagt med en ubegribelig entitet.',
    spells: { 3: ['detect-thoughts', 'dissonant-whispers', 'phantasmal-force', 'tashas-hideous-laughter'], 5: ['clairvoyance', 'hunger-of-hadar'], 7: ['confusion', 'summon-aberration'], 9: ['modify-memory', 'telekinesis'] },
    features: {
      3: [
        { name: 'Awakened Mind', text: 'Telepati med et væsen inden for 30 × level ft.' },
        { name: 'Psychic Spells', text: 'Enchantment- og illusion-spells uden verbale/somatiske komponenter; damage kan blive psychic.' },
      ],
      6: [{ name: 'Clairvoyant Combatant', text: 'Når du skaber telepatisk kontakt: WIS save eller disadvantage på angreb mod dig.' }],
      10: [
        { name: 'Eldritch Hex', text: 'Hex giver også disadvantage på saves med den valgte evne.' },
        { name: 'Thought Shield', text: 'Resistance mod psychic; reflektér psychic damage.', effects: { resistances: ['Psychic'] } },
      ],
      14: [{ name: 'Create Thrall', text: 'Summon Aberration uden slot og concentration; den får temp HP.' }],
    },
  },

  // ---------- Wizard ----------
  {
    id: 'abjurer', classId: 'wizard', name: 'Abjurer', blurb: 'Beskyttelse og ophævelse af magi.',
    spells: { 10: ['counterspell', 'dispel-magic'] },
    features: {
      3: [
        { name: 'Abjuration Savant', text: 'To abjuration-spells gratis i din spellbook og én mere pr. nyt spell-level.' },
        { name: 'Arcane Ward', text: ({ level, mods }) => `En ward med ${2 * level + mods.int} HP absorberer skade; genoplades når du caster abjuration-spells.` },
      ],
      6: [{ name: 'Projected Ward', text: 'Reaction: din Arcane Ward absorberer skade for en allieret.' }],
      10: [{ name: 'Spell Breaker', text: 'Counterspell og Dispel Magic altid forberedt; Dispel Magic som bonus action.' }],
      14: [{ name: 'Spell Resistance', text: 'Advantage på saves mod spells og resistance mod spell-damage.' }],
    },
  },
  {
    id: 'diviner', classId: 'wizard', name: 'Diviner', blurb: 'Seer, der kender fremtiden.',
    features: {
      3: [
        { name: 'Divination Savant', text: 'To divination-spells gratis i din spellbook og én mere pr. nyt spell-level.' },
        { name: 'Portent', text: ({ level }) => `Efter en long rest: slå ${level >= 14 ? 3 : 2} d20'ere og erstat valgfrie slag med dem.` },
      ],
      6: [{ name: 'Expert Divination', text: 'Når du caster en divination-spell af level 2+, genvinder du en lavere slot.' }],
      10: [{ name: 'The Third Eye', text: 'Bonus action: darkvision 120 ft., se usynligt eller læs alle sprog.' }],
      14: [{ name: 'Greater Portent', text: 'Portent giver tre terninger.' }],
    },
  },
  {
    id: 'evoker', classId: 'wizard', name: 'Evoker', blurb: 'Rå, destruktiv elementarmagi.',
    features: {
      3: [
        { name: 'Evocation Savant', text: 'To evocation-spells gratis i din spellbook og én mere pr. nyt spell-level.' },
        { name: 'Potent Cantrip', text: 'Misser eller saves dine damage-cantrips, gør de stadig halv skade.' },
      ],
      6: [{ name: 'Sculpt Spells', text: 'Beskyt allierede mod dine evocation-spells.' }],
      10: [{ name: 'Empowered Evocation', text: 'Læg INT til damage med Wizard-evocation-spells.' }],
      14: [{ name: 'Overchannel', text: 'Maksimal skade på en spell af level 1–5; gentagne brug skader dig.' }],
    },
  },
  {
    id: 'illusionist', classId: 'wizard', name: 'Illusionist', blurb: 'Mester i bedrag og falske billeder.',
    spells: { 3: ['minor-illusion'], 6: ['summon-beast', 'summon-fey'] },
    features: {
      3: [
        { name: 'Illusion Savant', text: 'To illusion-spells gratis i din spellbook og én mere pr. nyt spell-level.' },
        { name: 'Improved Illusions', text: 'Illusioner uden verbale komponenter og med længere rækkevidde; Minor Illusion med lyd og billede.' },
      ],
      6: [{ name: 'Phantasmal Creatures', text: 'Summon Beast og Summon Fey altid forberedt; cast dem som illusioner uden slot.' }],
      10: [{ name: 'Illusory Self', text: 'Reaction: en illusion af dig tager et angreb, så det misser.' }],
      14: [{ name: 'Illusory Reality', text: 'Gør en del af en illusion virkelig i et minut.' }],
    },
  },
]

export const findSubclass = (id: string | null) => SUBCLASSES.find(s => s.id === id)
export const subclassesFor = (classId: string | null) => SUBCLASSES.filter(s => s.classId === classId)
