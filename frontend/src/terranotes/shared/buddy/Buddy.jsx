import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from '../../router.jsx';
import Ghost from './Ghost.jsx';
import { callBuddy, openGames, useBuddy } from '../../lib/buddyState.js';
import { FONT } from '../../styles/fonts.js';

// Buddy, a little green ghost (an easter egg). Called from a hidden button in the web home page's top-right corner
// (it peeks out now and then while the pointer is near; he's lowered on a rope) or from "click me" at the bottom of
// the phone menu (he floats in beside the intro card). He stays until a reload (lib/buddyState.js).
// Tap him: a random trick (spin, hop, flip, vanish, boo, wobble) and "wanna play?" → Snake or Float (BuddyGames.jsx).
// Animations: styles/buddy.css.
const TRICKS = ['spin', 'hop', 'flip', 'vanish', 'boo', 'wobble'];
const MONO = { fontFamily: FONT.mono, fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" };

function TapGhost({ size, bubbleStyle }) {
  const [trick, setTrick] = useState(null);
  const [ask, setAsk] = useState(false);
  const box = useRef(null);
  const last = useRef(null);
  useEffect(() => {
    if (!ask) return undefined;
    const out = (e) => { if (!e.composedPath().includes(box.current)) setAsk(false); };
    const esc = (e) => { if (e.key === 'Escape') setAsk(false); };
    addEventListener('pointerdown', out); addEventListener('keydown', esc);
    return () => { removeEventListener('pointerdown', out); removeEventListener('keydown', esc); };
  }, [ask]);
  const tap = () => {
    let t; do t = TRICKS[Math.floor(Math.random() * TRICKS.length)]; while (t === last.current);
    last.current = t;
    setTrick(null); requestAnimationFrame(() => setTrick(t)); // restart even if it's mid-trick
    setAsk((a) => !a);
  };
  const play = (g) => { setAsk(false); openGames(g); };
  return (
    <div ref={box} style={{ position: "relative" }}>
      <button className="buddy-ghost" onClick={tap} aria-label="Buddy the ghost: tap him" aria-expanded={ask ? 'true' : 'false'}>
        <span className={trick ? `buddy-trick buddy-${trick}` : 'buddy-trick'} onAnimationEnd={() => setTrick(null)}>
          <Ghost size={size} face={trick === 'boo' ? 'boo' : 'happy'} />
        </span>
      </button>
      {ask && (
        <div className="card-drop buddy-bubble" style={{ position: "absolute", zIndex: "8", width: "164px", boxSizing: "border-box", background: "#FFFFFF", border: "2px solid #111111", boxShadow: "4px 4px 0 #7B5CE6", padding: "8px 10px 10px", ...bubbleStyle }}>
          <div style={{ fontFamily: FONT.hand, fontSize: "22px", lineHeight: "1", color: "#111111" }}>wanna play?</div>
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {[['snake', 'Snake'], ['float', 'Float']].map(([g, label]) => (
              <button key={g} className="press" onClick={() => play(g)} style={{ "--c": "#111111", ...MONO, flex: "1", fontSize: "10px", minHeight: "36px", padding: "0", background: g === 'snake' ? '#7FC49B' : '#3DA5F4', color: "#111111", border: "2px solid #111111", boxShadow: "2px 2px 0 #111111" }}>{label}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// The hidden call button. Invisible until the pointer comes into the area around it (within 120px), where it fades
// in; and while the pointer is anywhere near this corner (220px) he peeks out every 6.5 seconds, so it can be found.
function CallButton() {
  const btn = useRef(null);
  const [peek, setPeek] = useState(false);
  const [shown, setShown] = useState(false); // the pointer is in the area around it
  useEffect(() => {
    let near = false, first = 0, every = 0, off = 0;
    const show = () => { setPeek(true); clearTimeout(off); off = setTimeout(() => setPeek(false), 1800); };
    const move = (e) => {
      const b = btn.current?.getBoundingClientRect(); if (!b) return;
      const d = Math.hypot(e.clientX - (b.left + b.width / 2), e.clientY - (b.top + b.height / 2));
      setShown(d < 120);
      const now = d < 220;
      if (now === near) return;
      near = now;
      clearTimeout(first); clearInterval(every);
      if (near) { first = setTimeout(show, 1200); every = setInterval(show, 6500); }
    };
    addEventListener('pointermove', move);
    return () => { removeEventListener('pointermove', move); clearTimeout(first); clearInterval(every); clearTimeout(off); };
  }, []);
  return (
    <div style={{ position: "absolute", left: "1240px", top: "88px", width: "150px", height: "36px", zIndex: "6" }}>
      <button ref={btn} className={`buddy-call${shown ? ' buddy-near' : peek ? ' buddy-peek' : ''}`} onClick={callBuddy} aria-label="Call buddy?" style={{ position: "absolute", right: "0", top: "0" }}>
        <Ghost size={22} />
      </button>
      <span className="buddy-call-label" aria-hidden="true">Call buddy?</span>
    </div>
  );
}

// Web home, top right, under the Website / Instagram buttons.
export function WebBuddy() {
  const { here, fresh } = useBuddy();
  const [rope, setRope] = useState(true); // the rope lowers him, then pulls back up and leaves him floating
  return (
    <>
      {!here && <CallButton />}
      {here && (
        <div className={fresh ? 'buddy-arrive' : undefined} style={{ position: "absolute", left: "1296px", top: "80px", width: "64px", zIndex: "6" }}>
          {fresh && rope && <div className="buddy-line" onAnimationEnd={() => setRope(false)} style={{ position: "absolute", left: "31px", top: "0", width: "2px", height: "114px", background: "#8E7A5E" }} />}
          <div className="buddy-hang" style={{ paddingTop: "108px" }}>
            <div className="buddy-bob">
              <TapGhost size={64} bubbleStyle={{ right: "0", top: "84px" }} />
            </div>
            <div className={fresh ? 'buddy-note buddy-note-late' : 'buddy-note'} style={{ position: "absolute", right: "74px", top: "118px", fontFamily: FONT.hand, fontSize: "21px", color: "#5B3A1E", transform: "rotate(-6deg)", whiteSpace: "nowrap", pointerEvents: "none" }}>tap him →</div>
          </div>
        </div>
      )}
    </>
  );
}

// Phone home: he floats next to the intro card.
export function PhoneBuddy() {
  const { here, fresh } = useBuddy();
  // The phone menu's "click me" (MenuCall) is the handoff's only way to call him, and that menu's header is hidden inside
  // AQ's page, so a small visible ghost button stands where he floats and calls him (44px: a touch target).
  if (!here) {
    return (
      <div style={{ position: "absolute", left: "312px", top: "176px", width: "44px", height: "44px", zIndex: "5" }}>
        <button className="buddy-call buddy-near" onClick={callBuddy} aria-label="Call buddy the ghost" style={{ width: "44px", height: "44px" }}>
          <Ghost size={24} />
        </button>
      </div>
    );
  }
  return (
    <div className={fresh ? 'buddy-float-in' : undefined} style={{ position: "absolute", left: "298px", top: "170px", width: "70px", zIndex: "5" }}>
      <div style={{ fontFamily: FONT.hand, fontSize: "18px", color: "#5B3A1E", transform: "rotate(6deg)", whiteSpace: "nowrap", pointerEvents: "none", textAlign: "center", marginBottom: "4px" }}>tap him</div>
      <div className="buddy-bob" style={{ display: "flex", justifyContent: "center" }}>
        <TapGhost size={46} bubbleStyle={{ right: "0", top: "60px" }} />
      </div>
    </div>
  );
}

// Phone menu, at the bottom under "TerraNotes": "click me". Calls him, closes the menu and heads home.
export function MenuCall({ onClose }) {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const go = () => {
    callBuddy();
    onClose?.();
    if (pathname !== '/') nav('/');
    setTimeout(() => scrollTo({ top: 0, behavior: 'smooth' }), 60);
  };
  return (
    <button className="buddy-menu-call" onClick={go} aria-label="Call buddy the ghost">
      <Ghost size={20} />
      <span>click me</span>
    </button>
  );
}
