//-- Disable SSR for all routes — auth tokens are stored in localStorage/sessionStorage
// (browser-only), so server-side rendering cannot enforce authorization. Making the
// app fully client-rendered prevents protected pages from being pre-rendered for
// unauthenticated users. --
export const ssr = false;
