import { useEffect, useLayoutEffect, useRef } from 'react';
import WebHeader from './WebHeader.jsx';
import ArticleCard, { TagPill } from '../shared/ArticleCard.jsx';
import ArticleBody, { AuthorBox, FieldLog } from '../shared/ArticleBody.jsx';
import ImageSlot from '../shared/ImageSlot.jsx';
import { Clip, FeaturedTape } from '../shared/Tapes.jsx';
import { placeOf, TAGS } from '../data/articles.js';
import { pad2 } from '../lib/format.js';
import { useFitTitle } from '../lib/fitTitle.js';
import { flyInFromCard } from '../lib/cardFlight.js';
import { FONT } from '../styles/fonts.js';

// One article, web layout (data: data/articles.js; `next` = the following article in its edition). The cover hangs
// on a wire at the left (drops in, or flies out of the clicked card, then sways); tag, title, dek and byline on the
// right; then a 700px reading column (shared/ArticleBody.jsx) with the field log pinned in its right margin, the
// "words by" box, and the next article hanging on its own wire. Title block and body are in normal flow, so a long
// title pushes the text down.
const MONO = { fontFamily: FONT.mono, letterSpacing: "1px", textTransform: "uppercase" };

export default function WebArticle({ article: a, next }) {
  const hero = useRef(null);
  useLayoutEffect(() => { flyInFromCard(hero.current); }, []);
  useEffect(() => { document.title = `Aquaterra — ${a.title}`; }, [a.title]);
  const tag = TAGS[a.tag], { i, n } = placeOf(a);
  const log = a.body.find((b) => b.log)?.log;
  const title = useFitTitle(a.title, 76, 54, 5); // at most five lines

  return (
    <div className="web">
      <div style={{ position: "relative", width: "1440px", margin: "0 auto", overflow: "clip", background: "#F3EEE4", fontFamily: FONT.body, color: "#111111" }}>
        <WebHeader wire />
        <div style={{ position: "absolute", left: "0", top: "78px", width: "1440px", height: "2px", background: "#5B3A1E" }} />
        <div ref={hero} className="hero-drop" style={{ position: "absolute", left: "80px", top: "118px", width: a.cover ? "fit-content" : "620px", transformOrigin: "50% -38px" }}>
          <div className="hero-sway" style={{ transformOrigin: "50% -38px", transform: "rotate(-1deg)" }}>
            <div style={{ position: "absolute", left: "50%", marginLeft: "-0.7px", top: "-38px", width: "1.4px", height: "40px", background: "#5B3A1E" }} />
            <Clip color={tag.color} w={40} h={10} top="-8px" />
            {a.featured && <FeaturedTape style={{ left: "-10px", top: "-12px", fontSize: "12px" }} />}
            <div style={{ background: "#FFFFFF", border: "2px solid #111111", boxShadow: `12px 12px 0 ${a.featured ? "#F7C21A" : "#111111"}`, padding: "14px" }}>
              <ImageSlot src={a.cover} alt={a.alt} label={`${a.alt} — lead photo`} box={a.cover ? { height: "560px", width: "auto", maxWidth: "620px" } : { height: "420px" }} icon={22} font="12px" />
            </div>
          </div>
        </div>
        <div className="rise-in" style={{ position: "relative", margin: "48px 0 0 780px", width: "580px", minHeight: "560px", display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <TagPill a={a} size="12px" pad="3px 9px" lh="1.3" />
            <span style={{ fontFamily: FONT.mono, fontSize: "13px", letterSpacing: "1px" }}>{`${pad2(i + 1)} / ${pad2(n)}`}</span>
          </div>
          <h1 ref={title} style={{ margin: "0", fontFamily: FONT.head, fontWeight: "400", fontSize: "76px", lineHeight: "0.92", letterSpacing: "-1.5px", textTransform: "uppercase" }}>{a.title}</h1>
          <p style={{ margin: "0", fontFamily: FONT.hand, fontSize: "32px", lineHeight: "1.1", color: "#5B4630" }}>{a.dek}</p>
          <div style={{ ...MONO, display: "flex", border: "2px solid #111111", background: "#FFFFFF", fontSize: "12px", alignSelf: "flex-start" }}>
            {a.author !== null && <div style={{ padding: "12px 16px", borderRight: "2px solid #111111" }}>{`By ${a.author || '[Author]'}`}</div>}
            <div style={{ padding: "12px 16px", borderRight: "2px solid #111111" }}>{a.date || '[Date]'}</div>
            <div style={{ padding: "12px 16px", background: tag.color, color: tag.ink }}>{`${a.readTime || '[x]'} min read`}</div>
          </div>
        </div>
        <div className="rise-in" style={{ position: "relative", margin: "40px 0 0 370px", width: "700px", display: "flex", flexDirection: "column", gap: "28px" }}>
          {log && <FieldLog log={log} web />}
          <ArticleBody a={a} tag={tag} web />
          <div style={{ width: "18px", height: "18px", background: "#111111" }} />
          <AuthorBox a={a} web />
          {/* next on the line */}
          <div style={{ position: "relative", margin: "30px -370px 0", width: "1440px", height: "620px" }}>
            <div style={{ position: "absolute", left: "80px", top: "0", fontFamily: FONT.mono, fontSize: "12px", letterSpacing: "1.8px" }}>NEXT ON THE LINE</div>
            <div style={{ position: "absolute", left: "0", top: "36px", width: "1440px", height: "2px", background: "#5B3A1E" }} />
            <div className="hang sway" style={{ position: "absolute", left: "550px", top: "38px", width: "340px", height: "512px", "--a": "0.81deg", "--d": "5.4s", animationDelay: "-1.2s" }}>
              <div style={{ position: "absolute", left: "169.3px", top: "0", width: "1.4px", height: "54px", background: "#5B3A1E" }} />
              <div className="flutter" style={{ position: "absolute", left: "0", top: "52px", width: "340px", height: "460px", "--r": "-2deg", transform: "rotate(-2deg)", animationDelay: "-1.9s" }}>
                <ArticleCard article={next} look="webNext" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
