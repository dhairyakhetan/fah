import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from './router.jsx';
import PhoneHome from './phone/PhoneHome.jsx';
import PhoneArticle from './phone/PhoneArticle.jsx';
import WebHome from './web/WebHome.jsx';
import WebArticle from './web/WebArticle.jsx';
import { EditionPage, EditionsPage } from './pages/EditionsPage.jsx';
import DemoPage from './pages/DemoPage.jsx';
// the AQ Labs gallery is ~a third of the code: its own chunk (TerraNotesRoot warms it once the home page has settled)
export const loadLabs = () => import('./articles/labs/LabsPage.jsx');
const LabsPage = lazy(loadLabs);
import NotFoundPage from './pages/NotFoundPage.jsx';
import ErrorBoundary from './shared/ErrorBoundary.jsx';
import BuddyGames from './shared/buddy/BuddyGames.jsx';
import { ALL_ARTICLES } from './data/articles.js';
import { LATEST, articleFolder, articleLink, editionById, editionLink, editionOf } from './data/editions.js';
import { useIsWeb } from './lib/layoutMode.js';
import { SECTIONS, isDemoPath } from './lib/routes.js';
import { ScrollMemory } from './lib/scrollMemory.js';

// Mounted by TerraNotesRoot.jsx at AQ's /terranotes/*; the paths below are relative to that (router.jsx adds and strips the prefix).
// The routes, per layout (lib/layoutMode.js: 900px+ wide = web, else phone):
//   /                         home (PhoneHome / WebHome)
//   /articles /photos /words /members   the home page, opened at that section (lib/scrollMemory.js scrolls)
//   /articles/<slug>          an article in the latest edition (PhoneArticle / WebArticle, or its own page: PAGES);
//                             `next` = the following one in its edition
//   /<id>/articles/<slug>     an article in an older edition, e.g. /sep26/articles/labs (data/editions.js). Either
//                             address of an article redirects to its current one, so links survive a new edition.
//   <article>/<chapter>       an own-page article opened at a chapter (its `chapters`), e.g. /articles/labs/photon
//   <article>/<chapter>/demo  a demo web app kept in the article's folder (its `demos`), full-window with nothing
//                             else of the site around it (pages/DemoPage.jsx), e.g. /articles/labs/wisdom-woods/demo
//   /editions, /<id>          every edition / a previous one (pages/EditionsPage.jsx); old /editions/<n> redirects
//   anything else             404 (pages/NotFoundPage.jsx)
// Any address with ?by=<writer> goes to /articles?by=<writer> (that writer's articles first, lib/byWriter.js).
// Around them: the skip link, the crash card and Buddy's games popup (it outlives navigation).

// Articles with their own page instead of the usual layout (an article's `page` in data/articles.js)
const PAGES = { labs: LabsPage };

// / and /articles, /photos… (the home page: one route, so the address can change in place without a remount) or an
// edition's id (/sep26: that edition, or home if it's the latest)
function SectionRoute({ web }) {
  const { section } = useParams();
  if (!section || SECTIONS.includes(section)) return web ? <WebHome /> : <PhoneHome />;
  const e = editionById(section);
  if (!e) return <NotFoundPage web={web} />;
  return e.number === LATEST ? <Navigate to="/" replace /> : <EditionPage web={web} n={e.number} />;
}

function OldEditionRoute({ web }) {
  const e = editionOf(Number(useParams().n));
  return e ? <Navigate to={editionLink(e.number)} replace /> : <NotFoundPage web={web} />;
}

// <article>, <article>/<chapter> (one route, so the address can change in place) and <article>/<chapter>/demo
function ArticleRoute({ web }) {
  const { edition, slug, '*': rest } = useParams();
  const { pathname, search, hash } = useLocation();
  const n = edition ? editionById(edition)?.number : LATEST;
  // an older edition's article at the clean address it had while it was the latest is still found (then redirected)
  const a = ALL_ARTICLES.find((x) => x.slug === slug && x.edition === n) || (!edition && ALL_ARTICLES.findLast((x) => x.slug === slug));
  const [chapter, demo, more] = (rest || '').split('/').filter(Boolean);
  const ok = a && !more && (!chapter || (a.chapters?.includes(chapter) && (!demo || (demo === 'demo' && a.demos?.[chapter]))));
  if (!ok) return <NotFoundPage web={web} />;
  const here = [articleLink(a), chapter, demo].filter(Boolean).join('/');
  if (pathname !== here) return <Navigate to={here + search + hash} replace />;
  if (demo) return <DemoPage src={`${articleFolder(a)}/${a.demos[chapter]}/`} name={chapter.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />;
  const key = articleLink(a); // remount per article so its entrance replays
  if (a.page) { const Own = PAGES[a.page]; return <Suspense fallback={null}><Own key={key} article={a} web={web} chapter={chapter || null} /></Suspense>; }
  const Page = web ? WebArticle : PhoneArticle;
  const same = ALL_ARTICLES.filter((x) => x.edition === a.edition);
  return <Page key={key} article={a} next={same[(same.indexOf(a) + 1) % same.length]} />;
}

// (No skip link of its own: it always draws inside AQ's page, whose skip link lands on AQ's <main>, and the header it would skip is hidden.)

export default function App() {
  const { pathname, search } = useLocation();
  const web = useIsWeb();
  const toWriter = pathname !== '/articles' && new URLSearchParams(search).get('by');
  const bare = isDemoPath(pathname); // a demo tab: the demo alone
  return (
    <>
      <ScrollMemory />
      <ErrorBoundary resetKey={pathname}>
        {toWriter ? <Navigate to={{ pathname: '/articles', search }} replace /> : (
          <Routes>
            <Route path="/editions" element={<EditionsPage web={web} />} />
            <Route path="/editions/:n" element={<OldEditionRoute web={web} />} />
            <Route path="/:section?" element={<SectionRoute web={web} />} />
            <Route path="/articles/:slug/*" element={<ArticleRoute web={web} />} />
            <Route path="/:edition/articles/:slug/*" element={<ArticleRoute web={web} />} />
            <Route path="*" element={<NotFoundPage web={web} />} />
          </Routes>
        )}
      </ErrorBoundary>
      {!bare && <BuddyGames />}
    </>
  );
}
