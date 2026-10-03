// Where TerraNotes lives inside AQ. Pure string helpers, no React, so build scripts can import them too.
export const BASE = '/terranotes';

export const isTnPath = (p) => p === BASE || p.startsWith(`${BASE}/`);
// "/articles/x" → "/terranotes/articles/x"; "/" → "/terranotes"; keeps ?query and #hash; leaves relative and external strings alone
export function withBase(to) {
  if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//')) return to;
  if (isTnPath(to)) return to; // already prefixed
  return to === '/' ? BASE : BASE + to;
}
// "/terranotes/articles/x" → "/articles/x"; "/terranotes" → "/"
export const stripBase = (p) => (isTnPath(p) ? p.slice(BASE.length) || '/' : p);
