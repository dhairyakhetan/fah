import { Link, useLocation, useNavigate } from '../router.jsx';
import { openedFromHome } from '../lib/routes.js';

// "Back to home" link. Opened from the home page: a real Back (same scroll spot, the card flies back into place).
// Otherwise (a shared link, a reload…): an ordinary link to /.
export default function BackHome({ children, onClick, ...rest }) {
  const { key } = useLocation();
  const nav = useNavigate();
  const back = (e) => {
    onClick?.(e);
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    if (openedFromHome(key)) { e.preventDefault(); nav(-1); }
  };
  return <Link to="/" onClick={back} {...rest}>{children}</Link>;
}
