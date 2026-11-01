import type { CharacterDraft, summarize } from './rules/engine'
import type { PlayState } from './rules/play'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export interface SheetData {
  version: number
  draft: CharacterDraft
  /** Tracking ved bordet; mangler på karakterer, der aldrig er åbnet som ark. */
  play?: PlayState
  summary?: ReturnType<typeof summarize>
}

export interface CharacterRecord {
  id: number
  campaign_id: number | null
  name: string
  level: number
  sheet_data: SheetData | null
  created_at: string | null
  updated_at: string | null
  /** Hvornår billedet sidst blev skiftet; null = intet billede. */
  portrait_at: string | null
}

/** URL til karakterbilledet – tidsstemplet gør, at et nyt billede ikke hentes fra cachen. */
export const portraitUrl = (id: number, portraitAt: string | null) =>
  portraitAt ? `${API_URL}/characters/${id}/portrait?v=${encodeURIComponent(portraitAt)}` : null

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(res.status === 404 ? 'Karakteren findes ikke' : `Serverfejl (${res.status})`)
  return res.json() as Promise<T>
}

export const api = {
  listCharacters: () => request<CharacterRecord[]>('/characters'),
  getCharacter: (id: number) => request<CharacterRecord>(`/characters/${id}`),
  createCharacter: () => request<CharacterRecord>('/characters', { method: 'POST', body: '{}' }),
  deleteCharacter: (id: number) => request<{ deleted: number }>(`/characters/${id}`, { method: 'DELETE' }),
  savePortrait: (id: number, image: string) =>
    request<CharacterRecord>(`/characters/${id}/portrait`, { method: 'PUT', body: JSON.stringify({ image }) }),
  deletePortrait: (id: number) => request<CharacterRecord>(`/characters/${id}/portrait`, { method: 'DELETE' }),
  saveCharacter: (id: number, body: { name: string; level: number; sheet_data: SheetData }, keepalive = false) =>
    request<CharacterRecord>(`/characters/${id}`, { method: 'PATCH', body: JSON.stringify(body), keepalive }),
}
