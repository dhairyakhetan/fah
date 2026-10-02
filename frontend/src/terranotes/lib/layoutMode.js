import { useEffect, useState } from 'react';

// Which layout draws the page: windows 900px+ wide get the 1440px web layout (src/web/), everything narrower the
// 390px phone layout (src/phone/; phones are pinned to 390px by the viewport tag in index.html).
// Sets <html data-layout="web|phone"> and, on web, --web-zoom: the scale the 1440px page is drawn at (CSS zoom, web.css).
const WEB = '(min-width: 900px)';
// body, not <html>: with scrollbar-gutter the root's clientWidth still counts the scrollbar's strip
const fit = () => document.documentElement.style.setProperty('--web-zoom', String(Math.min(1, document.body.clientWidth / 1440)));
const apply = (web) => {
  document.documentElement.dataset.layout = web ? 'web' : 'phone';
  if (web) fit(); else document.documentElement.style.removeProperty('--web-zoom');
};

export function useIsWeb() {
  // applied during the first render, so the first jump to a section already has the right header offset
  const [web, setWeb] = useState(() => { const w = matchMedia(WEB).matches; apply(w); return w; });
  useEffect(() => {
    const m = matchMedia(WEB), on = () => { apply(m.matches); setWeb(m.matches); };
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  useEffect(() => {
    if (!web) return undefined;
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [web]);
  return web;
}

export const webZoom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--web-zoom')) || 1;
