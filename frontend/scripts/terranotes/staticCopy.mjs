// What each page says, as plain HTML, written into the built page inside #root (by scripts/terranotes/prerender.mjs,
// which prerender-meta.mjs runs). The app replaces it the moment it starts (prerender.mjs hides .tn-static once
// JavaScript runs), so people see the real page; chatbots, search engines and link readers that don't run JavaScript
// read this instead. Paths written here are TerraNotes' own (/articles/…); `at()` puts them under /terranotes.
const BASE = '/terranotes';
export const at = (p) => (p === '/' ? BASE : BASE + p);
import { ALL_ARTICLES, ARTICLES, placeOf } from '../../src/terranotes/data/articles.js';
import { EDITIONS, LATEST, articleLink, editionName } from '../../src/terranotes/data/editions.js';
import { PHOTOS } from '../../src/terranotes/data/photos.js';
import { SITE } from '../../src/terranotes/data/site.js';
import { MEMBERS, TEAMS, teamsOf } from '../../src/terranotes/data/team.js';
import { WORDS } from '../../src/terranotes/data/words.js';
import { firstName, instagramUrl, pad2 } from '../../src/terranotes/lib/format.js';

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const byline = (a) => [a.author && `By ${esc(a.author)}`, a.date && esc(a.date), a.readTime && `${esc(a.readTime)} min read`].filter(Boolean).join(' · ');

const shell = (inner) => `<div class="tn-static" style="max-width:680px;margin:0 auto;padding:24px 18px 48px;background:#F3EEE4;color:#1E2723;font:17px/1.6 Georgia,serif">
<nav aria-label="Pages" style="font:13px/1.8 monospace;text-transform:uppercase;letter-spacing:1px"><a href="${at('/')}">TerraNotes by Aquaterra</a> · <a href="${at('/articles')}">Articles</a> · <a href="${at('/photos')}">Photo wall</a> · <a href="${at('/words')}">Words</a> · <a href="${at('/members')}">Team</a> · <a href="${at('/editions')}">Editions</a></nav>
<main>${inner}</main>
</div>`;

const articleList = () => `<ul>${ARTICLES.map((a) => `<li><a href="${at(articleLink(a))}"><strong>${esc(a.title)}</strong></a> (${esc(a.tag)}): ${esc(a.dek)}. ${byline(a)}</li>`).join('')}</ul>`;

export function articleHtml(a) {
  const body = a.body.map((b) => {
    if (typeof b === 'string') return `<p>${esc(b)}</p>`;
    if (b.h2) return `<h2>${esc(b.h2)}</h2>`;
    if (b.projects) return `<ol>${b.projects.map((x) => `<li><strong>${esc(x.name)}</strong>, ${esc(x.what)} (${esc(x.meta)})</li>`).join('')}</ol>`;
    return '';
  }).join('\n');
  const { i, n, list } = placeOf(a), next = list[(i + 1) % n];
  return shell(`<article>
<p style="font:13px monospace;text-transform:uppercase">${esc(a.tag)} · ${pad2(i + 1)} / ${pad2(n)} · ${editionName(a.edition)}</p>
<h1>${esc(a.title)}</h1>
<p><em>${esc(a.dek)}</em></p>
<p>${byline(a)}</p>
${body}
</article>
<p>Next: <a href="${at(articleLink(next))}">${esc(next.title)}</a> · <a href="${at('/articles')}">All articles</a></p>`);
}

export const pageHtml = {
  '/': () => shell(`<h1>TerraNotes by Aquaterra</h1>
<p><strong>Notes from where the land meets the water.</strong> ${esc(SITE.intro)}</p>
<h2>Articles</h2>${articleList()}
<h2><a href="${at('/photos')}">Photo wall</a></h2><p>${PHOTOS.filter((p) => p.caption).map((p) => esc(p.caption)).join(' · ')}</p>
<h2><a href="${at('/words')}">Words we should bring back</a></h2><p>A mini game: guess what an old, forgotten word means.</p>
<h2><a href="${at('/members')}">Meet the team</a></h2><p>${MEMBERS.length} people across the heads, design, writing and tech teams.</p>`),
  '/editions': () => shell(`<h1>Editions</h1><p>TerraNotes comes out once a month.</p><ul>${[...EDITIONS].reverse().map((e) => `<li><strong>${editionName(e.number)}</strong>, ${esc(e.month)}${e.number === LATEST ? ' (latest)' : ''}: ${ALL_ARTICLES.filter((a) => a.edition === e.number).map((a) => `<a href="${at(articleLink(a))}">${esc(a.title)}</a>`).join(', ')}</li>`).join('')}</ul>`),
  '/articles': () => shell(`<h1>All articles</h1><p>${ARTICLES.length} pieces, hung up to dry, one by one.</p>${articleList()}`),
  '/photos': () => shell(`<h1>Photo wall</h1><p>Moments, strung up.</p><ul>${PHOTOS.filter((p) => p.photo).map((p, i) => `<li><img src="${esc(p.photo)}" alt="${esc(p.caption)}" width="240" style="max-width:100%;height:auto"><br>Highlight ${pad2(i + 1)}: ${esc(p.caption)}${p.place ? `, ${esc(p.place)}` : ''}</li>`).join('')}</ul>`),
  '/words': () => shell(`<h1>Words we should bring back</h1><p>A mini game: each round shows an old word and three meanings; pick the right one. Some of the words:</p><ul>${WORDS.map((w) => `<li>${esc(w.meaning)}</li>`).join('')}</ul>`),
  '/members': () => shell(`<h1>Meet the team</h1><p>${Object.values(TEAMS).map((t) => `<strong>${esc(t.label)}</strong>: ${esc(t.credit)}.`).join(' ')}</p><ul>${MEMBERS.map((m) => `<li><strong>${esc(m.name)}</strong>, ${esc(m.role)} (${teamsOf(m).map((t) => esc(TEAMS[t].label)).join(', ')})${m.bio ? `: ${esc(m.bio)}` : ''}${m.instagram ? ` · Instagram <a href="${instagramUrl(m.instagram)}">@${esc(m.instagram)}</a>` : ''}${ARTICLES.some((a) => a.author === m.name) ? ` · <a href="${at('/articles')}?by=${esc(firstName(m.name).toLowerCase())}">their articles</a>` : ''}</li>`).join('')}</ul>`),
};

// Put a page's content into the built HTML (index.html has an empty <div id="root"></div>).
export const withContent = (html, inner) => html.replace('<div id="root"></div>', `<div id="root">${inner}</div>`);
