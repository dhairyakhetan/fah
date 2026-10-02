# Terra Notes (`src/terranotes/`): guide for Claude

AquaTerra's monthly digital magazine, and inside it the AQ Labs gallery. It began as a standalone Vite + React app
(the "handoff") and was merged into `frontend/` in September 2026. It is **JavaScript, not TypeScript**, styled almost
entirely **inline**, and has **no backend**: all content is in `data/` (each file starts with a comment saying what its
fields are). Read the root `CLAUDE.md` for the AQ app around it; this file is only about this folder.

## How it sits inside AQ (read this before changing anything)

1. **It draws inside a shadow root.** `TerraNotesRoot.jsx` mounts everything into `attachShadow()` and renders the app
   into it with `createPortal`. AQ's `styles/v6.css` is global and forceful (`body{font-family … !important}`,
   heading sizes, `p` line-height, focus rings, `html{scroll-behavior:smooth}`), and this design relies on browser
   defaults plus inline styles, so sharing one document bends it. In the shadow root nothing of AQ's CSS reaches in and
   nothing of this CSS leaks out. The host is `all: initial`, so nothing inherits across either.
   - The stylesheets in `styles/` and `articles/labs/labs.css` are imported with `?inline` and injected into the shadow root.
   - A shadow root can't hold three things, so they live in `styles/document.css` (a normal import), keyed on
     `html.tn-on` so they do nothing while another page shows: `@font-face`, rules for `<html>`, and the
     `::view-transition-*` tree. If you add an animation the page-change transition needs, its keyframes go THERE.
   - `<html>` rules in the old files became `:host` / `.tn-body` (body), `html[data-nav]` became
     `:host([data-tn-nav])`, `.lite` became `:host(.tn-lite)`.
   - **Never `document.getElementById/querySelector` for something TerraNotes drew**: use `byId` / `$` from
     `lib/dom.js`. Pop-ups that used to portal into `<body>` portal into `portalRoot()`.
2. **Paths are relative to `/terranotes`.** AQ's router mounts `TerraNotesApp` at `/terranotes/*`. `router.jsx` stands
   between this code and React Router: `Link`, `Navigate` and `navigate()` ADD the prefix, `useLocation()` STRIPS it. So
   code here keeps writing `/articles/exam-stress` and `to="/photos"`. **Import router things from `router.jsx`, never from
   `react-router-dom`.** For a raw `<a href>` (or a DOM lookup by href) use `withBase()` from `lib/base.js`.
   Public files are under `public/terranotes/` and every data path starts `/terranotes/…`.
3. **Page-change animation** (card flights, crossfades) is `lib/animatedHistory.js`, which is AQ's router history
   (`App.tsx` `AppRouter`). It only animates changes that stay inside `/terranotes`; everything else passes through.
   Its `useTransitions={false}` toggle in `AppRouter` is needed for the flights: don't remove it.
4. **AQ's nav, dock and footer wrap it; this section's own header is hidden** (`header.site-header{visibility:hidden}` in `styles/base.css`, kept as the spacer under AQ's nav). `Companion`
   `Companion` and `FirstRunController` skip it, `ScrollToTop` leaves it to `lib/scrollMemory.js`. The viewport tag is
   pinned to `width=390` on phones only while this section shows (`pinViewport` in `TerraNotesRoot.jsx`).
5. **It is not linted or type-checked by AQ's tooling** (`eslint` covers `*.ts(x)` only; `tsc` sees only the `.d.ts`
   stubs beside `TerraNotesRoot`, `lib/base` and `lib/animatedHistory`; the accent linter skips this folder). There are
   no unit tests; verify in a real browser (below).
6. **Prerendering, sitemap, llms.txt** come from `scripts/terranotes/prerender.mjs`, run by `scripts/prerender-meta.mjs`
   and `scripts/generate-sitemap.mjs`: a new article appears in all three by itself. Link-preview pictures:
   `node scripts/terranotes/tools/make-link-previews.mjs` after adding an article or changing a cover.
7. **`/labs` and `/labs/<slug>` redirect** to `/terranotes/articles/labs[/<chapter>]` (`App.tsx` `LabsRedirect`, and
   permanent redirects in `vercel.json`). The Wisdom Woods demo (`public/terranotes/editions/…/wisdom-woods/demo/`) is
   shown in a same-origin iframe, so `vercel.json` gives that folder `X-Frame-Options: SAMEORIGIN` (and the routing gate
   checks it). One line was added to the team's `demo/index.html`: a `<base>` tag, because AQ serves without trailing slashes.

## Where this deliberately differs from the handoff

Verified pixel-for-pixel against the standalone build at 320 to 1920px (phone and web layouts, reduced motion, `?lite`, `?intro`,
menu, photo viewer, team card, focus rings). What is different on purpose:

- **The header is AQ's nav, not the handoff's.** The handoff's header (logo, back link, edition picker, section links, phone menu) is hidden;
  AQ's nav and dock are drawn instead, and its box remains as the spacer. The Editions page and the section links are therefore reached
  by address and by scrolling only.
- **AQ's film grain is off here** (`html.tn-on body.noise::before` in `styles/document.css`): it tinted the paper colours.
- **The page scrollbar is AQ's (6px)**, not the browser default, so the 1440px layout is zoomed to a slightly different width than
  in the standalone build. Nothing to fix; it is the same design at the width the window really has.
- **The Wisdom Woods demo's `index.html` has one added `<base>` tag** (see the root `CLAUDE.md`); everything else of the team's is untouched.
- **The opening animation's "yes" is remembered until it has played** (`lib/introNotebook.js`): AQ can render this section twice before
  it commits, and the check strips `?intro` from the address as a side effect.
- **Leaving Terra Notes resets** the header-glide and scroll memory (`forgetWebHeader`, `forgetPhoneHeader`, `forgetScroll`), the viewport
  tag, `history.scrollRestoration` and `<html>`'s classes, so AQ's pages get everything back as they were.

## Checking a change

There are no automated tests here. Verify in a real browser at **both** layouts: 390px wide (phone, emulate touch) and
1440px (web), plus ~1024px (web layout zoomed to fit) and 320px. Also check reduced motion, `?lite` (low-end mode) and
`?intro` (forces the opening animation; automated browsers never get it). From `frontend/`: `npm run dev`, then
`/terranotes`. Then `npm run build` (the whole chain, including prerender) and `npm test`.

## House rules (from the owner)

- **Writers' article text is verbatim, typos included.** Never "fix" it.
- **No new colours** outside the palette below, unless the owner supplies them. AQ Labs uses the palette its team supplied.

## Layout model

Two separate layouts, chosen by window width (`lib/layoutMode.js`, `useIsWeb()`):

| | Phone (`src/phone/`) | Web (`src/web/`) |
|---|---|---|
| Width | fixed **390px**. Phones and upright tablets are pinned to it by the viewport tag in `index.html` | fixed **1440px**, drawn with CSS `zoom: var(--web-zoom)` to fit narrower windows (900px and up) |
| Header | `PhoneHeader` (64px, sticky; the logo glides when the back link comes or goes) + slide-in `PhoneMenu` | `WebHeader` (80px, sticky; inner pages: "← back to home" left, logo + edition picker centred, gliding over when that changes) |

- **Home pages are artboards.** Everything under the header is `position: absolute` at design coordinates (px).
  - Sections export their heights so the page grows with the data: `HANG_EXTRA` (PhoneHangingArticles) and `TEAM_HEIGHT` (TeamSection).
  - When a section grows, move what's below it; don't reflow.
- **Article, editions and 404 pages** are in normal document flow.
- **Addresses follow the editions** (`data/editions.js`; each edition's id comes from its month, `sep26`):
  - latest edition: `/articles/<slug>`; older ones: `/<id>/articles/<slug>` and `/<id>` for the edition itself.
  - Build links with `articleLink(a)` / `editionLink(n)`, never by hand. A new edition moves the old links by itself; either address of an article redirects to its current one (`App.jsx`).
- **Files follow the editions too:** `public/terranotes/editions/<id>/` holds that edition's files, latest or not. Each article has a folder, `public/terranotes/editions/<id>/articles/<slug>/`: `cover.jpg`, `preview.jpg` (link preview, made by the tool) and any photos of its own (`articleFolder(a)`). The photo wall's pictures are in `public/terranotes/editions/<id>/photos/`.
- **An article can have its own page** instead of the usual layout: `page: 'labs'` in its data and an entry in `PAGES` (`App.jsx`). It lives in `src/articles/<name>/`.
  - Its `body` is still what crawlers and AIs read.
  - It gets no card flight (no cover to land on; `flight()` in `lib/cardFlight.js`), just the crossfade.
  - `chapters`: its sections get addresses, `<article>/<id>` (element ids).
  - `demos`: `{ chapter: folder }`, a web app kept in its folder, opened in a new tab at `<article>/<chapter>/demo`. `pages/DemoPage.jsx` shows it full-window in a same-origin frame, with no Buddy or opening animation. Its files stay as the team made them.
  - **AQ Labs** (`src/articles/labs/`, the "labs" article; teams and chapter ids in `data/labs.js`) is the AQ Labs team's own gallery site, ported. Its Wisdom Woods chapter opens the team's demo at `/articles/labs/wisdom-woods/demo` (files: `public/terranotes/editions/sep26/articles/labs/wisdom-woods/demo/`). It keeps their look on purpose: their fonts (`public/terranotes/fonts/`, JetBrains Mono from Google Fonts), their palette and rounded pills. Don't restyle it into the magazine's design.
    - Built from the AQ Labs design. Web: one long scroll (intro with a 3D bookshelf, then every chapter), chapter tabs as a floating glass pill under AQ's nav (sticky, no find bar; the page is full width, edge to edge, and its header slot is hidden). Phone: one chapter at a time (the shelf is the start; `/articles/labs/<id>` opens a chapter as its own page, so Back returns to the shelf); search lives in the "view all projects" sheet.
    - Books sit in fixed hover slots (`.bslot`), so the pulled-out book never flickers. Karyaarth's stills open in the site's `PhotoViewer` (it takes `photos`, `title`, `label`, `count`).
  - Its CSS (`labs.css`) is scoped to `.labs`. Its class names must not match any in `src/styles/` (it had to rename `.intro` and `.orbit`). Its loops keep the motion rules below, inside `labs.css`: transform / opacity only, stopped by reduced motion, `.lite`, `.off-screen` and `html[data-nav]`.
- **Shared components** (`src/shared/`) take a `web` prop (or `look`) and keep a `PHONE` / `WEB` table of positions and sizes. Change a value in the right table; don't fork the component.
- **The home page also answers at `/articles`, `/photos`, `/words` and `/members`** and scrolls to that section: element ids `articles`, `photos`, `words`, `members`. See `lib/routes.js` and `lib/scrollMemory.js`.
- **Section addresses drop off by themselves.** Once you scroll a screen away from the section an address names (`/photos`, `/articles/labs/photon`), `lib/scrollMemory.js` replaces it with the plain page (`/`, `/articles/labs`) in place, with state `{ quiet: true }`, so nothing scrolls or remounts. `?by=` addresses stay.
  - To change the address from a page without scrolling, use `navigate(path, { replace: true, state: { quiet: true } })`.
  - The home page (`/:section?`) and an article with its chapters (`/articles/:slug/*`) are one route each, so the page survives the change.
- **Styling is inline** (`style={{ … }}` with string values like `"12px"`), matching the existing code.
  - CSS files only hold what inline styles can't: `:active` / `:hover`, keyframes, and shared classes.
  - Fonts come from `FONT` in `src/styles/fonts.js`. Never retype a font stack.

## Design system

The site is "notes pegged on a line": paper cards hanging from strings, with ink borders, hard shadows, tape and handwriting.

**Palette** (use these, nothing else):

| Role | Colour |
|---|---|
| page | `#F3EEE4` (outside the artboard: `#E6E0D3`) |
| cards | `#FFFFFF` (soft cream `#FBF8F1`) |
| ink / borders | `#111111` |
| body text | `#1E2723` |
| handwriting | `#5B3A1E` (deks `#5B4630`) |
| string / wire | `#5B3A1E` / `#8E7A5E` |
| accents | yellow `#F7C21A`, red `#F0442B`, blue `#3DA5F4`, green `#1E7A4C`, purple `#7B5CE6`, pink `#EE4E8A`, mint `#7FC49B` |
| photo wall | panel `#1C2622`, amber shadow `#E9A23B` |

Tag colours are in `TAGS` (`data/articles.js`) and team colours in `TEAMS` (`data/team.js`).

**Type** (`FONT`):

| Name | Font | Use |
|---|---|---|
| `head` | Archivo Black | uppercase headings, titles, big numbers |
| `mono` | Space Mono | uppercase labels, meta lines and buttons, letter-spacing ~1–1.8px |
| `hand` | Caveat | handwritten notes, deks, captions, "you're here" |
| `serif` | Instrument Serif | "Photo wall", "TerraNotes", the intro headline |
| `body` | Figtree | UI text |
| `read` | Newsreader | article paragraphs |

**Shapes:**
- **Borders:** always `2px solid #111111`; 1.5px on small bits.
- **Shadows:** hard, no blur: `Npx Npx 0 <colour>`, 3–4px on buttons, 6–12px on cards. The colour carries meaning: black by default, the tag or team colour, yellow for featured.
- **Tilt:** things sit slightly crooked, `rotate(±0.5–3deg)`.
- **Corners:** square, except pills (`borderRadius: 999px`), faces (circles), the photo wall panel and the AQ Labs project bars.
- **Hanging:** a 1.4px `#5B3A1E` string plus a coloured `<Clip>` (`shared/Tapes.jsx`) on the card's top edge.
- **Tapes:** yellow with an ink border: `<ByTape>` "by <writer>", `<FeaturedTape>` "★ featured", `<LatestTag>`.
- **Placeholders:** empty data shows a dashed placeholder (`ImageSlot`) or `[bracketed text]`. Keep that behaviour.

**Buttons.** Every tap target is ≥ 44px tall.

| Kind | Style |
|---|---|
| primary | `background: "#111111", color: "#FFFFFF", border: "2px solid #111111", boxShadow: "4px 4px 0 #F7C21A"`, mono 700 11–12px uppercase, letter-spacing 1px, `minHeight: "44px", padding: "0 18px"` |
| secondary | white background, ink text, `boxShadow: "4px 4px 0 #111111"` |
| icon | 44–48px square, white, `<CloseIcon>` / `<ChevronIcon>` from `shared/Icons.jsx` |

Behaviour classes:
- `className="press"`: on touch it drops into its shadow while pressed. Set the shadow colour in `"--c"`.
- `className="btn"`: on web it lifts on hover and drops on press.
- Use `"press btn"` for components shown on both layouts.

Links that leave the site use `target="_blank" rel="noreferrer"` and end with ↗.

**Cards.** Use `<ArticleCard>` for articles:
- `look`: `phone` (you pass the size), `web` (172×272, the line) or `webNext` (340×460).
- It handles clip, cover, tag pill, number, title fitting (`lib/fitTitle.js`), the featured tape and the flight memory.

Popups are white cards with a hard shadow and a clip:
- Open with `className="card-drop"`, close with `"card-lift"`.
- `usePresence(value, ms)` keeps it mounted while it animates out.
- Put a dim backdrop (`"fade-in"` / `"fade-out"`) behind it.

**Motion** (it must run on low-end phones):
- **Endless loops** go in `styles/loops.css`:
  - Animate **only `transform` / `opacity`**, never layout or paint properties.
  - Add every new loop class to the reduced-motion rule, the `.lite` rule and the `html[data-nav]` pause rule there.
  - Wrap a section in `usePauseOffscreen(ref)` so its loops stop when it's scrolled away.
- **One-shot animations** go in `styles/motion.css`. Entrances animate the `translate` / `rotate` / `scale` properties (not `transform`) so elements keep their tilt.
- **JS animation** must check `calm()` (reduced motion) from `lib/motion.js`. For per-frame work, run `requestAnimationFrame` only while something moves. `web/WebArticleLine.jsx` is the model.
- **`LITE`** (low-end devices: ≤2 GB memory, ≤2 cores, Data Saver, or `?lite`) stops every loop.
- **Page changes** go through `lib/animatedHistory.js`. A card link flies (`lib/cardFlight.js`); anything else crossfades.

## Where things are

```
TerraNotesRoot.jsx      the shadow-root mount, viewport pin, fonts, the opening animation (lazy-loaded by AQ's App.tsx)
TerraNotesApp.jsx       routes (phone vs web page per route, articles with their own page: PAGES, address redirects), skip link,
                        scroll memory, error card, games popup
router.jsx              Link / Navigate / useLocation / useNavigate that add and strip the /terranotes prefix
data/                   ALL content (each file documents its fields at the top)
  site.js               AQ site + Instagram, the intro line
  articles.js           TAGS, ALL_ARTICLES (body block formats at the top), ARTICLES (latest edition), placeOf()
  editions.js           EDITIONS (newest last), LATEST, editionId, articleLink, editionLink, articleFolder
  team.js  photos.js  words.js  labs.js
phone/  web/            the two layouts (PhoneHome, PhoneHangingArticles, PhoneArticle, PhoneHeader, PhoneMenu / WebHome,
                        WebArticleLine, WebArticle, WebHeader, WebEditionPicker)
pages/                  EditionsPage (/editions, /<id>), NotFoundPage, DemoPage (an article's demo app, full-window)
articles/labs/         LabsPage.jsx + labs.css: the AQ Labs gallery (the "labs" article's own page, both layouts)
shared/                 ArticleCard, ArticleBody, TeamSection, PhotoWallSection, PhotoViewer, WordsGameSection, HomeIntroCard,
                        IntroNotebook, ErrorBoundary, Tapes, Icons, ImageSlot, Logo, BackHome, buddy/ (Buddy, Ghost, BuddyGames)
lib/                    logic only: base (prefix helpers) dom (shadow-root lookups) layoutMode routes scrollMemory animatedHistory
                        cardFlight motion fitTitle byWriter teamLayout photoShapes useGallery useWordsGame usePresence pauseOffscreen
                        scrollLock buddyState introNotebook format
styles/                 fonts.js (FONT) · base.css · loops.css · motion.css · phone.css · web.css · intro.css · buddy.css
                        (all injected into the shadow root) · document.css (fonts, <html> rules, view transitions: the document)
../../public/terranotes/  editions/<id>/ (articles/<slug>/: cover, preview, own photos · photos/) · brand/ · team/ · badges/ · fonts/ · og/
../../scripts/terranotes/ prerender.mjs, staticCopy.mjs, tools/make-link-previews.mjs
```

## Common jobs

- **New article:**
  1. Add an entry to `ALL_ARTICLES` (fields at the top of `data/articles.js`) and put the cover in its folder: `public/terranotes/editions/<id>/articles/<slug>/cover.jpg`.
  2. Run `node scripts/terranotes/tools/make-link-previews.mjs` (from `frontend/`).
  - Both layouts pick it up. Phone cards past the sixth hang in pairs; the web line grows.
- **New edition:** add it to `EDITIONS`, then set its articles' `edition` and put their files in `public/terranotes/editions/<new id>/`. The previous edition's links move under its id by themselves; nothing else to change.
- **New member:** add them to `MEMBERS` with a square ~400px WebP in `public/terranotes/team/`. The faces lay themselves out.
- **New block type in articles:**
  1. Render it in `shared/ArticleBody.jsx` (both sizes, `web` = ×1.25).
  2. Document it at the top of `data/articles.js`.
  3. Add its text to `scripts/terranotes/staticCopy.mjs` and the `llms-full.txt` builder in `scripts/terranotes/prerender.mjs`.
- **Site address changes:** the origin comes from `scripts/prerender-meta.mjs` (env `SITE_URL` overrides it); `SITE.url` in `data/site.js` is informational.
