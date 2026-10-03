import { describe, it, expect } from 'vitest'
import { heldSpots, registrationState } from './regState'

const NOW = Date.parse('2026-09-29T17:00:00Z')
const row = (o: Partial<{ status: string; paid: boolean; utr: string | null; hold_expires_at: string | null }> = {}) =>
  ({ status: 'pending_payment', paid: false, utr: null, hold_expires_at: '2026-09-30T00:00:00Z', ...o })

describe('heldSpots', () => {
  it('counts live holds and paid rows, not cancelled, waitlist, expired or lapsed holds', () => {
    const rows = [
      row(), row({ status: 'confirmed', paid: true, hold_expires_at: null }),
      row({ status: 'cancelled' }), row({ status: 'waitlist' }), row({ status: 'hold_expired' }),
      row({ hold_expires_at: '2026-09-29T10:00:00Z' }),                    // lapsed unpaid hold: not held
      row({ hold_expires_at: '2026-09-29T10:00:00Z', utr: 'UTR123' }),     // lapsed but a UTR was submitted: held
    ]
    expect(heldSpots(rows, NOW)).toBe(3)
  })
})

describe('registrationState', () => {
  const open = { status: 'open', closes_at: '2026-10-02T18:29:00Z', cap: 16 }
  it('is accepting while open, before closing and under the cap', () => {
    expect(registrationState(open, 6, NOW).kind).toBe('accepting')
  })
  it('is full at or over the cap even though the status is open', () => {
    expect(registrationState(open, 16, NOW).kind).toBe('full')
    expect(registrationState(open, 17, NOW).label).toBe('Full, 17 of 16 spots')
  })
  it('reports an admin close, a passed closing time and a cancelled sport', () => {
    expect(registrationState({ ...open, status: 'closed' }, 0, NOW).kind).toBe('closed_by_admin')
    expect(registrationState({ ...open, closes_at: '2026-09-29T16:59:59Z' }, 0, NOW).kind).toBe('past_close')
    expect(registrationState({ ...open, status: 'cancelled' }, 0, NOW).kind).toBe('cancelled')
  })
  it('an admin close wins over full', () => {
    expect(registrationState({ ...open, status: 'closed' }, 20, NOW).kind).toBe('closed_by_admin')
  })
})
