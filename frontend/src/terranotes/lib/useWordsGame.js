import { useEffect, useRef, useState } from 'react';
import { WORDS } from '../data/words.js';
import { pad2 } from './format.js';

// State for the "Words we should bring back" mini game (shared/WordsGameSection.jsx): 5 random words per game (never
// the previous game's), three meanings each. A "psst." hint appears after 16 s without an answer; its clock only starts
// once the section (ref `section`) is on screen.
const ROUNDS = 5, HINT_DELAY = 16000;

const shuffle = (xs) => {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const draw = (prev = []) => shuffle(WORDS.filter((w) => !prev.includes(w))).slice(0, ROUNDS);

// Font size that keeps a word inside its cloud (Archivo Black caps run ~0.66em wide).
export const fitWord = (word, max, width) => `${Math.min(max, Math.floor(width / (word.length * 0.66)))}px`;

export function useWordsGame(section) {
  const [s, setS] = useState(() => ({ rounds: draw(), q: 0, pick: null, score: 0, done: false, hint: false }));
  const timer = useRef(0);
  const armHint = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setS((p) => ({ ...p, hint: true })), HINT_DELAY);
  };
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); armHint(); } }, { threshold: 0.4 });
    io.observe(section.current);
    return () => { io.disconnect(); clearTimeout(timer.current); };
  }, []);

  const round = s.rounds[s.q], last = s.q >= s.rounds.length - 1, shown = s.pick != null;
  return {
    total: pad2(s.rounds.length),
    n: pad2(s.q + 1),
    score: pad2(s.score),
    word: round.word,
    say: round.say,
    playing: !s.done,
    done: s.done,
    locked: shown,
    hint: round.hint,
    showHint: s.hint && !shown && !s.done,
    verdict: shown ? (s.pick === round.answer ? 'Yes!' : 'Not quite.') : '',
    def: round.meaning,
    nextLabel: last ? 'Score' : 'Next word',
    next: () => {
      if (last) { setS({ ...s, done: true }); return; }
      setS({ ...s, q: s.q + 1, pick: null, hint: false });
      armHint();
    },
    restart: () => {
      setS((p) => ({ rounds: draw(p.rounds), q: 0, pick: null, score: 0, done: false, hint: false }));
      armHint();
    },
    message: s.score === s.rounds.length ? 'all of them. you should be writing for us.' : s.score === 0 ? 'zero. that\'s why we need to bring them back.' : 'not bad. now use one in a sentence today.',
    // the three meanings: A/B/C until answered, then ✓ on the right one and ✗ on a wrong pick (mood: its animation class)
    options: round.options.map((text, k) => {
      const right = k === round.answer, picked = k === s.pick;
      const letter = String.fromCharCode(65 + k);
      return {
        text,
        mark: shown ? (right ? '✓' : picked ? '✗' : letter) : letter,
        mood: shown ? (right ? 'w-right' : picked ? 'w-wrong' : '') : '',
        bg: shown && right ? '#F7C21A' : shown && picked ? '#111111' : '#FFFFFF',
        fg: shown && picked && !right ? '#FFFFFF' : '#111111',
        op: shown && !right && !picked ? 0.45 : 1,
        pick: () => {
          if (shown) return;
          clearTimeout(timer.current);
          setS({ ...s, pick: k, score: s.score + (right ? 1 : 0) });
        },
      };
    }),
  };
}
