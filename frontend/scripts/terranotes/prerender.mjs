/**
 * TerraNotes' prerendered pages, sitemap entries and llms.txt.
 * ────────────────────────────────────────────────────────────────────────────
 * The handoff did this as a Vite plugin (build/siteFiles.js) against its own index.html. Inside AQ the same job is a
 * pass of scripts/prerender-meta.mjs, which owns dist/index.html and the head/body helpers, so this file only DECIDES
 * what to write; prerender-meta.mjs writes it. Everything comes from src/terranotes/data/ (never retyped here), so a
 * new article shows up in the prerender and the sitemap by itself.
 *
 *   terraNotesPages()  → [{ path, file, title, description, type, image, imageAlt, body, copy }]
 *   terraNotesLlms()   → { 'llms.txt': …, 'llms-full.txt': … } (written to dist/terranotes/)
 *
 * `path` is the real address (/terranotes/articles/exam-stress); `file` is where it goes in dist/ (…/exam-stress.html;
 * Vercel's cleanUrls serves it without .html, and a path with no file behind it falls through to the SPA).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ALL_ARTICLES as ARTICLES } from '../../src/terranotes/data/articles.js';
import { articleFolder, articleLink } from '../../src/terranotes/data/editions.js';
import { SITE } from '../../src/terranotes/data/site.js';
import { articleHtml, pageHtml, at } from './staticCopy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(HERE, '../../public');
export const TN_BASE = '/terranotes';

const cap = (c) => c.replace(/-/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase());
const TITLES = { '/': '', '/articles': 'All articles', '/photos': 'Photo wall', '/words': 'Words we should bring back', '/members': 'Meet the team', '/editions': 'Editions' };
const HOME_DESC = 'Terra Notes by AquaTerra: notes from where the land meets the water. Stories, research, fashion, photos and art, written by students in Kolkata.';

// the preview picture (1200×630, made by scripts/terranotes/tools/make-link-previews.mjs) under a content-hashed name, so
// chat apps, which cache previews for a long time, fetch a new picture whenever it changes
function previewFor(a) {
  const made = path.join(PUBLIC, articleFolder(a), 'preview.jpg');
  if (!fs.existsSync(made)) return { image: a.cover || '', copy: null, wide: false };
  const buf = fs.readFileSync(made);
  const name = `${articleFolder(a)}/preview-${crypto.createHash('md5').update(buf).digest('hex').slice(0, 8)}.jpg`;
  return { image: name, copy: { to: name.slice(1), buf }, wide: true };
}

export function terraNotesPages(origin = SITE.website) {
  const pages = [];
  for (const [p, name] of Object.entries(TITLES)) {
    pages.push({
      path: p === '/' ? TN_BASE : TN_BASE + p,
      file: p === '/' ? 'terranotes.html' : `terranotes${p}.html`,
      title: name ? `Aquaterra — ${name}` : 'Terra Notes | AquaTerra’s Monthly Digital Magazine',
      description: name ? `${name} · Terra Notes by AquaTerra.` : HOME_DESC,
      type: 'website', image: `${origin}/terranotes/og/home.jpg`, imageAlt: 'Terra Notes by AquaTerra', wide: true,
      label: name || 'Terra Notes',
      body: pageHtml[p](),
    });
  }
  for (const a of ARTICLES) {
    const desc = `${a.dek}${a.author ? ` — by ${a.author}` : ''}`;
    const pv = previewFor(a);
    const base = TN_BASE + articleLink(a);
    const one = (p, file, extra = {}) => pages.push({
      path: p, file, title: `Aquaterra — ${a.title}`, description: desc, type: 'article',
      image: pv.image.startsWith('http') ? pv.image : `${origin}${pv.image}`, imageAlt: a.alt || a.title, wide: pv.wide, label: a.title,
      body: articleHtml(a), copy: pv.copy, ...extra,
    });
    one(base, `${base.slice(1)}.html`);
    for (const c of a.chapters || []) one(`${base}/${c}`, `${base.slice(1)}/${c}.html`);
    // A demo opens in its own tab, so its page is a STANDALONE file: just the frame around the team's app. No AQ app boots
    // (no second Supabase client in a second tab, and AQ's one-tab hold screen can't get in the way). `html` is written as is.
    for (const c of Object.keys(a.demos || {})) {
      const name = `${cap(c)} · demo`;
      const src = `${articleFolder(a)}/${a.demos[c]}/`;
      pages.push({ path: `${base}/${c}/demo`, file: `${base.slice(1)}/${c}/demo.html`, standalone: true, html: `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<title>${name}</title>\n<meta name="robots" content="noindex">\n<style>html,body{margin:0;height:100%;background:#111111}iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#111111}</style>\n</head>\n<body>\n<iframe src="${src}" title="${cap(c)}, the demo" allow="autoplay; fullscreen"></iframe>\n</body>\n</html>\n` });
    }
  }
  return pages;
}

// sitemap: the pages a person would link to (chapters and demos are sections of an article; the article carries them)
export const terraNotesSitemapPaths = () => [
  ...Object.keys(TITLES).map((p) => (p === '/' ? TN_BASE : TN_BASE + p)),
  ...ARTICLES.map((a) => TN_BASE + articleLink(a)),
  ...ARTICLES.flatMap((a) => (a.chapters || []).map((c) => `${TN_BASE}${articleLink(a)}/${c}`)),
];

export function terraNotesLlms(origin) {
  const url = (p) => `${origin}${p}`;
  const line = (a) => `${a.dek}${a.author ? ` (by ${a.author}` : ' ('}${a.date ? `${a.author ? ', ' : ''}${a.date}` : ''}, ${a.readTime} min read)`;
  const intro = ['# Terra Notes by AquaTerra', '', `> ${SITE.intro} Notes from where the land meets the water.`, '',
    `Terra Notes is the monthly digital magazine of AquaTerra (Kolkata; main site: ${SITE.website}). It is written, photographed and designed by its members. Each article has its own page; the home page also holds the photo wall, a words mini game and the team.`, ''];
  const text = (b) => (typeof b === 'string' ? [b, ''] : b.h2 ? [`### ${b.h2}`, ''] : b.projects ? [...b.projects.map((x) => `- ${x.name}: ${x.what} (${x.meta})`), ''] : []);
  const A = (a) => url(TN_BASE + articleLink(a));
  return {
    'llms.txt': [...intro, '## Articles', '', ...ARTICLES.map((a) => `- [${a.title}](${A(a)}): ${line(a)}`), '', '## Pages', '',
      `- [Home](${url(TN_BASE)}): the latest articles, photo wall, words game and team`,
      `- [All articles](${url(TN_BASE + '/articles')}): every article; add ?by=<first name> for one writer's pieces first (e.g. ?by=diti)`,
      `- [Photo wall](${url(TN_BASE + '/photos')}): photos from the community, with captions`,
      `- [Words we should bring back](${url(TN_BASE + '/words')}): a mini game about forgotten words`,
      `- [Meet the team](${url(TN_BASE + '/members')}): the heads, design, writing and tech teams`,
      `- [Editions](${url(TN_BASE + '/editions')}): every monthly edition; the latest is on the home page`,
      '', '## Optional', '', `- [Full text of every article](${url(TN_BASE + '/llms-full.txt')})`, ''].join('\n'),
    'llms-full.txt': [...intro, ...ARTICLES.map((a) => [`## ${a.title}`, '', `${A(a)} · ${a.tag} · ${line(a)}`, '', ...a.body.flatMap(text)].join('\n'))].join('\n'),
  };
}

export { at };
