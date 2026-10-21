// App Links (app build only): when a myfined.com link opens the app, show that page.
// Covers both a cold start (launch URL) and the app already running (appUrlOpen).
import { App } from '@capacitor/app';
import { inAppPath, isOwnSiteUrl, navigateInApp } from './appNavigate';

function openLink(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return;
  }
  if (!isOwnSiteUrl(url)) return;
  const path = inAppPath(url);
  if (path !== `${window.location.pathname}${window.location.search}${window.location.hash}`) navigateInApp(path);
}

export function setupAppLinks() {
  App.addListener('appUrlOpen', ({ url }) => openLink(url));
  App.getLaunchUrl()
    .then((launch) => launch?.url && openLink(launch.url))
    .catch(() => {});
}
