// Detaljer til spell cards: rækkevidde, komponenter, varighed og hvad upcasting giver (2024-reglerne).
// Format: 'rækkevidde|komponenter|varighed|upcast'. Upcast-koder:
//   c:1d10      cantrip-skalering (terninger ×2 på level 5, ×3 på 11, ×4 på 17); flere værdier med '/'
//   b:1d10      Eldritch Blast: flere stråler på level 5, 11 og 17
//   d:1d6 fire  ekstra terninger pr. slot-level over spellens level
//   n:5 temp HP fast ekstra værdi pr. slot-level
//   t:ét ekstra mål  noget ekstra pr. slot-level (antallet vises)
//   x:tekst     fri beskrivelse
// Kun mekanik og korte resuméer med egne ord – slå den fulde tekst op i PHB.

import type { Spell } from './spells'

const D: Record<string, string> = {
  // Cantrips
  'acid-splash': '60 ft.|V S|Øjeblikkelig|c:1d6',
  'blade-ward': 'Selv|V S|1 min',
  'chill-touch': 'Berøring|V S|Øjeblikkelig|c:1d10',
  'dancing-lights': '120 ft.|V S M|1 min',
  'druidcraft': '30 ft.|V S|Øjeblikkelig',
  'eldritch-blast': '120 ft.|V S|Øjeblikkelig|b:1d10',
  'elementalism': '30 ft.|V S|Øjeblikkelig',
  'fire-bolt': '120 ft.|V S|Øjeblikkelig|c:1d10',
  'friends': '10 ft.|S M|1 min',
  'guidance': 'Berøring|V S|1 min',
  'light': 'Berøring|V M|1 time',
  'mage-hand': '30 ft.|V S|1 min',
  'mending': 'Berøring|V S M|Øjeblikkelig',
  'message': '120 ft.|S M|1 runde',
  'mind-sliver': '60 ft.|V|1 runde|c:1d6',
  'minor-illusion': '30 ft.|S M|1 min',
  'poison-spray': '30 ft.|V S|Øjeblikkelig|c:1d12',
  'prestidigitation': '10 ft.|V S|Op til 1 time',
  'produce-flame': 'Selv|V S|10 min|c:1d8',
  'ray-of-frost': '60 ft.|V S|Øjeblikkelig|c:1d8',
  'resistance': 'Berøring|V S|1 min',
  'sacred-flame': '60 ft.|V S|Øjeblikkelig|c:1d8',
  'shillelagh': 'Selv|V S M|1 min|x:Damage-terningen bliver d10 på level 5, d12 på 11 og 2d6 på 17',
  'shocking-grasp': 'Berøring|V S|Øjeblikkelig|c:1d8',
  'sorcerous-burst': '120 ft.|V S|Øjeblikkelig|c:1d8',
  'spare-the-dying': '15 ft.|V S|Øjeblikkelig|x:Rækkevidden fordobles på level 5, 11 og 17',
  'starry-wisp': '60 ft.|V S|Øjeblikkelig|c:1d8',
  'thaumaturgy': '30 ft.|V|Op til 1 min',
  'thorn-whip': '30 ft.|V S M|Øjeblikkelig|c:1d6',
  'thunderclap': 'Selv (5 ft.)|S|Øjeblikkelig|c:1d6',
  'toll-the-dead': '60 ft.|V S M|Øjeblikkelig|c:1d8/1d12',
  'true-strike': 'Selv|S M|Øjeblikkelig|x:+1d6 radiant på level 5, +2d6 på 11 og +3d6 på 17',
  'vicious-mockery': '60 ft.|V|Øjeblikkelig|c:1d6',
  'word-of-radiance': '5 ft.|V M|Øjeblikkelig|c:1d6',

  // Level 1
  'alarm': '30 ft.|V S M|8 timer',
  'animal-friendship': '30 ft.|V S M|24 timer|t:ét ekstra dyr',
  'armor-of-agathys': 'Selv|V S M|1 time|n:5 temp HP og cold damage',
  'arms-of-hadar': 'Selv (10 ft.)|V S|Øjeblikkelig|d:1d6 necrotic',
  'bane': '30 ft.|V S M|1 min|t:ét ekstra mål',
  'bless': '30 ft.|V S M|1 min|t:ét ekstra mål',
  'burning-hands': 'Selv (15 ft. kegle)|V S|Øjeblikkelig|d:1d6 fire',
  'charm-person': '30 ft.|V S|1 time|t:ét ekstra mål',
  'chromatic-orb': '90 ft.|V S M|Øjeblikkelig|d:1d8 damage og ét ekstra hop',
  'color-spray': 'Selv (15 ft. kegle)|V S M|Øjeblikkelig',
  'command': '60 ft.|V|Øjeblikkelig|t:ét ekstra mål',
  'compelled-duel': '30 ft.|V|1 min',
  'comprehend-languages': 'Selv|V S M|1 time',
  'create-or-destroy-water': '30 ft.|V S M|Øjeblikkelig|n:10 gallons',
  'cure-wounds': 'Berøring|V S|Øjeblikkelig|d:2d8 healing',
  'detect-evil-and-good': 'Selv|V S|10 min',
  'detect-magic': 'Selv|V S|10 min',
  'detect-poison-and-disease': 'Selv|V S M|10 min',
  'disguise-self': 'Selv|V S|1 time',
  'dissonant-whispers': '60 ft.|V|Øjeblikkelig|d:1d6 psychic',
  'divine-favor': 'Selv|V S|1 min',
  'divine-smite': 'Selv|V S|Øjeblikkelig|d:1d8 radiant',
  'ensnaring-strike': 'Selv|V|1 min|d:1d6 piercing',
  'entangle': '90 ft.|V S|1 min',
  'expeditious-retreat': 'Selv|V S|10 min',
  'faerie-fire': '60 ft.|V|1 min',
  'false-life': 'Selv|V S M|Øjeblikkelig|n:5 temp HP',
  'feather-fall': '60 ft.|V M|1 min',
  'find-familiar': '10 ft.|V S M|Øjeblikkelig',
  'fog-cloud': '120 ft.|V S|1 time|n:20 ft. radius',
  'goodberry': 'Selv|V S M|24 timer',
  'grease': '60 ft.|V S M|1 min',
  'guiding-bolt': '120 ft.|V S|1 runde|d:1d6 radiant',
  'hail-of-thorns': 'Selv|V|Øjeblikkelig|d:1d10 piercing',
  'healing-word': '60 ft.|V|Øjeblikkelig|d:2d4 healing',
  'hellish-rebuke': '60 ft.|V S|Øjeblikkelig|d:1d10 fire',
  'heroism': 'Berøring|V S|1 min|t:ét ekstra mål',
  'hex': '90 ft.|V S M|1 time|x:Længere varighed: 4 timer (level 2), 8 timer (level 3–4), 24 timer (level 5+)',
  'hunters-mark': '90 ft.|V|1 time|x:Længere varighed: 8 timer (level 3–4), 24 timer (level 5+)',
  'ice-knife': '60 ft.|S M|Øjeblikkelig|d:1d6 cold',
  'identify': 'Berøring|V S M|Øjeblikkelig',
  'illusory-script': 'Berøring|S M|10 dage',
  'inflict-wounds': 'Berøring|V S|Øjeblikkelig|d:1d10 necrotic',
  'jump': 'Berøring|V S M|1 min|t:ét ekstra mål',
  'longstrider': 'Berøring|V S M|1 time|t:ét ekstra mål',
  'mage-armor': 'Berøring|V S M|8 timer',
  'magic-missile': '120 ft.|V S|Øjeblikkelig|t:én ekstra pil',
  'protection-from-evil-and-good': 'Berøring|V S M|10 min',
  'purify-food-and-drink': '10 ft.|V S|Øjeblikkelig',
  'ray-of-sickness': '60 ft.|V S|Øjeblikkelig|d:1d8 poison',
  'sanctuary': '30 ft.|V S M|1 min',
  'searing-smite': 'Selv|V|1 min|d:1d6 fire',
  'shield': 'Selv|V S|1 runde',
  'shield-of-faith': '60 ft.|V S M|10 min',
  'silent-image': '60 ft.|V S M|10 min',
  'sleep': '60 ft.|V S M|1 min',
  'speak-with-animals': 'Selv|V S|10 min',
  'tashas-hideous-laughter': '30 ft.|V S M|1 min|t:ét ekstra mål',
  'tensers-floating-disk': '30 ft.|V S M|1 time',
  'thunderous-smite': 'Selv|V|Øjeblikkelig|d:1d6 thunder',
  'thunderwave': 'Selv (15 ft. terning)|V S|Øjeblikkelig|d:1d8 thunder',
  'unseen-servant': '60 ft.|V S M|1 time',
  'witch-bolt': '60 ft.|V S M|1 min|d:1d12 lightning (første hit)',
  'wrathful-smite': 'Selv|V|1 min|d:1d6 necrotic',

  // Level 2
  'aid': '30 ft.|V S M|8 timer|n:5 HP',
  'alter-self': 'Selv|V S|1 time',
  'animal-messenger': '30 ft.|V S M|24 timer|n:48 timers varighed',
  'arcane-lock': 'Berøring|V S M|Til den ophæves',
  'arcane-vigor': 'Selv|V S|Øjeblikkelig|t:én ekstra hit die',
  'augury': 'Selv|V S M|Øjeblikkelig',
  'barkskin': 'Berøring|V S M|1 time',
  'beast-sense': 'Berøring|S|1 time',
  'blindness-deafness': '120 ft.|V|1 min|t:ét ekstra mål',
  'blur': 'Selv|V|1 min',
  'calm-emotions': '60 ft.|V S|1 min',
  'cloud-of-daggers': '60 ft.|V S M|1 min|d:2d4 slashing',
  'continual-flame': 'Berøring|V S M|Til den ophæves',
  'cordon-of-arrows': '5 ft.|V S M|8 timer|n:2 ekstra pile',
  'crown-of-madness': '120 ft.|V S|1 min',
  'darkness': '60 ft.|V M|10 min',
  'darkvision': 'Berøring|V S M|8 timer',
  'detect-thoughts': 'Selv|V S M|1 min',
  'dragons-breath': 'Berøring|V S M|1 min|d:1d6 damage',
  'enhance-ability': 'Berøring|V S M|1 time|t:ét ekstra mål',
  'enlarge-reduce': '30 ft.|V S M|1 min',
  'enthrall': '60 ft.|V S|1 min',
  'find-steed': '30 ft.|V S|Øjeblikkelig|x:Ridedyret får flere HP og stærkere angreb med slot-levelet',
  'find-traps': '120 ft.|V S|Øjeblikkelig',
  'flame-blade': 'Selv|V S M|10 min|d:1d6 fire',
  'flaming-sphere': '60 ft.|V S M|1 min|d:1d6 fire',
  'gentle-repose': 'Berøring|V S M|10 dage',
  'gust-of-wind': 'Selv (60 ft. linje)|V S M|1 min',
  'heat-metal': '60 ft.|V S M|1 min|d:1d8 fire',
  'hold-person': '60 ft.|V S M|1 min|t:ét ekstra mål',
  'invisibility': 'Berøring|V S M|1 time|t:ét ekstra mål',
  'knock': '60 ft.|V|Øjeblikkelig',
  'lesser-restoration': 'Berøring|V S|Øjeblikkelig',
  'levitate': '60 ft.|V S M|10 min',
  'locate-animals-or-plants': 'Selv|V S M|Øjeblikkelig',
  'locate-object': 'Selv|V S M|10 min',
  'magic-mouth': '30 ft.|V S M|Til den ophæves',
  'magic-weapon': 'Berøring|V S|1 time|x:+2 med et level 3–5-slot, +3 med et level 6+-slot',
  'melfs-acid-arrow': '90 ft.|V S M|Øjeblikkelig|d:1d4 acid (både første og anden skade)',
  'mind-spike': '120 ft.|S|1 time|d:1d8 psychic',
  'mirror-image': 'Selv|V S|1 min',
  'misty-step': 'Selv|V|Øjeblikkelig',
  'moonbeam': '120 ft.|V S M|1 min|d:1d10 radiant',
  'nystuls-magic-aura': 'Berøring|V S M|24 timer',
  'pass-without-trace': 'Selv|V S M|1 time',
  'phantasmal-force': '60 ft.|V S M|1 min',
  'prayer-of-healing': '30 ft.|V|Øjeblikkelig|d:1d8 healing',
  'protection-from-poison': 'Berøring|V S|1 time',
  'ray-of-enfeeblement': '60 ft.|V S|1 min',
  'rope-trick': 'Berøring|V S M|1 time',
  'scorching-ray': '120 ft.|V S|Øjeblikkelig|t:én ekstra stråle',
  'see-invisibility': 'Selv|V S M|1 time',
  'shadow-blade': 'Selv|V S|1 min|x:4d8 med et level 3–4-slot, 5d8 med level 5–6, 6d8 med level 7+',
  'shatter': '60 ft.|V S M|Øjeblikkelig|d:1d8 thunder',
  'shining-smite': 'Selv|V|1 min|d:1d6 radiant',
  'silence': '120 ft.|V S|10 min',
  'spider-climb': 'Berøring|V S M|1 time|t:ét ekstra mål',
  'spike-growth': '150 ft.|V S M|10 min',
  'spiritual-weapon': '60 ft.|V S|1 min|d:1d8 force',
  'suggestion': '30 ft.|V M|8 timer',
  'summon-beast': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'warding-bond': 'Berøring|V S M|1 time',
  'web': '60 ft.|V S M|1 time',
  'zone-of-truth': '60 ft.|V S|10 min',

  // Level 3
  'animate-dead': '10 ft.|V S M|Øjeblikkelig|n:2 ekstra undead',
  'aura-of-vitality': 'Selv|V|1 min',
  'beacon-of-hope': '30 ft.|V S|1 min',
  'bestow-curse': 'Berøring|V S|1 min|x:Længere varighed på højere levels (level 5+ uden concentration)',
  'blinding-smite': 'Selv|V|1 min|d:1d8 radiant',
  'blink': 'Selv|V S|1 min',
  'call-lightning': '120 ft.|V S|10 min|d:1d10 lightning',
  'clairvoyance': '1 mil|V S M|10 min',
  'conjure-animals': '60 ft.|V S|10 min|d:1d10 slashing',
  'conjure-barrage': 'Selv (60 ft. kegle)|V S M|Øjeblikkelig|d:1d8 force',
  'counterspell': '60 ft.|S|Øjeblikkelig',
  'create-food-and-water': '30 ft.|V S|Øjeblikkelig',
  'crusaders-mantle': 'Selv|V|1 min',
  'daylight': '60 ft.|V S|1 time',
  'dispel-magic': '120 ft.|V S|Øjeblikkelig|x:Afslutter automatisk spells op til det brugte slot-level',
  'elemental-weapon': 'Berøring|V S|1 time|x:+2 og +2d4 med et level 5–6-slot, +3 og +3d4 med level 7+',
  'fear': 'Selv (30 ft. kegle)|V S M|1 min',
  'feign-death': 'Berøring|V S M|1 time',
  'fireball': '150 ft.|V S M|Øjeblikkelig|d:1d6 fire',
  'fly': 'Berøring|V S M|10 min|t:ét ekstra mål',
  'gaseous-form': 'Berøring|V S M|1 time',
  'glyph-of-warding': 'Berøring|V S M|Til den udløses|d:1d8 damage (eksplosion)',
  'haste': '30 ft.|V S M|1 min',
  'hunger-of-hadar': '150 ft.|V S M|1 min|d:1d6 cold eller acid',
  'hypnotic-pattern': '120 ft.|S M|1 min',
  'leomunds-tiny-hut': 'Selv|V S M|8 timer',
  'lightning-arrow': 'Selv|V S|Øjeblikkelig|d:1d8 lightning',
  'lightning-bolt': 'Selv (100 ft. linje)|V S M|Øjeblikkelig|d:1d6 lightning',
  'magic-circle': '10 ft.|V S M|1 time|n:1 times varighed',
  'major-image': '120 ft.|V S M|10 min|x:Med et level 4+-slot varer den, til den ophæves – uden concentration',
  'mass-healing-word': '60 ft.|V|Øjeblikkelig|d:1d4 healing',
  'meld-into-stone': 'Berøring|V S|8 timer',
  'nondetection': 'Berøring|V S M|8 timer',
  'phantom-steed': '30 ft.|V S|1 time',
  'plant-growth': '150 ft.|V S|Øjeblikkelig',
  'protection-from-energy': 'Berøring|V S|1 time',
  'remove-curse': 'Berøring|V S|Øjeblikkelig',
  'revivify': 'Berøring|V S M|Øjeblikkelig',
  'sending': 'Ubegrænset|V S M|Øjeblikkelig',
  'sleet-storm': '150 ft.|V S M|1 min',
  'slow': '120 ft.|V S M|1 min',
  'speak-with-dead': '10 ft.|V S M|10 min',
  'speak-with-plants': 'Selv|V S|10 min',
  'spirit-guardians': 'Selv (15 ft.)|V S M|10 min|d:1d8 radiant/necrotic',
  'spirit-shroud': 'Selv|V S|1 min|x:+1d8 for hver to slot-levels over 3',
  'stinking-cloud': '90 ft.|V S M|1 min',
  'summon-fey': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'summon-undead': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'tongues': 'Berøring|V M|1 time',
  'vampiric-touch': 'Selv|V S|1 min|d:1d6 necrotic',
  'water-breathing': '30 ft.|V S M|24 timer',
  'water-walk': '30 ft.|V S M|1 time',
  'wind-wall': '120 ft.|V S M|1 min',

  // Level 4
  'arcane-eye': '30 ft.|V S M|1 time',
  'aura-of-life': 'Selv (30 ft.)|V|10 min',
  'aura-of-purity': 'Selv (30 ft.)|V|10 min',
  'banishment': '30 ft.|V S M|1 min|t:ét ekstra mål',
  'blight': '30 ft.|V S|Øjeblikkelig|d:1d8 necrotic',
  'charm-monster': '30 ft.|V S|1 time|t:ét ekstra mål',
  'compulsion': '30 ft.|V S|1 min',
  'confusion': '90 ft.|V S M|1 min|n:5 ft. radius',
  'conjure-minor-elementals': 'Selv|V S|10 min|d:1d8 ekstra damage',
  'conjure-woodland-beings': 'Selv|V S|10 min|d:1d6 force',
  'control-water': '300 ft.|V S M|10 min',
  'death-ward': 'Berøring|V S|8 timer',
  'dimension-door': '500 ft.|V|Øjeblikkelig',
  'divination': 'Selv|V S M|Øjeblikkelig',
  'dominate-beast': '60 ft.|V S|1 min|x:Længere varighed: 10 min (level 5), 1 time (6), 8 timer (7+)',
  'evards-black-tentacles': '90 ft.|V S M|1 min|d:1d6 bludgeoning',
  'fabricate': '120 ft.|V S|Øjeblikkelig',
  'fire-shield': 'Selv|V S M|10 min',
  'freedom-of-movement': 'Berøring|V S M|1 time|t:ét ekstra mål',
  'giant-insect': '60 ft.|V S|10 min|x:Insektet bliver stærkere med slot-levelet',
  'grasping-vine': '60 ft.|V S|1 min|d:1d8 bludgeoning',
  'greater-invisibility': 'Berøring|V S|1 min',
  'guardian-of-faith': '30 ft.|V|8 timer',
  'hallucinatory-terrain': '300 ft.|V S M|24 timer',
  'ice-storm': '300 ft.|V S M|Øjeblikkelig|d:1d10 bludgeoning',
  'leomunds-secret-chest': 'Berøring|V S M|Til den ophæves',
  'locate-creature': 'Selv|V S M|1 time',
  'mordenkainens-faithful-hound': '30 ft.|V S M|8 timer',
  'mordenkainens-private-sanctum': '120 ft.|V S M|24 timer|x:Større område; med et level 7+-slot er den permanent',
  'otilukes-resilient-sphere': '30 ft.|V S M|1 min',
  'phantasmal-killer': '120 ft.|V S|1 min|d:1d10 psychic',
  'polymorph': '60 ft.|V S M|1 time',
  'staggering-smite': 'Selv|V|Øjeblikkelig|d:1d6 psychic',
  'stone-shape': 'Berøring|V S M|Øjeblikkelig',
  'stoneskin': 'Berøring|V S M|1 time',
  'summon-aberration': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'summon-construct': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'summon-elemental': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'vitriolic-sphere': '150 ft.|V S M|Øjeblikkelig|d:2d4 acid',
  'wall-of-fire': '120 ft.|V S M|1 min|d:1d8 fire',
  'fount-of-moonlight': 'Selv|V S|10 min',

  // Level 5
  'animate-objects': '120 ft.|V S|1 min|x:Genstandene gør mere skade pr. slot-level over 5',
  'antilife-shell': 'Selv (10 ft.)|V S|1 time',
  'awaken': 'Berøring|V S M|Øjeblikkelig',
  'banishing-smite': 'Selv|V|1 min',
  'bigbys-hand': '120 ft.|V S M|1 min|d:2d8 force',
  'circle-of-power': 'Selv (30 ft.)|V|10 min',
  'cloudkill': '120 ft.|V S|10 min|d:1d8 poison',
  'commune': 'Selv|V S M|1 min',
  'commune-with-nature': 'Selv|V S|Øjeblikkelig',
  'cone-of-cold': 'Selv (60 ft. kegle)|V S M|Øjeblikkelig|d:1d8 cold',
  'conjure-elemental': '60 ft.|V S|10 min|d:1d8 damage',
  'conjure-volley': '150 ft.|V S M|Øjeblikkelig',
  'contact-other-plane': 'Selv|V|1 min',
  'contagion': 'Berøring|V S|7 dage',
  'creation': '30 ft.|V S M|Speciel|n:5 ft. større terning',
  'destructive-wave': 'Selv (30 ft.)|V|Øjeblikkelig',
  'dispel-evil-and-good': 'Selv|V S M|1 min',
  'dominate-person': '60 ft.|V S|1 min|x:Længere varighed: 10 min (level 6), 1 time (7), 8 timer (8+)',
  'dream': 'Speciel|V S M|8 timer',
  'flame-strike': '60 ft.|V S M|Øjeblikkelig|d:1d6 fire og 1d6 radiant',
  'geas': '60 ft.|V|30 dage|x:Varer 1 år med et level 7–8-slot og er permanent med level 9',
  'greater-restoration': 'Berøring|V S M|Øjeblikkelig',
  'hallow': 'Berøring|V S M|Til den ophæves',
  'hold-monster': '90 ft.|V S M|1 min|t:ét ekstra mål',
  'insect-plague': '300 ft.|V S M|10 min|d:1d10 piercing',
  'jallarzis-storm-of-radiance': '120 ft.|V S M|1 min|d:1d10 radiant og 1d10 thunder',
  'legend-lore': 'Selv|V S M|Øjeblikkelig',
  'mass-cure-wounds': '60 ft.|V S|Øjeblikkelig|d:1d8 healing',
  'mislead': 'Selv|S|1 time',
  'modify-memory': '30 ft.|V S|1 min|x:Ændr ældre minder: 7 dage (level 6), 30 dage (7), 1 år (8), hele livet (9)',
  'passwall': '30 ft.|V S M|1 time',
  'planar-binding': '60 ft.|V S M|24 timer|x:Længere varighed: 10 dage (level 6), 30 dage (7), 180 dage (8), 1 år og en dag (9)',
  'raise-dead': 'Berøring|V S M|Øjeblikkelig',
  'rarys-telepathic-bond': '30 ft.|V S M|1 time',
  'reincarnate': 'Berøring|V S M|Øjeblikkelig',
  'scrying': 'Selv|V S M|10 min',
  'seeming': '30 ft.|V S|8 timer',
  'steel-wind-strike': '30 ft.|S M|Øjeblikkelig',
  'summon-celestial': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'summon-dragon': '60 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'swift-quiver': 'Selv|V S M|1 min',
  'synaptic-static': '120 ft.|V S|Øjeblikkelig',
  'telekinesis': '60 ft.|V S|10 min',
  'teleportation-circle': '10 ft.|V M|1 runde',
  'tree-stride': 'Selv|V S|1 min',
  'wall-of-force': '120 ft.|V S M|10 min',
  'wall-of-stone': '120 ft.|V S M|10 min',
  'yolandes-regal-presence': 'Selv (10 ft.)|V S M|1 min',

  // Level 6
  'arcane-gate': '500 ft.|V S|10 min',
  'blade-barrier': '90 ft.|V S|10 min',
  'chain-lightning': '150 ft.|V S M|Øjeblikkelig|t:ét ekstra hop',
  'circle-of-death': '150 ft.|V S M|Øjeblikkelig|d:2d8 necrotic',
  'conjure-fey': '60 ft.|V S|10 min|d:2d12 psychic',
  'contingency': 'Selv|V S M|10 dage',
  'create-undead': '10 ft.|V S M|Øjeblikkelig|x:Flere og stærkere undead (ghasts, wights, mummies) på højere levels',
  'disintegrate': '60 ft.|V S M|Øjeblikkelig|d:3d6 force',
  'drawmijs-instant-summons': 'Berøring|V S M|Til den ophæves',
  'eyebite': 'Selv|V S|1 min',
  'find-the-path': 'Selv|V S M|1 dag',
  'flesh-to-stone': '60 ft.|V S M|1 min',
  'forbiddance': 'Berøring|V S M|1 dag',
  'globe-of-invulnerability': 'Selv (10 ft.)|V S M|1 min|x:Blokerer ét spell-level mere pr. slot-level over 6',
  'guards-and-wards': 'Berøring|V S M|24 timer',
  'harm': '60 ft.|V S|Øjeblikkelig',
  'heal': '60 ft.|V S|Øjeblikkelig|n:10 healing',
  'heroes-feast': 'Selv|V S M|Øjeblikkelig',
  'magic-jar': 'Selv|V S M|Til den ophæves',
  'mass-suggestion': '60 ft.|V M|24 timer|x:Længere varighed: 10 dage (level 7), 30 dage (8), 1 år og en dag (9)',
  'move-earth': '120 ft.|V S M|2 timer',
  'otilukes-freezing-sphere': '300 ft.|V S M|Øjeblikkelig|d:1d6 cold',
  'ottos-irresistible-dance': '30 ft.|V|1 min',
  'planar-ally': '60 ft.|V S|Øjeblikkelig',
  'programmed-illusion': '120 ft.|V S M|Til den ophæves',
  'summon-fiend': '90 ft.|V S M|1 time|x:Ånden får flere HP, bedre AC og flere angreb med slot-levelet',
  'sunbeam': 'Selv (60 ft. linje)|V S M|1 min',
  'tashas-bubbling-cauldron': '5 ft.|V S M|10 min|x:Flere eliksirer med højere slot-level',
  'transport-via-plants': '10 ft.|V S|1 runde',
  'true-seeing': 'Berøring|V S M|1 time',
  'wall-of-ice': '120 ft.|V S M|10 min|d:2d6 cold',
  'wall-of-thorns': '120 ft.|V S M|10 min|d:1d8 piercing og slashing',
  'wind-walk': '30 ft.|V S M|8 timer',
  'word-of-recall': '5 ft.|V|Øjeblikkelig',

  // Level 7
  'conjure-celestial': '90 ft.|V S|10 min|d:1d12 healing/radiant',
  'delayed-blast-fireball': '150 ft.|V S M|1 min|d:1d6 fire',
  'divine-word': '30 ft.|V|Øjeblikkelig',
  'etherealness': 'Selv|V S|8 timer|x:Tag op til tre villige væsener med pr. slot-level over 7',
  'finger-of-death': '60 ft.|V S|Øjeblikkelig',
  'fire-storm': '150 ft.|V S|Øjeblikkelig',
  'forcecage': '100 ft.|V S M|1 time',
  'mirage-arcane': 'Syn|V S|10 dage',
  'mordenkainens-magnificent-mansion': '300 ft.|V S M|24 timer',
  'mordenkainens-sword': '90 ft.|V S M|1 min',
  'plane-shift': 'Berøring|V S M|Øjeblikkelig',
  'power-word-fortify': '60 ft.|V|Øjeblikkelig',
  'prismatic-spray': 'Selv (60 ft. kegle)|V S|Øjeblikkelig',
  'project-image': '500 mil|V S M|1 dag',
  'regenerate': 'Berøring|V S M|1 time',
  'resurrection': 'Berøring|V S M|Øjeblikkelig',
  'reverse-gravity': '100 ft.|V S M|1 min',
  'sequester': 'Berøring|V S M|Til den ophæves',
  'simulacrum': 'Berøring|V S M|Til den ophæves',
  'symbol': 'Berøring|V S M|Til den udløses',
  'teleport': '10 ft.|V|Øjeblikkelig',

  // Level 8
  'animal-shapes': '30 ft.|V S|24 timer',
  'antimagic-field': 'Selv (10 ft.)|V S M|1 time',
  'antipathy-sympathy': '60 ft.|V S M|10 dage',
  'befuddlement': '150 ft.|V S M|Øjeblikkelig',
  'clone': 'Berøring|V S M|Øjeblikkelig',
  'control-weather': 'Selv (5 mil)|V S M|8 timer',
  'demiplane': '60 ft.|S|1 time',
  'dominate-monster': '60 ft.|V S|1 time|x:Med et level 9-slot varer den op til 8 timer',
  'earthquake': '500 ft.|V S M|1 min',
  'glibness': 'Selv|V|1 time',
  'holy-aura': 'Selv (30 ft.)|V S M|1 min',
  'incendiary-cloud': '150 ft.|V S|1 min',
  'maze': '60 ft.|V S|10 min',
  'mind-blank': 'Berøring|V S|24 timer',
  'power-word-stun': '60 ft.|V|Øjeblikkelig',
  'sunburst': '150 ft.|V S M|Øjeblikkelig',
  'telepathy': 'Ubegrænset|V S M|24 timer',
  'tsunami': '1 mil|V S|6 runder',

  // Level 9
  'astral-projection': '10 ft.|V S M|Speciel',
  'foresight': 'Berøring|V S M|8 timer',
  'gate': '60 ft.|V S M|1 min',
  'imprisonment': '30 ft.|V S M|Til den ophæves',
  'mass-heal': '60 ft.|V S|Øjeblikkelig',
  'meteor-swarm': '1 mil|V S|Øjeblikkelig',
  'power-word-heal': 'Berøring|V|Øjeblikkelig',
  'power-word-kill': '60 ft.|V|Øjeblikkelig',
  'prismatic-wall': '60 ft.|V S|10 min',
  'shapechange': 'Selv|V S M|1 time',
  'storm-of-vengeance': '1 mil|V S|1 min',
  'time-stop': 'Selv|V|Øjeblikkelig',
  'true-polymorph': '30 ft.|V S M|1 time',
  'true-resurrection': 'Berøring|V S M|Øjeblikkelig',
  'weird': '120 ft.|V S M|1 min',
  'wish': 'Selv|V|Øjeblikkelig',
}

export interface SpellDetails {
  range: string
  components: string
  duration: string
  /** Rå upcast-kode (se toppen af filen). */
  upcast?: string
}

export const SPELL_DETAIL_IDS = Object.keys(D)

export function spellDetails(id: string): SpellDetails | undefined {
  const raw = D[id]
  if (!raw) return
  const [range, components, duration, upcast] = raw.split('|')
  return { range, components, duration, upcast: upcast || undefined }
}

/** Varighed med concentration-præfiks, fx 'Concentration, op til 1 min'. */
export const durationText = (spell: Spell, d: SpellDetails) =>
  spell.concentration ? `Concentration, op til ${d.duration}` : d.duration

const multiplyDice = (dice: string, n: number) => {
  const m = dice.match(/^(\d+)d(\d+)$/)
  return m ? `${Number(m[1]) * n}d${m[2]}` : dice
}

/** Antal cantrip-trin for et karakterlevel: 1 → 4. */
export const cantripTier = (level: number) => 1 + Number(level >= 5) + Number(level >= 11) + Number(level >= 17)

/** Cantrip-skalering på et karakterlevel, fx 'Fire Bolt: 2d10' – null hvis cantrippen ikke skalerer med terninger. */
export function cantripScaling(spell: Spell, characterLevel: number): string | null {
  const code = spellDetails(spell.id)?.upcast
  if (!code) return null
  const tier = cantripTier(characterLevel)
  if (code.startsWith('c:')) return code.slice(2).split('/').map(d => multiplyDice(d, tier)).join(' / ')
  if (code.startsWith('b:')) return `${tier} ${tier === 1 ? 'stråle' : 'stråler'} à ${code.slice(2)}`
  if (code.startsWith('x:')) return code.slice(2)
  return null
}

/** Hvad det giver at caste en spell med et højere slot – null hvis intet ændrer sig. */
export function upcastText(spell: Spell, slotLevel: number): string | null {
  const code = spellDetails(spell.id)?.upcast
  const steps = slotLevel - spell.level
  if (!code || spell.level === 0 || steps <= 0) return null
  const [kind, ...rest] = code.split(':')
  const value = rest.join(':')
  if (kind === 'd') {
    const [dice, ...label] = value.split(' ')
    return `+${multiplyDice(dice, steps)}${label.length ? ` ${label.join(' ')}` : ''}`
  }
  if (kind === 'n') {
    const [num, ...label] = value.split(' ')
    return `+${Number(num) * steps} ${label.join(' ')}`
  }
  if (kind === 't') return `${steps}× ${value}`
  if (kind === 'x') return value
  return null
}

/** Generel upcast-beskrivelse til kortet, når der ikke er et konkret slot-level. */
export function upcastSummary(spell: Spell): string | null {
  const code = spellDetails(spell.id)?.upcast
  if (!code || spell.level === 0) return null
  const [kind, ...rest] = code.split(':')
  const value = rest.join(':')
  if (kind === 'd' || kind === 'n') return `+${value} pr. slot-level over ${spell.level}`
  if (kind === 't') return `${value[0].toUpperCase()}${value.slice(1)} pr. slot-level over ${spell.level}`
  return value
}
