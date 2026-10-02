import { useEffect, useRef, useState } from 'react';
import PhoneHeader from './PhoneHeader.jsx';
import PhoneHangingArticles, { HANG_EXTRA } from './PhoneHangingArticles.jsx';
import HomeIntroCard from '../shared/HomeIntroCard.jsx';
import PhotoWallSection from '../shared/PhotoWallSection.jsx';
import PhotoViewer from '../shared/PhotoViewer.jsx';
import WordsGameSection from '../shared/WordsGameSection.jsx';
import TeamSection, { TEAM_HEIGHT } from '../shared/TeamSection.jsx';
import SnakeCard, { SNAKE_CARD_SPACE } from '../shared/SnakeCard.jsx';
import { PhoneBuddy } from '../shared/buddy/Buddy.jsx';
import { usePauseOffscreen } from '../lib/pauseOffscreen.js';
import { usePresence } from '../lib/usePresence.js';
import { FONT } from '../styles/fonts.js';

// The phone home page (also at /articles, /photos, /words, /members, scrolled to that section): a 390px page where
// everything under the sticky header is absolutely placed. Top to bottom: intro card, hanging articles, photo wall,
// words game, team. The hanging articles keep page coordinates (their box starts at the page's top-left) and run
// HANG_EXTRA taller than the original design, so everything after them sits in a box moved down by that much.
export default function PhoneHome() {
  const [photo, setPhoto] = useState(null); // index open in the photo viewer
  const [shownPhoto, photoLeaving] = usePresence(photo, 180);
  useEffect(() => { document.title = 'Terra Notes | AquaTerra'; }, []);
  const hangers = useRef(null);
  usePauseOffscreen(hangers); // the swinging cards hold still once scrolled away

  return (
    <>
      <div id="top" className="page-home" style={{ position: "relative", width: "390px", height: `${2480 + TEAM_HEIGHT.phone + HANG_EXTRA + SNAKE_CARD_SPACE.phone}px`, margin: "0 auto", overflow: "clip", background: "#F3EEE4", fontFamily: FONT.body, color: "#1E2723" }}>
        <PhoneHeader current="home" />
        <PhoneBuddy />
        <HomeIntroCard />
        <div id="articles" aria-hidden="true" style={{ position: "absolute", left: "0", top: "236px", width: "1px", height: "1px" }} />
        <div ref={hangers} style={{ position: "absolute", left: "0", top: "0", width: "390px", height: `${1100 + HANG_EXTRA}px`, pointerEvents: "none" }}>
          <PhoneHangingArticles />
        </div>
        <div style={{ position: "absolute", left: "0", top: `${HANG_EXTRA}px`, width: "390px", height: "0" }}>
          <PhotoWallSection onOpen={setPhoto} />
          <WordsGameSection />
          <TeamSection />
        </div>
        <SnakeCard top={2480 + TEAM_HEIGHT.phone + HANG_EXTRA + 40} />
      </div>
      {shownPhoto != null && <PhotoViewer start={shownPhoto} closing={photoLeaving} onClose={() => setPhoto(null)} />}
    </>
  );
}
