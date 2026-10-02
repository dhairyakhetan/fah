import { useEffect, useRef, useState } from 'react';
import { CloseIcon, ChevronIcon } from '../Icons.jsx';
import { usePresence } from '../../lib/usePresence.js';
import { FONT } from '../../styles/fonts.js';
import { lockScroll, unlockScroll } from '../../lib/scrollLock.js';
import { drawGhost } from './Ghost.jsx';

// Buddy's games popup (mounted once in App.jsx; opened by openGames() in lib/buddyState.js, event 'aq-games').
// Two tabs, each a <canvas> game drawn every frame with requestAnimationFrame (only while the popup is open):
//   Snake: Buddy's head + a tail of wisps eating stars; arrows / WASD / swipe / the on-screen pad (keys light up while
//          held, big screens); it speeds up a little per star; only the Play again button restarts.
//   Float: flappy style; tap / click / space floats him up between the posts.
// Best scores in localStorage. Esc, ✕ or a click outside closes it.
const MONO = { fontFamily: FONT.mono, fontWeight: "700", letterSpacing: "1.2px", textTransform: "uppercase" };
const best = (k) => { try { return Number(localStorage.getItem(k)) || 0; } catch { return 0; } };
const keep = (k, v) => { try { localStorage.setItem(k, String(v)); } catch { /* private mode */ } };

// a canvas at the screen's pixel density; returns its 2d context drawing in CSS px
function setup(c, w, h) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  c.width = Math.round(w * dpr); c.height = Math.round(h * dpr);
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}
const card = (g, w, h, lines, shift = 0) => {
  g.fillStyle = 'rgba(17,17,17,.62)'; g.fillRect(0, 0, w, h);
  g.textAlign = 'center'; g.fillStyle = '#F3EEE4';
  lines.forEach(([text, font, y]) => { g.font = font; g.fillText(text, w / 2, h / 2 + y + shift); });
};

// ---------------------------------------------------------------- Snake
const DIRS = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0] };
function Snake({ W, small }) {
  const [held, setHeld] = useState(null); // big screens: the on-screen key lights up while its key is held
  const cv = useRef(null);
  const turn = useRef(null);
  const again = useRef(null);
  const [score, setScore] = useState(0);
  const [over, setOver] = useState(false);
  const [top, setTop] = useState(() => best('aq-snake-best'));
  useEffect(() => {
    const N = 15, C = W / N, g = setup(cv.current, W, W);
    let snake, dir, queue, food, state = 'ready', acc = 0, last = performance.now(), raf = 0, pts = 0;
    const free = () => { let f; do f = [Math.floor(Math.random() * N), Math.floor(Math.random() * N)]; while (snake.some(([x, y]) => x === f[0] && y === f[1])); return f; };
    const reset = () => { snake = [[7, 7], [6, 7], [5, 7]]; dir = [1, 0]; queue = []; food = free(); pts = 0; setScore(0); };
    reset();
    const steer = (d) => {
      if (state === 'over') return; // only the Play again button restarts, so the score stays up
      if (state === 'ready') state = 'playing';
      const prev = queue.length ? queue[queue.length - 1] : dir;
      if (d[0] === -prev[0] && d[1] === -prev[1]) return; // no turning back on yourself
      if (d[0] !== prev[0] || d[1] !== prev[1]) queue.push(d);
    };
    turn.current = steer;
    again.current = () => { reset(); state = 'ready'; setOver(false); };
    const tick = () => {
      if (queue.length) dir = queue.shift();
      const head = [snake[0][0] + dir[0], snake[0][1] + dir[1]];
      const hit = head[0] < 0 || head[1] < 0 || head[0] >= N || head[1] >= N || snake.some(([x, y], i) => i < snake.length - 1 && x === head[0] && y === head[1]);
      if (hit) { state = 'over'; setOver(true); if (pts > best('aq-snake-best')) { keep('aq-snake-best', pts); setTop(pts); } return; }
      snake.unshift(head);
      if (head[0] === food[0] && head[1] === food[1]) { pts++; setScore(pts); food = free(); } else snake.pop();
    };
    const draw = (t) => {
      g.fillStyle = '#F3EEE4'; g.fillRect(0, 0, W, W);
      g.fillStyle = '#E6E0D3';
      for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) { g.beginPath(); g.arc((x + 0.5) * C, (y + 0.5) * C, 1.3, 0, Math.PI * 2); g.fill(); }
      // food: a little yellow star, twinkling
      const [fx, fy] = food, s = C * (0.34 + Math.sin(t / 180) * 0.04);
      g.save(); g.translate((fx + 0.5) * C, (fy + 0.5) * C); g.rotate(t / 900); g.beginPath();
      for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.45 : s; g.lineTo(Math.cos((i * Math.PI) / 5) * r, Math.sin((i * Math.PI) / 5) * r); }
      g.closePath(); g.fillStyle = '#F7C21A'; g.fill(); g.strokeStyle = '#111111'; g.lineWidth = 1.5; g.stroke(); g.restore();
      // tail: wisps that get smaller and fainter
      for (let i = snake.length - 1; i > 0; i--) {
        const [x, y] = snake[i], k = 1 - i / (snake.length + 2);
        g.globalAlpha = 0.3 + 0.6 * k; g.fillStyle = '#1E7A4C';
        g.beginPath(); g.arc((x + 0.5) * C, (y + 0.5) * C, C * (0.24 + 0.16 * k), 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      const [hx, hy] = snake[0];
      drawGhost(g, (hx + 0.5) * C, (hy + 0.42) * C, C * 0.38, { look: dir, t: t / 1000, face: state === 'over' ? 'boo' : 'happy' });
      if (state === 'ready') card(g, W, W, [['SNAKE, BUT SPOOKY', `700 ${Math.round(W / 16)}px 'Space Mono', monospace`, -8], ['arrows, WASD or swipe to start', `${Math.round(W / 14)}px Caveat, cursive`, 24]]);
      if (state === 'over') card(g, W, W, [[`BOO. ${pts} ${pts === 1 ? 'STAR' : 'STARS'}`, `700 ${Math.round(W / 14)}px 'Space Mono', monospace`, -8], [`best ${Math.max(pts, best('aq-snake-best'))}`, `${Math.round(W / 14)}px Caveat, cursive`, 22]], -30);
    };
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      const step = Math.max(120, 230 - pts * 4); // ms per move: gentle at first, a little quicker with every star
      if (state === 'playing') { acc += t - last; while (acc >= step && state === 'playing') { acc -= step; tick(); } } else acc = 0;
      last = t; draw(t);
    };
    raf = requestAnimationFrame(loop);
    const key = (e) => { const d = DIRS[e.key] || DIRS[e.key.toLowerCase?.()]; if (d) { e.preventDefault(); setHeld(d.join()); steer(d); } };
    const lift = (e) => { const d = DIRS[e.key] || DIRS[e.key.toLowerCase?.()]; if (d) setHeld((h) => (h === d.join() ? null : h)); };
    addEventListener('keyup', lift);
    addEventListener('keydown', key);
    // swipes
    let sx = null, sy = null;
    const c = cv.current;
    const down = (e) => { sx = e.clientX; sy = e.clientY; };
    const up = (e) => {
      if (sx == null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) { if (state !== 'playing') steer(dir); return; }
      steer(Math.abs(dx) > Math.abs(dy) ? [Math.sign(dx), 0] : [0, Math.sign(dy)]);
    };
    c.addEventListener('pointerdown', down); c.addEventListener('pointerup', up);
    return () => { cancelAnimationFrame(raf); removeEventListener('keydown', key); removeEventListener('keyup', lift); c.removeEventListener('pointerdown', down); c.removeEventListener('pointerup', up); };
  }, [W]);
  const pad = (label, d, dir) => {
    const on = !small && held === d.join();
    return (
      <button className="press" aria-label={label} onClick={() => turn.current?.(d)} style={{ "--c": "#111111", width: "52px", height: "44px", padding: "0", background: on ? "#F7C21A" : "#FFFFFF", border: "2px solid #111111", boxShadow: on ? "1px 1px 0 #111111" : "3px 3px 0 #111111", transform: on ? "translate(2px, 2px)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ChevronIcon dir={dir} size={18} />
      </button>
    );
  };
  return (
    <>
      <Scores score={score} top={top} unit="stars" />
      <div style={{ position: "relative" }}>
        <canvas ref={cv} style={{ display: "block", width: `${W}px`, height: `${W}px`, border: "2px solid #111111", touchAction: "none" }} />
        {over && (
          <button className="press card-drop" onClick={() => again.current?.()} style={{ "--c": "#111111", ...MONO, position: "absolute", left: "50%", top: "58%", marginLeft: "-70px", width: "140px", minHeight: "44px", fontSize: "12px", background: "#F7C21A", color: "#111111", border: "2px solid #111111", boxShadow: "4px 4px 0 #111111" }}>Play again</button>
        )}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 52px)", gap: "6px", justifyContent: "center", marginTop: "12px" }}>
        <span />{pad('Up', [0, -1], 'up')}<span />
        {pad('Left', [-1, 0], 'left')}{pad('Down', [0, 1], 'down')}{pad('Right', [1, 0], 'right')}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Float
const POSTS = ['#F0442B', '#3DA5F4', '#F7C21A', '#7FC49B', '#7B5CE6', '#EE4E8A'];
function Float({ W, H }) {
  const cv = useRef(null);
  const tap = useRef(null);
  const [score, setScore] = useState(0);
  const [top, setTop] = useState(() => best('aq-float-best'));
  useEffect(() => {
    const g = setup(cv.current, W, H);
    const R = W / 24, X = W * 0.3, GAP = H * 0.33, PW = W * 0.13, SPEED = W * 0.36, EVERY = 1.55;
    let s, raf = 0, last = performance.now(), t = 0;
    const reset = () => { s = { y: H * 0.45, vy: 0, lift: 0, posts: [], until: 0.6, pts: 0, state: 'ready', puffs: [], squash: 0 }; setScore(0); };
    reset();
    const flap = () => {
      if (s.state === 'over') { if (s.wait > 0) return; reset(); }
      if (s.state === 'ready') s.state = 'playing';
      s.lift = 1; s.squash = 1;
      for (let i = 0; i < 6; i++) s.puffs.push({ x: X - R * 0.4 + Math.random() * R * 0.8, y: s.y + R * 1.6, vx: (Math.random() - 0.5) * 40 - 30, vy: 20 + Math.random() * 40, life: 1, r: R * (0.18 + Math.random() * 0.2) });
    };
    tap.current = flap;
    const end = () => { s.state = 'over'; s.wait = 0.6; if (s.pts > best('aq-float-best')) { keep('aq-float-best', s.pts); setTop(s.pts); } };
    const update = (dt) => {
      s.squash = Math.max(0, s.squash - dt * 5);
      s.puffs.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt * 1.8; });
      s.puffs = s.puffs.filter((p) => p.life > 0);
      if (s.state === 'ready') { s.y = H * 0.45 + Math.sin(t * 2.4) * R * 0.6; return; }
      if (s.state === 'over') { s.wait -= dt; if (s.y < H - R * 1.2) { s.vy = Math.min(s.vy + 900 * dt, 420); s.y += s.vy * dt; } return; }
      // floaty: gentle gravity; a tap eases him up rather than kicking him
      if (s.lift > 0) { s.vy += (-H * 0.62 - s.vy) * Math.min(1, dt * 16); s.lift -= dt * 5.5; } else s.vy = Math.min(s.vy + H * 1.5 * dt, H * 0.75);
      s.y += s.vy * dt;
      s.until -= dt;
      if (s.until <= 0) { s.until = EVERY; const gy = H * 0.2 + Math.random() * (H * 0.6 - GAP * 0.5); s.posts.push({ x: W + PW, gy, c: POSTS[Math.floor(Math.random() * POSTS.length)], passed: false }); }
      s.posts.forEach((p) => { p.x -= SPEED * dt; if (!p.passed && p.x + PW < X - R) { p.passed = true; s.pts++; setScore(s.pts); } });
      s.posts = s.posts.filter((p) => p.x > -PW * 2);
      if (s.y - R < 0 || s.y + R * 1.5 > H) end();
      for (const p of s.posts) {
        const inX = X + R * 0.85 > p.x && X - R * 0.85 < p.x + PW;
        if (inX && (s.y - R * 0.9 < p.gy - GAP / 2 || s.y + R * 1.4 > p.gy + GAP / 2)) end();
      }
    };
    const draw = () => {
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#F3EEE4'); sky.addColorStop(1, '#E6E0D3');
      g.fillStyle = sky; g.fillRect(0, 0, W, H);
      // a far-off wire, for home
      g.strokeStyle = 'rgba(91,58,30,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, H * 0.14); g.quadraticCurveTo(W / 2, H * 0.2, W, H * 0.13); g.stroke();
      for (const p of s.posts) {
        for (const [y0, y1, cap] of [[-4, p.gy - GAP / 2, p.gy - GAP / 2 - 14], [p.gy + GAP / 2, H + 4, p.gy + GAP / 2]]) {
          g.fillStyle = '#1E2723'; g.fillRect(p.x, y0, PW, y1 - y0);
          g.fillStyle = p.c; g.strokeStyle = '#111111'; g.lineWidth = 2; g.fillRect(p.x - 5, cap, PW + 10, 14); g.strokeRect(p.x - 5, cap, PW + 10, 14);
        }
      }
      s.puffs.forEach((p) => { g.globalAlpha = Math.max(0, p.life) * 0.8; g.fillStyle = '#FBF8F1'; g.strokeStyle = 'rgba(17,17,17,.4)'; g.lineWidth = 1; g.beginPath(); g.arc(p.x, p.y, p.r, 0, Math.PI * 2); g.fill(); g.stroke(); });
      g.globalAlpha = 1;
      const tilt = Math.max(-0.35, Math.min(0.5, s.vy / (H * 1.6)));
      drawGhost(g, X, s.y, R, { t, tilt, look: [1, s.vy > 0 ? 0.6 : -0.4], face: s.state === 'over' ? 'boo' : 'happy', sx: 1 + s.squash * 0.14, sy: 1 - s.squash * 0.12 });
      g.textAlign = 'center'; g.fillStyle = '#111111'; g.font = `700 ${Math.round(W / 9)}px 'Archivo Black', Impact, sans-serif`;
      if (s.state === 'playing') g.fillText(String(s.pts), W / 2, H * 0.12);
      if (s.state === 'ready') card(g, W, H, [['FLOAT', `700 ${Math.round(W / 11)}px 'Space Mono', monospace`, -10], ['tap, click or space to float up', `${Math.round(W / 15)}px Caveat, cursive`, 26]]);
      if (s.state === 'over') card(g, W, H, [[`BOO. ${s.pts} ${s.pts === 1 ? 'POST' : 'POSTS'}`, `700 ${Math.round(W / 13)}px 'Space Mono', monospace`, -10], ['tap to float again', `${Math.round(W / 15)}px Caveat, cursive`, 26]]);
    };
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.034, (now - last) / 1000); last = now; t += dt;
      update(dt); draw();
    };
    raf = requestAnimationFrame(loop);
    const c = cv.current;
    const down = (e) => { e.preventDefault(); flap(); };
    const key = (e) => { if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); flap(); } };
    c.addEventListener('pointerdown', down); addEventListener('keydown', key);
    return () => { cancelAnimationFrame(raf); c.removeEventListener('pointerdown', down); removeEventListener('keydown', key); };
  }, [W, H]);
  return (
    <>
      <Scores score={score} top={top} unit="posts" />
      <canvas ref={cv} aria-label="Float: tap to float up" style={{ display: "block", width: `${W}px`, height: `${H}px`, border: "2px solid #111111", touchAction: "none", cursor: "pointer" }} />
    </>
  );
}

function Scores({ score, top, unit }) {
  return (
    <div style={{ ...MONO, display: "flex", justifyContent: "space-between", fontSize: "10.5px", margin: "0 0 8px" }}>
      <span>{`${score} ${unit}`}</span><span style={{ color: "#6B665C" }}>{`best ${top}`}</span>
    </div>
  );
}

// The popup. Esc, the ✕ or a click outside closes it (it lifts away).
export default function BuddyGames() {
  const [game, setGame] = useState(null);
  const [shown, leaving] = usePresence(game, 200);
  useEffect(() => {
    const on = (e) => setGame(e.detail || 'snake');
    addEventListener('aq-games', on);
    return () => removeEventListener('aq-games', on);
  }, []);
  useEffect(() => {
    if (!game) return undefined;
    lockScroll();
    const esc = (e) => { if (e.key === 'Escape') setGame(null); };
    addEventListener('keydown', esc);
    return () => { unlockScroll(); removeEventListener('keydown', esc); };
  }, [game]);
  if (!shown) return null;
  const small = window.innerWidth < 600 || document.documentElement.dataset.layout === 'phone';
  const W = small ? 290 : 400, H = small ? 360 : 460;
  const tab = (id, label) => (
    <button onClick={() => setGame(id)} aria-pressed={shown === id ? 'true' : 'false'} style={{ ...MONO, fontSize: "11px", minHeight: "40px", padding: "0 14px", border: "2px solid #111111", background: shown === id ? '#111111' : '#FFFFFF', color: shown === id ? '#F3EEE4' : '#111111', cursor: "pointer" }}>{label}</button>
  );
  return (
    <div className={leaving ? 'fade-out' : 'fade-in'} onClick={(e) => { if (e.target === e.currentTarget) setGame(null); }} style={{ position: "fixed", inset: "0", zIndex: "900", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(17,17,17,.55)", padding: "12px" }}>
      <div className={leaving ? 'card-lift' : 'card-drop'} role="dialog" aria-label="Buddy's games" style={{ position: "relative", boxSizing: "border-box", background: "#FBF8F1", border: "2px solid #111111", boxShadow: "8px 8px 0 #7B5CE6", padding: small ? "14px" : "20px", transform: "rotate(-0.6deg)", maxHeight: "calc(100dvh - 24px)", overflowY: "auto" }}>
        <div className="no-cascade" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
          {tab('snake', 'Snake')}{tab('float', 'Float')}
          <span style={{ flexGrow: "1", fontFamily: FONT.hand, fontSize: "20px", color: "#5B3A1E", textAlign: "right", paddingRight: "8px" }}>{shown === 'snake' ? 'eat the stars' : 'mind the posts'}</span>
          <button className="press" onClick={() => setGame(null)} aria-label="Close the games" style={{ "--c": "#111111", width: "40px", height: "40px", flexShrink: "0", padding: "0", background: "#FFFFFF", border: "2px solid #111111", boxShadow: "3px 3px 0 #111111", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CloseIcon size={14} weight={2.8} />
          </button>
        </div>
        <div className="no-cascade" key={shown}>{shown === 'snake' ? <Snake W={W} small={small} /> : <Float W={W} H={H} />}</div>
      </div>
    </div>
  );
}
