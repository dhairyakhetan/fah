// TerraNotes comes out once a month; each edition is a set of articles (their `edition` in data/articles.js).
// Newest last. The newest is the "latest": the home page shows it and its articles have clean links (/articles/<slug>).
// Every older edition lives under its id, made from its month ('September 2026' → 'sep26'): its page is /sep26 and
// its articles /sep26/articles/<slug>. That happens by itself the moment a newer edition is added here (old clean
// links redirect). Its files live in public/terranotes/editions/<id>/ too, latest or not (see CLAUDE.md).
// To start a new edition: add it here, then give its articles that edition number.
export const EDITIONS = [
  { number: 1, month: 'September 2026' },
];

export const LATEST = EDITIONS[EDITIONS.length - 1].number;
export const editionOf = (n) => EDITIONS.find((e) => e.number === n);
export const editionName = (n) => `Edition ${String(n).padStart(2, '0')}`;
export const editionId = (n) => { const [m, y] = editionOf(n).month.split(' '); return m.slice(0, 3).toLowerCase() + y.slice(2); };
export const editionById = (id) => EDITIONS.find((e) => editionId(e.number) === id);
export const editionLink = (n) => (n === LATEST ? '/' : `/${editionId(n)}`);
export const articleLink = (a) => `${a.edition === LATEST ? '' : `/${editionId(a.edition)}`}/articles/${a.slug}`;
// an article's folder of files (cover.jpg, preview.jpg, its photos): public/terranotes/editions/<id>/articles/<slug>/
export const articleFolder = (a) => `/terranotes/editions/${editionId(a.edition)}/articles/${a.slug}`;
// the month a new edition is due, for the empty "previous editions" shelf
export const nextMonth = () => {
  const [m, y] = EDITIONS[EDITIONS.length - 1].month.split(' ');
  const d = new Date(`${m} 1, ${y}`); d.setMonth(d.getMonth() + 1);
  return d.toLocaleString('en', { month: 'long', year: 'numeric' });
};
