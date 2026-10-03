// Link-preview pictures for the articles: preview.jpg in each article's folder (public/terranotes/editions/<id>/articles/<slug>/),
// 1200×630 (the shape WhatsApp, Instagram, iMessage…
// show big). Drawn like the site: the whole cover, uncropped, on the left (white mount, hard shadow), hanging by a string
// from the top edge with a clip in the tag's colour; on the right the
// logo, the tag, the title big enough to read in a chat bubble, the dek and the byline. The build (scripts/terranotes/prerender.mjs, run by
// prerender-meta.mjs) copies each to a content-hashed name and points that article's page at it. public/terranotes/og/home.jpg (the home page's
// preview) is made by hand, not by this script.
// Run after adding an article or changing a cover:  node scripts/terranotes/tools/make-link-previews.mjs   (needs Playwright:
// npm i -D playwright; env CHROMIUM = a browser to use, FONTS_DIR = serve the Google Fonts from a local folder)
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { ALL_ARTICLES, TAGS } from '../../../src/terranotes/data/articles.js';
import { articleFolder, editionName } from '../../../src/terranotes/data/editions.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..') // frontend/;
const pub = (f) => path.join(root, 'public', f);
const data = (f, type) => `data:${type};base64,${fs.readFileSync(pub(f)).toString('base64')}`;
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONTS = 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Caveat:wght@600&family=Instrument+Serif:ital@1&family=Space+Mono:wght@700&display=block';

const page = (a, coverSrc, w, h) => {
  const tag = TAGS[a.tag] || { color: '#F7C21A', ink: '#111111' };
  const ch = 530, cw = Math.min(530, Math.round((w / h) * ch)), cht = Math.round((h / w) * cw), top = Math.round((630 - cht - 30) / 2) + 16;
  return `<!doctype html><html><head><link rel="stylesheet" href="${FONTS}"><style>
  *{box-sizing:border-box} body{margin:0;width:1200px;height:630px;background:#F3EEE4;overflow:hidden;position:relative;font-family:'Space Mono',monospace}
  .rope{position:absolute;left:50%;bottom:100%;width:2.5px;height:${top + 40}px;margin-left:-1px;background:#5B3A1E}
  .cover{position:absolute;left:56px;top:${top}px;background:#fff;border:3px solid #111;box-shadow:12px 12px 0 #111;padding:12px;transform:rotate(-2deg)}
  .cover img{display:block;width:${cw}px;height:${cht}px;object-fit:cover}
  .peg{position:absolute;left:50%;top:-14px;width:44px;height:18px;margin-left:-22px;background:${tag.color};border:2.5px solid #111}
  .right{position:absolute;left:${56 + cw + 24 + 70}px;right:56px;top:64px;bottom:52px;display:flex;flex-direction:column}
  .logo{display:flex;align-items:center;gap:10px}
  .logo img.g{width:52px;height:52px} .logo img.w{height:30px;display:block} .logo span{font:italic 400 20px/1 'Instrument Serif',serif;color:#1E2723;display:block;margin-top:4px}
  .tag{align-self:flex-start;margin-top:34px;background:${tag.color};color:${tag.ink};border:2.5px solid #111;border-radius:999px;padding:6px 16px;font-size:18px;letter-spacing:2px;text-transform:uppercase}
  h1{margin:18px 0 0;font:400 64px/0.98 'Archivo Black',Impact,sans-serif;text-transform:uppercase;color:#111;letter-spacing:-1px}
  .dek{margin-top:16px;font:600 34px/1.05 'Caveat',cursive;color:#5B3A1E}
  .by{margin-top:auto;font-size:17px;letter-spacing:2px;text-transform:uppercase;color:#111}
  </style></head><body>
  <div class="cover"><div class="rope"></div><div class="peg"></div><img src="${coverSrc}"></div>
  <div class="right">
    <div class="logo"><img class="g" src="${data('terranotes/brand/aquaterra-globe.webp', 'image/webp')}"><div><img class="w" src="${data('terranotes/brand/aquaterra-wordmark.webp', 'image/webp')}"><span>TerraNotes</span></div></div>
    <div class="tag">${esc(a.tag)}</div>
    <h1 id="t">${esc(a.title)}</h1>
    <div class="dek">${esc(a.dek)}</div>
    <div class="by">${a.author ? `By ${esc(a.author)} · ` : ''}${editionName(a.edition)}</div>
  </div></body></html>`;
};

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
if (process.env.FONTS_DIR) { // offline: serve Google Fonts from a local folder (fonts.css + files named after their URL)
  const css = fs.readFileSync(path.join(process.env.FONTS_DIR, 'fonts.css'), 'utf8');
  await ctx.route(/fonts\.googleapis\.com/, (r) => r.fulfill({ body: css, contentType: 'text/css' }));
  await ctx.route(/fonts\.gstatic\.com/, (r) => r.fulfill({ path: path.join(process.env.FONTS_DIR, r.request().url().replace('https://fonts.gstatic.com/', '').replace(/\//g, '_')), contentType: 'font/woff2' }));
}
const p = await ctx.newPage();
for (const a of ALL_ARTICLES.filter((x) => x.cover)) {
  const size = await p.evaluate((src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok([i.naturalWidth, i.naturalHeight]); i.src = src; }), data(a.cover.slice(1), 'image/jpeg'));
  await p.setContent(page(a, data(a.cover.slice(1), 'image/jpeg'), ...size), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  // the title shrinks until it fits in four lines
  await p.evaluate(() => { const t = document.getElementById('t'); let s = 64; while (t.getBoundingClientRect().height > s * 0.98 * 4 + 4 && s > 34) { s -= 2; t.style.fontSize = `${s}px`; } });
  const file = pub(`${articleFolder(a).slice(1)}/preview.jpg`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await p.screenshot({ path: file, type: 'jpeg', quality: 82 });
  console.log(articleFolder(a), Math.round(fs.statSync(file).size / 1024), 'KB');
}
await browser.close();
