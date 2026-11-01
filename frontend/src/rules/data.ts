// Regeldata for D&D 2024 (5.5e): species, baggrunde, origin feats, udstyr og klassernes level 1.
// Progression for level 2–20 ligger i progression.ts og subclasses.ts.
// Kun mekanik (navne, tal, valgmuligheder) og korte resuméer med egne ord – slå den fulde tekst op i PHB.

export type Ability = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
export type Size = 'Small' | 'Medium'
export type ArmorTraining = 'light' | 'medium' | 'heavy' | 'shield'
export type ToolGroup = 'artisan' | 'instrument' | 'gaming'

export const ABILITIES: { key: Ability; name: string; short: string }[] = [
  { key: 'str', name: 'Strength', short: 'STR' },
  { key: 'dex', name: 'Dexterity', short: 'DEX' },
  { key: 'con', name: 'Constitution', short: 'CON' },
  { key: 'int', name: 'Intelligence', short: 'INT' },
  { key: 'wis', name: 'Wisdom', short: 'WIS' },
  { key: 'cha', name: 'Charisma', short: 'CHA' },
]

export const abilityShort = (a: Ability) => ABILITIES.find(x => x.key === a)!.short

// ---------- Skills ----------

export const SKILLS = [
  { id: 'acrobatics', name: 'Acrobatics', ability: 'dex' },
  { id: 'animal_handling', name: 'Animal Handling', ability: 'wis' },
  { id: 'arcana', name: 'Arcana', ability: 'int' },
  { id: 'athletics', name: 'Athletics', ability: 'str' },
  { id: 'deception', name: 'Deception', ability: 'cha' },
  { id: 'history', name: 'History', ability: 'int' },
  { id: 'insight', name: 'Insight', ability: 'wis' },
  { id: 'intimidation', name: 'Intimidation', ability: 'cha' },
  { id: 'investigation', name: 'Investigation', ability: 'int' },
  { id: 'medicine', name: 'Medicine', ability: 'wis' },
  { id: 'nature', name: 'Nature', ability: 'int' },
  { id: 'perception', name: 'Perception', ability: 'wis' },
  { id: 'performance', name: 'Performance', ability: 'cha' },
  { id: 'persuasion', name: 'Persuasion', ability: 'cha' },
  { id: 'religion', name: 'Religion', ability: 'int' },
  { id: 'sleight_of_hand', name: 'Sleight of Hand', ability: 'dex' },
  { id: 'stealth', name: 'Stealth', ability: 'dex' },
  { id: 'survival', name: 'Survival', ability: 'wis' },
] as const satisfies readonly { id: string; name: string; ability: Ability }[]

export type SkillId = (typeof SKILLS)[number]['id']
export const ALL_SKILLS: SkillId[] = SKILLS.map(s => s.id)
export const skillName = (id: SkillId) => SKILLS.find(s => s.id === id)!.name

// ---------- Værktøj og sprog ----------

export const TOOLS: Record<ToolGroup, string[]> = {
  artisan: [
    "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools",
    "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools",
    "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies",
    "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools",
  ],
  instrument: ['Bagpipes', 'Drum', 'Dulcimer', 'Flute', 'Horn', 'Lute', 'Lyre', 'Pan Flute', 'Shawm', 'Viol'],
  gaming: ['Dice', 'Dragonchess', 'Playing Cards', 'Three-Dragon Ante'],
}

export const STANDARD_LANGUAGES = [
  'Common Sign Language', 'Draconic', 'Dwarvish', 'Elvish', 'Giant', 'Gnomish', 'Goblin', 'Halfling', 'Orc',
]

// ---------- Fælles typer ----------

/** Det tekster og ressourcer kan skalere efter. */
export interface FeatureCtx { level: number; mods: Record<Ability, number>; pb: number }

export interface Trait {
  name: string
  text: string
  /** Traitet låses først op på dette level. */
  level?: number
}

/** Mekaniske effekter et valg, en feature eller et feat kan have på karakteren. */
export interface OptionEffects {
  speed?: number
  /** Lægges oven i speed (fx Fast Movement, Roving, Speedy). */
  speedBonus?: number
  /** Ekstra speed uden rustning og skjold (Monk). */
  unarmoredSpeed?: number
  darkvision?: number
  resistances?: string[]
  armor?: ArmorTraining[]
  martialWeapons?: boolean
  extraCantrips?: number
  /** Lægger evnens modifier (min. +1) oven i de nævnte skills, fx Thaumaturge. */
  skillBonus?: { skills: SkillId[]; ability: Ability }
  /** Spells der gives automatisk (spell-id'er fra spells.ts). */
  spells?: string[]
  /** Spells der gives automatisk fra et bestemt karakterlevel (lineages, legacies). */
  spellsAt?: Record<number, string[]>
  /** Ekstra saving throw-proficiencies. */
  saves?: Ability[] | 'all'
  /** Lægger evnens modifier (min. +1) til alle saving throws (Aura of Protection). */
  saveBonus?: Ability
  /** Advantage på de nævnte saving throws; `note` vises ved savet (kilde og evt. betingelse). */
  saveAdvantage?: { abilities: Ability[]; note: string }
  skillProficiencies?: SkillId[]
  toolProficiencies?: string[]
  /** Halv proficiency bonus på checks uden proficiency (Jack of All Trades). */
  jackOfAllTrades?: boolean
  /** Ekstra max HP pr. level. */
  hpPerLevel?: number
  unarmoredDefense?: { ability: Ability; allowShield: boolean }
  /** Capstones: +amount til evnerne med et højere loft. */
  abilityBonus?: { abilities: Ability[]; amount: number; max: number }
  /** Lægger evnens modifier til initiative (Gloom Stalker). */
  initiativeBonus?: Ability
  languages?: string[]
}

export interface ChoiceOption { id: string; name: string; text?: string; effects?: OptionEffects }
export interface ChoiceDef { id: string; label: string; options: ChoiceOption[] }

export interface SkillGrant { count: number; from: SkillId[] | 'any'; label: string }
export interface ToolGrant { count: number; from: ToolGroup[]; label: string }

const castingAbilityChoice: ChoiceDef = {
  id: 'castingAbility',
  label: 'Spellcasting-evne til species-spells',
  options: [
    { id: 'int', name: 'Intelligence' },
    { id: 'wis', name: 'Wisdom' },
    { id: 'cha', name: 'Charisma' },
  ],
}

// ---------- Species ----------

export interface Species {
  id: string
  name: string
  blurb: string
  sizes: Size[]
  speed: number
  darkvision: number
  resistances?: string[]
  hpPerLevel?: number
  traits: Trait[]
  choices?: ChoiceDef[]
  skillGrant?: SkillGrant
  /** Human (Versatile): vælg et ekstra Origin Feat. */
  originFeat?: boolean
  /** Spells alle af denne species kender (lineage-spells ligger på valget). */
  spells?: string[]
  /** Fast spellcasting-evne; ellers bruges valget 'castingAbility'. */
  spellAbility?: Ability
  /** Mekaniske effekter alle af denne species får (fx en fast skill). */
  effects?: OptionEffects
  /** Species fra 2014-reglerne, tilpasset 2024: ingen ability-bonusser, de kommer fra baggrunden. */
  legacy?: boolean
}

export const SPECIES: Species[] = [
  {
    id: 'aasimar', name: 'Aasimar', blurb: 'Dødelige med en gnist af himmelsk kraft.',
    sizes: ['Medium', 'Small'], speed: 30, darkvision: 60, resistances: ['Necrotic', 'Radiant'],
    spells: ['light'], spellAbility: 'cha',
    traits: [
      { name: 'Celestial Resistance', text: 'Resistance mod necrotic og radiant damage.' },
      { name: 'Healing Hands', text: 'Én gang pr. long rest: hel et væsen for et antal d4 lig din proficiency bonus.' },
      { name: 'Light Bearer', text: 'Du kender Light-cantrip (CHA).' },
      { name: 'Celestial Revelation', level: 3, text: 'Bonus action: transformér dig i et minut (Heavenly Wings, Inner Radiance eller Necrotic Shroud) og gør +PB damage én gang pr. tur. Én gang pr. long rest.' },
    ],
  },
  {
    id: 'dragonborn', name: 'Dragonborn', blurb: 'Dragebårne med en ødelæggende breath weapon.',
    sizes: ['Medium'], speed: 30, darkvision: 60,
    traits: [
      { name: 'Breath Weapon', text: 'Erstat et angreb med en 15 ft. kegle eller 30 ft. linje: 1d10 damage (2d10 på level 5, 3d10 på 11, 4d10 på 17), DEX save mod DC 8 + CON + PB. Antal brug = PB pr. long rest.' },
      { name: 'Damage Resistance', text: 'Resistance mod din ancestrys damage type.' },
      { name: 'Draconic Flight', level: 5, text: 'Bonus action: spektrale vinger giver fly speed lig din speed i 10 minutter. Én gang pr. long rest.' },
    ],
    choices: [{
      id: 'ancestry', label: 'Draconic Ancestry',
      options: [
        ['black', 'Black', 'Acid'], ['blue', 'Blue', 'Lightning'], ['brass', 'Brass', 'Fire'],
        ['bronze', 'Bronze', 'Lightning'], ['copper', 'Copper', 'Acid'], ['gold', 'Gold', 'Fire'],
        ['green', 'Green', 'Poison'], ['red', 'Red', 'Fire'], ['silver', 'Silver', 'Cold'], ['white', 'White', 'Cold'],
      ].map(([id, name, type]) => ({ id, name: `${name} (${type})`, effects: { resistances: [type] } })),
    }],
  },
  {
    id: 'dwarf', name: 'Dwarf', blurb: 'Seje, udholdende folk fra bjergenes dyb.',
    sizes: ['Medium'], speed: 30, darkvision: 120, resistances: ['Poison'], hpPerLevel: 1,
    traits: [
      { name: 'Dwarven Resilience', text: 'Resistance mod poison damage og advantage på saves mod poisoned.' },
      { name: 'Dwarven Toughness', text: '+1 max HP pr. level.' },
      { name: 'Stonecunning', text: 'Bonus action: tremorsense 60 ft. i 10 min, antal brug = PB pr. long rest.' },
    ],
  },
  {
    id: 'elf', name: 'Elf', blurb: 'Fey-beslægtede, langlivede folk med skarpe sanser.',
    sizes: ['Medium'], speed: 30, darkvision: 60,
    traits: [
      { name: 'Fey Ancestry', text: 'Advantage på saves mod charmed.' },
      { name: 'Keen Senses', text: 'Proficiency i Insight, Perception eller Survival.' },
      { name: 'Trance', text: 'Long rest på 4 timer i meditativ trance.' },
    ],
    choices: [
      {
        id: 'lineage', label: 'Elven Lineage',
        options: [
          { id: 'drow', name: 'Drow', text: 'Darkvision 120 ft. Kender Dancing Lights; Faerie Fire på level 3 og Darkness på level 5.', effects: { darkvision: 120, spells: ['dancing-lights'], spellsAt: { 3: ['faerie-fire'], 5: ['darkness'] } } },
          { id: 'high', name: 'High Elf', text: 'Kender Prestidigitation (kan byttes ved long rest); Detect Magic på level 3 og Misty Step på level 5.', effects: { spells: ['prestidigitation'], spellsAt: { 3: ['detect-magic'], 5: ['misty-step'] } } },
          { id: 'wood', name: 'Wood Elf', text: 'Speed 35 ft. Kender Druidcraft; Longstrider på level 3 og Pass without Trace på level 5.', effects: { speed: 35, spells: ['druidcraft'], spellsAt: { 3: ['longstrider'], 5: ['pass-without-trace'] } } },
        ],
      },
      castingAbilityChoice,
    ],
    skillGrant: { count: 1, from: ['insight', 'perception', 'survival'], label: 'Keen Senses (Elf)' },
  },
  {
    id: 'gnome', name: 'Gnome', blurb: 'Små, nysgerrige og magisk kloge.',
    sizes: ['Small'], speed: 30, darkvision: 60,
    traits: [{ name: 'Gnomish Cunning', text: 'Advantage på INT-, WIS- og CHA-saves.' }],
    choices: [
      {
        id: 'lineage', label: 'Gnomish Lineage',
        options: [
          { id: 'forest', name: 'Forest Gnome', text: 'Kender Minor Illusion; Speak with Animals PB gange pr. long rest.', effects: { spells: ['minor-illusion', 'speak-with-animals'] } },
          { id: 'rock', name: 'Rock Gnome', text: 'Kender Mending og Prestidigitation; kan bygge små clockwork-genstande.', effects: { spells: ['mending', 'prestidigitation'] } },
        ],
      },
      castingAbilityChoice,
    ],
  },
  {
    id: 'goliath', name: 'Goliath', blurb: 'Kæmpe-ætlinge med overnaturlig styrke.',
    sizes: ['Medium'], speed: 35, darkvision: 0,
    traits: [
      { name: 'Giant Ancestry', text: 'En overnaturlig evne fra din kæmpe-slægt, PB gange pr. long rest.' },
      { name: 'Powerful Build', text: 'Advantage mod at slippe ud af grappled; tæller som én størrelse større ved bæreevne.' },
      { name: 'Large Form', level: 5, text: 'Bonus action: bliv Large i 10 minutter med advantage på STR-checks og +10 ft. speed. Én gang pr. long rest.' },
    ],
    choices: [{
      id: 'ancestry', label: 'Giant Ancestry',
      options: [
        { id: 'cloud', name: "Cloud's Jaunt", text: 'Bonus action: teleport 30 ft.' },
        { id: 'fire', name: "Fire's Burn", text: '+1d10 fire damage ved hit.' },
        { id: 'frost', name: "Frost's Chill", text: '+1d6 cold damage og -10 ft. speed ved hit.' },
        { id: 'hill', name: "Hill's Tumble", text: 'Slå et Large eller mindre væsen prone ved hit.' },
        { id: 'stone', name: "Stone's Endurance", text: 'Reaction: reducer skade med 1d12 + CON.' },
        { id: 'storm', name: "Storm's Thunder", text: 'Reaction: 1d8 thunder damage mod den der skader dig.' },
      ],
    }],
  },
  {
    id: 'half-elf', name: 'Half-Elf', blurb: 'Fra 2014-reglerne: arv fra både elvere og mennesker.', legacy: true,
    sizes: ['Medium'], speed: 30, darkvision: 60,
    traits: [
      { name: 'Fey Ancestry', text: 'Advantage på saves mod charmed, og magi kan ikke få dig til at sove.' },
      { name: 'Skill Versatility', text: 'Proficiency i to valgfri skills.' },
    ],
    skillGrant: { count: 2, from: 'any', label: 'Skill Versatility (Half-Elf)' },
  },
  {
    id: 'half-orc', name: 'Half-Orc', blurb: 'Fra 2014-reglerne: orkisk styrke og menneskelig vilje.', legacy: true,
    sizes: ['Medium'], speed: 30, darkvision: 60,
    traits: [
      { name: 'Menacing', text: 'Proficiency i Intimidation.' },
      { name: 'Relentless Endurance', text: 'Når du falder til 0 HP uden at dø, kan du gå til 1 HP i stedet, én gang pr. long rest.' },
      { name: 'Savage Attacks', text: 'Ved et critical hit med et melee-våben slår du én af våbnets damage-terninger en ekstra gang.' },
    ],
    effects: { skillProficiencies: ['intimidation'] },
  },
  {
    id: 'halfling', name: 'Halfling', blurb: 'Små, modige og forbløffende heldige.',
    sizes: ['Small'], speed: 30, darkvision: 0,
    traits: [
      { name: 'Brave', text: 'Advantage på saves mod frightened.' },
      { name: 'Halfling Nimbleness', text: 'Kan bevæge dig gennem større væseners felt.' },
      { name: 'Luck', text: 'Slår du 1 på en d20 Test, må du slå om.' },
      { name: 'Naturally Stealthy', text: 'Kan forsøge Hide bag væsener mindst én størrelse større.' },
    ],
  },
  {
    id: 'human', name: 'Human', blurb: 'Alsidige og ambitiøse – findes overalt.',
    sizes: ['Medium', 'Small'], speed: 30, darkvision: 0,
    traits: [
      { name: 'Resourceful', text: 'Du får Heroic Inspiration efter hver long rest.' },
      { name: 'Skillful', text: 'Proficiency i én valgfri skill.' },
      { name: 'Versatile', text: 'Du får et Origin Feat efter eget valg.' },
    ],
    skillGrant: { count: 1, from: 'any', label: 'Skillful (Human)' },
    originFeat: true,
  },
  {
    id: 'orc', name: 'Orc', blurb: 'Stærke, udholdende og drevet af Gruumsh-arven.',
    sizes: ['Medium'], speed: 30, darkvision: 120,
    traits: [
      { name: 'Adrenaline Rush', text: 'Bonus action Dash + temp HP lig PB, PB gange pr. short/long rest.' },
      { name: 'Relentless Endurance', text: 'Når du falder til 0 HP, kan du gå til 1 HP i stedet, én gang pr. long rest.' },
    ],
  },
  {
    id: 'tiefling', name: 'Tiefling', blurb: 'Bærere af en fiendish arv.',
    sizes: ['Medium', 'Small'], speed: 30, darkvision: 60,
    traits: [{ name: 'Otherworldly Presence', text: 'Du kender Thaumaturgy.' }],
    spells: ['thaumaturgy'],
    choices: [
      {
        id: 'legacy', label: 'Fiendish Legacy',
        options: [
          { id: 'abyssal', name: 'Abyssal', text: 'Poison resistance; kender Poison Spray. Ray of Sickness på level 3 og Hold Person på level 5.', effects: { resistances: ['Poison'], spells: ['poison-spray'], spellsAt: { 3: ['ray-of-sickness'], 5: ['hold-person'] } } },
          { id: 'chthonic', name: 'Chthonic', text: 'Necrotic resistance; kender Chill Touch. False Life på level 3 og Ray of Enfeeblement på level 5.', effects: { resistances: ['Necrotic'], spells: ['chill-touch'], spellsAt: { 3: ['false-life'], 5: ['ray-of-enfeeblement'] } } },
          { id: 'infernal', name: 'Infernal', text: 'Fire resistance; kender Fire Bolt. Hellish Rebuke på level 3 og Darkness på level 5.', effects: { resistances: ['Fire'], spells: ['fire-bolt'], spellsAt: { 3: ['hellish-rebuke'], 5: ['darkness'] } } },
        ],
      },
      castingAbilityChoice,
    ],
  },
]

// ---------- Origin Feats ----------

export type FeatCategory = 'origin' | 'general' | 'fighting-style' | 'epic-boon'

export interface FeatPrereq {
  level?: number
  /** Mindst én af evnerne skal være 13 eller højere. */
  abilities?: Ability[]
  armor?: ArmorTraining
  spellcasting?: boolean
  fightingStyle?: boolean
}

export interface Feat {
  id: string
  name: string
  text: string
  /** Udeladt = origin feat. */
  category?: FeatCategory
  prereq?: FeatPrereq
  repeatable?: boolean
  hpPerLevel?: number
  /** Fast ekstra max HP (Boon of Fortitude). */
  hpBonus?: number
  initiativeProf?: boolean
  skillGrant?: number
  toolGrant?: ToolGrant
  expertiseGrant?: number
  /** Magic Initiate: klasse-id for spell-listen. */
  magicInitiate?: string
  /** Evner man kan hæve med +1, når feat'et vælges. */
  abilityIncrease?: Ability[]
  /** Loft for forøgelsen (Epic Boons: 30). */
  abilityMax?: number
  /** Resilient: proficiency i saving throw for den hævede evne. */
  saveFromAbility?: boolean
  effects?: OptionEffects
  /** Spells der følger med; de castes med den hævede evne. */
  spells?: string[]
  /** Fey/Shadow Touched: vælg level 1-spells fra bestemte schools. */
  spellPick?: { count: number; schools: string[] }
}

export const ORIGIN_FEATS: Feat[] = [
  { id: 'alert', name: 'Alert', text: 'Læg din proficiency bonus til initiative; du kan bytte initiative med en villig allieret.', initiativeProf: true },
  { id: 'crafter', name: 'Crafter', text: "Proficiency med 3 Artisan's Tools, 20% rabat på ikke-magiske genstande og hurtig fremstilling.", toolGrant: { count: 3, from: ['artisan'], label: 'Crafter (feat)' } },
  { id: 'healer', name: 'Healer', text: "Brug et Healer's Kit til at stabilisere og hele; slå 1'ere om på healing-terninger." },
  { id: 'lucky', name: 'Lucky', text: 'Luck Points lig din proficiency bonus: giv dig selv advantage eller en fjende disadvantage.' },
  { id: 'magic-initiate-cleric', name: 'Magic Initiate (Cleric)', text: '2 cantrips og ét level 1-spell fra Cleric-listen; spellen kan castes gratis én gang pr. long rest.', repeatable: true, magicInitiate: 'cleric' },
  { id: 'magic-initiate-druid', name: 'Magic Initiate (Druid)', text: '2 cantrips og ét level 1-spell fra Druid-listen; spellen kan castes gratis én gang pr. long rest.', repeatable: true, magicInitiate: 'druid' },
  { id: 'magic-initiate-wizard', name: 'Magic Initiate (Wizard)', text: '2 cantrips og ét level 1-spell fra Wizard-listen; spellen kan castes gratis én gang pr. long rest.', repeatable: true, magicInitiate: 'wizard' },
  { id: 'musician', name: 'Musician', text: 'Proficiency med 3 instrumenter; giv allierede Heroic Inspiration efter en rest.', toolGrant: { count: 3, from: ['instrument'], label: 'Musician (feat)' } },
  { id: 'savage-attacker', name: 'Savage Attacker', text: 'Én gang pr. tur: slå weapon damage to gange og brug det bedste.' },
  { id: 'skilled', name: 'Skilled', text: 'Proficiency i 3 skills efter eget valg.', repeatable: true, skillGrant: 3 },
  { id: 'tavern-brawler', name: 'Tavern Brawler', text: "Unarmed strike 1d4 + STR, slå 1'ere om, proficiency med improvised weapons og skub ved hit." },
  { id: 'tough', name: 'Tough', text: '+2 max HP pr. level.', hpPerLevel: 2 },
]

// ---------- Backgrounds ----------

export interface Background {
  id: string
  name: string
  abilities: [Ability, Ability, Ability]
  feat: string
  skills: [SkillId, SkillId]
  tool: string | ToolGrant
  equipment: { items: string[]; gold: number }
}

export const BACKGROUND_GOLD_OPTION = 50

export const BACKGROUNDS: Background[] = [
  { id: 'acolyte', name: 'Acolyte', abilities: ['int', 'wis', 'cha'], feat: 'magic-initiate-cleric', skills: ['insight', 'religion'], tool: "Calligrapher's Supplies",
    equipment: { items: ["Calligrapher's Supplies", 'Book (prayers)', 'Holy Symbol', 'Parchment (10 sheets)', 'Robe'], gold: 8 } },
  { id: 'artisan', name: 'Artisan', abilities: ['str', 'dex', 'int'], feat: 'crafter', skills: ['investigation', 'persuasion'], tool: { count: 1, from: ['artisan'], label: "Artisan (background)" },
    equipment: { items: ["Artisan's Tools (samme som din proficiency)", '2 Pouches', "Traveler's Clothes"], gold: 32 } },
  { id: 'charlatan', name: 'Charlatan', abilities: ['dex', 'con', 'cha'], feat: 'skilled', skills: ['deception', 'sleight_of_hand'], tool: 'Forgery Kit',
    equipment: { items: ['Forgery Kit', 'Costume', 'Fine Clothes'], gold: 15 } },
  { id: 'criminal', name: 'Criminal', abilities: ['dex', 'con', 'int'], feat: 'alert', skills: ['sleight_of_hand', 'stealth'], tool: "Thieves' Tools",
    equipment: { items: ['2 Daggers', "Thieves' Tools", 'Crowbar', '2 Pouches', "Traveler's Clothes"], gold: 16 } },
  { id: 'entertainer', name: 'Entertainer', abilities: ['str', 'dex', 'cha'], feat: 'musician', skills: ['acrobatics', 'performance'], tool: { count: 1, from: ['instrument'], label: 'Entertainer (background)' },
    equipment: { items: ['Musical Instrument (samme som din proficiency)', '2 Costumes', 'Mirror', 'Perfume', "Traveler's Clothes"], gold: 11 } },
  { id: 'farmer', name: 'Farmer', abilities: ['str', 'con', 'wis'], feat: 'tough', skills: ['animal_handling', 'nature'], tool: "Carpenter's Tools",
    equipment: { items: ['Sickle', "Carpenter's Tools", "Healer's Kit", 'Iron Pot', 'Shovel', "Traveler's Clothes"], gold: 30 } },
  { id: 'guard', name: 'Guard', abilities: ['str', 'int', 'wis'], feat: 'alert', skills: ['athletics', 'perception'], tool: { count: 1, from: ['gaming'], label: 'Guard (background)' },
    equipment: { items: ['Spear', 'Light Crossbow', '20 Bolts', 'Gaming Set (samme som din proficiency)', 'Hooded Lantern', 'Manacles', 'Quiver', "Traveler's Clothes"], gold: 12 } },
  { id: 'guide', name: 'Guide', abilities: ['dex', 'con', 'wis'], feat: 'magic-initiate-druid', skills: ['stealth', 'survival'], tool: "Cartographer's Tools",
    equipment: { items: ['Shortbow', '20 Arrows', "Cartographer's Tools", 'Bedroll', 'Quiver', 'Tent', "Traveler's Clothes"], gold: 3 } },
  { id: 'hermit', name: 'Hermit', abilities: ['con', 'wis', 'cha'], feat: 'healer', skills: ['medicine', 'religion'], tool: 'Herbalism Kit',
    equipment: { items: ['Quarterstaff', 'Herbalism Kit', 'Bedroll', 'Book (philosophy)', 'Lamp', 'Oil (3 flasks)', "Traveler's Clothes"], gold: 16 } },
  { id: 'merchant', name: 'Merchant', abilities: ['con', 'int', 'cha'], feat: 'lucky', skills: ['animal_handling', 'persuasion'], tool: "Navigator's Tools",
    equipment: { items: ["Navigator's Tools", '2 Pouches', "Traveler's Clothes"], gold: 22 } },
  { id: 'noble', name: 'Noble', abilities: ['str', 'int', 'cha'], feat: 'skilled', skills: ['history', 'persuasion'], tool: { count: 1, from: ['gaming'], label: 'Noble (background)' },
    equipment: { items: ['Gaming Set (samme som din proficiency)', 'Fine Clothes', 'Perfume'], gold: 29 } },
  { id: 'sage', name: 'Sage', abilities: ['con', 'int', 'wis'], feat: 'magic-initiate-wizard', skills: ['arcana', 'history'], tool: "Calligrapher's Supplies",
    equipment: { items: ['Quarterstaff', "Calligrapher's Supplies", 'Book (history)', 'Parchment (8 sheets)', 'Robe'], gold: 8 } },
  { id: 'sailor', name: 'Sailor', abilities: ['str', 'dex', 'wis'], feat: 'tavern-brawler', skills: ['acrobatics', 'perception'], tool: "Navigator's Tools",
    equipment: { items: ['Dagger', "Navigator's Tools", 'Rope', "Traveler's Clothes"], gold: 20 } },
  { id: 'scribe', name: 'Scribe', abilities: ['dex', 'int', 'wis'], feat: 'skilled', skills: ['investigation', 'perception'], tool: "Calligrapher's Supplies",
    equipment: { items: ["Calligrapher's Supplies", 'Fine Clothes', 'Lamp', 'Oil (3 flasks)', 'Parchment (12 sheets)'], gold: 23 } },
  { id: 'soldier', name: 'Soldier', abilities: ['str', 'dex', 'con'], feat: 'savage-attacker', skills: ['athletics', 'intimidation'], tool: { count: 1, from: ['gaming'], label: 'Soldier (background)' },
    equipment: { items: ['Spear', 'Shortbow', '20 Arrows', 'Gaming Set (samme som din proficiency)', "Healer's Kit", 'Quiver', "Traveler's Clothes"], gold: 14 } },
  { id: 'wayfarer', name: 'Wayfarer', abilities: ['dex', 'wis', 'cha'], feat: 'lucky', skills: ['insight', 'stealth'], tool: "Thieves' Tools",
    equipment: { items: ['2 Daggers', "Thieves' Tools", 'Gaming Set (valgfrit)', 'Bedroll', '2 Pouches', "Traveler's Clothes"], gold: 16 } },
]

// ---------- Våben og rustning ----------

export interface Weapon {
  name: string
  martial: boolean
  melee: boolean
  finesse?: boolean
  light?: boolean
  damage: string
  damageType: 'Bludgeoning' | 'Piercing' | 'Slashing'
  /** Øvrige egenskaber som tekst, fx 'Thrown (20/60), Versatile (1d8)'. */
  properties: string
  mastery: string
}

const DAMAGE_TYPES = { B: 'Bludgeoning', P: 'Piercing', S: 'Slashing' } as const

/** flags: F = Finesse, L = Light */
const w = (name: string, martial: boolean, melee: boolean, damage: string, type: keyof typeof DAMAGE_TYPES, mastery: string, properties = '', flags = ''): Weapon =>
  ({ name, martial, melee, damage, damageType: DAMAGE_TYPES[type], mastery, properties, finesse: flags.includes('F'), light: flags.includes('L') })

export const WEAPONS: Weapon[] = [
  w('Club', false, true, '1d4', 'B', 'Slow', '', 'L'),
  w('Dagger', false, true, '1d4', 'P', 'Nick', 'Thrown (20/60)', 'FL'),
  w('Greatclub', false, true, '1d8', 'B', 'Push', 'Two-Handed'),
  w('Handaxe', false, true, '1d6', 'S', 'Vex', 'Thrown (20/60)', 'L'),
  w('Javelin', false, true, '1d6', 'P', 'Slow', 'Thrown (30/120)'),
  w('Light Hammer', false, true, '1d4', 'B', 'Nick', 'Thrown (20/60)', 'L'),
  w('Mace', false, true, '1d6', 'B', 'Sap'),
  w('Quarterstaff', false, true, '1d6', 'B', 'Topple', 'Versatile (1d8)'),
  w('Sickle', false, true, '1d4', 'S', 'Nick', '', 'L'),
  w('Spear', false, true, '1d6', 'P', 'Sap', 'Thrown (20/60), Versatile (1d8)'),
  w('Dart', false, false, '1d4', 'P', 'Vex', 'Thrown (20/60)', 'F'),
  w('Light Crossbow', false, false, '1d8', 'P', 'Slow', 'Ammunition (80/320), Loading, Two-Handed'),
  w('Shortbow', false, false, '1d6', 'P', 'Vex', 'Ammunition (80/320), Two-Handed'),
  w('Sling', false, false, '1d4', 'B', 'Slow', 'Ammunition (30/120)'),
  w('Battleaxe', true, true, '1d8', 'S', 'Topple', 'Versatile (1d10)'),
  w('Flail', true, true, '1d8', 'B', 'Sap'),
  w('Glaive', true, true, '1d10', 'S', 'Graze', 'Heavy, Reach, Two-Handed'),
  w('Greataxe', true, true, '1d12', 'S', 'Cleave', 'Heavy, Two-Handed'),
  w('Greatsword', true, true, '2d6', 'S', 'Graze', 'Heavy, Two-Handed'),
  w('Halberd', true, true, '1d10', 'S', 'Cleave', 'Heavy, Reach, Two-Handed'),
  w('Lance', true, true, '1d10', 'P', 'Topple', 'Heavy, Reach, Two-Handed (medmindre beredet)'),
  w('Longsword', true, true, '1d8', 'S', 'Sap', 'Versatile (1d10)'),
  w('Maul', true, true, '2d6', 'B', 'Topple', 'Heavy, Two-Handed'),
  w('Morningstar', true, true, '1d8', 'P', 'Sap'),
  w('Pike', true, true, '1d10', 'P', 'Push', 'Heavy, Reach, Two-Handed'),
  w('Rapier', true, true, '1d8', 'P', 'Vex', '', 'F'),
  w('Scimitar', true, true, '1d6', 'S', 'Nick', '', 'FL'),
  w('Shortsword', true, true, '1d6', 'P', 'Vex', '', 'FL'),
  w('Trident', true, true, '1d8', 'P', 'Topple', 'Thrown (20/60), Versatile (1d10)'),
  w('Warhammer', true, true, '1d8', 'B', 'Push', 'Versatile (1d10)'),
  w('War Pick', true, true, '1d8', 'P', 'Sap', 'Versatile (1d10)'),
  w('Whip', true, true, '1d4', 'S', 'Slow', 'Reach', 'F'),
  w('Blowgun', true, false, '1', 'P', 'Vex', 'Ammunition (25/100), Loading'),
  w('Hand Crossbow', true, false, '1d6', 'P', 'Vex', 'Ammunition (30/120), Loading', 'L'),
  w('Heavy Crossbow', true, false, '1d10', 'P', 'Push', 'Ammunition (100/400), Heavy, Loading, Two-Handed'),
  w('Longbow', true, false, '1d8', 'P', 'Slow', 'Ammunition (150/600), Heavy, Two-Handed'),
  w('Musket', true, false, '1d12', 'P', 'Slow', 'Ammunition (40/120), Loading, Two-Handed'),
  w('Pistol', true, false, '1d10', 'P', 'Vex', 'Ammunition (30/90), Loading'),
]

export type ArmorId =
  | 'padded' | 'leather' | 'studded-leather'
  | 'hide' | 'chain-shirt' | 'scale-mail' | 'breastplate' | 'half-plate'
  | 'ring-mail' | 'chain-mail' | 'splint' | 'plate'

export interface Armor {
  name: string
  type: Exclude<ArmorTraining, 'shield'>
  base: number
  dexCap: number | null
  strength?: number
  stealthDisadvantage?: boolean
  weight: number
}

export const ARMOR: Record<ArmorId, Armor> = {
  'padded': { name: 'Padded Armor', type: 'light', base: 11, dexCap: null, stealthDisadvantage: true, weight: 8 },
  'leather': { name: 'Leather Armor', type: 'light', base: 11, dexCap: null, weight: 10 },
  'studded-leather': { name: 'Studded Leather Armor', type: 'light', base: 12, dexCap: null, weight: 13 },
  'hide': { name: 'Hide Armor', type: 'medium', base: 12, dexCap: 2, weight: 12 },
  'chain-shirt': { name: 'Chain Shirt', type: 'medium', base: 13, dexCap: 2, weight: 20 },
  'scale-mail': { name: 'Scale Mail', type: 'medium', base: 14, dexCap: 2, stealthDisadvantage: true, weight: 45 },
  'breastplate': { name: 'Breastplate', type: 'medium', base: 14, dexCap: 2, weight: 20 },
  'half-plate': { name: 'Half Plate Armor', type: 'medium', base: 15, dexCap: 2, stealthDisadvantage: true, weight: 40 },
  'ring-mail': { name: 'Ring Mail', type: 'heavy', base: 14, dexCap: 0, stealthDisadvantage: true, weight: 40 },
  'chain-mail': { name: 'Chain Mail', type: 'heavy', base: 16, dexCap: 0, strength: 13, stealthDisadvantage: true, weight: 55 },
  'splint': { name: 'Splint Armor', type: 'heavy', base: 17, dexCap: 0, strength: 15, stealthDisadvantage: true, weight: 60 },
  'plate': { name: 'Plate Armor', type: 'heavy', base: 18, dexCap: 0, strength: 15, stealthDisadvantage: true, weight: 65 },
}

export const SHIELD_AC = 2
export const SHIELD_WEIGHT = 6

// ---------- Klasser ----------

export type MartialTraining = 'none' | 'all' | 'finesse-or-light' | 'light'

export interface EquipmentPackage { id: string; items: string[]; gold: number; armor?: ArmorId; shield?: boolean }

export interface ClassFeature { name: string; text: string | ((ctx: FeatureCtx) => string); effects?: OptionEffects }

// Værdier der skalerer med klasselevel – bruges både i feature-tekster og som ressourcer på arket
const byLevel = (level: number, steps: [number, number][]) => steps.reduce((v, [from, value]) => (level >= from ? value : v), steps[0][1])
export const rageUses = (level: number) => byLevel(level, [[1, 2], [3, 3], [6, 4], [12, 5], [17, 6]])
export const rageDamage = (level: number) => byLevel(level, [[1, 2], [9, 3], [16, 4]])
export const bardicDie = (level: number) => `d${byLevel(level, [[1, 6], [5, 8], [10, 10], [15, 12]])}`
export const martialArtsDie = (level: number) => `d${byLevel(level, [[1, 6], [5, 8], [11, 10], [17, 12]])}`
export const sneakAttackDice = (level: number) => Math.ceil(level / 2)
export const secondWindUses = (level: number) => byLevel(level, [[1, 2], [4, 3], [10, 4]])
export const favoredEnemyUses = (level: number) => byLevel(level, [[1, 2], [5, 3], [9, 4], [13, 5], [17, 6]])
export const unarmoredMovement = (level: number) => byLevel(level, [[1, 0], [2, 10], [6, 15], [10, 20], [14, 25], [18, 30]])
export const channelDivinityUses = (level: number, cls: 'cleric' | 'paladin') =>
  cls === 'cleric' ? byLevel(level, [[1, 0], [2, 2], [6, 3], [18, 4]]) : byLevel(level, [[1, 0], [3, 2], [11, 3]])
export const wildShapeUses = (level: number) => byLevel(level, [[1, 0], [2, 2], [6, 3], [17, 4]])
export const psionicDice = (level: number) => ({
  count: byLevel(level, [[1, 0], [3, 4], [5, 6], [9, 8], [13, 10], [17, 12]]),
  die: `d${byLevel(level, [[1, 6], [5, 8], [11, 10], [17, 12]])}`,
})

export interface DndClass {
  id: string
  name: string
  blurb: string
  hitDie: number
  primary: Ability[]
  saves: [Ability, Ability]
  skillGrant: SkillGrant
  armor: ArmorTraining[]
  martial: MartialTraining
  tools: string[]
  toolGrant?: ToolGrant
  features: ClassFeature[]
  choices?: ChoiceDef[]
  weaponMastery?: { count: number; meleeOnly?: boolean }
  expertise?: number
  extraLanguages?: string[]
  unarmoredDefense?: { ability: Ability; allowShield: boolean }
  spellcasting?: {
    ability: Ability
    cantrips: number
    prepared: number
    slots: number
    pact?: boolean
    /** Wizard: antal level 1-spells i spellbook; forberedte spells vælges blandt dem. */
    spellbook?: number
    /** Altid forberedt og tæller ikke med i `prepared`. */
    alwaysPrepared?: string[]
  }
  /** PHB'ens anbefalede Standard Array-fordeling (STR, DEX, CON, INT, WIS, CHA). */
  suggestedArray: [number, number, number, number, number, number]
  equipment: EquipmentPackage[]
}

export const FIGHTING_STYLES: ChoiceOption[] = [
  { id: 'archery', name: 'Archery', text: '+2 på angreb med ranged weapons.' },
  { id: 'blind-fighting', name: 'Blind Fighting', text: 'Blindsight 10 ft.' },
  { id: 'defense', name: 'Defense', text: '+1 AC når du bærer rustning.' },
  { id: 'dueling', name: 'Dueling', text: '+2 damage med ét enhånds melee-våben.' },
  { id: 'great-weapon', name: 'Great Weapon Fighting', text: "1'ere og 2'ere tæller som 3 med tohåndsvåben." },
  { id: 'interception', name: 'Interception', text: 'Reaction: reducer skade på en allieret.' },
  { id: 'protection', name: 'Protection', text: 'Reaction: giv disadvantage på angreb mod en allieret.' },
  { id: 'thrown', name: 'Thrown Weapon Fighting', text: '+2 damage med kastevåben.' },
  { id: 'two-weapon', name: 'Two-Weapon Fighting', text: 'Læg modifier til damage på det ekstra angreb.' },
  { id: 'unarmed', name: 'Unarmed Fighting', text: 'Unarmed strikes giver 1d6 (1d8 med frie hænder).' },
]

export const CLASSES: DndClass[] = [
  {
    id: 'barbarian', name: 'Barbarian', blurb: 'Raseri-drevet kriger med enorm udholdenhed.',
    hitDie: 12, primary: ['str'], saves: ['str', 'con'],
    skillGrant: { count: 2, from: ['animal_handling', 'athletics', 'intimidation', 'nature', 'perception', 'survival'], label: 'Barbarian' },
    armor: ['light', 'medium', 'shield'], martial: 'all', tools: [],
    features: [
      { name: 'Rage', text: ({ level }) => `${rageUses(level)} brug pr. long rest (ét genvindes ved short rest): +${rageDamage(level)} damage, resistance mod bludgeoning/piercing/slashing og advantage på STR-checks og -saves.`, effects: { saveAdvantage: { abilities: ['str'], note: 'Rage – kun under Rage' } } },
      { name: 'Unarmored Defense', text: 'Uden rustning er din AC 10 + DEX + CON (skjold tilladt).' },
      { name: 'Weapon Mastery', text: 'Brug mastery-egenskaben på 2 slags simple eller martial melee-våben.' },
    ],
    weaponMastery: { count: 2, meleeOnly: true },
    unarmoredDefense: { ability: 'con', allowShield: true },
    suggestedArray: [15, 13, 14, 10, 12, 8],
    equipment: [
      { id: 'A', items: ['Greataxe', '4 Handaxes', "Explorer's Pack"], gold: 15 },
      { id: 'B', items: [], gold: 75 },
    ],
  },
  {
    id: 'bard', name: 'Bard', blurb: 'Inspirerende kunstner, hvis magi bor i ord og musik.',
    hitDie: 8, primary: ['cha'], saves: ['dex', 'cha'],
    skillGrant: { count: 3, from: 'any', label: 'Bard' },
    armor: ['light'], martial: 'none', tools: [],
    toolGrant: { count: 3, from: ['instrument'], label: 'Bard' },
    features: [
      { name: 'Bardic Inspiration', text: ({ mods, level }) => `Bonus action: giv en allieret en ${bardicDie(level)} at lægge til en mislykket d20 Test. ${Math.max(1, mods.cha)} brug pr. long rest (CHA-modifier).` },
      { name: 'Spellcasting', text: 'Bard-spells med CHA; et musikinstrument kan bruges som spellcasting focus.' },
    ],
    spellcasting: { ability: 'cha', cantrips: 2, prepared: 4, slots: 2 },
    suggestedArray: [8, 14, 12, 13, 10, 15],
    equipment: [
      { id: 'A', items: ['Leather Armor', '2 Daggers', 'Musical Instrument (valgfrit)', "Entertainer's Pack"], gold: 19, armor: 'leather' },
      { id: 'B', items: [], gold: 90 },
    ],
  },
  {
    id: 'cleric', name: 'Cleric', blurb: 'Guddommelig formidler, der kanaliserer sin gudes kraft.',
    hitDie: 8, primary: ['wis'], saves: ['wis', 'cha'],
    skillGrant: { count: 2, from: ['history', 'insight', 'medicine', 'persuasion', 'religion'], label: 'Cleric' },
    armor: ['light', 'medium', 'shield'], martial: 'none', tools: [],
    features: [
      { name: 'Spellcasting', text: 'Cleric-spells med WIS; et Holy Symbol er dit spellcasting focus.' },
      { name: 'Divine Order', text: 'Din hellige rolle: Protector eller Thaumaturge.' },
    ],
    choices: [{
      id: 'divineOrder', label: 'Divine Order',
      options: [
        { id: 'protector', name: 'Protector', text: 'Training med heavy armor og martial weapons.', effects: { armor: ['heavy'], martialWeapons: true } },
        { id: 'thaumaturge', name: 'Thaumaturge', text: 'Én ekstra cantrip og +WIS (min. +1) på Arcana og Religion.', effects: { extraCantrips: 1, skillBonus: { skills: ['arcana', 'religion'], ability: 'wis' } } },
      ],
    }],
    spellcasting: { ability: 'wis', cantrips: 3, prepared: 4, slots: 2 },
    suggestedArray: [14, 8, 13, 10, 15, 12],
    equipment: [
      { id: 'A', items: ['Chain Shirt', 'Shield', 'Mace', 'Holy Symbol', "Priest's Pack"], gold: 7, armor: 'chain-shirt', shield: true },
      { id: 'B', items: [], gold: 110 },
    ],
  },
  {
    id: 'druid', name: 'Druid', blurb: 'Naturens præst, der kan antage dyrs skikkelse.',
    hitDie: 8, primary: ['wis'], saves: ['int', 'wis'],
    skillGrant: { count: 2, from: ['arcana', 'animal_handling', 'insight', 'medicine', 'nature', 'perception', 'religion', 'survival'], label: 'Druid' },
    armor: ['light', 'shield'], martial: 'none', tools: ['Herbalism Kit'],
    features: [
      { name: 'Spellcasting', text: 'Druid-spells med WIS; et Druidic Focus er dit spellcasting focus.' },
      { name: 'Druidic', text: 'Du kender druidernes hemmelige sprog og har Speak with Animals altid forberedt.' },
      { name: 'Primal Order', text: 'Din hellige rolle: Magician eller Warden.' },
    ],
    choices: [{
      id: 'primalOrder', label: 'Primal Order',
      options: [
        { id: 'magician', name: 'Magician', text: 'Én ekstra cantrip og +WIS (min. +1) på Arcana og Nature.', effects: { extraCantrips: 1, skillBonus: { skills: ['arcana', 'nature'], ability: 'wis' } } },
        { id: 'warden', name: 'Warden', text: 'Training med medium armor og martial weapons.', effects: { armor: ['medium'], martialWeapons: true } },
      ],
    }],
    extraLanguages: ['Druidic'],
    spellcasting: { ability: 'wis', cantrips: 2, prepared: 4, slots: 2, alwaysPrepared: ['speak-with-animals'] },
    suggestedArray: [8, 12, 14, 13, 15, 10],
    equipment: [
      { id: 'A', items: ['Leather Armor', 'Shield', 'Sickle', 'Druidic Focus (Quarterstaff)', "Explorer's Pack", 'Herbalism Kit'], gold: 9, armor: 'leather', shield: true },
      { id: 'B', items: [], gold: 50 },
    ],
  },
  {
    id: 'fighter', name: 'Fighter', blurb: 'Våbenmester med alsidig kamptræning.',
    hitDie: 10, primary: ['str', 'dex'], saves: ['str', 'con'],
    skillGrant: { count: 2, from: ['acrobatics', 'animal_handling', 'athletics', 'history', 'insight', 'intimidation', 'persuasion', 'perception', 'survival'], label: 'Fighter' },
    armor: ['light', 'medium', 'heavy', 'shield'], martial: 'all', tools: [],
    features: [
      { name: 'Fighting Style', text: 'Et Fighting Style-feat efter eget valg.' },
      { name: 'Second Wind', text: ({ level }) => `Bonus action: hel 1d10 + ${level}. ${secondWindUses(level)} brug, ét kommer tilbage ved short rest.` },
      { name: 'Weapon Mastery', text: 'Brug mastery-egenskaben på 3 slags simple eller martial våben (flere på level 4, 10 og 16).' },
    ],
    choices: [{ id: 'fightingStyle', label: 'Fighting Style', options: FIGHTING_STYLES }],
    weaponMastery: { count: 3 },
    suggestedArray: [15, 14, 13, 8, 10, 12],
    equipment: [
      { id: 'A', items: ['Chain Mail', 'Greatsword', 'Flail', '8 Javelins', "Dungeoneer's Pack"], gold: 4, armor: 'chain-mail' },
      { id: 'B', items: ['Studded Leather Armor', 'Scimitar', 'Shortsword', 'Longbow', '20 Arrows', 'Quiver', "Dungeoneer's Pack"], gold: 11, armor: 'studded-leather' },
      { id: 'C', items: [], gold: 155 },
    ],
  },
  {
    id: 'monk', name: 'Monk', blurb: 'Kampkunstner, der kanaliserer indre energi.',
    hitDie: 8, primary: ['dex', 'wis'], saves: ['str', 'dex'],
    skillGrant: { count: 2, from: ['acrobatics', 'athletics', 'history', 'insight', 'religion', 'stealth'], label: 'Monk' },
    armor: [], martial: 'light', tools: [],
    toolGrant: { count: 1, from: ['artisan', 'instrument'], label: 'Monk' },
    features: [
      { name: 'Martial Arts', text: ({ level }) => `Unarmed strikes og Monk-våben (simple melee og martial melee med Light) kan bruge DEX og ${martialArtsDie(level)}; bonus action unarmed strike.` },
      { name: 'Unarmored Defense', text: 'Uden rustning og skjold er din AC 10 + DEX + WIS.' },
    ],
    unarmoredDefense: { ability: 'wis', allowShield: false },
    suggestedArray: [12, 15, 13, 10, 14, 8],
    equipment: [
      { id: 'A', items: ['Spear', '5 Daggers', "Artisan's Tools eller instrument (som din proficiency)", "Explorer's Pack"], gold: 11 },
      { id: 'B', items: [], gold: 50 },
    ],
  },
  {
    id: 'paladin', name: 'Paladin', blurb: 'Hellig kriger bundet af en ed.',
    hitDie: 10, primary: ['str', 'cha'], saves: ['wis', 'cha'],
    skillGrant: { count: 2, from: ['athletics', 'insight', 'intimidation', 'medicine', 'persuasion', 'religion'], label: 'Paladin' },
    armor: ['light', 'medium', 'heavy', 'shield'], martial: 'all', tools: [],
    features: [
      { name: 'Lay On Hands', text: ({ level }) => `Bonus action: pulje på ${5 * level} HP (5 × level) til healing; 5 point kan fjerne poisoned.` },
      { name: 'Spellcasting', text: 'Paladin-spells med CHA; et Holy Symbol er dit spellcasting focus.' },
      { name: 'Weapon Mastery', text: 'Brug mastery-egenskaben på 2 slags våben.' },
    ],
    weaponMastery: { count: 2 },
    spellcasting: { ability: 'cha', cantrips: 0, prepared: 2, slots: 2 },
    suggestedArray: [15, 10, 13, 8, 12, 14],
    equipment: [
      { id: 'A', items: ['Chain Mail', 'Shield', 'Longsword', '6 Javelins', 'Holy Symbol', "Priest's Pack"], gold: 9, armor: 'chain-mail', shield: true },
      { id: 'B', items: [], gold: 150 },
    ],
  },
  {
    id: 'ranger', name: 'Ranger', blurb: 'Vildmarksjæger med naturmagi.',
    hitDie: 10, primary: ['dex', 'wis'], saves: ['str', 'dex'],
    skillGrant: { count: 3, from: ['animal_handling', 'athletics', 'insight', 'investigation', 'nature', 'perception', 'stealth', 'survival'], label: 'Ranger' },
    armor: ['light', 'medium', 'shield'], martial: 'all', tools: [],
    features: [
      { name: 'Spellcasting', text: 'Ranger-spells med WIS; et Druidic Focus er dit spellcasting focus.' },
      { name: 'Favored Enemy', text: ({ level }) => `Hunter's Mark er altid forberedt og kan castes ${favoredEnemyUses(level)} gange uden spell slot pr. long rest.` },
      { name: 'Weapon Mastery', text: 'Brug mastery-egenskaben på 2 slags våben.' },
    ],
    weaponMastery: { count: 2 },
    spellcasting: { ability: 'wis', cantrips: 0, prepared: 2, slots: 2, alwaysPrepared: ['hunters-mark'] },
    suggestedArray: [12, 15, 13, 8, 14, 10],
    equipment: [
      { id: 'A', items: ['Studded Leather Armor', 'Scimitar', 'Shortsword', 'Longbow', '20 Arrows', 'Quiver', 'Druidic Focus (sprig of mistletoe)', "Explorer's Pack"], gold: 7, armor: 'studded-leather' },
      { id: 'B', items: [], gold: 150 },
    ],
  },
  {
    id: 'rogue', name: 'Rogue', blurb: 'Snedig specialist i list, præcision og skjulte stik.',
    hitDie: 8, primary: ['dex'], saves: ['dex', 'int'],
    skillGrant: { count: 4, from: ['acrobatics', 'athletics', 'deception', 'insight', 'intimidation', 'investigation', 'perception', 'persuasion', 'sleight_of_hand', 'stealth'], label: 'Rogue' },
    armor: ['light'], martial: 'finesse-or-light', tools: ["Thieves' Tools"],
    features: [
      { name: 'Expertise', text: 'Dobbelt proficiency bonus i 2 af dine skill proficiencies.' },
      { name: 'Sneak Attack', text: ({ level }) => `+${sneakAttackDice(level)}d6 damage én gang pr. tur med advantage eller en allieret ved målet (Finesse/Ranged).` },
      { name: "Thieves' Cant", text: 'Du kender tyvenes hemmelige sprog og ét ekstra sprog.' },
      { name: 'Weapon Mastery', text: 'Brug mastery-egenskaben på 2 slags våben, du har proficiency med.' },
    ],
    weaponMastery: { count: 2 },
    expertise: 2,
    extraLanguages: ["Thieves' Cant"],
    suggestedArray: [12, 15, 13, 14, 10, 8],
    equipment: [
      { id: 'A', items: ['Leather Armor', '2 Daggers', 'Shortsword', 'Shortbow', '20 Arrows', 'Quiver', "Thieves' Tools", "Burglar's Pack"], gold: 8, armor: 'leather' },
      { id: 'B', items: [], gold: 100 },
    ],
  },
  {
    id: 'sorcerer', name: 'Sorcerer', blurb: 'Født med medfødt, rå magi.',
    hitDie: 6, primary: ['cha'], saves: ['con', 'cha'],
    skillGrant: { count: 2, from: ['arcana', 'deception', 'insight', 'intimidation', 'persuasion', 'religion'], label: 'Sorcerer' },
    armor: [], martial: 'none', tools: [],
    features: [
      { name: 'Spellcasting', text: 'Sorcerer-spells med CHA; et Arcane Focus er dit spellcasting focus.' },
      { name: 'Innate Sorcery', text: 'Bonus action i 1 minut: +1 spell save DC og advantage på spell attacks. 2 brug pr. long rest.' },
    ],
    spellcasting: { ability: 'cha', cantrips: 4, prepared: 2, slots: 2 },
    suggestedArray: [10, 13, 14, 8, 12, 15],
    equipment: [
      { id: 'A', items: ['Spear', '2 Daggers', 'Arcane Focus (crystal)', "Dungeoneer's Pack"], gold: 28 },
      { id: 'B', items: [], gold: 50 },
    ],
  },
  {
    id: 'warlock', name: 'Warlock', blurb: 'Magi købt gennem en pagt med en mægtig patron.',
    hitDie: 8, primary: ['cha'], saves: ['wis', 'cha'],
    skillGrant: { count: 2, from: ['arcana', 'deception', 'history', 'intimidation', 'investigation', 'nature', 'religion'], label: 'Warlock' },
    armor: ['light'], martial: 'none', tools: [],
    features: [
      { name: 'Eldritch Invocations', text: 'Én invocation efter eget valg.' },
      { name: 'Pact Magic', text: 'Warlock-spells med CHA; spell slots kommer tilbage ved short rest.' },
    ],
    choices: [{
      id: 'invocation', label: 'Eldritch Invocation',
      options: [
        { id: 'armor-of-shadows', name: 'Armor of Shadows', text: 'Cast Mage Armor på dig selv uden spell slot.' },
        { id: 'eldritch-mind', name: 'Eldritch Mind', text: 'Advantage på CON-saves for at holde concentration.' },
        { id: 'pact-blade', name: 'Pact of the Blade', text: 'Fremkald et pagtvåben; brug CHA til angreb.' },
        { id: 'pact-chain', name: 'Pact of the Chain', text: 'Find Familiar med særlige former.' },
        { id: 'pact-tome', name: 'Pact of the Tome', text: 'Book of Shadows med 3 ekstra cantrips og 2 level 1-ritualer fra alle klasselister.' },
      ],
    }],
    spellcasting: { ability: 'cha', cantrips: 2, prepared: 2, slots: 1, pact: true },
    suggestedArray: [8, 14, 13, 12, 10, 15],
    equipment: [
      { id: 'A', items: ['Leather Armor', 'Sickle', '2 Daggers', 'Arcane Focus (orb)', 'Book (occult lore)', "Scholar's Pack"], gold: 15, armor: 'leather' },
      { id: 'B', items: [], gold: 100 },
    ],
  },
  {
    id: 'wizard', name: 'Wizard', blurb: 'Lærd magiker, der mestrer magi gennem studier.',
    hitDie: 6, primary: ['int'], saves: ['int', 'wis'],
    skillGrant: { count: 2, from: ['arcana', 'history', 'insight', 'investigation', 'medicine', 'nature', 'religion'], label: 'Wizard' },
    armor: [], martial: 'none', tools: [],
    features: [
      { name: 'Spellcasting', text: 'Wizard-spells med INT; din spellbook starter med 6 level 1-spells og får 2 nye pr. level.' },
      { name: 'Ritual Adept', text: 'Cast ritual-spells fra din spellbook uden at have dem forberedt.' },
      { name: 'Arcane Recovery', text: 'Én gang om dagen efter en short rest: genvind spell slots.' },
    ],
    spellcasting: { ability: 'int', cantrips: 3, prepared: 4, slots: 2, spellbook: 6 },
    suggestedArray: [8, 12, 13, 15, 14, 10],
    equipment: [
      { id: 'A', items: ['2 Daggers', 'Arcane Focus (Quarterstaff)', 'Robe', 'Spellbook', "Scholar's Pack"], gold: 5 },
      { id: 'B', items: [], gold: 55 },
    ],
  },
]

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
]
