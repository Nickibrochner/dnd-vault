# DND Vault

Et værktøj til at bygge og spille D&D-karakterer efter 2024-reglerne (5.5e). Man opretter en karakter i en wizard, stiger i level helt til 20 og bruger et karakterark ved bordet, hvor HP, spell slots, ressourcer og udstyr trackes.

## Funktioner

### Character Creation Wizard (level 1)

- Trin for trin: species og identitet, klasse, baggrund, ability scores, udstyr og proficiencies, spells og en oversigt.
- Ability scores med Standard Array, Point Buy eller manuel indtastning; baggrundens +2/+1 eller +1/+1/+1.
- Hvert trin valideres, og et trin låses først op, når de foregående er færdige.
- Ugyldige valg ryddes automatisk, fx når man skifter klasse.

### Level-up (2–20)

- HP som gennemsnit eller eget slag.
- Ability Score Improvement eller feat: general feats, origin feats, fighting styles og epic boons. Feat-krav tjekkes.
- Alle 48 subclasses fra PHB 2024.
- Klassevalg som invocations, metamagic, maneuvers, expertise og fighting styles.
- Multiclass med 2024-reglerne: krav på 13 i primære evner, begrænsede proficiencies og samlede spell slots.
- Spells fra cantrips til level 9: spellbook, Pact Magic, Mystic Arcanum og Magical Secrets.

### Karakterark med tre faner

- **Ark:**
  - HP, temp HP, death saves og hit dice.
  - Conditions og exhaustion.
  - Angreb og ressourcer, fx Rage, Channel Divinity og Focus Points.
  - Short og long rest samt en log over seneste handlinger.
  - Panelerne kan flyttes rundt.
- **Udstyr:**
  - Inventory oprettet fra startudstyret.
  - Det, man har i brug, bestemmer AC og angreb.
  - Magiske bonusser, attunement (max 3), vægt og bæreevne, mønter og packs, der kan pakkes ud.
- **Spells:**
  - Spell cards med rækkevidde, komponenter og varighed.
  - Upcast-effekt pr. slot-level og cantrip-skalering.
  - Cast-knapper, der automatisk bruger det rigtige slot eller gratis cast.

Alt gemmes automatisk.

## Kom i gang

Kræver Docker med Docker Compose.

```bash
docker compose up --build
```

- Frontend: <http://localhost:5173>
- Backend (API): <http://localhost:3000>

Databasen er en SQLite-fil i `data/dnd.sqlite`, som er mountet ind i backend-containeren og overlever genstarter.

## Teknologi

| Del | Teknologi |
| --- | --- |
| Frontend | Vue 3 (`<script setup>`), Pinia, Vue Router, Tailwind CSS, Vite, TypeScript |
| Backend | Bun, Elysia |
| Database | SQLite via `bun:sqlite` |

## Projektstruktur

```text
backend/
  src/index.ts        API-endpoints
  src/db.ts           Tabeller og simple migrationer
frontend/src/
  rules/              Regelmotor og regeldata (ingen Vue – rene funktioner)
    engine.ts         Udleder alt fra brugerens valg: HP, AC, slots, validering …
    data.ts           Species, baggrunde, origin feats, våben, rustning, klassernes level 1
    progression.ts    Klasseprogression level 2–20, slot-tabeller, multiclass-regler
    subclasses.ts     De 48 subclasses
    feats.ts          General feats, fighting styles og epic boons
    spells.ts         Spell-liste (cantrips til level 9)
    spellDetails.ts   Rækkevidde, komponenter, varighed og upcast til spell cards
    items.ts          Genstandskatalog til inventory
    play.ts           Spilletilstand ved bordet: HP, brugte ressourcer, rests, casting, inventory
  stores/character.ts Indlæsning, autosave og level-up
  views/              Dashboard, wizard, level-up og karakterark
  components/         wizard/, levelup/, sheet/ og ui/
```

## Arkitektur

En karakter gemmes som to dele i kolonnen `sheet_data`:

- **`draft`**: kun brugerens valg (species, klasse, scores, levels, spell-valg …). Intet afledt gemmes.
- **`play`**: tilstanden ved bordet (nuværende HP, brugte slots, conditions, inventory, layout …).

Regelmotoren (`rules/engine.ts`) er et sæt rene funktioner:

- `derive(draft)` beregner alt, der står på arket.
- `sanitize(draft)` fjerner valg, der ikke længere er gyldige. Den er idempotent, så den kan køres efter hver ændring.
- `validateStep()` og `validateProgression()` giver de mangler, der vises i wizarden og på level-up-siden.

Storen sanitizer, sammenligner med det sidst gemte og autosaver efter ét sekund. Ved navigation eller lukning af fanen gemmes med det samme.

Ud over `draft` og `play` gemmes et kort `summary`, så dashboardet kan vise karakterer uden at køre regelmotoren.

## API

| Metode | Sti | Beskrivelse |
| --- | --- | --- |
| GET | `/characters` | Alle karakterer, nyeste først |
| POST | `/characters` | Opret en tom karakter |
| GET | `/characters/:id` | Hent én karakter |
| PATCH | `/characters/:id` | Gem `name`, `level` og `sheet_data` (`version`, `draft`, `play`, `summary`) |
| DELETE | `/characters/:id` | Slet en karakter |
| GET/POST | `/campaigns` | Kampagner (endnu ikke brugt i UI'et) |
| GET | `/campaigns/:id/characters` | Karakterer i en kampagne |

## Udvikling

- **Backend:** containeren opdager ikke altid ændringer via bind-mountet på Windows. Kør `docker restart dnd-vault-backend-1` efter ændringer i `backend/src`.
- **Frontend:** Vite hot-reloader. Containeren har sine egne `node_modules`. Kør `npm install` i `frontend/` lokalt, så editoren får typerne.
- **Type-check:** `cd frontend && npx vue-tsc --noEmit`
- **Build:** `npm run build` i `frontend/`.

## Regeldata

Indholdet dækker 2024-reglerne: alle species, baggrunde, klasser og subclasses, feats og spell-listerne. Kun mekanikken er gengivet (navne, tal og valgmuligheder) og korte resuméer med egne ord. Den fulde regeltekst skal slås op i Player's Handbook.

Tabeller, spell-lister og især casting times, upcast-regler og subclass-features er skrevet efter hukommelsen og bør tjekkes mod PHB.

## Kendte begrænsninger

- Kampagner findes i backenden, men har ingen brugerflade endnu.
- Udstyrsvalget i wizarden kommer kun fra startklassens og baggrundens pakker; derefter styres udstyr i inventory.
- Visse regler vises kun som tekst og regnes ikke ind, fx Ritual Caster, Lessons of the First Ones og Spell Mastery.
- Magiske genstande giver kun bonus til AC, to-hit og damage – øvrige effekter noteres selv.
- Der er ingen automatiske tests i repoet.
