import { describe, it, expect } from 'vitest'
import { TN_NAV_REVEAL_AT, terraNotesInNav } from './terraNotesReveal'

describe('terra notes nav reveal', () => {
  it('is 5:45 pm IST on 29 Sep 2026', () => {
    expect(new Date(TN_NAV_REVEAL_AT).toISOString()).toBe('2026-09-29T12:15:00.000Z')
    // IST is UTC+5:30
    expect(new Date(TN_NAV_REVEAL_AT + 5.5 * 3600_000).toISOString()).toBe('2026-09-29T17:45:00.000Z')
  })
  it('is hidden one millisecond before, shown at and after', () => {
    expect(terraNotesInNav(TN_NAV_REVEAL_AT - 1)).toBe(false)
    expect(terraNotesInNav(TN_NAV_REVEAL_AT)).toBe(true)
    expect(terraNotesInNav(TN_NAV_REVEAL_AT + 86_400_000)).toBe(true)
  })
})
