// General feats, Fighting Style-feats og Epic Boons fra 2024-reglerne (PHB).
// Origin feats ligger i data.ts. Kun mekanik og korte resuméer med egne ord.

import { FIGHTING_STYLES, ORIGIN_FEATS, type Ability, type Feat } from './data'

const PHYSICAL: Ability[] = ['str', 'dex']
const MENTAL: Ability[] = ['int', 'wis', 'cha']
const ALL: Ability[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']

const general = (feat: Omit<Feat, 'category'>): Feat => ({ ...feat, category: 'general', prereq: { level: 4, ...feat.prereq } })

/** ASI er et feat i 2024-reglerne, men vælges med sin egen +2/+1+1-fordeling. */
export const ASI_FEAT_ID = 'ability-score-improvement'

export const GENERAL_FEATS: Feat[] = [
  general({ id: ASI_FEAT_ID, name: 'Ability Score Improvement', text: '+2 til én evne eller +1 til to evner (max 20).', repeatable: true }),
  general({ id: 'actor', name: 'Actor', text: 'Advantage på Deception og Performance, når du udgiver dig for at være en anden; efterlign stemmer.', abilityIncrease: ['cha'], prereq: { abilities: ['cha'] } }),
  general({ id: 'athlete', name: 'Athlete', text: 'Climb speed lig din speed; rejs dig fra prone med 5 ft.; længere spring med tilløb.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'charger', name: 'Charger', text: 'Dash giver +10 ft.; efter 10 ft. i lige linje: +1d8 damage eller skub 10 ft. én gang pr. tur.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'chef', name: 'Chef', text: "Proficiency med Cook's Utensils; madlavning giver ekstra healing ved short rest og temp HP-snacks.", abilityIncrease: ['con', 'wis'], effects: { toolProficiencies: ["Cook's Utensils"] } }),
  general({ id: 'crossbow-expert', name: 'Crossbow Expert', text: 'Ignorer Loading; ingen disadvantage på ranged angreb tæt på fjender; +modifier på ekstra Light-angreb.', abilityIncrease: ['dex'], prereq: { abilities: ['dex'] } }),
  general({ id: 'crusher', name: 'Crusher', text: 'Bludgeoning-hit kan skubbe 5 ft.; crits giver advantage på angreb mod målet.', abilityIncrease: ['str', 'con'], prereq: { abilities: ['str', 'con'] } }),
  general({ id: 'defensive-duelist', name: 'Defensive Duelist', text: 'Reaction med et Finesse-våben: læg PB til AC mod melee-angreb.', abilityIncrease: ['dex'], prereq: { abilities: ['dex'] } }),
  general({ id: 'dual-wielder', name: 'Dual Wielder', text: 'Ekstra angreb med et våben uden Light; tegn eller gem to våben ad gangen.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'durable', name: 'Durable', text: 'Advantage på death saves; bonus action: brug en hit die til at hele.', abilityIncrease: ['con'] }),
  general({ id: 'elemental-adept', name: 'Elemental Adept', text: 'Vælg en elementtype: dine spells ignorerer resistance mod den, og 1\'ere tæller som 2.', abilityIncrease: MENTAL, repeatable: true, prereq: { spellcasting: true } }),
  general({ id: 'fey-touched', name: 'Fey Touched', text: 'Misty Step og én level 1 Divination- eller Enchantment-spell; hver kan castes gratis én gang pr. long rest.', abilityIncrease: MENTAL, spells: ['misty-step'], spellPick: { count: 1, schools: ['Divination', 'Enchantment'] } }),
  general({ id: 'grappler', name: 'Grappler', text: 'Unarmed strike kan både skade og grapple; advantage på angreb mod væsener, du har grappled.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'great-weapon-master', name: 'Great Weapon Master', text: 'Heavy-våben gør +PB damage; crit eller kill giver et bonus action-angreb.', abilityIncrease: ['str'], prereq: { abilities: ['str'] } }),
  general({ id: 'heavily-armored', name: 'Heavily Armored', text: 'Training med heavy armor.', abilityIncrease: ['str', 'con'], prereq: { armor: 'medium' }, effects: { armor: ['heavy'] } }),
  general({ id: 'heavy-armor-master', name: 'Heavy Armor Master', text: 'I heavy armor: reducer bludgeoning, piercing og slashing damage med PB.', abilityIncrease: ['str', 'con'], prereq: { armor: 'heavy' } }),
  general({ id: 'inspiring-leader', name: 'Inspiring Leader', text: 'Efter en rest: op til seks allierede får temp HP lig level + modifier.', abilityIncrease: ['wis', 'cha'], prereq: { abilities: ['wis', 'cha'] } }),
  general({ id: 'keen-mind', name: 'Keen Mind', text: 'Proficiency (eller Expertise) i Arcana, History, Investigation, Nature eller Religion; Study som bonus action.', abilityIncrease: ['int'], prereq: { abilities: ['int'] } }),
  general({ id: 'lightly-armored', name: 'Lightly Armored', text: 'Training med light armor og skjolde.', abilityIncrease: ['str', 'dex'], effects: { armor: ['light', 'shield'] } }),
  general({ id: 'mage-slayer', name: 'Mage Slayer', text: 'Dine hits bryder concentration lettere; slå et mislykket mentalt save om én gang pr. rest.', abilityIncrease: PHYSICAL }),
  general({ id: 'martial-weapon-training', name: 'Martial Weapon Training', text: 'Proficiency med martial weapons.', abilityIncrease: PHYSICAL, effects: { martialWeapons: true } }),
  general({ id: 'medium-armor-master', name: 'Medium Armor Master', text: 'Medium armor tillader op til +3 DEX til AC.', abilityIncrease: PHYSICAL, prereq: { armor: 'medium' } }),
  general({ id: 'moderately-armored', name: 'Moderately Armored', text: 'Training med medium armor og skjolde.', abilityIncrease: PHYSICAL, prereq: { armor: 'light' }, effects: { armor: ['medium', 'shield'] } }),
  general({ id: 'mounted-combatant', name: 'Mounted Combatant', text: 'Advantage mod umonterede væsener; dit ridedyr er sværere at ramme.', abilityIncrease: ['str', 'dex', 'wis'] }),
  general({ id: 'observant', name: 'Observant', text: 'Proficiency (eller Expertise) i Insight, Investigation eller Perception; Search som bonus action.', abilityIncrease: ['int', 'wis'], prereq: { abilities: ['int', 'wis'] } }),
  general({ id: 'piercer', name: 'Piercer', text: 'Slå én piercing-terning om pr. tur; crits giver en ekstra terning.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'poisoner', name: 'Poisoner', text: "Proficiency med Poisoner's Kit; dine gifte ignorerer resistance mod poison.", abilityIncrease: ['dex', 'int'], effects: { toolProficiencies: ["Poisoner's Kit"] } }),
  general({ id: 'polearm-master', name: 'Polearm Master', text: 'Bonus action-angreb med skaftet; opportunity attack når fjender kommer inden for rækkevidde.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'resilient', name: 'Resilient', text: 'Proficiency i saving throws med den evne, du hæver.', abilityIncrease: ALL, saveFromAbility: true }),
  general({ id: 'ritual-caster', name: 'Ritual Caster', text: 'Lær level 1-ritualer (antal = PB) og cast ét gratis pr. long rest.', abilityIncrease: MENTAL, prereq: { abilities: MENTAL } }),
  general({ id: 'sentinel', name: 'Sentinel', text: 'Opportunity attacks stopper bevægelse; reager når en fjende angriber en anden.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'shadow-touched', name: 'Shadow Touched', text: 'Invisibility og én level 1 Illusion- eller Necromancy-spell; hver kan castes gratis én gang pr. long rest.', abilityIncrease: MENTAL, spells: ['invisibility'], spellPick: { count: 1, schools: ['Illusion', 'Necromancy'] } }),
  general({ id: 'sharpshooter', name: 'Sharpshooter', text: 'Ignorer half og three-quarters cover; ingen disadvantage på lang afstand eller tæt på fjender.', abilityIncrease: ['dex'], prereq: { abilities: ['dex'] } }),
  general({ id: 'shield-master', name: 'Shield Master', text: 'Skjoldslag skubber eller vælter; reaction: ingen skade ved et klaret DEX save.', abilityIncrease: ['str'], prereq: { armor: 'shield' } }),
  general({ id: 'skill-expert', name: 'Skill Expert', text: 'Proficiency i én skill og Expertise i én skill, du har proficiency i.', abilityIncrease: ALL, skillGrant: 1, expertiseGrant: 1 }),
  general({ id: 'skulker', name: 'Skulker', text: 'Blindsight 10 ft.; misser fra skjul afslører dig ikke; advantage på Stealth i bevægelse.', abilityIncrease: ['dex'], prereq: { abilities: ['dex'] } }),
  general({ id: 'slasher', name: 'Slasher', text: 'Slashing-hit sænker speed med 10 ft.; crits giver disadvantage på angreb.', abilityIncrease: PHYSICAL, prereq: { abilities: PHYSICAL } }),
  general({ id: 'speedy', name: 'Speedy', text: '+10 ft. speed; Dash over svært terræn; opportunity attacks mod dig har disadvantage.', abilityIncrease: ['dex', 'con'], prereq: { abilities: ['dex', 'con'] }, effects: { speedBonus: 10 } }),
  general({ id: 'spell-sniper', name: 'Spell Sniper', text: 'Spell attacks ignorerer cover og har længere rækkevidde.', abilityIncrease: MENTAL, prereq: { spellcasting: true } }),
  general({ id: 'telekinetic', name: 'Telekinetic', text: 'Usynlig Mage Hand; bonus action: skub et væsen 5 ft. (STR save).', abilityIncrease: MENTAL, spells: ['mage-hand'] }),
  general({ id: 'telepathic', name: 'Telepathic', text: 'Telepati 60 ft.; Detect Thoughts gratis én gang pr. long rest.', abilityIncrease: MENTAL, spells: ['detect-thoughts'] }),
  general({ id: 'war-caster', name: 'War Caster', text: 'Advantage på concentration-saves; cast en spell som opportunity attack.', abilityIncrease: MENTAL, prereq: { spellcasting: true } }),
  general({ id: 'weapon-master', name: 'Weapon Master', text: 'Mastery-egenskaben på én ekstra slags våben (kan byttes ved long rest).', abilityIncrease: PHYSICAL }),
]

/** Fighting Style-feats kræver featuren Fighting Style; id'erne matcher FIGHTING_STYLES med 'fs-'-præfiks. */
export const FIGHTING_STYLE_FEATS: Feat[] = FIGHTING_STYLES.map(o => ({
  id: `fs-${o.id}`, name: `Fighting Style: ${o.name}`, text: o.text ?? '', category: 'fighting-style', prereq: { level: 4, fightingStyle: true },
}))

const boon = (feat: Omit<Feat, 'category' | 'abilityMax'>): Feat =>
  ({ abilityIncrease: ALL, ...feat, category: 'epic-boon', abilityMax: 30, prereq: { level: 19, ...feat.prereq } })

export const EPIC_BOONS: Feat[] = [
  boon({ id: 'boon-combat-prowess', name: 'Boon of Combat Prowess', text: 'Én gang pr. tur: gør et miss til et hit.' }),
  boon({ id: 'boon-dimensional-travel', name: 'Boon of Dimensional Travel', text: 'Teleportér 30 ft. efter Attack eller Magic action.' }),
  boon({ id: 'boon-energy-resistance', name: 'Boon of Energy Resistance', text: 'Resistance mod to valgte damage types; omdiriger skaden som reaction.' }),
  boon({ id: 'boon-fate', name: 'Boon of Fate', text: 'Læg 2d4 til eller træk 2d4 fra en d20 Test, én gang pr. rest.' }),
  boon({ id: 'boon-fortitude', name: 'Boon of Fortitude', text: '+40 max HP; ekstra healing én gang pr. tur.', hpBonus: 40 }),
  boon({ id: 'boon-irresistible-offense', name: 'Boon of Irresistible Offense', text: 'Ignorer resistance mod B/P/S; en 20 giver ekstra damage.', abilityIncrease: ['str', 'dex'] }),
  boon({ id: 'boon-recovery', name: 'Boon of Recovery', text: 'Gå til halv HP i stedet for 0 én gang pr. long rest; pulje af d10\'ere til healing.' }),
  boon({ id: 'boon-skill', name: 'Boon of Skill', text: 'Proficiency i alle skills og Expertise i én.', expertiseGrant: 1, effects: { skillProficiencies: ['acrobatics', 'animal_handling', 'arcana', 'athletics', 'deception', 'history', 'insight', 'intimidation', 'investigation', 'medicine', 'nature', 'perception', 'performance', 'persuasion', 'religion', 'sleight_of_hand', 'stealth', 'survival'] } }),
  boon({ id: 'boon-speed', name: 'Boon of Speed', text: '+30 ft. speed; Disengage som bonus action.', effects: { speedBonus: 30 } }),
  boon({ id: 'boon-spell-recall', name: 'Boon of Spell Recall', text: 'Cast en forberedt spell af level 1–4 uden slot, én gang pr. long rest.', abilityIncrease: MENTAL, prereq: { spellcasting: true } }),
  boon({ id: 'boon-night-spirit', name: 'Boon of the Night Spirit', text: 'Bliv usynlig i mørke som bonus action; resistance mod alt undtagen psychic og radiant i mørke.' }),
  boon({ id: 'boon-truesight', name: 'Boon of Truesight', text: 'Truesight 60 ft.' }),
]

export const ALL_FEATS: Feat[] = [...ORIGIN_FEATS, ...GENERAL_FEATS, ...FIGHTING_STYLE_FEATS, ...EPIC_BOONS]

export const featCategory = (feat: Feat) => feat.category ?? 'origin'
