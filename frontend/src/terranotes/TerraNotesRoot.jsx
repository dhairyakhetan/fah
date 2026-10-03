import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import TerraNotesApp, { loadLabs } from './TerraNotesApp.jsx';
import IntroNotebook from './shared/IntroNotebook.jsx';
import { introWanted } from './lib/introNotebook.js';
import { LITE } from './lib/motion.js';
import { setRoot, clearRoot } from './lib/dom.js';
import { forgetWebHeader } from './web/WebHeader.jsx';
import { forgetPhoneHeader } from './phone/PhoneHeader.jsx';
import './styles/document.css';
import base from './styles/base.css?inline';
import loops from './styles/loops.css?inline';
import motion from './styles/motion.css?inline';
import phone from './styles/phone.css?inline';
import web from './styles/web.css?inline';
import intro from './styles/intro.css?inline';
import buddy from './styles/buddy.css?inline';

// TerraNotes inside AQ. AQ's stylesheet is global and opinionated (`body{font-family … !important}`, heading sizes,
// `p{line-height}`, focus rings, `html{scroll-behavior:smooth}`), and the handoff's design leans on browser defaults plus
// inline styles, so sharing one document would bend it. So the whole section draws inside a shadow root: nothing in AQ's CSS
// reaches in, nothing in the handoff's CSS leaks out. The one thing a shadow root can't hold is document-level CSS
// (@font-face, <html> rules, the ::view-transition tree): styles/document.css, loaded with this chunk and keyed on
// html.tn-on so it does nothing while another page shows.
// The host is `all: initial`, so nothing inherits across the boundary (AQ's body font, size, colour, line-height).
const SHEETS = [base, loops, motion, phone, web, intro, buddy]; // the Labs gallery brings its own (articles/labs/LabsPage.jsx)
// text-size-adjust is reset by `all: initial` too; the handoff's base.css sets it on <html> so phones don't enlarge the text on their own
const HOST_STYLE = { all: 'initial', display: 'block', position: 'relative', minHeight: '100vh', background: '#F3EEE4', WebkitTextSizeAdjust: '100%', textSizeAdjust: '100%' };

// Phones (and upright tablets) are pinned to the 390px layout by the viewport tag; the handoff's index.html did this for
// its whole site, here it is on only while TerraNotes shows, and AQ's own tag comes back after. Desktop browsers ignore it.
function pinViewport() {
  const meta = document.querySelector('meta[name="viewport"]');
  if (!meta) return () => {};
  const was = meta.content;
  const tablet = Math.min(screen.width, screen.height) >= 700;
  const land = matchMedia('(orientation: landscape)');
  const fit = () => { meta.content = tablet && land.matches ? 'width=device-width, initial-scale=1' : 'width=390'; };
  fit();
  if (tablet) land.addEventListener('change', fit);
  return () => { land.removeEventListener('change', fit); meta.content = was; };
}

export default function TerraNotesRoot() {
  const [parts, setParts] = useState(null); // { app, portals }: the two containers inside the shadow root
  const [showIntro] = useState(() => introWanted()); // decided once, before the first paint
  const shadowRef = useRef(null);

  const hostRef = useCallback((el) => {
    if (!el) return;
    const shadow = el.shadowRoot || el.attachShadow({ mode: 'open' });
    let app = shadow.querySelector('.tn-app'), portals = shadow.querySelector('.tn-portals');
    if (!app) {
      for (const css of SHEETS) shadow.appendChild(Object.assign(document.createElement('style'), { textContent: css }));
      app = Object.assign(document.createElement('div'), { className: 'tn-body tn-app' });
      portals = Object.assign(document.createElement('div'), { className: 'tn-body tn-portals' });
      shadow.append(app, portals);
    }
    shadowRef.current = shadow;
    setRoot(shadow, el, portals);
    setParts({ app, portals });
  }, []);

  useLayoutEffect(() => {
    const html = document.documentElement;
    html.classList.add('tn-on');
    if (LITE) html.classList.add('tn-lite');
    const unpin = pinViewport();
    const warm = setTimeout(() => loadLabs().catch(() => {}), 2500); // so opening AQ Labs from a card doesn't wait on its chunk
    return () => {
      clearTimeout(warm);
      unpin();
      html.classList.remove('tn-on', 'tn-lite');
      html.dataset.tnLeft = ''; // AQ's page fades in (styles/document.css); cleared once it has
      setTimeout(() => { delete html.dataset.tnLeft; }, 320);
      html.style.removeProperty('--web-zoom');
      delete html.dataset.layout;
      delete html.dataset.tnNav;
      forgetWebHeader();
      forgetPhoneHeader();
      if (html.style.overflow === 'hidden') html.style.overflow = ''; // a pop-up or the opening animation may have been holding the scroll lock (anything else set there is AQ's)
    };
  }, []);

  useLayoutEffect(() => () => clearRoot(shadowRef.current), []);

  return (
    <>
      <div ref={hostRef} data-terranotes="" data-tn-host="" className={LITE ? 'tn-lite' : undefined} style={HOST_STYLE} />
      {parts && createPortal(<TerraNotesApp />, parts.app)}
      {parts && showIntro && createPortal(<IntroNotebook />, parts.portals)}
    </>
  );
}
