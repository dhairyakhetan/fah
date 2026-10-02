import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '../router.jsx';
import { CloseIcon, PhotoIcon } from './Icons.jsx';
import { Clip } from './Tapes.jsx';
import { MEMBERS, TEAMS, teamsOf } from '../data/team.js';
import { articlesBy, byLink } from '../lib/byWriter.js';
import { firstName, instagramUrl } from '../lib/format.js';
import { webZoom } from '../lib/layoutMode.js';
import { usePauseOffscreen } from '../lib/pauseOffscreen.js';
import { useDialogA11y } from '../lib/useDialogA11y.js';
import { usePresence } from '../lib/usePresence.js';
import { faceSpots, profileTop, teamLinks, useFaceColors } from '../lib/teamLayout.js';
import { FONT } from '../styles/fonts.js';

// "Meet the team" (id="members"), both layouts: every member's face (data/team.js) floating in a honeycomb, dotted
// lines joining each team, a legend that highlights one team, and a profile card
// that opens level with a tapped face (bio, what their team made, their articles, Instagram, optional badge / crown).
// PHONE and WEB hold each layout's positions and sizes; the section's height grows with the number of members.
const PHONE = {
  faces: { rows: [[72, 196, 318], [134, 256]], sizes: [92, 80, 98, 84, 88, 96, 82, 90], nudgeX: [-6, 5, -3, 8, -8, 4, 2, -5, 7], nudgeY: [0, 16, -10, 8, 20, -6, 12, -14, 4, 18, -4], top: 510, rowH: 176 },
  width: 390, top: 2470, bend: 18, line: [1.2, '3 5'], header: 64,
  rule: { left: "20px", width: "350px" },
  title: { left: "18px", top: "22px", fontSize: "46px", lineHeight: "0.92", letterSpacing: "-1px" },
  count: { right: "20px", top: "30px", fontSize: "9px", letterSpacing: "1.6px", lineHeight: "1.6" },
  blurb: { left: "20px", top: "136px", width: "340px", fontSize: "15px", lineHeight: "1.5" },
  note: { left: "22px", top: "270px", width: "250px", fontSize: "21px" },
  legend: { left: "16px", top: "340px", width: "142px", gap: "4px" }, chip: { minHeight: "32px", padding: "0 10px 0 6px", gap: "8px", fontSize: "9.5px", letterSpacing: "1.2px" }, dot: "12px",
  face: { half: 58, gap: "8px", shadow: "6px 5px 0", icon: 20, font: "11px", name: "12px", role: "8.5px", roleSpacing: "1px", roleGap: "3px", pad: "2px 6px", bump: "transform .12s ease" },
  dim: "rgba(17,17,17,.55)",
  card: { width: 334, shadow: "8px 8px 0", padding: "18px", clip: [34, 10, "-7px"], close: { right: "10px", top: "10px" }, photo: "96px", name: "30px", role: "20px", bio: "14px", credit: "13px" },
};
const WEB = {
  faces: { rows: [[650, 820, 990, 1160, 1330], [735, 905, 1075, 1245]], sizes: [112, 98, 120, 104, 108, 116, 100, 110, 96], nudgeX: [-10, 8, -4, 12, -8, 5, 3, -12, 9, -6], nudgeY: [0, 22, -14, 10, 28, -8, 16, -18, 6, 24, -4], top: 120, rowH: 205 },
  width: 1440, top: 2570, bend: 24, line: [1.3, '3 6'], header: 80,
  rule: { left: "80px", width: "1280px" },
  title: { left: "78px", top: "36px", fontSize: "72px", lineHeight: "0.9", letterSpacing: "-1.5px" },
  count: { left: "1080px", top: "30px", width: "280px", fontSize: "11px", letterSpacing: "1.8px" },
  blurb: { left: "80px", top: "200px", width: "440px", fontSize: "17px", lineHeight: "1.55" },
  note: { left: "82px", top: "360px", width: "400px", fontSize: "27px" },
  legend: { left: "78px", top: "440px", width: "220px", gap: "6px" }, chip: { minHeight: "40px", padding: "0 14px 0 8px", gap: "10px", fontSize: "11px", letterSpacing: "1.4px" }, dot: "14px",
  face: { half: 66, gap: "10px", shadow: "8px 6px 0", icon: 22, font: "13px", name: "15px", role: "10px", roleSpacing: "1.2px", roleGap: "4px", pad: "2px 8px", bump: "transform 180ms cubic-bezier(0.32, 0.72, 0, 1)" },
  dim: "rgba(17,17,17,.35)",
  card: { width: 360, shadow: "9px 9px 0", padding: "22px", clip: [36, 11, "-8px"], close: { right: "12px", top: "12px" }, photo: "108px", name: "34px", role: "23px", bio: "15px", credit: "14px" },
};
const layoutOf = (L) => {
  const spots = faceSpots(L.faces), bottom = Math.max(...spots.map((s) => s.cy + s.size / 2));
  const height = L === PHONE ? bottom + 64 : Math.max(900, bottom + 110);
  return { ...L, spots, links: teamLinks(spots, L.bend), height };
};
const LAYOUT = { phone: layoutOf(PHONE), web: layoutOf(WEB) };
export const TEAM_HEIGHT = { phone: LAYOUT.phone.height, web: LAYOUT.web.height }; // the home pages grow with it

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const photoFill = { width: "100%", height: "100%", objectFit: "cover", display: "block" };

// crown: true in data/team.js → a crown on their photo in the profile card
const Crown = () => (
  <svg width="44" height="34" viewBox="0 0 44 34" aria-hidden="true" style={{ position: "absolute", left: "-12px", top: "-18px", transform: "rotate(-22deg)", zIndex: "1" }}>
    <path d="M4 28 L2 8 L13 17 L22 3 L31 17 L42 8 L40 28 Z" fill="#F7C21A" stroke="#111111" strokeWidth="2.4" strokeLinejoin="round" />
    <path d="M4 28 H40" stroke="#111111" strokeWidth="2.4" />
    <circle cx="22" cy="21" r="2.6" fill="#F0442B" stroke="#111111" strokeWidth="1.4" /><circle cx="12" cy="23" r="1.8" fill="#3DA5F4" stroke="#111111" strokeWidth="1.2" /><circle cx="32" cy="23" r="1.8" fill="#3DA5F4" stroke="#111111" strokeWidth="1.2" />
  </svg>
);

// badge: { img, text } in data/team.js → a small picture in the card's corner; its text slides out on hover / tap
// (styles/motion.css .card-badge). The pictures are fetched and decoded once, early, so they're there when a card opens.
const Badge = ({ b }) => (
  <button type="button" className="card-badge" aria-label={b.text}>
    <span>{b.text}</span>
    <img src={b.img} alt="" width="24" height="24" decoding="sync" />
  </button>
);
const badges = [];
const preloadBadges = () => { if (!badges.length) MEMBERS.filter((m) => m.badge).forEach((m) => { const i = new Image(); i.src = m.badge.img; i.decode?.().catch(() => {}); badges.push(i); }); };

export default function TeamSection({ web }) {
  const L = LAYOUT[web ? 'web' : 'phone'], S = L.spots, H = L.height;
  useEffect(preloadBadges, []);
  const self = useRef(null);
  usePauseOffscreen(self);
  const [team, setTeam] = useState(null); // legend filter; null = everyone
  const { colorFor, fade } = useFaceColors(team);
  const [open, setOpen] = useState(null); // index of the member whose profile is open
  const [shown, leaving] = usePresence(open, 170);
  const card = useRef(null);
  // the card's spot, measured before it's painted: level with the face, as central on screen as it can be; on web
  // beside the face, on the side nearer the page's middle when it fits
  const [cardAt, setCardAt] = useState(null);
  useLayoutEffect(() => {
    if (open == null || !card.current) return;
    const s = S[open], top = profileTop({ section: self.current, header: L.header, cy: s.cy, height: card.current.offsetHeight, zoom: webZoom() });
    if (!web) { setCardAt({ left: 28, top }); return; }
    const W = L.card.width, gap = s.size / 2 + 28, sides = [s.cx + gap, s.cx - gap - W], fits = sides.filter((x) => x >= 16 && x + W <= 1424);
    setCardAt({ left: Math.round((fits.length ? fits : sides).sort((a, b) => Math.abs(a + W / 2 - 720) - Math.abs(b + W / 2 - 720))[0]), top });
  }, [open]);
  const count = NUMBER_WORDS[MEMBERS.length] || String(MEMBERS.length);
  const sel = shown != null ? MEMBERS[shown] : null, spot = sel && S[shown], color = sel ? colorFor(sel) : '#111111';
  const fallback = spot && (web
    ? { left: spot.cx < 1000 ? Math.round(spot.cx + spot.size / 2 + 28) : Math.round(spot.cx - spot.size / 2 - 28 - L.card.width), top: Math.max(20, Math.min(Math.round(spot.cy - 150), H - 530)) }
    : { left: 28, top: Math.max(120, Math.min(spot.cy - spot.size / 2 - 60, H - 540)) });
  const at = cardAt || fallback, C = L.card, F = L.face;
  const close = () => setOpen(null);
  useDialogA11y(sel != null && !leaving, card, close, 'button[aria-label="Close profile"]');
  const btn = web ? 'btn' : undefined;

  return (
    <section ref={self} id="members" style={{ position: "absolute", left: "0", top: `${L.top}px`, width: `${L.width}px`, height: `${H}px` }}>
      <div style={{ position: "absolute", top: "0", height: "2px", background: "#111111", ...L.rule }} />
      <h2 style={{ position: "absolute", margin: "0", fontFamily: FONT.head, fontWeight: "400", textTransform: "uppercase", color: "#111111", ...L.title }}>Meet<br />the team</h2>
      <div style={{ position: "absolute", textAlign: "right", fontFamily: FONT.mono, color: "#111111", ...L.count }}>{web ? `${count.toUpperCase()} OF US · CLICK A FACE` : <>{count.toUpperCase()} OF US<br />TAP A FACE</>}</div>
      <p style={{ position: "absolute", margin: "0", color: "#1E2723", ...L.blurb }}>one magazine, a meeting every Friday, {count} people who are all doing something else the rest of the week. writing writes the articles, design made this site's look and layout, tech built it, and the heads keep everyone on track.</p>
      <div style={{ position: "absolute", fontFamily: FONT.hand, lineHeight: "1.1", color: "#5B3A1E", transform: "rotate(-2deg)", ...L.note }}>nobody here is a professional. that is the point.</div>
      <svg width={L.width} height={H} viewBox={`0 0 ${L.width} ${H}`} style={{ position: "absolute", left: "0", top: "0", pointerEvents: "none" }} aria-hidden="true" fill="none" strokeWidth={L.line[0]} strokeDasharray={L.line[1]} strokeLinecap="round">
        {L.links.map((l) => <path key={l.team} d={l.d} stroke={TEAMS[l.team].color} opacity={team == null ? 0.55 : team === l.team ? 0.95 : 0.12} style={{ transition: "opacity .25s" }} />)}
      </svg>
      {/* legend: pick a team to fade everyone else */}
      <div style={{ position: "absolute", display: "flex", flexDirection: "column", ...L.legend }}>
        {Object.entries(TEAMS).map(([key, t]) => {
          const on = team === key;
          return (
            <button key={key} className="legend-chip" onClick={() => setTeam(on ? null : key)} aria-pressed={on ? 'true' : 'false'} style={{ width: "100%", display: "flex", alignItems: "center", background: on ? '#111111' : 'transparent', color: on ? '#FFFFFF' : '#111111', border: `1.5px solid ${on ? '#111111' : 'transparent'}`, borderRadius: "999px", fontFamily: FONT.mono, fontWeight: "700", textTransform: "uppercase", textAlign: "left", ...L.chip }}>
              <span style={{ width: L.dot, height: L.dot, flexShrink: "0", borderRadius: "50%", background: t.color, border: "1.5px solid #111111", boxSizing: "border-box" }} />
              <span style={{ flexGrow: "1" }}>{t.label}</span>
              <span>{MEMBERS.filter((m) => teamsOf(m).includes(key)).length}</span>
            </button>
          );
        })}
      </div>
      {/* faces: photo in a circle ringed by the team colour, name and role underneath */}
      {S.map((s, i) => {
        const m = MEMBERS[i];
        return (
          <div key={m.name} className={web ? `${s.float} face` : s.float} style={{ position: "absolute", left: `${s.cx - F.half}px`, top: `${s.cy - s.size / 2}px`, width: `${F.half * 2}px`, display: "flex", flexDirection: "column", alignItems: "center", gap: F.gap, opacity: team == null || teamsOf(m).includes(team) ? 1 : 0.18, transition: "opacity .25s" }}>
            <button className="bub" onClick={() => setOpen(i)} aria-label={`${m.name}, ${m.role} — open profile`} style={{ width: `${s.size}px`, height: `${s.size}px`, padding: "0", borderRadius: "50%", border: "2px solid #111111", background: "#F2F1ED", boxShadow: `${F.shadow} ${colorFor(m)}`, transition: `box-shadow ${fade} ease, ${F.bump}`, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: web ? "4px" : "3px", fontSize: F.font, color: "#444" }}>
              {m.photo ? <img src={m.photo} alt="" loading="lazy" decoding="async" width="400" height="400" style={photoFill} /> : <><PhotoIcon size={F.icon} /><span>{firstName(m.name).toLowerCase()}</span></>}
            </button>
            <div style={{ textAlign: "center", lineHeight: "1.1", padding: F.pad, background: "#F3EEE4" }}>
              <div style={{ fontFamily: FONT.head, fontSize: F.name, textTransform: "uppercase", color: "#111111" }}>{m.name}</div>
              {/* the role hides while the legend picks a team (they'd all say the same) */}
              {team == null && <div className="fade-in" style={{ marginTop: F.roleGap, fontFamily: FONT.mono, fontSize: F.role, letterSpacing: F.roleSpacing, textTransform: "uppercase", color: "#4A4A45" }}>{m.role}</div>}
            </div>
          </div>
        );
      })}
      {/* profile card over a dimmed section */}
      {sel && (
        <>
          <button className={leaving ? 'fade-out' : 'fade-in'} onClick={close} aria-label="Close profile" style={{ position: "absolute", left: "0", top: "0", width: `${L.width}px`, height: `${H}px`, border: "0", padding: "0", background: L.dim, cursor: web ? "default" : undefined }} />
          <div ref={card} className={leaving ? 'card-lift' : 'card-drop'} role="dialog" aria-modal="true" aria-label={`${sel.name} — profile`} style={{ position: "absolute", left: `${at.left}px`, top: `${at.top}px`, width: `${C.width}px`, boxSizing: "border-box", background: "#FFFFFF", border: "2px solid #111111", boxShadow: `${C.shadow} ${color}`, padding: C.padding, display: "flex", flexDirection: "column", gap: "12px", transform: "rotate(-1deg)" }}>
            {sel.badge && <Badge b={sel.badge} />}
            <Clip color={color} w={C.clip[0]} h={C.clip[1]} top={C.clip[2]} />
            <button className={web ? 'btn' : 'press'} onClick={close} aria-label="Close profile" style={{ "--c": "#111111", position: "absolute", ...C.close, width: "44px", height: "44px", background: "#FFFFFF", border: "2px solid #111111", boxShadow: "3px 3px 0 #111111", padding: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CloseIcon size={16} />
            </button>
            <div style={{ position: "relative", alignSelf: "flex-start" }}>
              {sel.crown && <Crown />}
              <div style={{ width: C.photo, height: C.photo, borderRadius: "50%", border: "2px solid #111111", background: "#F2F1ED", boxShadow: `6px 5px 0 ${color}`, display: "flex", alignItems: "center", justifyContent: "center", overflow: sel.photo ? "hidden" : undefined }}>
                {sel.photo ? <img src={sel.photo} alt={sel.name} style={photoFill} /> : <PhotoIcon size={22} />}
              </div>
            </div>
            <div style={{ fontFamily: FONT.head, fontSize: C.name, lineHeight: "0.95", textTransform: "uppercase", color: "#111111" }}>{sel.name}</div>
            <div style={{ fontFamily: FONT.hand, fontSize: C.role, lineHeight: "1.1", color: "#5B3A1E" }}>{sel.role}</div>
            <p style={{ margin: "0", fontSize: C.bio, lineHeight: "1.5", color: "#333333" }}>{sel.bio || '[Two lines about them: where they work from, what they write or shoot, what they care about.]'}</p>
            {/* what each of their teams made (their own `credit` line instead, if they have one) */}
            {teamsOf(sel).map((t) => {
              const credit = sel.credit || TEAMS[t].credit;
              return <p key={t} style={{ margin: "0", paddingLeft: "10px", borderLeft: `3px solid ${TEAMS[t].color}`, fontSize: C.credit, lineHeight: "1.45", color: "#1E2723" }}><strong style={{ fontWeight: "600" }}>{TEAMS[t].label}</strong>{` — ${credit[0].toLowerCase()}${credit.slice(1)}.`}</p>;
            })}
            <div style={{ display: "flex", gap: "10px" }}>
              {articlesBy(sel.name).length > 0 && <Link className={btn} to={byLink(sel.name)} onClick={web ? close : undefined} style={{ minHeight: "44px", flexGrow: "1", display: "flex", alignItems: "center", justifyContent: "center", background: "#111111", color: "#FFFFFF", border: "2px solid #111111", fontFamily: FONT.mono, fontWeight: "700", fontSize: "11px", letterSpacing: "1px", textDecoration: "none" }}>THEIR ARTICLES</Link>}
              {sel.instagram && <a className={btn} href={instagramUrl(sel.instagram)} target="_blank" rel="noreferrer" style={{ minHeight: "44px", padding: "0 14px", display: "flex", alignItems: "center", background: "#FFFFFF", color: "#111111", border: "2px solid #111111", boxShadow: "3px 3px 0 #111111", fontFamily: FONT.mono, fontWeight: "700", fontSize: "11px", letterSpacing: "1px", textDecoration: "none" }}><span style={{ fontFamily: FONT.body, fontWeight: "700", fontSize: "13px", letterSpacing: "0", marginRight: "1px" }}>@</span>{`${sel.instagram} ↗`}</a>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
