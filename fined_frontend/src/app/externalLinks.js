// Outside links in the app (app build only):
//  - links to myfined.com open inside the app
//  - WhatsApp, LinkedIn, Instagram and similar are left to Android, which opens their apps
//  - everything else (article sources, authors' sites) opens in an in-app browser sheet
import { Browser } from '@capacitor/browser';
import { inAppPath, isOwnSiteUrl, navigateInApp } from './appNavigate';

const OPENS_IN_THEIR_APP =
  /(^|\.)(whatsapp\.com|wa\.me|linkedin\.com|lnkd\.in|instagram\.com|twitter\.com|x\.com|t\.me|telegram\.me|facebook\.com|youtube\.com|youtu\.be)$/i;

export function setupExternalLinks() {
  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      const link = event.target.closest?.('a[href]');
      if (!link) return;

      let url;
      try {
        url = new URL(link.href, window.location.href);
      } catch {
        return;
      }
      if (!/^https?:$/.test(url.protocol) || url.origin === window.location.origin) return;

      if (isOwnSiteUrl(url)) {
        event.preventDefault();
        navigateInApp(inAppPath(url));
        return;
      }
      if (OPENS_IN_THEIR_APP.test(url.hostname)) return;

      event.preventDefault();
      Browser.open({ url: url.href, toolbarColor: '#4100BC' }).catch(() => {});
    },
    true,
  );
}
