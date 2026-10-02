import { openGames } from '../lib/buddyState.js';
import { FONT } from '../styles/fonts.js';

// The last thing on the home pages: Snake, one tap away, without having to call Buddy first. It opens the same games
// popup Buddy does (shared/buddy/BuddyGames.jsx, event 'aq-games'). The whole card is the button (one 44px+ target).
// `web` is the 1440 artboard, otherwise the 390 phone one; `top` is where it sits on that artboard.
export const SNAKE_CARD_SPACE = { web: 360, phone: 330 }; // how much taller the home page gets to make room for it

const MONO = { fontFamily: FONT.mono, fontWeight: "700", letterSpacing: "1.4px", textTransform: "uppercase" };

// a little pixel snake going after a star (decoration; the card's label carries the meaning)
function Art({ width }) {
  const cell = 14, body = [[1, 4], [2, 4], [3, 4], [3, 3], [3, 2], [4, 2], [5, 2]];
  return (
    <svg width={width} height={width * 0.62} viewBox="0 0 150 93" role="img" aria-hidden="true" style={{ display: "block", flexShrink: "0" }}>
      <rect x="0" y="0" width="150" height="93" rx="6" fill="#1E2723" />
      {body.map(([cx, cy], i) => <rect key={i} x={cx * cell + 6} y={cy * cell + 3} width={cell - 2} height={cell - 2} rx="3" fill={i === body.length - 1 ? '#7FC49B' : '#4E9C74'} />)}
      <circle cx={5 * cell + 6 + 9} cy={2 * cell + 3 + 4} r="1.6" fill="#111111" />
      <path d="M118 24l3.2 8 8.4.8-6.4 5.6 2 8.4-7.2-4.4-7.2 4.4 2-8.4-6.4-5.6 8.4-.8z" fill="#F7C21A" transform="translate(-4 -6)" />
    </svg>
  );
}

export default function SnakeCard({ web, top }) {
  const play = () => openGames('snake');
  const W = web ? 620 : 342;
  return (
    <div style={{ position: "absolute", left: `${(web ? 1440 : 390) / 2 - W / 2}px`, top: `${top}px`, width: `${W}px` }}>
      <button className={web ? 'btn' : 'press'} onClick={play} aria-label="Play Snake, a small game"
        style={{ "--c": "#111111", width: "100%", boxSizing: "border-box", display: "flex", alignItems: "center", gap: web ? "28px" : "16px", padding: web ? "22px 28px" : "16px", textAlign: "left", background: "#FFFFFF", border: "2px solid #111111", boxShadow: `${web ? 8 : 5}px ${web ? 8 : 5}px 0 #7B5CE6`, color: "#111111", transform: "rotate(-1deg)", minHeight: "44px" }}>
        <Art width={web ? 200 : 104} />
        <span style={{ display: "flex", flexDirection: "column", gap: web ? "8px" : "5px", minWidth: "0" }}>
          <span style={{ ...MONO, fontSize: web ? "12px" : "10px", color: "#5B4630" }}>mini game</span>
          <span style={{ fontFamily: FONT.head, fontSize: web ? "34px" : "22px", lineHeight: "0.95", textTransform: "uppercase" }}>Snake, but spooky</span>
          <span style={{ fontFamily: FONT.hand, fontSize: web ? "24px" : "19px", lineHeight: "1.05", color: "#5B3A1E" }}>eat the stars. don&rsquo;t eat yourself.</span>
          <span style={{ ...MONO, fontSize: web ? "13px" : "11px", marginTop: web ? "6px" : "2px" }}>play →</span>
        </span>
      </button>
    </div>
  );
}
