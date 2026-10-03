import type { ComponentType } from 'react'

/**
 * The mini games. One entry per game; the hub (/games), each game's page (/games/:slug) and the "mini games" column of
 * the full menu all read this list, so adding a game is one entry here plus its component file.
 *
 *   {
 *     slug: 'river-run',                       // the URL: /games/river-run
 *     title: 'River Run',
 *     blurb: 'One line for the hub card and the menu.',
 *     hue: 'var(--sky)',                       // the card and menu-pill accent (an existing --token)
 *     load: () => import('./river-run/RiverRun'),   // a string-literal import(), so Rollup cuts its own chunk
 *   }
 *
 * The component takes no props. It draws inside the page's container, sized to its parent, and owns its own keyboard and
 * touch handling. Games must honour prefers-reduced-motion and never write to the database without the mutation
 * conventions in CLAUDE.md (toast on success and failure, pending state).
 */
export interface MiniGame {
  slug: string
  title: string
  blurb: string
  hue: string
  load: () => Promise<{ default: ComponentType }>
}

export const GAMES: MiniGame[] = []

export const gameBySlug = (slug: string | undefined) => GAMES.find(g => g.slug === slug)
