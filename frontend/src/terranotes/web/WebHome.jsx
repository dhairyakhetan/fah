import { useEffect, useRef, useState } from 'react';
import { usePauseEach } from '../lib/pauseOffscreen.js';
import WebHeader from './WebHeader.jsx';
import WebArticleLine from './WebArticleLine.jsx';
import HomeIntroCard from '../shared/HomeIntroCard.jsx';
import PhotoWallSection from '../shared/PhotoWallSection.jsx';
import PhotoViewer from '../shared/PhotoViewer.jsx';
import WordsGameSection from '../shared/WordsGameSection.jsx';
import TeamSection, { TEAM_HEIGHT } from '../shared/TeamSection.jsx';
import SnakeCard, { SNAKE_CARD_SPACE } from '../shared/SnakeCard.jsx';
import { WebBuddy } from '../shared/buddy/Buddy.jsx';
import { ARTICLES } from '../data/articles.js';
import { usePresence } from '../lib/usePresence.js';
import { FONT } from '../styles/fonts.js';

// The web home page (also at /articles, /photos, /words, /members, scrolled to that section): a 1440px page where
// everything under the sticky header is absolutely placed. Intro card + "Land. Water. City." masthead, Buddy's
// corner, the sideways article line, photo wall, words game, team.
const DOT = <span style={{ color: "#3DA5F4" }}>.</span>;

export default function WebHome() {
  const [photo, setPhoto] = useState(null); // index open in the photo viewer
  const [shownPhoto, photoLeaving] = usePresence(photo, 180);
  useEffect(() => { document.title = 'Terra Notes | AquaTerra'; }, []);
  const page = useRef(null);
  usePauseEach(page, '.hero-sway,.fl1,.fl2,.fl3,.fl4,.fl5,.fl6,.fk1,.fk2,.fk3,.fk4,.spark,.bulb,.orbit-bubble,.buddy-bob'); // loops hold still once scrolled away

  return (
    <div className="web">
      <div id="top" ref={page} style={{ position: "relative", width: "1440px", height: `${2610 + TEAM_HEIGHT.web + SNAKE_CARD_SPACE.web}px`, margin: "0 auto", overflow: "clip", background: "#F3EEE4", fontFamily: FONT.body, color: "#111111" }}>
        <WebHeader />
        <HomeIntroCard web />
        <div style={{ position: "absolute", left: "720px", top: "132px", fontFamily: FONT.mono, fontSize: "12px", letterSpacing: "1.8px" }}>TERRANOTES · WRITE-UPS, PHOTOS &amp; WORDS</div>
        <div style={{ position: "absolute", left: "716px", top: "160px", fontFamily: FONT.head, fontSize: "96px", lineHeight: "0.9", letterSpacing: "-2px", textTransform: "uppercase", color: "#111111" }}>
          <div>Land{DOT}</div>
          <div style={{ paddingLeft: "70px" }}>Water{DOT}</div>
          <div style={{ paddingLeft: "20px" }}>City{DOT}</div>
        </div>
        <div style={{ position: "absolute", left: "1150px", top: "380px", width: "220px", fontFamily: FONT.hand, fontSize: "26px", lineHeight: "1.05", color: "#5B3A1E", transform: "rotate(-4deg)" }}>write-ups, fresh off the line ↓</div>
        <WebBuddy />
        {ARTICLES.length > 0 && <WebArticleLine />}
        <PhotoWallSection web onOpen={setPhoto} />
        <WordsGameSection web />
        <TeamSection web />
        <SnakeCard web top={2610 + TEAM_HEIGHT.web + 40} />
      </div>
      {shownPhoto != null && <PhotoViewer web start={shownPhoto} closing={photoLeaving} onClose={() => setPhoto(null)} />}
    </div>
  );
}
