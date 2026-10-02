import { useEffect } from 'react';
import { Link } from '../router.jsx';
import PhoneHeader from '../phone/PhoneHeader.jsx';
import WebHeader from '../web/WebHeader.jsx';
import ArticleCard from '../shared/ArticleCard.jsx';
import { LatestTag } from '../shared/Tapes.jsx';
import { ALL_ARTICLES } from '../data/articles.js';
import { EDITIONS, LATEST, articleLink, editionLink, editionName, editionOf, nextMonth } from '../data/editions.js';
import { pad2 } from '../lib/format.js';
import { FONT } from '../styles/fonts.js';

// /editions (every monthly edition, the latest on top) and /<edition id>, e.g. /sep26 (a previous edition's articles;
// App.jsx sends the latest one's id to the home page). Both layouts, in normal document flow (not absolutely placed).
const HEAD = { fontFamily: FONT.head, fontWeight: "400", textTransform: "uppercase", color: "#111111" };
const MONO = { fontFamily: FONT.mono, letterSpacing: "1.4px", textTransform: "uppercase" };
const inEdition = (n) => ALL_ARTICLES.filter((a) => a.edition === n);

// the page around the content: header + a centred column
function Frame({ web, title, children }) {
  useEffect(() => { document.title = `Aquaterra — ${title}`; }, [title]);
  if (web) {
    return (
      <div className="web">
        <div style={{ position: "relative", width: "1440px", margin: "0 auto", overflow: "clip", background: "#F3EEE4", color: "#111111", fontFamily: FONT.body, paddingBottom: "100px" }}>
          <WebHeader />
          <div style={{ width: "1000px", margin: "0 auto", paddingTop: "60px" }}>{children}</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{ position: "relative", width: "390px", margin: "0 auto", overflow: "clip", background: "#F3EEE4", color: "#111111", fontFamily: FONT.body, paddingBottom: "70px" }}>
      <PhoneHeader current="editions" />
      <div style={{ padding: "30px 20px 0" }}>{children}</div>
    </div>
  );
}

// one edition on the shelf: number, month, piece count, covers, titles, and a way in
function EditionCard({ e, web }) {
  const list = inEdition(e.number), latest = e.number === LATEST;
  return (
    <article style={{ position: "relative", boxSizing: "border-box", background: "#FFFFFF", border: "2px solid #111111", boxShadow: `${web ? 9 : 7}px ${web ? 9 : 7}px 0 ${latest ? '#F7C21A' : '#111111'}`, padding: web ? "26px 28px" : "18px", transform: "rotate(-0.6deg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <h2 style={{ ...HEAD, margin: "0", fontSize: web ? "44px" : "30px", lineHeight: "0.95" }}>{editionName(e.number)}</h2>
        {latest && <LatestTag size={web ? '11px' : '10px'} />}
      </div>
      <div style={{ marginTop: "6px", fontFamily: FONT.hand, fontSize: web ? "30px" : "24px", color: "#5B3A1E" }}>{e.month}</div>
      <div style={{ ...MONO, marginTop: "4px", fontSize: web ? "12px" : "10px" }}>{`${pad2(list.length)} pieces`}</div>
      <div style={{ display: "flex", gap: web ? "12px" : "6px", marginTop: web ? "18px" : "14px" }}>
        {list.filter((a) => a.cover).slice(0, 6).map((a) => (
          <Link key={a.slug} to={articleLink(a)} aria-label={a.title} style={{ flex: "1", minWidth: "0", aspectRatio: "3 / 4", border: "1.5px solid #111111", background: `#E6E0D3 url(${a.cover}) 50% 12% / cover no-repeat` }} />
        ))}
      </div>
      <ol style={{ margin: web ? "18px 0 0" : "14px 0 0", padding: "0 0 0 22px", fontSize: web ? "16px" : "14px", lineHeight: "1.5" }}>
        {list.map((a) => <li key={a.slug}><Link to={articleLink(a)} style={{ color: "#111111" }}>{a.title}</Link>{a.author ? <span style={{ color: "#6B665C" }}>{` · ${a.author}`}</span> : null}</li>)}
      </ol>
      <Link className="press btn" to={editionLink(e.number)} style={{ "--c": "#111111", ...MONO, fontWeight: "700", fontSize: "11px", marginTop: web ? "22px" : "16px", minHeight: "44px", padding: "0 18px", display: "inline-flex", alignItems: "center", background: "#111111", color: "#FFFFFF", border: "2px solid #111111", boxShadow: "4px 4px 0 #F7C21A", textDecoration: "none" }}>{latest ? 'Open the latest edition →' : 'Open this edition →'}</Link>
    </article>
  );
}

export function EditionsPage({ web }) {
  const past = [...EDITIONS].reverse().filter((e) => e.number !== LATEST);
  return (
    <Frame web={web} title="Editions">
      <div className="cascade-in">
        <div style={{ ...MONO, fontSize: web ? "12px" : "11px" }}>TerraNotes · one edition a month</div>
        <h1 style={{ ...HEAD, margin: "8px 0 0", fontSize: web ? "96px" : "56px", lineHeight: "0.9", letterSpacing: "-1.5px" }}>Editions</h1>
        <div style={{ marginTop: "8px", fontFamily: FONT.hand, fontSize: web ? "30px" : "22px", color: "#5B3A1E", transform: "rotate(-1deg)" }}>every issue, pegged up in order</div>
      </div>
      <div style={{ marginTop: web ? "40px" : "28px" }}><EditionCard e={editionOf(LATEST)} web={web} /></div>
      <h2 style={{ ...HEAD, margin: web ? "70px 0 18px" : "46px 0 14px", fontSize: web ? "34px" : "24px" }}>Previous editions</h2>
      {past.length ? (
        <div style={{ display: "grid", gridTemplateColumns: web ? "1fr 1fr" : "1fr", gap: web ? "34px" : "24px" }}>{past.map((e) => <EditionCard key={e.number} e={e} web={web} />)}</div>
      ) : (
        <div style={{ boxSizing: "border-box", border: "2px dashed #8E7A5E", background: "#FBF8F1", padding: web ? "30px" : "20px" }}>
          <div style={{ ...MONO, fontSize: "11px", color: "#8E7A5E" }}>Nothing here yet</div>
          <p style={{ margin: "10px 0 0", fontFamily: FONT.hand, fontSize: web ? "30px" : "24px", lineHeight: "1.1", color: "#5B3A1E" }}>{`${editionName(LATEST)} is the first one. Once ${editionName(LATEST + 1)} comes out in ${nextMonth()}, this one moves down here.`}</p>
        </div>
      )}
    </Frame>
  );
}

export function EditionPage({ web, n }) {
  const e = editionOf(n), list = inEdition(n);
  return (
    <Frame web={web} title={`${editionName(n)} · ${e.month}`}>
      <Link to="/editions" style={{ fontFamily: FONT.hand, fontSize: "22px", color: "#111111" }}>← all editions</Link>
      <h1 style={{ ...HEAD, margin: "10px 0 0", fontSize: web ? "84px" : "48px", lineHeight: "0.9" }}>{editionName(n)}</h1>
      <div style={{ fontFamily: FONT.hand, fontSize: web ? "30px" : "24px", color: "#5B3A1E" }}>{`${e.month} · ${pad2(list.length)} pieces`}</div>
      <div style={{ display: "grid", gridTemplateColumns: web ? "repeat(4, 1fr)" : "1fr 1fr", gap: web ? "36px 28px" : "26px 16px", marginTop: "34px" }}>
        {list.map((a) => <ArticleCard key={a.slug} article={a} style={{ position: "relative", height: web ? "330px" : "250px" }} imgH={web ? "140px" : "96px"} titleSize={web ? "19px" : "15px"} dekSize={web ? "17px" : "14px"} />)}
      </div>
      <Link to="/" style={{ display: "inline-block", marginTop: "40px", fontFamily: FONT.hand, fontSize: "22px", color: "#111111" }}>see the latest edition →</Link>
    </Frame>
  );
}
