// TerraNotes draws inside a shadow root (TerraNotesRoot.jsx) so AQ's global CSS can't reach it. Anything that used to
// ask `document` for an element must ask the root instead, or it finds nothing. The root registers itself here.
let root = null;
let host = null;
let portals = null;
export const setRoot = (shadow, hostEl, portalsEl) => { root = shadow; host = hostEl; portals = portalsEl; };
export const clearRoot = (shadow) => { if (root === shadow) { root = null; host = null; portals = null; } };
export const tnRoot = () => root || document;   // ShadowRoot has getElementById / querySelector(All)
export const tnHost = () => host;
export const portalRoot = () => portals || document.body; // where pop-ups that the handoff put in <body> go: inside the shadow root, after the page
export const byId = (id) => tnRoot().getElementById(id);
export const $ = (sel) => tnRoot().querySelector(sel);
