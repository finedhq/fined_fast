// Route change from outside React (back button, link handling, App Links). React Router's
// BrowserRouter listens for popstate, so it renders the new path. App build only.
export function navigateInApp(path, { replace = false } = {}) {
  if (replace) window.history.replaceState(window.history.state, '', path);
  else {
    const idx = (window.history.state?.idx ?? 0) + 1;
    window.history.pushState({ ...window.history.state, idx }, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }));
}

// FinEd's own web addresses: links to these open inside the app.
const OWN_HOSTS = new Set(['myfined.com', 'www.myfined.com']);

export function isOwnSiteUrl(url) {
  return OWN_HOSTS.has(url.hostname);
}

export function inAppPath(url) {
  return `${url.pathname}${url.search}${url.hash}`;
}
