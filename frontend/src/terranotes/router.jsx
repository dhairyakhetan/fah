// The handoff was written to run at the root of its own domain: every path in it is "/articles/…", "/photos"… and the
// address it reads back is the same. Inside AQ it lives under /terranotes. Rather than touch every path, this file
// stands between the handoff's code and React Router: what goes IN (Link to, navigate, Navigate) gains the prefix, what
// comes OUT (useLocation) has it stripped. Code under src/terranotes/ therefore keeps thinking in un-prefixed paths and
// must import router pieces from HERE, never from react-router-dom (lib/routes.js has the pure helpers).
import { forwardRef, useCallback, useMemo } from 'react';
import { Link as RRLink, Navigate as RRNavigate, useLocation as useRRLocation, useNavigate as useRRNavigate } from 'react-router-dom';
import { withBase, stripBase } from './lib/base.js';

export { Routes, Route, useParams, useNavigationType, useSearchParams } from 'react-router-dom';

const prefixed = (to) => {
  if (typeof to === 'string') return withBase(to);
  if (to && typeof to === 'object' && to.pathname != null) return { ...to, pathname: withBase(to.pathname) };
  return to;
};

export const Link = forwardRef(function Link({ to, ...rest }, ref) {
  return <RRLink ref={ref} to={prefixed(to)} {...rest} />;
});

export function Navigate({ to, ...rest }) {
  return <RRNavigate to={prefixed(to)} {...rest} />;
}

export function useLocation() {
  const loc = useRRLocation();
  return useMemo(() => ({ ...loc, pathname: stripBase(loc.pathname) }), [loc]);
}

export function useNavigate() {
  const navigate = useRRNavigate();
  return useCallback((to, opts) => (typeof to === 'number' ? navigate(to) : navigate(prefixed(to), opts)), [navigate]);
}
