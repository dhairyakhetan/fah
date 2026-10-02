import { useEffect, useRef, useState } from 'react';
import { ARTICLES } from '../data/articles.js';
import { PHOTOS } from '../data/photos.js';
import { introSeen } from '../lib/introNotebook.js';
import { calm } from '../lib/motion.js';

// The opening animation (when: lib/introNotebook.js), over the site while it loads underneath: a notebook slides in
// spinning, opens on the Aquaterra logo, "TerraNotes" is written in, a CERTIFIED stamp thumps down, and it lifts away
// after 4.3 s (1.8 s with reduced motion). Skip button, Enter or Space ends it early. Meanwhile the covers and photos start
// downloading. All timings: styles/intro.css.
const PLAY = 4300, REDUCED = 1800, LEAVE = 450;

export default function IntroNotebook() {
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);
  const skip = useRef(null);

  const leave = () => setLeaving(true);

  useEffect(() => {
    introSeen();
    // fetch what the pages will need while the notebook plays
    for (const src of ['/terranotes/brand/aquaterra-globe.webp', '/terranotes/brand/aquaterra-wordmark.webp', ...ARTICLES.map((a) => a.cover), ...PHOTOS.map((p) => p.photo)].filter(Boolean)) {
      const img = new Image();
      img.src = src;
    }
    const root = document.documentElement, was = root.style.overflow;
    root.style.overflow = 'hidden'; // no scrolling the page behind it
    skip.current?.focus({ preventScroll: true });
    const t = setTimeout(leave, calm() ? REDUCED : PLAY);
    const onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); leave(); } };
    addEventListener('keydown', onKey);
    return () => { clearTimeout(t); removeEventListener('keydown', onKey); root.style.overflow = was; };
  }, []);

  useEffect(() => {
    if (!leaving) return undefined;
    document.documentElement.style.overflow = '';
    const t = setTimeout(() => setGone(true), LEAVE);
    return () => clearTimeout(t);
  }, [leaving]);

  if (gone) return null;
  return (
    <div className={leaving ? 'intro intro-out' : 'intro'}>
      {/* rough edges and specks for the stamp's ink */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="aq-ink" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.4" result="rough" />
          <feComponentTransfer in="noise" result="specks"><feFuncA type="discrete" tableValues="0 0 0 0 0 0 0 0.9" /></feComponentTransfer>
          <feComposite in="rough" in2="specks" operator="out" />
        </filter>
      </svg>
      <div className="intro-stage" aria-hidden="true">
        <div className="nb">
          <div className="nb-thump">
            <div className="nb-book">
              {/* the first page, under the cover */}
              <div className="nb-page nb-right">
                <div className="nb-name">TerraNotes</div>
                <div className="nb-line">notes from where the land meets the water</div>
                <div className="nb-stamp">
                  <div className="nb-stamp-in">
                    <div className="nb-stamp-small">Aquaterra · Issue one</div>
                    <div className="nb-stamp-big">Certified</div>
                    <div className="nb-stamp-small">Field approved</div>
                  </div>
                </div>
              </div>
              {/* the cover: its outside, then (once it swings past halfway) its inside with the logo */}
              <div className="nb-cover">
                <div className="nb-face nb-front">
                  <img src="/terranotes/brand/aquaterra-globe.webp" alt="" className="nb-front-logo" />
                  <div className="nb-label">TerraNotes<span>issue 01</span></div>
                </div>
                <div className="nb-face nb-back">
                  <img src="/terranotes/brand/aquaterra-globe.webp" alt="" className="nb-logo" />
                  <div className="nb-word"><img className="nb-wordmark" src="/terranotes/brand/aquaterra-wordmark.webp" alt="Aquaterra" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <button ref={skip} className="intro-skip" onClick={leave}>Skip loading <span aria-hidden="true">→</span></button>
    </div>
  );
}
