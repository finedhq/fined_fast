// Google Analytics in the app (app build only): Firebase Analytics, linked to FinEd's GA4 property,
// so GA4 shows the website and the app side by side (Platform: Web / Android).
//  - Collection is off until this turns it on (AndroidManifest.xml), and it stays off in phone test
//    builds unless they're built with FINED_ANALYTICS_TEST=1, so practice-data testing doesn't land
//    in the real reports (vite.config.app.js sets VITE_ANALYTICS_ENABLED).
//  - No advertising ID and no ad personalisation (AndroidManifest.xml).
//  - One screen_view per app screen, named like the top bar (Home, Courses, Article, Module…).
//  - The website's own events (src/utils/analytics.js pushes them to window.dataLayer for Google Tag
//    Manager, which the app doesn't load) are forwarded with the same names and parameters.
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';
import { tabForPath, titleForPath } from './nativeApp';

const ENABLED =
  import.meta.env.VITE_FIREBASE_CONFIGURED === 'true' && import.meta.env.VITE_ANALYTICS_ENABLED === 'true';

// GA4 limits: parameter values up to 100 characters.
const clip = (value) => (typeof value === 'string' ? value.slice(0, 100) : value);

export function screenName(pathname) {
  if (pathname === '/') return 'Welcome';
  const tab = tabForPath(pathname);
  if (tab && tab.to === pathname) return tab.label;
  if (pathname.startsWith('/cards/')) return 'Module';
  if (pathname === '/try') return 'Try a module';
  if (pathname.startsWith('/onboarding')) return 'Onboarding';
  return titleForPath(pathname);
}

function log(name, params = {}) {
  const clean = Object.fromEntries(
    Object.entries(params)
      .filter(([, v]) => ['string', 'number', 'boolean'].includes(typeof v))
      .map(([k, v]) => [k, clip(v)]),
  );
  FirebaseAnalytics.logEvent({ name, params: clean }).catch(() => {});
}

// "/" shows nothing while sign-in is being restored, then either goes to Home or shows the welcome
// screen, so it's only counted when the welcome screen itself appears (Welcome.jsx calls this).
let reportScreen = null;
export function reportWelcomeShown() {
  reportScreen?.('/', true);
}

function trackScreens() {
  let last = '';
  let timer = 0;
  const report = (path = window.location.pathname, welcomeShown = false) => {
    if (path === '/' && !welcomeShown) return;
    if (path === last) return;
    last = path;
    FirebaseAnalytics.setCurrentScreen({ screenName: screenName(path), screenClassOverride: clip(path) }).catch(() => {});
  };
  reportScreen = report;
  // Wait until the screen settles, so instant hops aren't counted (e.g. a signed-in start passes
  // through the welcome screen on its way to Home).
  const reportSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(() => report(), 400);
  };
  for (const method of ['pushState', 'replaceState']) {
    const original = window.history[method];
    window.history[method] = function patched(...args) {
      const result = original.apply(this, args);
      reportSoon();
      return result;
    };
  }
  window.addEventListener('popstate', reportSoon);
  reportSoon();
}

function forwardWebsiteEvents() {
  const dataLayer = (window.dataLayer = window.dataLayer || []);
  const send = (item) => {
    if (!item || typeof item.event !== 'string' || item.event.startsWith('gtm.')) return;
    const { event, ...params } = item;
    log(event, params);
  };
  dataLayer.forEach(send); // anything pushed before start-up
  const push = dataLayer.push.bind(dataLayer);
  dataLayer.push = (...items) => {
    items.forEach(send);
    return push(...items);
  };
}

export function setupAnalytics() {
  if (!ENABLED) return;
  FirebaseAnalytics.setEnabled({ enabled: true }).catch(() => {});
  trackScreens();
  forwardWebsiteEvents();
}
