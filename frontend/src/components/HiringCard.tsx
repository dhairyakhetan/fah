import { useState } from 'react'
import { Link } from 'react-router-dom'

// Bright brand hues only - every one keeps ink (black) text legible on top
// (contrast law §1.2), so a hiring card can be any of them without a text-colour
// change. A random hue is picked per card mount, so the feed varies on each load.
// audit-ok: the Pop sticker palette (mint/pink/lemon/orange/sky/grape),
// documented on /brand as `STICKERS` in public/BrandPage.tsx. It is a
// decorative FILL palette for stickers, posters and confetti, deliberately
// outside tokens.css - it is not a UI colour and never sets text on cream.
const HIRING_HUES = ['#FFE94A', '#00E5A0', '#3DA9FC', '#FF7A1A', '#FF6BD6', '#FFC700', '#6BE86B']

interface HiringCardProps {
  /** Role title (from the opening / source_title, falling back to the post body). */
  title: string
  category?: string
  /** Short one-liner, e.g. "2–3 hrs/week · closes Aug 12". */
  meta?: string
  /** Where "apply →" goes. Defaults to the openings board. */
  href?: string
  /** Slight scrapbook tilt varies per card. */
  seed?: number
}

const CAT_LABEL: Record<string, string> = {
  events: 'events', welfare: 'welfare', labs: 'labs', operations: 'ops', ops: 'ops', content: 'content',
}

/**
 * Compact, visually-distinct "we're hiring" card for job_opening posts - used in
 * both the feed and the directory so an open role reads as a stamped ticket, not
 * a normal post. Lemon signal + hard ink border + apply CTA; ~⅓ the height of a
 * full post card. Ink text on lemon (contrast law §1.2).
 */
export default function HiringCard({ title, category, meta, href = '/opportunities', seed = 0 }: HiringCardProps) {
  const tilt = seed % 2 ? 0.5 : -0.5
  // Random hue per mount → the feed's hiring cards vary on every load instead
  // of all reading as the same lemon ticket. Stable across re-renders.
  const [hue] = useState(() => HIRING_HUES[Math.floor(Math.random() * HIRING_HUES.length)])
  return (
    <Link
      to={href}
      className="hiring-card"
      style={{
        display: 'block',
        position: 'relative',
        background: hue,
        color: 'var(--ink)',
        border: '3px solid var(--ink)',
        borderRadius: 16,
        boxShadow: 'var(--sh)',
        padding: '14px 16px 13px',
        transform: `rotate(${tilt}deg)`,
        transition: 'transform 0.16s var(--ease-pop), box-shadow 0.16s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'rotate(0deg) translate(-2px,-2px)'; e.currentTarget.style.boxShadow = 'var(--sh-lg)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = `rotate(${tilt}deg)`; e.currentTarget.style.boxShadow = 'var(--sh)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
        <span
          className="mono"
          style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', background: 'var(--ink)', color: hue, padding: '3px 8px', borderRadius: 999 }}
        >
          ★ we're hiring
        </span>
        {category && (
          <span className="mono" style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.75 }}>
            {CAT_LABEL[category] || category}
          </span>
        )}
      </div>

      <h2 className="h-display" style={{ fontSize: 'clamp(17px, 2.4vw, 20px)', lineHeight: 1.08, letterSpacing: '-0.01em' }}>
        {title}
      </h2>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
        {meta
          ? <span className="mono" style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>{meta}</span>
          : <span className="mono" style={{ fontSize: 11, fontWeight: 600, opacity: 0.8 }}>open role · 2 min to apply</span>}
        <span
          className="h-display"
          style={{ fontSize: 13, fontWeight: 800, background: 'var(--ink)', color: hue, padding: '6px 12px', borderRadius: 999, whiteSpace: 'nowrap' }}
        >
          apply →
        </span>
      </div>
    </Link>
  )
}
