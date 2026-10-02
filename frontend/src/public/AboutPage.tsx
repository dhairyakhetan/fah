import './AboutPage.css'
import { useNavigate } from 'react-router-dom'
import { Star, I, Marquee } from '../components/v6Shared'
import { useIsMobile } from '../hooks/useMobile'
import DynamicIslandTOC from '../components/DynamicIslandTOC'
import { Reveal, RevealGroup } from '../components/Reveal'
import { useMeta } from '../hooks/useMeta'
import { pageMetadata } from '../lib/metaConfig'
import { useJsonLd, breadcrumbLd } from '../hooks/useJsonLd'
import { DEPARTMENTS } from '../lib/departments'
import OrgChart from '../components/OrgChart'
import { Sticker } from '../components/Sticker'
import { APPROVAL_TIME, ORG_FACTS, displayCount } from '../lib/orgFacts'
import { setAuthIntent } from '../lib/authIntent'

// ── Decorative SVG arrows ──────────────────────────────────────
// The only hand-drawn marks in the system, and they belong to this page.
// Desktop-only (see the !isMobile gate in HeroSection).
const ArrowMint = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', color: 'var(--welfare)', stroke: 'currentColor', overflow: 'visible' }} fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10,90 C 10,40 40,20 60,50 C 70,65 80,75 95,70" />
    <path d="M80,55 L95,70 L85,85" />
  </svg>
)
const ArrowLemon = () => (
  <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', color: 'var(--lemon)', stroke: 'currentColor', overflow: 'visible' }} fill="none" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M90,10 C 80,60 60,80 40,60 C 20,40 40,20 60,30 C 80,40 70,70 50,80" />
    <path d="M65,75 L50,80 L55,65" />
  </svg>
)

// ── Spinning circular badge ────────────────────────────────────
// Kept at >= 1025 only; it overlapped the type on a phone.
const SpinBadge = () => (
  <div style={{
    position: 'relative', width: 128, height: 128,
    background: 'var(--welfare)', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: 'var(--shadow-cta)', border: '2px solid var(--ink)',
    transform: 'rotate(12deg)', flexShrink: 0,
  }}>
    <div className="ab-badge-spin" style={{ position: 'absolute', inset: 4 }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
        <path id="badgePath" d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0" fill="none" />
        <text style={{ fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em' }} fill="#0A0A0A">
          <textPath href="#badgePath" startOffset="0%">EST. JUNE 2021 • KOLKATA NGO • EST. JUNE 2021 • KOLKATA NGO •</textPath>
        </text>
      </svg>
    </div>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Star size={40} color="#0A0A0A" />
    </div>
  </div>
)

// ── Hero ───────────────────────────────────────────────────────
// Section 05: one ink block. The 200vh sticky scroll container, the
// `useScroll` call and both `useTransform` pairs are gone, so nothing on this
// page animates on scroll any more.
//
// Section 26: the three float contents have left the hero for the bands where
// they can actually be read - `1,200+` to chapter 2026, Paradox 3.0 and the
// zero-donations band to the totals band. Every string moved verbatim; none was
// dropped.
//
// changelog/09-about.md replaced the three decorative stacked words (STUDENT /
// KOLKATA / NGO.) and their sr-only h1 with the design source's real copy: a
// kicker, a headline that is itself the page's one <h1>, a lead paragraph and
// a re-worded sticker row. Still the same ink block, same desktop-only badge
// and arrows, same scroll cue - only the text layer and its alignment (left,
// not centred - see .ab-hero-inner in AboutPage.css) changed.
function HeroSection() {
  const isMobile = useIsMobile(768)

  return (
    <section className="ab-hero bleed-under-nav" data-nav-tint="ink">
      <div className="ab-hero-grid" aria-hidden />

      <div className="ab-hero-inner">
        {/* changelog/09-about.md's hero copy, approved 2026-09-05. This
            replaces the previous sr-only-h1-plus-three-decorative-words
            layout: the manifesto's own headline now carries the sentence, so
            there is no separate accessible string to keep in sync with it. */}
        <div className="ab-kicker-onink">★ est. june 2021 · kolkata</div>
        <h1 className="ab-hero-h1">
          started in<br />kolkata.<br />
          <span className="ab-hero-h1-em">got out of hand.</span>
        </h1>
        <p className="ab-hero-lead">
          16 students, no budget, no experience, and a WhatsApp group. Five years later there are {displayCount(ORG_FACTS.membersTotal)} of us across eight departments, still student-run, still Kolkata.
        </p>

        {/* Sticker row. Copy swapped for 09-about's three (ages / fees /
            registration) - the est.-year and DARPAN facts this row used to
            carry still read above and in position 07 of the manifesto below,
            so nothing is dropped, only moved to where the design source
            put it. */}
        <div className="ab-hero-stickers">
          <span className="ab-pill ab-pill-welfare ab-pill-r-3">ages {ORG_FACTS.ageRange}</span>
          <span className="ab-pill ab-pill-lemon ab-pill-r2">zero fees</span>
          <span className="ab-pill ab-pill-ghost ab-pill-r-1">darpan registered</span>
        </div>

        <span className="ab-hero-scroll">
          <span className="ab-hero-scroll-dot" aria-hidden />
          scroll to explore
        </span>
      </div>

      {/* Desktop-only decor. Same useIsMobile(768) gate as before. */}
      {!isMobile && (<>
        <div className="ab-hero-badge"><SpinBadge /></div>
        <div className="ab-hero-arrow ab-hero-arrow-mint" aria-hidden><ArrowMint /></div>
        <div className="ab-hero-arrow ab-hero-arrow-lemon" aria-hidden><ArrowLemon /></div>
      </>)}
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────
export default function AboutPage() {
  useMeta(pageMetadata.about)
  useJsonLd('about-breadcrumb', breadcrumbLd([['Home', '/'], ['About', '/about']]))
  const navigate = useNavigate()

  const principles = [
    { t: 'ownership first', s: 'students own execution. not just participation. real responsibility, not just titles.', c: 'var(--welfare)' },
    { t: 'real impact only', s: 'every initiative creates tangible, real-world results. time is the resource. impact is the output.', c: 'var(--lemon)' },
    { t: 'fun is mandatory', s: 'participation is designed to feel social and energising, not obligation-driven. if it is boring we fix it.', c: 'var(--pink)' },
    { t: 'community is the point', s: 'friendships and shared experiences are not a bonus. they are the retention mechanism and the whole point.', c: 'var(--sky)' },
  ]

  // The manifesto. Seven numbered positions, written to docs/BRAND_VOICE.md's
  // "Real Person Test" (changelog/09-about.md §09.0-09.1): every position
  // pairs a claim with a receipt - a name, number, place or date - rather
  // than reading as a mission statement. Verbatim from the design source's
  // "15a" artboard, with two edits the LIVE code required that the source
  // (drawn from an older read of the repo) didn't have:
  //   - "ROOTS" -> "Crftd": App.tsx has "ROOTS was renamed to Crftd, keep the
  //     old path redirecting" - docs/BRAND_VOICE.md still says ROOTS because
  //     it predates the rename.
  //   - position 03's drives figure is a real number, not a confirm-me alert.
  //     The source drew "512+ / 534+ / 450+ all appear in the codebase,
  //     awaiting your confirmation" because that conflict was still open when
  //     it was written; lib/orgFacts.ts resolved it live the same day this
  //     file was built (548 public drives -> displayCount() -> "540+"), so
  //     the position now carries the resolved figure instead of the alert.
  const positions = [
    {
      n: '01', hue: 'var(--welfare)',
      t: "Students don't need supervising. They need a budget and a deadline.",
      p: 'Every school club is student-supervised. We are student-run. The difference is who signs off, and here it is us.',
    },
    {
      n: '02', hue: 'var(--lemon)',
      t: 'Nobody waits for college to be useful.',
      p: 'A class-10 student can be running logistics for a Sundarbans relief drive within months of joining. Eight of those trips have gone out, the most recent in December 2025.',
    },
    {
      n: '03', hue: 'var(--sky)',
      t: 'We count things.',
      p: 'Not a mission statement. A tally.',
    },
    {
      n: '04', hue: 'var(--tomato)',
      t: 'We pay for it ourselves.',
      p: "Zero donations, zero external funding, since day one. Crftd sells streetwear and the profits fund the welfare drives. That's the whole business model.",
    },
    {
      n: '05', hue: 'var(--pink)',
      t: "If it isn't fun, nobody comes back.",
      p: "Everywhere else, being productive and seeing your friends are two different afternoons. Here they're the same one. That isn't a perk - it's why the work keeps happening.",
    },
    {
      n: '06', hue: 'var(--grape)',
      t: "Eight departments, so there's a lane for whatever you're actually good at.",
      p: 'Welfare, Events, Social Media, Collabs, Human Resources - plus three student businesses: Crftd, ShikshAQ and AQ.Ventures.',
    },
    {
      n: '07', hue: 'var(--teal)',
      t: "It's a real NGO, on paper.",
      p: 'DARPAN-registered with NITI Aayog, Government of India.',
    },
  ]

  // The six milestone strings are the page's spine (section 26). Array order,
  // wording and years are frozen - this array is not reordered, reworded or
  // extended, and a chapter may only carry a fact its own string carries.
  const milestones = [
    { y: '2021', t: '16 students, a WhatsApp group, and a Sundarbans relief trip with no budget' },
    { y: '2022', t: '200 members, first leadership handover, certificates as currency' },
    { y: '2023', t: 'dipped. recovered. original team stepped back in and rebuilt' },
    { y: '2024', t: 'Disco Diwali. Starry Nights. both crossed 6-digit revenue. Crftd launched.' },
    /* 2026-09-06 — kept BYTE-IDENTICAL with the duplicate of this array in
       public/DirectoryPage.tsx (`YEARS`), per the note there. §21.0: no public
       statistic as a literal. 2025's `1,100 members. 550+ projects.` and
       2026's `1,200+ active members` were three hand-typed figures that
       contradicted this page's own footer marquee (540+ / 1,300+) and shipped
       the `550+` ACCEPTANCE §F bans by name. 2025's are DELETED, not
       re-derived — an ORG_FACTS count is TODAY's number and pinning it to a
       past chapter would be a new, wrong claim. 2026 is the "now" chapter, so
       its figure is the live one. No other word changed. */
    { y: '2025', t: 'AQ.Ventures and ShikshAQ in the ecosystem.' },
    { y: '2026', t: `${displayCount(ORG_FACTS.membersTotal)} active members. ShikshAQ live. still student-run. still Kolkata.` },
  ]

  // "chapter one" … "chapter six · now". The only new strings in section 26.
  const chapterLabels = ['chapter one', 'chapter two', 'chapter three', 'chapter four', 'chapter five', 'chapter six · now']

  // The old timeline's disc rotation, kept so a reader who knew it sees the same
  // hue per year. The `-ink` variants are used on paper and the bright hue on
  // the 2023 ink band: a 52px numeral in raw `--lemon` on paper measures ~1.4:1,
  // which is the same contrast failure the stat-label rule exists to stop.
  const yearColors = ['var(--welfare-ink)', 'var(--lemon-ink)', 'var(--pink)', 'var(--sky-ink)', 'var(--welfare-ink)', 'var(--lemon-ink)']

  // The totals band's own four-tile stat grid (drives / kids / saplings /
  // bananas) is REMOVED as of changelog/09-about.md: position 03 of the new
  // manifesto above states the same tally (plus medical checkups, plus the
  // now-resolved drives receipt) more prominently and more completely, and
  // this file's own established rule is "every claim keeps its exact wording
  // and gets ONE home" (see the 2021-chapter manifesto comment below). The
  // heading and the registration/Paradox/zero-donations cards that used to
  // sit below the grid are unchanged.

  // Paradox 3.0's year was a real conflict (BRAND_VOICE.md §3.3: Jun 2024 vs
  // Jun 2025) until lib/orgFacts.ts's generator cross-checked this page's own
  // card against src/paradox/pages/Legacy.tsx's edition timeline and found
  // both already agreeing on June 2024 - still flagged there for a human's
  // final sign-off, so this reads the constant rather than re-hardcoding
  // "2024" a second time.
  const paradoxDate = new Date(`${ORG_FACTS.paradoxThreeDate}-01`).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  // Sourced from the same canonical 8-department list QuickLinksPage uses -
  // this used to be a hand-maintained 6-entry copy that had drifted, missing
  // AQ.Ventures and Human Resources entirely. `c` is each entry's LITERAL
  // colour token, never a CAT_COLORS[category] lookup.
  const team = DEPARTMENTS.map(d => ({ n: d.name, r: d.stat, c: d.color, category: d.category }))

  return (
    <div className="route-enter">

      {/* Floating dynamic-island table of contents */}
      <DynamicIslandTOC />

      <HeroSection />

      {/* ── MARQUEE BAND ── */}
      {/* The one deliberate exception to section 26's one-home rule: a marquee
          is a chant, not a statement. All eight items are unchanged. */}
      {/* 2026-09-06, changelog/09-about.md §09.4 + ACCEPTANCE §F: the members
          and drives items were hand-typed `1,200+ ACTIVE MEMBERS` and
          `550+ DRIVES` — a fourth value for the same stat, and on this very
          page, 200px from the footer marquee printing `1,300+ MEMBERS` and
          `540+ DRIVES`. Both now derive from ORG_FACTS. Saplings likewise.
          Every word, the order, and the ★ rhythm are unchanged; `15,000
          BANANAS` keeps its exact wording (no "+", and never "meals"). */}
      <div className="ab-marquee" data-nav-tint="welfare">
        <Marquee items={['★ KOLKATA BORN', `${displayCount(ORG_FACTS.membersTotal)} ACTIVE MEMBERS`, '★ ZERO DONATIONS EVER', `${displayCount(ORG_FACTS.drivesWrittenUp)} DRIVES`, '★ DARPAN CERTIFIED', `${displayCount(ORG_FACTS.saplingsPlanted)} SAPLINGS`, '★ STUDENT RUN', '15,000 BANANAS']} color="mint" />
      </div>

      {/* ── THE MANIFESTO (changelog/09-about.md) ── */}
      {/* Full-bleed ink, same device as the hero. Torn seam INTO it is
          welfare-coloured because the marquee immediately above it is
          --welfare (color="mint"), not ink - see the updated note in
          AboutPage.css's "3.3 the torn seam" block for why this is now a
          second boundary rather than the one the earlier pass documented.
          No seam is needed on its OUT edge: the six chapters below already
          tear in ink (`ab-torn-ink`), and ink is now literally what precedes
          them, so that seam is unchanged and still correct. */}
      <section className="ab-positions-wrap ab-torn ab-torn-welfare" data-nav-tint="ink">
        <div className="ab-positions-head">
          <div className="ab-kicker-onink">★ what we hold</div>
          <h2 className="h-display" data-toc data-toc-title="Manifesto" style={{ margin: '12px 0 0', fontSize: 'clamp(34px, 7vw, 56px)', lineHeight: 0.92, color: 'var(--paper)' }}>
            seven positions.
          </h2>
        </div>
        <ol className="ab-positions-list">
          {positions.map(pos => (
            <li key={pos.n} className="ab-position">
              <b className="ab-position-n" style={{ color: pos.hue }}>{pos.n}</b>
              <div className="ab-position-body">
                {/* <p>, not a heading: v6.css's global "h1,h2,h3.. {font-family:
                    var(--display) !important}" rule (Variable Bridges section)
                    would force this sentence-case text into NeutralFace, which
                    has no lowercase glyphs and silently re-capitalises it -
                    the exact !important wall .ab-chapter-t already routes
                    around the same way, one section down. */}
                <p className="ab-position-t">{pos.t}</p>
                <p className="ab-position-p">{pos.p}</p>

                {/* Position 03: the tally. Four cleared, undisputed stats
                    (§3 ✅) in the 2x2 grid the design source specifies, then
                    the resolved drives receipt in place of its confirm-me
                    alert - see the `positions` array comment above. */}
                {pos.n === '03' && (
                  <>
                    <div className="ab-position-grid">
                      <div className="ab-position-tile">
                        <span className="ab-position-tile-n">15,000+</span>
                        <span className="ab-position-tile-k">bananas</span>
                      </div>
                      <div className="ab-position-tile">
                        <span className="ab-position-tile-n">4,000+</span>
                        <span className="ab-position-tile-k">saplings</span>
                      </div>
                      <div className="ab-position-tile">
                        <span className="ab-position-tile-n">3,500+</span>
                        <span className="ab-position-tile-k">kids in workshops</span>
                      </div>
                      <div className="ab-position-tile">
                        <span className="ab-position-tile-n">1,600+</span>
                        <span className="ab-position-tile-k">medical checkups</span>
                      </div>
                    </div>
                    <div className="ab-position-receipt">
                      <span className="ab-position-receipt-n">{displayCount(ORG_FACTS.drivesWrittenUp)}</span>
                      <span className="ab-position-receipt-k">drives completed</span>
                    </div>
                    <p className="ab-position-note">Bananas, not meals. It isn't a typo.</p>
                  </>
                )}

                {pos.n === '07' && (
                  <span className="ab-position-reg">reg. no. {ORG_FACTS.darpanReg}</span>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── THE SIX CHAPTERS (was: the story section + the 56px-circle timeline) ── */}
      {/* The torn seam. ONE, not the three the study proposed - see the
          .ab-torn block in AboutPage.css for why. It tears in ink because the
          manifesto immediately above it (09-about.md) is a full-bleed ink
          section, same as the hero was when this comment was first written. */}
      <section className="ab-chapters-wrap ab-torn ab-torn-ink">
        <div className="container">
          <span className="ab-pill ab-pill-welfare ab-pill-r-2">★ the story</span>
          <div className="row ab-chapters-head">
            <h2 className="h-display" data-toc data-toc-title="Timeline" style={{ fontSize: 'clamp(30px, 5vw, 64px)', margin: 0, lineHeight: 0.95 }}>
              five <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--pink-ink)' }}>years</span>, six chapters.
            </h2>
            <span className="ab-pill ab-pill-lemon ab-pill-r3">★ since 2021</span>
          </div>

          <ol className="ab-chapters">
            {milestones.map((m, i) => (
              <li key={m.y} className={'ab-chapter' + (m.y === '2023' ? ' ab-chapter-ink' : '')}>
                <div className="ab-chapter-head">
                  <span className="ab-chapter-y" style={{ color: yearColors[i] }}>{m.y}</span>
                  <span className="ab-chapter-k">{chapterLabels[i]}</span>
                </div>
                <div className="ab-chapter-body">
                <p className={'ab-chapter-t' + (m.y === '2023' ? ' ab-chapter-t-big' : '')}>{m.t}</p>

                {/* 2021 carries the founders block and the founding paragraphs,
                    all verbatim from the story section and the standalone
                    founders card that this section deletes. */}
                {m.y === '2021' && (
                  <div className="ab-chapter-extra">
                    <p className="ab-story-lead">
                      AquaTerra launched on <span style={{ fontStyle: 'italic', color: 'var(--pink-ink)' }}>11 June 2021</span>. 16 students. COVID lockdowns. nowhere to put the energy.
                    </p>
                    {/* 3.1, the manifesto. Study reference: Sand Studio's giant
                        manifesto paragraph with die-cut stickers sitting INSIDE
                        the sentence instead of beside it.

                        DEVIATION from the study, deliberately. The study put a
                        new manifesto block BETWEEN chapters 2021 and 2022. That
                        would have duplicated the founders quote, which section
                        26 had just given exactly one home here, and "every claim
                        keeps its exact wording and gets ONE home" is that
                        section's whole rule. So the manifesto is this block,
                        promoted to manifesto scale, rather than a second copy of
                        it one chapter down.

                        No new claim is written. The quote and the byline are the
                        frozen strings that were already here; the stickers
                        replace punctuation, which is the device the study
                        actually contributes. This is the first thing on About
                        that uses the 87-piece pack at all. */}
                    <div className="ab-founders">
                      <div className="mono xs upper muted" style={{ fontWeight: 700 }}>★ how it started</div>
                      <p className="ab-manifesto">
                        <span>why</span>
                        <Sticker shape="burst12" hue="lemon" rotate={-9} size={72} mark="plus" label="" />
                        <span>why not.</span>
                      </p>
                      <p className="ab-founders-a">- the founders, June 2021</p>
                      <p className="ab-story-p">
                        16 students, no budget, no experience, and a WhatsApp group started AquaTerra during lockdown. every leadership handover since has kept the same rule: students own execution, not just participation.
                      </p>
                    </div>
                    <p className="ab-story-p">
                      The first project was a relief trip to the Sundarbans. Nobody really knew what they were doing. It worked anyway. That became the pattern.
                    </p>
                  </div>
                )}

                {/* 2024 names Crftd, so Crftd's description card lives here now
                    and has left "what AquaTerra actually is". */}
                {m.y === '2024' && (
                  <div className="ab-chapter-extra">
                    <div className="ab-lift">
                      <span className="ab-lift-rule" style={{ ['--wc' as string]: 'var(--lemon)' } as React.CSSProperties} aria-hidden />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span className="ab-what-label">Crftd</span>
                        <span className="ab-what-detail">a student-run streetwear brand. profits fund NGO activities. members design, produce, and sell.</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 2025 names two ventures, so it gets their NAMES only. Their
                    description cards stay in "what AquaTerra actually is". */}
                {m.y === '2025' && (
                  <div className="ab-chapter-extra ab-chapter-pills">
                    <span className="ab-name-pill" style={{ background: 'var(--grape)' }}>AQ.Ventures</span>
                    <span className="ab-name-pill" style={{ background: 'var(--teal)' }}>ShikshAQ</span>
                  </div>
                )}

                {/* 2026 is the only place the live member count renders as a
                    statistic (elsewhere in this array it's frozen wording -
                    see the milestones comment above). */}
                {m.y === '2026' && (
                  <div className="ab-chapter-extra ab-chapter-tiles">
                    <div className="ab-chapter-tile" style={{ background: 'var(--welfare)' }}>
                      <span className="ab-chapter-tile-n">{displayCount(ORG_FACTS.membersTotal)}</span>
                      <span className="ab-chapter-tile-k">active members</span>
                    </div>
                    <div className="ab-chapter-tile" style={{ background: 'var(--card)' }}>
                      <span className="ab-chapter-tile-n">8</span>
                      <span className="ab-chapter-tile-k">departments</span>
                    </div>
                  </div>
                )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── THE TOTALS BAND ── */}
      {/* What the numbers add up to, stated once, after the story instead of
          three times before it. The four-tile stat grid this heading used to
          sit above is gone (see the comment by the deleted `stats` array
          above); the registration, Paradox 3.0 and zero-donations cards are
          unchanged. */}
      <section className="ab-totals-wrap">
        <div className="container">
          <div className="ab-totals">
            <h2 className="ab-story-h ab-story-h-onink" data-toc data-toc-title="Real work">
              real work.<br />
              <span className="ab-story-h-em ab-story-h-em-onink">real impact.</span>
            </h2>
            <p className="ab-story-eyebrow ab-story-eyebrow-onink" style={{ margin: 0 }}>since june 2021 · kolkata</p>
          </div>

          <div className="ab-totals-cards">
            <div className="ab-note" style={{ background: 'var(--card)' }}>
              <div className="mono xs upper muted" style={{ fontWeight: 700, marginBottom: 12 }}>★ registered &amp; certified</div>
              <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'var(--eina)' }}>DARPAN certified NGO</div>
              <div className="mono xs" style={{ marginTop: 5, color: 'var(--ink-2)' }}>Reg. No. AAFTT2300ME20251</div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.6, marginTop: 12 }}>
                registered under DARPAN, an initiative of NITI Aayog, Govt. of India. self-funded, always - zero donations, zero external funding, since day one.
              </p>
            </div>

            {/* Paradox 3.0 lived ONLY in the hero float, and source did not date
                it, so it lands in the totals band rather than being guessed into
                a chapter. The year was a blocked stat until lib/orgFacts.ts
                resolved it (see the `paradoxDate` comment above) - it now reads
                live from ORG_FACTS instead of staying undated. */}
            <div className="ab-note" style={{ background: 'var(--card)' }}>
              <div className="mono xs upper muted" style={{ fontWeight: 700, marginBottom: 12 }}>Paradox 3.0</div>
              <div className="ab-para-row">
                <span className="ab-para-n">₹1L+</span>
                <span className="ab-para-s">300 attendees · {paradoxDate}</span>
              </div>
            </div>

            <div className="ab-zero">
              <span className="ab-zero-k">₹0 donations</span>
              <span className="ab-zero-s">self-funded. always.</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUOTE BAND (changelog/09-about.md) ── */}
      {/* "the page's emotional centre" per §09.1 - the one place the serif
          carries a whole sentence rather than one or two words. Byte-identical
          to the live string already in the values section below it (per
          09-about's own instruction: "if that exact string exists, use the
          live one" rather than the design source's paraphrase) - kept as a
          rounded card rather than a full-bleed hue band like the design
          source draws, matching how this page already treats `.ab-totals`/
          `.ab-cta` (see AboutPage.css's "3.3 the torn seam" note on why full-
          bleed hue bands were deliberately kept to the one hero/manifesto
          pair rather than added here too). */}
      <section className="container" style={{ padding: 'clamp(8px, 3vw, 24px) var(--page-px) clamp(28px, 5vw, 48px)' }}>
        <div className="ab-quote">
          <span className="ab-quote-dot" aria-hidden />
          <p className="ab-quote-t">students learn best when trusted with real work.</p>
          <p className="ab-quote-k">★ the whole argument, in one line</p>
        </div>
      </section>

      {/* ── WHAT WE ACTUALLY ARE - three items; Crftd moved into chapter 2024 ── */}
      <section className="container" style={{ padding: 'clamp(32px, 5vw, 56px) var(--page-px) 56px' }}>
        <div className="ab-what">
          <div className="mono xs upper muted" style={{ fontWeight: 700 }}>★ what AquaTerra actually is</div>
          <p className="ab-story-p ab-what-intro">
            Four years later, AquaTerra is not a traditional NGO. It is a student ecosystem: impact work, a streetwear brand, a tuition discovery platform, and a free marketing agency for student businesses. All run by teenagers in Kolkata.
          </p>
          <RevealGroup className="ab-what-list">
            {[
              { label: 'NGO (DARPAN certified)', detail: 'cleanup drives, Sundarbans relief, tree planting, animal welfare, educational workshops for underprivileged kids', c: 'var(--welfare)' },
              { label: 'AQ.Ventures', detail: 'a free marketing agency built by AQ members, for student businesses. real clients, real work.', c: 'var(--grape)' },
              { label: 'ShikshAQ', detail: 'a tuition discovery platform built by students, for students across Kolkata.', c: 'var(--teal)' },
            ].map((item, i) => (
              <Reveal key={item.label} delay={i * 0.05} className="ab-what-row">
                <span className="ab-what-rule" style={{ ['--wc' as string]: item.c } as React.CSSProperties} aria-hidden />
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="ab-what-label">{item.label}</span>
                  <span className="ab-what-detail">{item.detail}</span>
                </span>
              </Reveal>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── PRINCIPLES ── */}
      <section className="container" style={{ padding: '0 var(--page-px) 56px' }}>
        <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="h-display" data-toc data-toc-title="Values" style={{ fontSize: 'clamp(34px, 6vw, 64px)', margin: 0, lineHeight: 0.95 }}>
            four <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--welfare-ink)' }}>values</span>.
          </h2>
          <span className="ab-pill ab-pill-pink ab-pill-r3">★ non-negotiable</span>
        </div>
        <p className="ab-story-p ab-values-intro">
          The core logic has not changed: <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', color: 'var(--welfare-ink)' }}>students learn best when trusted with real work</span>. Not simulations. Not worksheets. Actual execution, with actual stakes.
        </p>
        <RevealGroup className="ab-values">
          {principles.map((p, i) => (
            <Reveal key={i} delay={i * 0.05} className="ab-value" style={{ background: p.c }}>
              <div className="ab-value-n">0{i + 1} / 04</div>
              <h3 className="ab-value-t">{p.t}</h3>
              <p className="ab-value-s">{p.s}</p>
            </Reveal>
          ))}
        </RevealGroup>
      </section>

      {/* ── TEAMS ── */}
      <section className="container" style={{ padding: 'clamp(44px, 8vw, 80px) var(--page-px,24px) clamp(32px, 5vw, 56px)' }}>
        <div className="row" style={{ alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, flexWrap: 'wrap', gap: 12 }}>
          <h2 className="h-display" data-toc data-toc-title="Departments" style={{ fontSize: 'clamp(32px, 5vw, 64px)', margin: 0, lineHeight: 0.95 }}>
            the <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--welfare-ink)' }}>departments</span>.
          </h2>
        </div>
        <div className="ab-depts">
          {team.map((t, i) => {
            // Each card names a specific department, but used to send every
            // click to the same generic /teams list regardless of which one
            // was picked - the choice the visitor just made was discarded.
            const dest = `/teams?category=${t.category}`
            const go = () => navigate(dest)
            // Human Resources' disc is --ink-2; ink initials on it are unreadable.
            const onInk = t.c === 'var(--ink-2)'
            return (
            // 3.2. WAS a card in a grid. Now a full-width row carrying its
            // department's own literal hue, per the Radical Futures reference's
            // one-hue-per-row accordion. The hue still comes from
            // lib/departments.ts and never from CAT_COLORS: five category keys
            // cannot serve eight departments, and that collision is recorded in
            // the file itself.
            //
            // `role="button"` stays a div rather than becoming a real <button>
            // because the row carries a hue band, a name and a stat as separate
            // styled children, and the existing keyboard handler already covers
            // Enter and Space.
            <div key={i} role="button" tabIndex={0} className={'ab-dept ab-dept-row' + (onInk ? ' is-onink' : '')} style={{ ['--dept' as any]: t.c }} onClick={go} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } }}>
              <span className="ab-dept-n">{t.n}</span>
              <span className="ab-dept-s">{t.r}</span>
              <span className="ab-dept-go" aria-hidden>→</span>
            </div>
            )
          })}
        </div>
      </section>

      {/* ── ORG CHART ── */}
      {/* Visual hierarchy: AquaTerra -> 8 departments -> sub-departments
          (where real roster data exists). Separate from "the departments"
          list right above — that's a quick-scan directory; this is the
          click-through structure, department members + HoDs + every post
          tagged to that department or sub-department live one click away
          via /teams/:uuid and /teams/:uuid/sub/:slug. */}
      <section className="container" style={{ padding: '0 var(--page-px) clamp(44px, 8vw, 72px)' }}>
        <div style={{ marginBottom: 22 }}>
          <h2 className="h-display" data-toc data-toc-title="Org chart" style={{ fontSize: 'clamp(32px, 5vw, 64px)', margin: 0, lineHeight: 0.95 }}>
            how it <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--welfare-ink)' }}>fits together</span>.
          </h2>
          <p style={{ fontFamily: 'var(--eina)', fontSize: 15, color: 'var(--ink-2)', marginTop: 10, maxWidth: 560 }}>
            Tap a department to see its members, its HoDs and every post it's put out. Departments with sub-teams show them underneath — tap one to open its own page.
          </p>
        </div>
        <OrgChart />
      </section>

      {/* ── CTA ── */}
      {/* FROZEN: this copy is duplicated verbatim in public/JoinPromoPage.tsx
          (section 27) so the two screens cannot drift. Changing a string here
          desyncs the promo - change both or neither. */}
      <section className="container" style={{ padding: '0 var(--page-px) 64px' }}>
        <div className="ab-cta">
          <div className="ab-cta-grid" aria-hidden />
          <div className="ab-cta-inner">
            <span className="ab-pill ab-pill-welfare ab-pill-r-3">★ free. always.</span>
            <h2 className="h-display" data-toc data-toc-title="Join us" style={{ fontSize: 'clamp(40px, 7vw, 80px)', margin: '16px 0', lineHeight: 0.9 }}>
              come <span style={{ fontStyle: 'italic', fontFamily: 'var(--serif)', fontWeight: 400, color: 'var(--welfare)' }}>build</span> with us.{/* accent-lint-ok: on the ink outro slab — --welfare 4.55:1 there, --welfare-ink 3.20:1 */}
            </h2>
            <p style={{ fontSize: 15, color: 'color-mix(in srgb, var(--paper) 70%, transparent)', maxWidth: 520, margin: '0 auto 24px', lineHeight: 1.6 }}>2 minutes to apply. Usually replies {APPROVAL_TIME}. zero rupees. forever.</p>
            <button className="btn btn-lg btn-primary" onClick={() => { setAuthIntent({ kind: 'apply' }); navigate('/login') }}>
              <I.rocket /> START YOUR APPLICATION
            </button>
          </div>
        </div>
      </section>

    </div>
  )
}
