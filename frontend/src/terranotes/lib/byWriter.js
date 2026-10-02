import { useSearchParams } from '../router.jsx';
import { ARTICLES } from '../data/articles.js';
import { MEMBERS } from '../data/team.js';
import { firstName } from './format.js';

// "Their articles": /articles?by=<first name> (e.g. ?by=diti; a full name works too) lists that writer's pieces first,
// each with a yellow "by …" tape (shared/Tapes.jsx), on both layouts' article lines.
const key = (name) => firstName(name).toLowerCase();
export const byLink = (name) => `/articles?by=${key(name)}`;
export const articlesBy = (name) => ARTICLES.filter((a) => a.author === name);

// → { by: the writer's full name or '', mine: their articles, isMine(a), list: every article, theirs first }
export function useByWriter() {
  const [q] = useSearchParams();
  const want = (q.get('by') || '').trim().toLowerCase();
  const by = (want && [...MEMBERS.map((m) => m.name), ...ARTICLES.map((a) => a.author)].find((n) => n && (key(n) === want || n.toLowerCase() === want))) || '';
  const isMine = (a) => !!by && a.author === by;
  const mine = ARTICLES.filter(isMine);
  return { by, mine, isMine, list: by ? [...mine, ...ARTICLES.filter((a) => !isMine(a))] : ARTICLES };
}
