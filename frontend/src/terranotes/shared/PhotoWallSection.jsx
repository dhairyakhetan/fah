import { useRef } from 'react';
import { PHOTOS } from '../data/photos.js';
import { usePauseOffscreen } from '../lib/pauseOffscreen.js';
import { fitFrame, usePhotoShapes } from '../lib/photoShapes.js';
import { FONT } from '../styles/fonts.js';

// "Photo wall" (id="photos"), both layouts: a dark rounded panel with two strings of fairy lights and the 5 PHOTOS
// (data/photos.js) pegged up as polaroids, each framed at its photo's own shape. Tap / click one → onOpen(index) opens
// the full-screen viewer (shared/PhotoViewer.jsx). Lights (.bulb), sparkles (.spark), a polaroid's occasional turn on
// its peg (.twist, phone only) and its glint (.glint) are CSS loops in styles/loops.css, paused when scrolled away.
// Bulbs: [x, y, flicker class, big]; sparks: [x, y, size, classes]; spots: where PHOTOS[i] hangs (r = tilt,
// dur / delay = its glint's clock; phone: slot width and placeholder height too).
const PHONE = {
  section: { left: "10px", top: "1190px", width: "370px", height: "600px", borderRadius: "28px" },
  title: { left: "22px", top: "24px", fontSize: "30px" }, tagline: { left: "190px", top: "30px", fontSize: "20px" },
  strings: { view: "10 0 370 600", width: 370, height: 600, stroke: 1.2, paths: ['M-10 90 Q95 170 200 100 Q300 40 400 120', 'M-10 330 Q120 420 250 360 Q330 320 400 370'] },
  shift: 10, bulb: [30, 7.2], bigBulb: [38, 8.4],
  bulbs: [[25, 112.5, 'fk1'], [95, 132.5], [130, 130, 'fk2'], [165, 119], [233, 84, 'fk3'], [266, 76], [333, 82, 'fk4'], [366, 97], [33, 356, 'fk2'], [77, 373, 'fk1'], [163, 383], [207, 376, 'fk3', true], [276, 349], [352, 347, 'fk4'], [376, 356]],
  sparks: [[130, 130, 9, 'sp1'], [266, 76, 8, 'sp2'], [207, 376, 11, 'sp3'], [352, 347, 8, 'sp1 sp-late'], [25, 112.5, 7, 'sp2 sp-late']],
  spots: [
    { left: 2, top: 134, slot: 116, empty: 96, r: -5, dur: 11, delay: -2, ink: '#EDE9DD' },
    { left: 132, top: 104, slot: 116, empty: 96, r: 3.5, dur: 13, delay: -7, ink: '#EDE9DD' },
    { left: 250, top: 82, slot: 116, empty: 96, r: -2.5, dur: 12, delay: -4.5, ink: '#F3EEE4' },
    { left: 50, top: 388, slot: 128, empty: 108, r: 3, dur: 14, delay: -10, ink: '#F3EEE4' },
    { left: 234, top: 348, slot: 120, empty: 100, r: -4, dur: 10.5, delay: -0.5, ink: '#EDE9DD' },
  ],
  frame: { mat: 18, maxH: 118, minW: 86 }, peg: { marginLeft: "-4.5px", top: "-10px", width: "9px", height: "18px", borderRadius: "2px" },
  print: { padding: "7px 7px 0", boxShadow: "5px 5px 0 #E9A23B" }, emptyFont: "11px", caption: { fontSize: "16px", padding: "4px 0 6px" },
};
const WEB = {
  section: { left: "40px", top: "1090px", width: "1360px", height: "760px", borderRadius: "36px" },
  title: { left: "48px", top: "40px", fontSize: "56px" }, tagline: { left: "330px", top: "56px", fontSize: "28px" },
  strings: { view: "0 0 1360 760", width: 1360, height: 760, stroke: 1.4, paths: ['M-10 150 Q560 290 1380 130', 'M-10 430 Q700 560 1380 420'] },
  shift: 0, bulb: [34, 8],
  bulbs: [[42, 162, 'fk1'], [96, 173], [150, 183, 'fk3'], [206, 191], [262, 198], [320, 204, 'fk2'], [378, 209], [438, 212, 'fk1'], [498, 214], [560, 215, 'fk3'], [622, 215], [686, 213], [751, 211, 'fk2'], [817, 207], [883, 201, 'fk1'], [951, 195], [1020, 187, 'fk3'], [1090, 178], [1161, 168], [1233, 157, 'fk2'], [1306, 144], [54, 441], [119, 451, 'fk4'], [183, 460], [247, 468, 'fk2'], [311, 475], [375, 481], [439, 485, 'fk1'], [502, 489], [566, 491, 'fk4'], [629, 492], [692, 492, 'fk2'], [756, 491], [819, 489], [881, 486, 'fk1'], [944, 482], [1007, 476, 'fk4'], [1069, 470], [1132, 462, 'fk2'], [1194, 453], [1256, 443], [1318, 432, 'fk1']],
  sparks: [[262, 198, 10, 'sp1'], [817, 207, 10, 'sp2'], [502, 489, 10, 'sp3'], [1069, 470, 10, 'sp1 sp-late'], [1233, 157, 10, 'sp2 sp-late']],
  spots: [
    { left: 145, top: 205, slot: 210, empty: 170, r: -4, dur: 11, delay: -2, ink: '#EDE9DD' },
    { left: 585, top: 221, slot: 210, empty: 170, r: 3, dur: 13, delay: -7, ink: '#EDE9DD' },
    { left: 1025, top: 181, slot: 210, empty: 170, r: -2.5, dur: 12, delay: -4.5, ink: '#EDE9DD' },
    { left: 335, top: 493, slot: 210, empty: 170, r: 3, dur: 14, delay: -10, ink: '#EDE9DD' },
    { left: 795, top: 493, slot: 210, empty: 170, r: -3.5, dur: 10.5, delay: -0.5, ink: '#EDE9DD' },
  ],
  frame: { mat: 22, maxW: 188, maxH: 172, minW: 140 }, peg: { marginLeft: "-6px", top: "-12px", width: "12px", height: "22px", border: "1.5px solid #111111", boxSizing: "border-box", zIndex: "2" },
  print: { padding: "9px 9px 0", border: "2px solid #111111", boxShadow: "6px 6px 0 #E9A23B" }, emptyFont: "12px", caption: { fontSize: "20px", padding: "6px 0 8px", color: "#111111" },
};

const Arrow = ({ w, h }) => <svg width={w} height={h} viewBox="0 0 34 22" fill="none" stroke="#F7C21A" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" style={{ flexShrink: "0" }}><path d="M2 19 C10 18 22 14 30 4" /><path d="M24 4 L30 4 L30 10" /></svg>;

export default function PhotoWallSection({ web, onOpen }) {
  const L = web ? WEB : PHONE;
  const shapes = usePhotoShapes(0.2, 5);
  const self = useRef(null);
  usePauseOffscreen(self);
  return (
    <section ref={self} id="photos" style={{ position: "absolute", background: "#1C2622", overflow: "hidden", ...L.section }}>
      <div style={{ position: "absolute", fontFamily: FONT.serif, color: "#F3EEE4", lineHeight: "1", ...L.title }}>Photo wall</div>
      <div style={{ position: "absolute", fontFamily: FONT.hand, color: "#E9A23B", transform: "rotate(-4deg)", ...L.tagline }}>moments, strung up</div>
      <svg width={L.strings.width} height={L.strings.height} viewBox={L.strings.view} style={{ position: "absolute", left: "0", top: "0" }} aria-hidden="true">
        <g stroke="#8E8A7A" strokeWidth={L.strings.stroke} fill="none">{L.strings.paths.map((d) => <path key={d} d={d} />)}</g>
      </svg>
      {L.bulbs.map(([x, y, fk, big], i) => {
        const [d, core] = big ? L.bigBulb : L.bulb;
        return <span key={i} className={fk ? `bulb ${fk}` : 'bulb'} style={{ left: `${x - L.shift - d / 2}px`, top: `${y - d / 2}px`, width: `${d}px`, height: `${d}px`, "--core": `${core}px` }} aria-hidden="true" />;
      })}
      {L.sparks.map(([x, y, s, cls], i) => <span key={i} className={`spark ${cls}`} style={{ left: `${x - L.shift - s}px`, top: `${y - s}px`, width: `${s * 2}px`, height: `${s * 2}px` }} aria-hidden="true" />)}
      {L.spots.map((s, i) => {
        const p = PHOTOS[i];
        if (!p) return null;
        const f = fitFrame(p.photo && shapes[i], L.frame.maxW ?? s.slot - L.frame.mat, L.frame.maxH, L.frame.minW), fw = f.w + L.frame.mat;
        return (
          <figure key={i} className="twist" style={{ position: "absolute", left: `${s.left + (s.slot - fw) / 2}px`, top: `${s.top}px`, width: `${fw}px`, margin: "0", "--r": `${s.r}deg`, transform: `rotate(${s.r}deg)`, transformOrigin: "50% 0", animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }}>
            <div style={{ position: "absolute", left: "50%", background: "#C9A57A", ...L.peg }} />
            <div style={{ background: "#FFFFFF", border: "2px solid #111111", ...L.print }}>
              <div style={{ position: "relative", overflow: "hidden", height: p.photo ? `${f.h}px` : `${s.empty}px`, background: p.tint, display: "flex", alignItems: "center", justifyContent: "center", fontSize: L.emptyFont, color: s.ink }}>
                {p.photo ? <img src={p.photo} alt={p.caption} style={{ position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover" }} /> : '[photo]'}
                <div className="glint" style={{ animationDuration: `${s.dur}s`, animationDelay: `${s.delay}s` }} />
              </div>
              <figcaption style={{ fontFamily: FONT.hand, textAlign: "center", ...L.caption }}>{p.caption || '[caption]'}</figcaption>
            </div>
            <button className="ph-open" onClick={() => onOpen(i)} aria-label={`Open photo ${i + 1} of ${PHOTOS.length}`} style={{ position: "absolute", left: "0", top: "0", width: "100%", height: "100%", padding: "0", background: "transparent", border: "0" }} />
          </figure>
        );
      })}
      {/* a handwritten nudge: the photos open */}
      {web
        ? <div style={{ position: "absolute", left: "1130px", top: "500px", width: "220px", fontFamily: FONT.hand, fontSize: "30px", lineHeight: "1.05", color: "#F3EEE4", transform: "rotate(-4deg)", pointerEvents: "none" }}>click a photo to see it up close<div style={{ marginTop: "6px" }}><Arrow w={48} h={30} /></div></div>
        : <div style={{ position: "absolute", right: "18px", bottom: "16px", width: "178px", display: "flex", alignItems: "flex-end", gap: "6px", fontFamily: FONT.hand, fontSize: "22px", lineHeight: "1", color: "#F3EEE4", transform: "rotate(-3deg)", pointerEvents: "none" }}>tap a photo to see it up close<Arrow w={34} h={22} /></div>}
    </section>
  );
}
