import { useEffect, useLayoutEffect, useRef } from 'react';
import PhoneHeader from './PhoneHeader.jsx';
import ArticleCard, { TagPill } from '../shared/ArticleCard.jsx';
import ArticleBody, { AuthorBox } from '../shared/ArticleBody.jsx';
import BackHome from '../shared/BackHome.jsx';
import ImageSlot from '../shared/ImageSlot.jsx';
import { Clip, FeaturedTape } from '../shared/Tapes.jsx';
import { placeOf, TAGS } from '../data/articles.js';
import { pad2 } from '../lib/format.js';
import { useFitTitle } from '../lib/fitTitle.js';
import { flyInFromCard } from '../lib/cardFlight.js';
import { FONT } from '../styles/fonts.js';

// One article, phone layout (data: data/articles.js; `next` = the following article in its edition). The cover card
// hangs from a wire: it drops in (or flies straight out of the tapped card) and keeps swaying (styles/motion.css,
// loops.css). Then the byline strip, the body (shared/ArticleBody.jsx), the "words by" box, the next article on its
// own wire, and "back to home". Hero, byline and body are in normal flow: a taller cover pushes the rest down.
export default function PhoneArticle({ article: a, next }) {
  const hero = useRef(null);
  useLayoutEffect(() => { flyInFromCard(hero.current, true); }, []);
  useEffect(() => { document.title = `Aquaterra — ${a.title}`; }, [a.title]);
  const tag = TAGS[a.tag], { i, n } = placeOf(a);
  const title = useFitTitle(a.title, 42, 30, 4); // at most four lines

  return (
    <div className="page-article" style={{ position: "relative", width: "390px", margin: "0 auto", overflow: "clip", background: "#F3EEE4", fontFamily: FONT.body, color: "#111111" }}>
      <PhoneHeader current="article" edge={tag.color} />
      <div style={{ position: "absolute", left: "0", top: "100px", width: "390px", height: "2px", background: "#5B3A1E" }} />
      <div ref={hero} className="hero-drop" style={{ position: "relative", margin: "70px 0 0 16px", width: "358px", minHeight: "484px", transformOrigin: "50% -32px" }}>
        <div className="hero-sway" style={{ transformOrigin: "50% -32px", transform: "rotate(-0.8deg)" }}>
          <div style={{ position: "absolute", left: "178.3px", top: "-32px", width: "1.4px", height: "34px", background: "#5B3A1E" }} />
          <Clip color={tag.color} w={34} h={9} top="-7px" />
          {a.featured && <FeaturedTape style={{ left: "-6px", top: "-10px" }} />}
          <article style={{ boxSizing: "border-box", background: "#FFFFFF", border: "2px solid #111111", boxShadow: `8px 8px 0 ${a.featured ? "#F7C21A" : "#111111"}`, padding: "10px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <ImageSlot src={a.cover} alt={a.alt} label={`${a.alt} — lead photo`} box={a.cover ? { height: "auto" } : { height: "240px" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <TagPill a={a} size="10px" pad="3px 8px" lh="1.2" />
              <span style={{ fontFamily: FONT.mono, fontSize: "11px", letterSpacing: "1px", color: "#111111" }}>{`${pad2(i + 1)} / ${pad2(n)}`}</span>
            </div>
            <h1 ref={title} style={{ margin: "0", fontFamily: FONT.head, fontWeight: "400", fontSize: "42px", lineHeight: "0.95", letterSpacing: "-0.3px", textTransform: "uppercase", color: "#111111" }}>{a.title}</h1>
            <p style={{ margin: "0", fontFamily: FONT.hand, fontSize: "22px", lineHeight: "1.1", color: "#5B4630" }}>{a.dek}</p>
          </article>
        </div>
      </div>
      <div className="rise-in" style={{ position: "relative", margin: "28px 0 0 20px", width: "350px", display: "flex", border: "2px solid #111111", background: "#FFFFFF", fontFamily: FONT.mono, fontSize: "10px", letterSpacing: "1px", textTransform: "uppercase" }}>
        {a.author !== null && <div style={{ flexGrow: "1", padding: "10px", borderRight: "2px solid #111111" }}>{`By ${a.author || '[Author]'}`}</div>}
        <div style={{ flexGrow: a.author === null ? "1" : undefined, padding: "10px", borderRight: "2px solid #111111" }}>{a.date || '[Date]'}</div>
        <div style={{ padding: "10px", background: tag.color, color: tag.ink }}>{`${a.readTime || '[x]'} min`}</div>
      </div>
      <div className="rise-in" style={{ position: "relative", margin: "39px 0 0 24px", width: "342px", minHeight: "2606px", display: "flex", flexDirection: "column", gap: "22px" }}>
        <ArticleBody a={a} tag={tag} />
        <div style={{ width: "16px", height: "16px", background: "#111111" }} />
        <AuthorBox a={a} />
        {/* next on the line */}
        <div style={{ position: "relative", margin: "10px -24px 0", width: "390px", height: "470px" }}>
          <div style={{ position: "absolute", left: "20px", top: "0", fontFamily: FONT.mono, fontSize: "11px", letterSpacing: "1.6px" }}>NEXT ON THE LINE</div>
          <div style={{ position: "absolute", left: "0", top: "30px", width: "390px", height: "2px", background: "#5B3A1E" }} />
          <div style={{ position: "absolute", left: "200px", top: "32px", width: "1.4px", height: "36px", background: "#5B3A1E" }} />
          <ArticleCard article={next} style={{ position: "absolute", left: "70px", top: "70px", width: "250px", height: "330px", transform: "rotate(-2deg)" }} imgH="150px" titleSize="22px" dekSize="18px" />
          <BackHome className="lift-link" style={{ position: "absolute", left: "20px", top: "420px", minHeight: "44px", display: "flex", alignItems: "center", fontFamily: FONT.hand, fontSize: "21px", textDecoration: "none" }}>← back to home</BackHome>
        </div>
      </div>
    </div>
  );
}
