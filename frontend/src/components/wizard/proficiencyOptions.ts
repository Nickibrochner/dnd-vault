import { SKILLS, abilityShort, skillName, type SkillId } from '../../rules/data'
import { fixedSkills, fixedTools, skillSlots, type CharacterDraft } from '../../rules/engine'
import type { PickOption } from '../ui/PickList.vue'

/** Hvilken kilde har allerede givet en skill (bruges til at låse den andre steder). */
function skillOwner(d: CharacterDraft, skill: SkillId, exceptSlot: string): string | undefined {
  const f = fixedSkills(d).find(s => s.skill === skill)
  if (f) return f.source
  for (const slot of skillSlots(d)) {
    if (slot.key !== exceptSlot && d.skillPicks[slot.key]?.includes(skill)) return slot.label
  }
}

export const skillOptions = (d: CharacterDraft, slotKey: string, from: SkillId[]): PickOption[] => from.map(id => {
  const owner = skillOwner(d, id, slotKey)
  const skill = SKILLS.find(s => s.id === id)!
  return { value: id, label: skill.name, hint: abilityShort(skill.ability), disabled: !!owner, note: owner && `Har du allerede fra ${owner}` }
})

/** En skill kan kun få Expertise fra én kilde. */
export function expertiseOptions(d: CharacterDraft, slotKey: string, from: SkillId[]): PickOption[] {
  const takenElsewhere = new Set(Object.entries(d.expertisePicks).filter(([k]) => k !== slotKey).flatMap(([, v]) => v))
  return from.map(id => ({ value: id, label: skillName(id), disabled: takenElsewhere.has(id), note: takenElsewhere.has(id) ? 'Har allerede Expertise' : undefined }))
}

export function toolOptions(d: CharacterDraft, slotKey: string, from: string[]): PickOption[] {
  const takenElsewhere = new Set([
    ...fixedTools(d),
    ...Object.entries(d.toolPicks).filter(([k]) => k !== slotKey).flatMap(([, v]) => v),
  ])
  return from.map(t => ({ value: t, label: t, disabled: takenElsewhere.has(t), note: takenElsewhere.has(t) ? 'Har du allerede' : undefined }))
}
