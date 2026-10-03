import { useEffect, useState } from 'react'

/**
 * Terra Notes joins the nav bar (the top pill and the phone tab bar) at 5:45 pm IST on 29 Sep 2026 = 12:15 UTC.
 * Until then it is not in the bar; its route, the menus and the footer are untouched. Delete this file and the two
 * `useTerraNotesInNav()` call sites once the date has passed and the item should simply stay.
 * (Client clock: a visitor whose clock is wrong sees it early or late, and anyone can still open /terranotes by address.)
 */
export const TN_NAV_REVEAL_AT = Date.UTC(2026, 8, 29, 12, 15, 0)

export const terraNotesInNav = (now: number = Date.now()) => now >= TN_NAV_REVEAL_AT

/** True once the reveal time has passed; flips on its own if the page is open when the time arrives. */
export function useTerraNotesInNav(): boolean {
  const [shown, setShown] = useState(() => terraNotesInNav())
  useEffect(() => {
    if (shown) return
    const wait = TN_NAV_REVEAL_AT - Date.now()
    if (wait <= 0) { setShown(true); return }
    if (wait > 2 ** 31 - 1) return // setTimeout's ceiling: a page open for 24 days will pick it up on the next visit
    const t = setTimeout(() => setShown(true), wait)
    return () => clearTimeout(t)
  }, [shown])
  return shown
}
