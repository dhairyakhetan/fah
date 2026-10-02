import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from '../router.jsx';
import { LatestTag } from '../shared/Tapes.jsx';
import { EDITIONS, LATEST, editionById, editionLink, editionName } from '../data/editions.js';
import { FONT } from '../styles/fonts.js';

// The web header's "Edition 01 · Sep 2026 [LATEST] ▾" button: opens a list of every edition (newest first) and a
// link to /editions. Shows the edition of the page you're on (/sep26…, else the latest). Esc / outside click closes.
const MONO = { fontFamily: FONT.mono, fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" };

export default function WebEditionPicker() {
  const [open, setOpen] = useState(false);
  const here = editionById(useLocation().pathname.split('/')[1])?.number ?? LATEST;
  const box = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const out = (e) => { if (!e.composedPath().includes(box.current)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    addEventListener('pointerdown', out); addEventListener('keydown', esc);
    return () => { removeEventListener('pointerdown', out); removeEventListener('keydown', esc); };
  }, [open]);
  const cur = EDITIONS.find((e) => e.number === here) || EDITIONS[EDITIONS.length - 1];
  return (
    <div ref={box} style={{ position: "relative" }}>
      <button className="edition-btn" onClick={() => setOpen(!open)} aria-expanded={open ? 'true' : 'false'} aria-haspopup="true" aria-label={`${editionName(cur.number)}, ${cur.month}${cur.number === LATEST ? ', latest' : ''}. Choose an edition`}
        style={{ ...MONO, fontSize: "11px", minHeight: "40px", display: "flex", alignItems: "center", gap: "8px", padding: "0 12px", background: "#FFFFFF", color: "#111111", border: "2px solid #111111", boxShadow: "3px 3px 0 #111111", cursor: "pointer" }}>
        <span>{`${editionName(cur.number)} · ${cur.month.replace(/^(\w{3})\w*/, '$1')}`}</span>
        {cur.number === LATEST && <LatestTag />}
        <svg width="10" height="7" viewBox="0 0 10 7" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}><path d="M1 1 L5 5 L9 1" /></svg>
      </button>
      {open && (
        <div className="card-drop" role="menu" style={{ position: "absolute", left: "0", top: "calc(100% + 10px)", zIndex: "60", width: "280px", boxSizing: "border-box", background: "#FFFFFF", border: "2px solid #111111", boxShadow: "6px 6px 0 #111111", padding: "8px" }}>
          <div style={{ ...MONO, fontSize: "9.5px", color: "#6B665C", padding: "6px 8px" }}>Editions</div>
          {[...EDITIONS].reverse().map((e) => (
            <Link key={e.number} role="menuitem" to={editionLink(e.number)} onClick={() => setOpen(false)} aria-current={e.number === here ? 'true' : undefined}
              style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "44px", padding: "0 8px", textDecoration: "none", color: "#111111", background: e.number === here ? "#F3EEE4" : "transparent" }}>
              <span style={{ fontFamily: FONT.head, fontSize: "15px", textTransform: "uppercase" }}>{editionName(e.number)}</span>
              <span style={{ fontFamily: FONT.hand, fontSize: "19px", color: "#5B3A1E", flexGrow: "1" }}>{e.month}</span>
              {e.number === LATEST && <LatestTag />}
            </Link>
          ))}
          {EDITIONS.length === 1 && <div style={{ padding: "6px 8px 8px", fontFamily: FONT.hand, fontSize: "18px", color: "#8E7A5E" }}>no previous editions yet: this is the first one.</div>}
          <Link role="menuitem" to="/editions" onClick={() => setOpen(false)} style={{ ...MONO, fontSize: "10px", display: "flex", alignItems: "center", minHeight: "40px", padding: "0 8px", borderTop: "1.5px solid #111111", marginTop: "4px", textDecoration: "none", color: "#111111" }}>All editions →</Link>
        </div>
      )}
    </div>
  );
}
