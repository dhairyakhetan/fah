import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from '../router.jsx';
import BackHome from '../shared/BackHome.jsx';
import Logo from '../shared/Logo.jsx';
import { MenuIcon } from '../shared/Icons.jsx';
import PhoneMenu from './PhoneMenu.jsx';
import { calm } from '../lib/motion.js';
import { portalRoot } from '../lib/dom.js';
import { FONT } from '../styles/fonts.js';

// The phone's sticky 64px header, plus the slide-in menu it opens. Home: logo left, menu button right. Every other
// page: "back to home" left, a smaller logo, menu button. The page root must stay overflow: clip (not hidden) for
// sticky to work. current = which page this is (the menu marks it "you're here"); edge = the menu's edge colour.
// When the back link comes or goes from one page to the next, the logo glides (and grows or shrinks) from where it was
// (FLIP, transform only) and the back link slides in, like the web header.
const EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
let last = null; // the previous page's header: { home, box: the logo's place }

export const forgetPhoneHeader = () => { last = null; }; // leaving Terra Notes: the next visit's first page shouldn't glide from the last visit's

export default function PhoneHeader({ current, edge }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const home = current === 'home';
  const logo = useRef(null), back = useRef(null);
  useLayoutEffect(() => {
    const box = logo.current.getBoundingClientRect(), was = last;
    last = { home, box };
    if (!was || was.home === home || calm()) return;
    const s = was.box.width / box.width;
    logo.current.animate([{ transform: `translate(${was.box.left - box.left}px, ${was.box.top - box.top}px) scale(${s})` }, { transform: 'none' }], { duration: 560, delay: home ? 60 : 0, easing: EASE, fill: 'backwards' });
    back.current?.animate([{ opacity: 0, transform: 'translateX(-20px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 140, easing: EASE, fill: 'backwards' });
  }, [home]);
  return (
    <>
      <header className="site-header" style={{ position: "sticky", top: "0", zIndex: "50", width: "390px", height: "64px", boxSizing: "border-box", padding: home ? "0 10px 0 16px" : "0 10px 0 12px", background: "#F3EEE4", borderBottom: "2px solid #111111", display: "flex", alignItems: "center", gap: "4px" }}>
        {!home && (
          <BackHome ref={back} style={{ height: "44px", flexShrink: "0", display: "flex", alignItems: "center", gap: "6px", paddingRight: "6px", textDecoration: "none", color: "#111111", fontFamily: FONT.hand, fontSize: "21px", lineHeight: "1", whiteSpace: "nowrap" }}>
            <svg width="24" height="13" viewBox="0 0 30 12" fill="none" stroke="#111111" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M29 6 C20 8 12 4 2 6" /><path d="M7 2 L2 6 L7 10" /></svg>
            back to home
          </BackHome>
        )}
        {!home && <span style={{ flexGrow: "1" }} />}
        <Link ref={logo} to="/" aria-label="Aquaterra — home" style={{ display: "flex", alignItems: "center", gap: "6px", minHeight: "44px", textDecoration: "none", transformOrigin: "0 50%" }}>
          {home ? <Logo globe={38} word={22} sub={14} /> : <Logo globe={28} word={16} sub={10} />}
        </Link>
        {home && <span style={{ flexGrow: "1" }} />}
        <button onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen ? 'true' : 'false'} style={{ width: "44px", height: "44px", flexShrink: "0", border: "0", background: "transparent", padding: "0", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MenuIcon />
        </button>
      </header>
      {/* in <body>, outside the page: page styles (.page-home a …) must not reach it */}
      {createPortal(<PhoneMenu open={menuOpen} onClose={() => setMenuOpen(false)} current={current} edge={edge} />, portalRoot())}
    </>
  );
}
