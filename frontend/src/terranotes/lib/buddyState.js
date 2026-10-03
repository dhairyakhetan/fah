import { useEffect, useState } from 'react';

// Buddy the ghost (shared/buddy/): whether he's been called. Memory only, so he stays while you move between pages
// and is gone after a reload. Components talk through window events: 'aq-buddy' (he arrives), 'aq-games' (open his
// games popup, detail = 'snake' | 'float').
let called = false;
export function callBuddy() {
  called = true;
  dispatchEvent(new Event('aq-buddy'));
}
// → { here, fresh }: fresh = he was called while this component was on screen (so it plays his entrance)
export function useBuddy() {
  const [here, setHere] = useState(called);
  const [fresh, setFresh] = useState(false);
  useEffect(() => { const on = () => { setHere(true); setFresh(true); }; addEventListener('aq-buddy', on); return () => removeEventListener('aq-buddy', on); }, []);
  return { here, fresh };
}
export const openGames = (game) => dispatchEvent(new CustomEvent('aq-games', { detail: game }));
