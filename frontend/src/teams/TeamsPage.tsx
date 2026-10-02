import './TeamsPage.css'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import teamService from '../services/teamService'
import { jobOpenings, CAT_COLORS } from '../lib/jobOpenings'
import { deptColorForTeamName, deptKindForTeamName, normDeptName, KIND_LABEL, isDarkDepartmentFill } from '../lib/departments'
import { ORG_FACTS, displayCount } from '../lib/orgFacts'
import { useMeta } from '../hooks/useMeta'
import { useJsonLd, breadcrumbLd } from '../hooks/useJsonLd'
import { pageMetadata } from '../lib/metaConfig'
import { Reveal } from '../components/Reveal'
import HowItWorks from '../components/HowItWorks'
import Img from '../components/Img'
import Skeleton from '../components/Skeleton'

const CAT_ICONS: Record<string, string> = {
  events: '🎪', welfare: '🌱', labs: '⚡', operations: '⚙️', content: '✍️', default: '★'
}

const CATS = ['all', 'events', 'welfare', 'labs', 'operations', 'content']

// The *-ink partners README/05.2 ask for ("never the hue itself as text on
// white") exist in tokens.css for 6 of the 8 live department hues:
// --welfare-ink, --tomato-ink, --grape-ink, --pink-ink, --sky-ink, --lemon-ink.
// Collabs (`--teal`) and Human Resources (`--ink-2`) have no defined partner,
// so this darkens the existing token with color-mix instead of adding a new
// one (no new colours - README invariant 1). ink-2 is already a near-black
// tone, so it is its own partner.
const OPENINGS_INK_PARTNER: Record<string, string> = {
  'var(--sky)': 'var(--sky-ink)',
  'var(--welfare)': 'var(--welfare-ink)',
  'var(--grape)': 'var(--grape-ink)',
  'var(--pink)': 'var(--pink-ink)',
  'var(--tomato)': 'var(--tomato-ink)',
  'var(--lemon)': 'var(--lemon-ink)',
  'var(--teal)': 'color-mix(in srgb, var(--teal) 55%, black)',
  // Crftd is the ink card (05.0). Ink is already the darkest token, so it is
  // its own partner; --ink-2 is kept as a fallback for any legacy row.
  'var(--ink)': 'var(--ink)',
  'var(--ink-2)': 'var(--ink-2)',
}

export type RosterFace = { uuid: string; fullName: string; avatarUrl?: string; role: 'member' | 'lead' }

// Initials from a full name — first + last initial, never more than two.
// Returns '' for an unnamed row so the disc can render as an unresolved
// identity rather than inventing a letter (same rule Avatar.tsx follows).
function initialsOf(name: string): string {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return ''
  const first = parts[0][0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] || '' : ''
  return (first + last).toUpperCase()
}

/**
 * The stacked roster row.
 *
 * MEASURED 2026-09-07: five member avatars exist across the entire org (3 on
 * Welfare, 1 on Events, 1 on ShikshAQ; 0 on the other five teams). So the
 * initials disc is the PRIMARY state here, not a fallback — ~99.6% of the
 * members rendered by this row will be one. It is designed as such: the disc
 * carries the team's own department hue at full saturation with full-opacity
 * ink or paper letterforms chosen by `isDarkDepartmentFill` (the single
 * source — Crftd and Human Resources are the ink-family fills and a per-file
 * copy of that rule has been re-broken five times on this project), and a 2px
 * paper ring so overlapping discs stay separable instead of reading as one bar.
 */
function RosterRow({ faces, total, accent }: { faces: RosterFace[]; total: number; accent: string }) {
  const dark = isDarkDepartmentFill(accent)
  const letterColor = dark ? 'var(--bg)' : '#0A0A0A'
  const overflow = Math.max(0, total - faces.length)
  if (!faces.length) return null
  return (
    <div className="tc-roster" aria-hidden="true">
      {faces.map(f => {
        const ini = initialsOf(f.fullName)
        return f.avatarUrl ? (
          <Img
            key={f.uuid}
            className="tc-face tc-face-img"
            src={f.avatarUrl}
            ctx="avatar"
            alt=""
            referrerPolicy="no-referrer"
          />
        ) : (
          <span
            key={f.uuid}
            className={'tc-face tc-face-ini' + (ini ? '' : ' tc-face-unresolved')}
            style={{ background: accent, color: letterColor }}
          >
            {ini}
          </span>
        )
      })}
      {overflow > 0 && <span className="tc-face tc-face-more">+{overflow}</span>}
    </div>
  )
}

function TeamCard({ team, index = 0, openCount, extra, faces = [] }: { team: any; index?: number; openCount: number; extra?: boolean; faces?: RosterFace[] }) {
  // The live `teams` table has 8 rows sharing 5 `category` values, so a
  // CAT_COLORS[category] lookup collides 3 teams onto teal and 2 onto grape.
  // Match the team's name to its department card's literal colour first
  // (see lib/departments.ts) and only fall back to the colliding lookup for
  // a team name that doesn't map to a known department.
  const accent = team.color || deptColorForTeamName(team.name) || CAT_COLORS[team.category] || 'var(--welfare)'
  const icon = CAT_ICONS[team.category] || CAT_ICONS.default
  const kind = deptKindForTeamName(team.name)

  // Text-on-hue lives in RosterRow now (the initials discs are the only place
  // this card sets type directly on a saturated fill) and goes through
  // `isDarkDepartmentFill`, the single source. Do NOT re-derive a dark-fill
  // check here: Crftd (`--ink`) and Human Resources are the ink-family fills,
  // and a per-file copy of this rule has been re-broken five separate times on
  // this project — most recently rendering an invisible ink-on-ink tile at
  // 1.00:1 on a live public page.
  const inkPartner = OPENINGS_INK_PARTNER[accent] || 'var(--ink-2)'

  const bio = (team.bio || team.description || '').trim()
  // `bannerUrl` is what teamService.getTeams maps `teams.banner_url` to; the
  // SAMPLE_TEAMS fallback rows carry neither, so they take the no-photo path.
  const bannerUrl: string | undefined = team.bannerUrl || team.banner_url || undefined
  // A banner that fails to load falls back to the no-photo path rather than to
  // <Img>'s own "couldn't load, tap to retry" placeholder: that placeholder is
  // a <button>, and a nested control inside this <Link> is both an a11y bug
  // and the wrong offer here (the card's job is to open the team, not to retry
  // an image). FOUND LIVE 2026-09-07: the single banner_url in the whole
  // `teams` table, AQ.Ventures' `/team-ventures-banner.jpg`, points at a file
  // that does not exist in `public/` — under Vite's SPA fallback it resolves
  // to index.html and fails to decode. So this path is not hypothetical:
  // today it is what every one of the eight cards actually renders.
  const [photoFailed, setPhotoFailed] = useState(false)
  const banner = photoFailed ? undefined : bannerUrl
  const memberCount: number = Number(team.memberCount ?? 0) || 0

  // Alternating idle tilt - every card sharing the identical flat rectangle
  // (only differing by hue) read as one monotone repeated block. A slight
  // per-card rotation (undone on hover) gives the grid the scrapbook "pinned
  // photos" feel the rest of the brand uses.
  const tilt = [-0.6, 0.8, -0.4][index % 3]

  // Roster size is BACK on this card (it was dropped by 05.2 as "a number we
  // were dressing up"). Owner ruling 2026-09-07: the counts are accurate —
  // 56 on Welfare, 21 on AQ.Ventures, 1 on Crftd — so render them exactly as
  // they are. Nothing here rounds, pads, pluralises wrongly, or appends a "+".
  return (
    <Link
      to={'/teams/' + (team.uuid || team.id)}
      // `.team-card` (TeamsPage.css) only ever added the link-reset/tilt/hover
      // rules on top of "the global .card" per its own comment - it never
      // actually carried the `card` class name, so the concentric 32/10 white
      // shell (background/border/radius/shadow/padding, all from `.card` in
      // v6.css) silently never rendered. Confirmed via computed styles
      // (background/border/radius/shadow/padding all reset to none/0).
      className={'card team-card' + (extra ? ' team-card-extra' : '')}
      style={{ '--accent': accent, '--tilt': `${tilt}deg` } as React.CSSProperties}
    >
      {/* ── The header block ──────────────────────────────────────────────
          One slot, two paths, identical geometry (radius 22 = the card's
          outer 32 minus its 10px --pad-card, so this is the concentric
          inner). Dropping real photography in later is a DATA change, not a
          redesign: `banner_url` going non-null swaps the fan for the photo
          and nothing else about the card moves.

          MEASURED 2026-09-07: exactly one of the eight live teams
          (AQ.Ventures) has a banner and none has a logo, so the no-photo
          path below is the COMMON case and is designed as the primary one —
          the department hue as the ground, with a fanned strip of paper
          tiles carrying the department mark. That is the reference's layered
          photo strip drawn in paper rather than a blank rectangle: it reads
          as a deliberate emblem at the size a photo will later occupy,
          instead of reading as a failed image. */}
      <div className="tc-head" style={{ background: accent }}>
        {banner ? (
          <>
            <Img
              className="tc-head-photo"
              src={banner}
              ctx="cover"
              alt=""
              onError={() => setPhotoFailed(true)}
            />
            {/* The reference's coloured wash over the photo strip. An alpha on
                a PHOTO, never on text — DESIGN.md's full-opacity rule governs
                type on a saturated fill, which the wash never carries. */}
            <span className="tc-head-wash" style={{ background: accent }} aria-hidden />
          </>
        ) : (
          <span className="tc-fan" aria-hidden>
            <span className="tc-fan-tile tc-fan-tile--l" />
            <span className="tc-fan-tile tc-fan-tile--c">{icon}</span>
            <span className="tc-fan-tile tc-fan-tile--r" />
          </span>
        )}
        {/* The round affordance from the reference. Rendered as an arrow, not
            a "+": the whole card IS the link to the team, and there is no
            add-to-team mutation on this page (joining happens on the team's
            own page behind a join request), so a "+" here would promise an
            action that does not exist. aria-hidden and non-interactive —
            a nested control inside a link is a real a11y bug, and the link's
            own accessible name already says where it goes. */}
        <span className="tc-go" aria-hidden>→</span>
      </div>

      {/* ── Meta ── bold title, then the quiet grey line. */}
      <div className="team-card-body">
        <div className="tc-title">{team.name}</div>
        <div className="tc-meta">
          <span>{kind ? KIND_LABEL[kind] : team.category || 'team'}</span>
          <span className="tc-dot" aria-hidden>·</span>
          {/* Owner ruling 2026-09-07: the counts are accurate, show them as
              they are. No rounding, no "+", no padding. The zero case says
              what is true instead of printing a bare 0 — unreachable live
              (every one of the eight teams has at least one member) but a
              team created today would hit it. */}
          <span>{memberCount > 0 ? `${memberCount} member${memberCount === 1 ? '' : 's'}` : 'no members listed yet'}</span>
        </div>

        <RosterRow faces={faces} total={memberCount} accent={accent} />

        <p className="team-card-bio">{bio}</p>

        <div className="team-card-foot">
          {openCount > 0 ? (
            <span className="team-card-openings" style={{ color: inkPartner }}>
              {openCount} role{openCount !== 1 ? 's' : ''} open →
            </span>
          ) : (
            <span className="team-card-openings team-card-openings--none">nothing open</span>
          )}
        </div>
      </div>
    </Link>
  )
}

const TEAMS_CACHE_KEY = 'aq_teams_cache'
const TEAMS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 1 week - show instantly, never a cold reload within a week

// Read the session-cached teams list, or null when absent/stale. Module scope
// so it can seed useState lazily without a render-phase impurity warning.
function readTeamsCache() {
  try {
    const cached = sessionStorage.getItem(TEAMS_CACHE_KEY)
    if (cached) {
      const { data, ts } = JSON.parse(cached)
      if (Date.now() - ts < TEAMS_CACHE_TTL && data?.length) return data
    }
  } catch { /* private mode / bad JSON - treat as cache miss */ }
  return null
}

export default function TeamsPage() {
  useMeta(pageMetadata.teams)
  useJsonLd('teams-breadcrumb', breadcrumbLd([['Home', '/'], ['Teams', '/teams']]))
  const [searchParams] = useSearchParams()
  // Reads ?category=welfare so a link that names a specific department (the
  // About page's department cards, previously all pointing at bare /teams
  // regardless of which one was clicked) actually lands filtered instead of
  // discarding the visitor's choice. Falls back to 'all' for a missing or
  // unrecognized value rather than filtering to an empty, confusing list.
  const [filter, setFilter] = useState(() => {
    const c = searchParams.get('category')
    return c && CATS.includes(c) ? c : 'all'
  })
  // Seed teams/loading straight from the session cache (lazy initialiser) so a
  // warm cache renders instantly with no effect-time setState cascade.
  const [teams, setTeams] = useState<any[]>(() => readTeamsCache() ?? [])
  const [loading, setLoading] = useState(() => readTeamsCache() == null)
  const [openRoles, setOpenRoles] = useState<any[]>([])
  // 05.2: "Show 4 more" on phone only - desktop's 4-up grid always shows all
  // eight, so this flag is inert (and its pill hidden) above the 760px
  // breakpoint. Never resets to false once true within a visit.
  const [showAll, setShowAll] = useState(false)
  // Roster previews, keyed by team uuid. One batched query for all eight
  // teams (teamService.getRosterPreviews) — never one per card, per 05's own
  // Unresolved Q4. Non-blocking: the cards render with their counts and the
  // faces slot in when it resolves, and a failure degrades to no faces
  // rather than an error state (the count above it is the load-bearing fact).
  const [rosters, setRosters] = useState<Record<string, RosterFace[]>>({})

  useEffect(() => {
    jobOpenings.getOpen().then(roles => setOpenRoles(roles)).catch(() => setOpenRoles([]))
  }, [])

  // Per-team open-role count for the grid cards, derived from the roles
  // already fetched for the banner above - never a query per card (05's own
  // Unresolved Q4: "batch it or drop it, do not add eight queries").
  const openRolesByDept = useMemo(() => {
    const m = new Map<string, number>()
    for (const op of openRoles) {
      const key = normDeptName(op.teamName || '')
      if (!key) continue
      m.set(key, (m.get(key) || 0) + 1)
    }
    return m
  }, [openRoles])

  const [loadFailed, setLoadFailed] = useState(false)
  const loadTeams = () => {
    setLoadFailed(false)
    setLoading(true)
    // 8s cap on the skeleton: a request that hangs is treated as a failure, so the page never sits on grey blocks.
    const cap = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))
    Promise.race([teamService.getTeams({ limit: 50 }), cap])
      .then(result => {
        if (!result.success) throw new Error('failed')
        const data = result.data.length > 0 ? result.data : SAMPLE_TEAMS
        setTeams(data)
        try { sessionStorage.setItem(TEAMS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() })) } catch {}
      })
      .catch(() => { setTeams(SAMPLE_TEAMS); setLoadFailed(true) }) // show the sample teams, and say so, with a way to retry
      .finally(() => setLoading(false))
  }
  useEffect(() => {
    // A fresh cache already seeded state above - don't refetch within the TTL.
    if (readTeamsCache() != null) return
    loadTeams()
  }, [])

  // Fires once the team list is known (cache-seeded or fetched). Uuids are
  // sorted into the dep key so a re-render with the same eight teams in a
  // different order can't retrigger the fetch.
  const teamUuidKey = useMemo(
    () => teams.map((t: any) => t.uuid).filter(Boolean).sort().join(','),
    [teams]
  )
  useEffect(() => {
    if (!teamUuidKey) return
    let cancelled = false
    teamService.getRosterPreviews(teamUuidKey.split(','), 4)
      .then(r => { if (!cancelled) setRosters(r) })
      .catch(() => { if (!cancelled) setRosters({}) })
    return () => { cancelled = true }
  }, [teamUuidKey])

  const filtered = filter === 'all' ? teams : teams.filter((t: any) => t.category === filter)

  return (
    <div className="route-enter">
      {/* Hero */}
      <section className="teams-hero">
        <div className="container">
          <span className="sticker sticker-mint wobble sticker--diecut" style={{ display: 'inline-flex', marginBottom: 16, ['--sticker-ground' as string]: 'var(--bg)' }}>
            ★ {teams.length} TEAMS
          </span>
          {/* 05.1 - UI objects set into the word gaps. display:inline-flex, in
              the text flow, position:static: they push the words apart and
              never sit on top of them (the overlap rule satisfied by
              construction - no z-index anywhere in this headline). All three
              lockups are aria-hidden and inert (no role, no tabindex, no
              handler) so a screen reader hears exactly "pick a lane, then
              turn up." Text nodes are explicit strings (not JSX whitespace)
              so that sentence can't accidentally collapse or merge words. */}
          <h1 className="h-display teams-hero-title" style={{ textWrap: 'balance' } as React.CSSProperties}>
            {'pick a '}
            <span className="tm-lockup tm-lockup--discs" aria-hidden="true">
              <span className="tm-disc" style={{ background: 'var(--welfare)' }} />
              <span className="tm-disc" style={{ background: 'var(--sky)' }} />
              <span className="tm-disc" style={{ background: 'var(--pink)' }} />
            </span>
            {' lane, '}
            <span className="tm-lockup tm-lockup--wire" aria-hidden="true">
              <svg width="34" height="16" viewBox="0 0 34 16" fill="none">
                <circle cx="3" cy="8" r="2.5" fill="var(--ink)" />
                <line x1="6.5" y1="8" x2="27.5" y2="8" stroke="rgba(10,10,10,0.28)" strokeWidth="2" strokeDasharray="3 3" strokeLinecap="round" />
                <circle cx="31" cy="8" r="2.5" fill="var(--ink)" />
              </svg>
            </span>
            <br />
            {'then '}
            <span className="tm-lockup tm-lockup--toggle" aria-hidden="true">
              <span className="tm-toggle-pill">
                <span className="tm-toggle-track"><span className="tm-toggle-knob" /></span>
                <span className="tm-toggle-on">ON</span>
              </span>
            </span>
            <em style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontWeight: 400 }}>turn up.</em>
          </h1>
          <p style={{ fontSize: 16, marginTop: 14, color: 'var(--ink-2)', maxWidth: 480 }}>
            Every team at AQ owns a real piece of the org. Pick the one that fits what you want to build.
          </p>

        </div>
      </section>

      {/* ── Open Roles banner - a contained rounded black card (matches the
           directory's `.dhero` treatment), not a full-bleed strip ──

           Item 3.3, "Teams page: hiring section opens at the top." It was
           already the first thing after the hero, but the hero ended with the
           "How joining a team works" explainer, so on a phone the openings
           banner sat below a headline, a paragraph AND a three-step explainer.
           The explainer now follows this rather than preceding it: somebody
           who can see a role open should meet the role first and the process
           second. Nothing else about either block changed.

           HONEST NOTE, counted live 2026-09-11: this renders NOTHING today.
           Both `job_openings` rows are `status='closed'`, so `getOpen()`
           returns [] and the guard below is false. The ordering is right for
           when a role opens; it is not a visible change until one does. */}
      {openRoles.length > 0 && (
        <section className="container" style={{ padding: '0 var(--page-px, 24px)', marginBottom: 'clamp(20px,4vw,28px)' }}>
          {/* No ink border — changelog/12-secondary-pages.md blanket transform
              #1 (§00.6) and DESIGN.md §1: the ink keyline survives on primary
              buttons and stamped stickers only. A 3px ink border on a #0A0A0A
              fill drew nothing; the fill separates it from the cream page.
              Same removal as the /opportunities hero, which used this exact
              inline pattern. */}
          <div style={{ background: '#0A0A0A', borderRadius: 'var(--r-md)', padding: 'clamp(18px,3.5vw,26px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--welfare)', display: 'inline-block', boxShadow: '0 0 0 0 color-mix(in srgb, var(--welfare) 50%, transparent)', animation: 'pending-pulse 2s ease-in-out infinite' }} />
                <span style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 16, color: '#fff' }}>
                  {openRoles.length} role{openRoles.length !== 1 ? 's' : ''} currently open
                </span>
              </div>
              <Link
                to="/opportunities"
                style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--welfare-ink)', textDecoration: 'none', fontWeight: 700, letterSpacing: '0.05em' }}
              >
                view all openings →
              </Link>
            </div>

            {/* Role cards - horizontal scroll on mobile */}
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', overscrollBehaviorX: 'none' }}>
              {openRoles.map(op => {
                const accent = CAT_COLORS[op.category] || 'var(--welfare)'
                return (
                  <Link
                    key={op.id}
                    to="/opportunities"
                    style={{
                      textDecoration: 'none', flexShrink: 0,
                      display: 'flex', flexDirection: 'column', gap: 8,
                      padding: '14px 16px',
                      background: 'rgba(255,255,255,0.04)',
                      border: `2px solid ${accent}`,
                      borderRadius: 14,
                      minWidth: 200, maxWidth: 260,
                      transition: 'background 0.14s, border-color 0.14s',
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'rgba(255,255,255,0.08)'
                      el.style.borderColor = accent
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement
                      el.style.background = 'rgba(255,255,255,0.04)'
                      el.style.borderColor = `${accent}44`
                    }}
                  >
                    {/* Category chip */}
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: accent }}>
                      {op.category}{op.teamName ? ` · ${op.teamName}` : ''}
                    </span>
                    {/* Title */}
                    <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 15, color: '#fff', lineHeight: 1.15 }}>
                      {op.title}
                    </div>
                    {/* Meta */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 'auto' }}>
                      {op.commitment && (
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>
                          ⏱ {op.commitment}
                        </span>
                      )}
                      {op.deadline && (() => {
                        const d = Math.ceil((new Date(op.deadline).getTime() - Date.now()) / 86400000)
                        return d > 0 ? (
                          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: d <= 3 ? 'var(--tomato)' : 'rgba(255,255,255,0.45)' }}>
                            {d <= 3 ? `⚠ ${d}d left` : `${d}d left`}
                          </span>
                        ) : null
                      })()}
                      <span style={{ flex: 1 }} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: accent, fontWeight: 700 }}>apply →</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Browsing teams posed the same unanswered question the login page used
          to: "what happens if I press this?" The cards said "View team →" and
          the modal behind it said a lead would review you, but nobody saw that
          until after they'd committed. Answer it up front, in the shared
          format.

          Moved out of the hero 2026-09-11 (item 3.3) so the openings banner
          above reaches the top of the page. `.teams-hero-steps` only sets a
          max-width and a border colour - it carries no hero-dependent
          positioning - so it renders identically here. */}
      <section className="container" style={{ paddingTop: 0, paddingBottom: 0, marginBottom: 'clamp(14px,3vw,20px)' }}>
        <HowItWorks
          label="How joining a team works"
          accent="var(--c-events)"
          className="teams-hero-steps"
          steps={[
            { title: 'Pick a team and request to join', detail: 'browse first, you can be on more than one' },
            { title: 'The team lead reviews it', detail: 'they look at what you want to work on, not your grades' },
            { title: 'You’re added to the roster', detail: 'the answer arrives in your Notifications either way' },
          ]}
        />
      </section>

      {/* Filters */}
      <div className="container" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="row gap-2" style={{ flexWrap: 'wrap', paddingBottom: 14, overflowX: 'hidden' }}>
          {CATS.map(c => (
            <button
              key={c}
              className={'chip ' + (filter === c ? 'chip-active' : '')}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <span className="mono xs muted">{filtered.length} team{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {loadFailed && (
        <div className="container">
          <div className="card" role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', padding: '12px 16px', marginBottom: 16 }}>
            <span className="sm">couldn&rsquo;t load the latest team list. showing the last known teams.</span>
            <button type="button" className="btn btn-sm" onClick={loadTeams}>try again</button>
          </div>
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length === 0 ? (
        <div className="container">
          {/* The reference's fanned card-stack empty state: illustration,
              headline, one line of explanation, one primary button.
              NOTE: the `filter === 'all'` arm of this is UNREACHABLE today —
              eight teams are active live, so only the per-category arm can
              actually render. Built, not observed in the wild. */}
          <div className="card teams-empty">
            <span className="te-stack" aria-hidden>
              <span className="te-stack-card te-stack-card--l" />
              <span className="te-stack-card te-stack-card--r" />
              <span className="te-stack-card te-stack-card--c" />
            </span>
            <div className="h-display teams-empty-title">no teams here.</div>
            <p className="teams-empty-sub">
              {filter === 'all' ? 'no teams yet.' : `no teams in "${filter}" right now — try another category.`}
            </p>
            {filter !== 'all' && (
              <button className="btn btn-primary teams-empty-btn" onClick={() => setFilter('all')}>
                see all teams
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={'container teams-grid' + (showAll ? ' show-all' : '')}>
            {loading
              // Eight, matching the real (static, always-eight-department)
              // count - a skeleton count that changes once real data lands
              // reads as the page jumping (06.7).
              ? [0,1,2,3,4,5,6,7].map(i => (
                  <div key={i} className="card team-card-skel" aria-hidden="true">
                    {/* Shared Skeleton (11.2), and the SAME geometry the real
                        card renders — header block at --r-inner, then title,
                        meta, roster row, bio — so nothing shifts on swap. */}
                    <Skeleton variant="block" height={132} radius="var(--r-inner)" />
                    <div className="team-card-body">
                      <Skeleton variant="line" height={17} width="72%" />
                      <Skeleton variant="line" height={12} width="46%" />
                      <Skeleton variant="line" height={28} width={110} radius={999} />
                      <Skeleton variant="line" height={12} width="88%" />
                    </div>
                  </div>
                ))
              : filtered.map((t: any, i: number) => (
                  <Reveal key={t.uuid || t.id} delay={(i % 3) * 0.06}>
                    <TeamCard
                      team={t}
                      index={i}
                      extra={i >= 4}
                      openCount={openRolesByDept.get(normDeptName(t.name)) ?? 0}
                      faces={rosters[t.uuid] || []}
                    />
                  </Reveal>
                ))
            }
          </div>
          {!loading && !showAll && filtered.length > 4 && (
            <div className="teams-show-more-wrap">
              <button className="chip" onClick={() => setShowAll(true)}>
                Show {filtered.length - 4} more
              </button>
            </div>
          )}
        </>
      )}

    </div>
  )
}

// No per-team `color` override here on purpose - leaving it unset lets
// TeamCard fall through to CAT_COLORS[category], so every sample card (shown
// only when the real fetch fails) lands on the correct one-hue-per-vertical
// token instead of the old off-palette hexes that used to collapse labs/ops
// into blue and content into pink here.
// memberCount is 0 for every sample team, deliberately - this fallback only
// renders on a dead-database read, and the file's own rule two comments up
// is "nothing here invents a number." Specific counts (40, 60, 20...) used
// to sit here despite that rule, which made hasRoster (>= 3) true for every
// sample card and rendered a fully-populated, entirely fabricated "★ N
// strong" badge with no visual distinction from real data. 0 routes every
// sample card through the same honest "taking applications" treatment a
// real low-roster team gets.
const SAMPLE_TEAMS = [
  { uuid: 't-1', name: 'Events Team',     category: 'events',     memberCount: 0, bio: 'Paradox. Disco Diwali. Starry Nights. Every fundraiser AQ has ever run. 300+ came to Paradox alone. Proceeds fund the welfare drives. This team runs it.' },
  // The three figures here are the same cleared cumulative-impact facts every
  // other surface states; they now read ORG_FACTS rather than being retyped
  // (§21.0), like the HR entry below already did. Values unchanged.
  { uuid: 't-2', name: 'Welfare Team',    category: 'welfare',    memberCount: 0, bio: `${displayCount(ORG_FACTS.childrenReached)} kids reached in teaching workshops. ${ORG_FACTS.sundarbansTrips} Sundarbans relief trips. Dog feeding drives across Kolkata. ${displayCount(ORG_FACTS.saplingsPlanted)} saplings planted. This is the impact core.` },
  { uuid: 't-3', name: 'Social Media',    category: 'content',    memberCount: 0, bio: 'Instagram, LinkedIn, the website. Reels, carousels, copy, strategy. Not a school club account run by teachers. A real brand account, run by students.' },
  { uuid: 't-4', name: 'Collabs Team',    category: 'operations', memberCount: 0, bio: 'School collabs, college collabs, NGO partnerships, outreach. AQ grows through peer networks. This team builds those networks.' },
  { uuid: 't-5', name: 'Crftd',           category: 'content',    memberCount: 0, bio: 'Student-run streetwear brand. Design, production, sales. Profits fund AQ welfare projects and events. The brand is real. The revenue is real.' },
  { uuid: 't-6', name: 'AQ.Ventures',     category: 'operations', memberCount: 0, bio: 'Free marketing agency for student businesses. Real clients. Real briefs. Real deliverables. Members build marketing experience before college.' },
  { uuid: 't-7', name: 'ShikshAQ',        category: 'labs',       memberCount: 0, bio: 'Tuition discovery platform built by AQ members for Kolkata students. Launched 2026. Product, design, content, growth. Still early. The team is small.' },
  { uuid: 't-8', name: 'Human Resources', category: 'operations', memberCount: 0, bio: `Recruitment, onboarding, certificates, Letters of Recommendation. HR runs the intake pipeline for ${displayCount(ORG_FACTS.membersTotal)} members.` },
]
