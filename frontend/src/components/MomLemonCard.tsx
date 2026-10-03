import { Link } from 'react-router-dom'
import Img from './Img'
import { getInitials, hashColor } from '../lib/uiHelpers'
import { formatPeriod, type MemberOfMonthPick } from '../services/memberOfMonthService'
import { Sticker } from './Sticker'

interface MomLemonCardProps {
  mom: MemberOfMonthPick
  /**
   * Defaults to true (links out to the member's profile, per the home rail's
   * "See their month" placement). Pass false on the honoured member's OWN
   * profile (changelog/22-social-engine.md §22.4's second placement) - a
   * "go see them" link back to the page you are already on is circular, so
   * that instance renders as a static card with no outbound CTA instead.
   */
  linkToProfile?: boolean
}

/**
 * The one lemon-card presentation for changelog/22-social-engine.md §22.4:
 * a var(--r-outer) lemon fill, a 58px ink avatar, the mono "★ member of the
 * month" kicker, the name at 900/23px/var(--display), and the period line.
 * Shared by public/HomePage.tsx's right-rail (and phone) instance and the
 * profile placement below it, so there is exactly one card, not two forks of
 * one - see README.md's "if you end up with two X, one of them is wrong."
 *
 * Full-opacity `var(--ink)` throughout, never an alpha of it - the lemon
 * fill is exactly the saturated-hue case README.md's contrast note calls
 * out by name ("the MotM card's period line").
 *
 * `See what he did` / `See what she did` is the gendered pattern `15.4`
 * already flagged once (`Wish her`, itself only sample copy in the unrouted
 * feed/cards/CardCatalogue.tsx dev surface - see the PR report) - this uses
 * the neutral `See their month` everywhere the card appears, per 22.4.
 */
const CATEGORY_TO_STICKER_HUE: Record<string, 'welfare' | 'events' | 'content' | 'ops' | 'labs'> = {
  welfare: 'welfare', events: 'events', content: 'content', operations: 'ops', labs: 'labs',
}

export default function MomLemonCard({ mom, linkToProfile = true }: MomLemonCardProps) {
  const body = (
    <>
      <span className="mono mom-lemon-kicker">★ member of the month</span>
      <div className="avatar mom-lemon-avatar" style={{ background: hashColor(mom.memberName), overflow: 'hidden' }}>
        {mom.memberAvatarUrl
          ? <Img ctx="avatar" src={mom.memberAvatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
          : getInitials(mom.memberName)}
      </div>
      <div className="mom-lemon-name">{mom.memberName}</div>
      <div className="mono mom-lemon-period">{formatPeriod(mom.period)} · {mom.teamName}</div>
      {mom.citation && <p className="mom-lemon-citation">{mom.citation}</p>}
    </>
  )

  if (!linkToProfile) {
    // Only this placement (changelog/22.4's second one, on the honoured
    // member's OWN profile) ever renders exactly one of these cards on
    // screen at a time - the home rail's placement above stacks one per
    // team with a current pick (up to 8 at once), which is exactly the
    // "no cheap per-viewport cap" problem Sticker.tsx's own "max three per
    // viewport" rule exists for. A single celebratory sticker here is safe
    // in a way it would not be there.
    return (
      <div className="mom-lemon" style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', top: -14, right: -10, zIndex: 1 }}>
          <Sticker shape="burst12" hue={CATEGORY_TO_STICKER_HUE[mom.teamCategory] || 'welfare'} rotate={7} size={72} mark="heart" />
        </span>
        {body}
      </div>
    )
  }

  return (
    <Link to={`/member/${mom.memberUuid}`} className="mom-lemon">
      {body}
      <span className="mom-lemon-cta">See their month →</span>
    </Link>
  )
}
