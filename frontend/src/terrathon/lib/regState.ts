/**
 * Whether a sport is taking registrations, and if not, why. Mirrors the rule in the `terrathon_public_events` view
 * (scripts/terrathon_schema_2026_09_21.sql): accepting = status 'open' AND not past closes_at AND spots held < cap, where a
 * spot is held by any registration that is not cancelled / waitlist / hold_expired and is either paid, has a UTR, has no
 * hold expiry, or has a hold that has not expired yet. The admin desk shows the reason; the database stays the judge.
 */
export type RegKind = 'accepting' | 'closed_by_admin' | 'past_close' | 'full' | 'cancelled'

export interface RegStateEvent { status: string; closes_at: string | null; cap: number | null }
export interface RegStateRow { status: string; paid: boolean; utr: string | null; hold_expires_at: string | null }

export function heldSpots(rows: RegStateRow[], nowMs: number): number {
  return rows.filter((r) => (
    !['cancelled', 'waitlist', 'hold_expired'].includes(r.status)
    && (r.paid || r.utr != null || r.hold_expires_at == null || Date.parse(r.hold_expires_at) > nowMs)
  )).length
}

export function registrationState(e: RegStateEvent, held: number, nowMs: number): { kind: RegKind; label: string; detail: string } {
  if (e.status === 'cancelled') return { kind: 'cancelled', label: 'Cancelled', detail: 'This sport is cancelled.' }
  if (e.status !== 'open') return { kind: 'closed_by_admin', label: 'Closed by admin', detail: 'Turn registrations back on with the switch.' }
  if (e.closes_at && Date.parse(e.closes_at) <= nowMs) return { kind: 'past_close', label: 'Past closing time', detail: 'The closing time has passed; it needs a later closing time in the database.' }
  if (e.cap != null && held >= e.cap) return { kind: 'full', label: `Full, ${held} of ${e.cap} spots`, detail: 'Open, but every spot is held. The switch cannot reopen it; the spot limit has to go up.' }
  return { kind: 'accepting', label: 'Accepting', detail: e.cap != null ? `${held} of ${e.cap} spots held.` : `${held} spots held.` }
}
