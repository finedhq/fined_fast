// Safety check for the app work: builds the WEBSITE and fails if anything app-only leaked into it
// or anything the website needs went missing.  Run: npm run check:website
import { execSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const dist = join(root, 'dist');
const html = readFileSync(join(dist, 'index.html'), 'utf8');
const assets = readdirSync(join(dist, 'assets'));
const assetText = (re) =>
  assets.filter((f) => /\.(js|css)$/.test(f) && re.test(readFileSync(join(dist, 'assets', f), 'utf8')));

const checks = [
  ['Google Tag Manager still on the site', html.includes('googletagmanager.com/gtm.js')],
  ['Google Fonts still on the site', html.includes('fonts.googleapis.com')],
  ['pinch-zoom still allowed on the site', !html.includes('user-scalable=no')],
  ['no bundled app fonts', !assets.some((f) => /\.woff2?$/.test(f))],
  ['no fake login', !assets.some((f) => /fakeAuth0/.test(f))],
  ['no app layout (tab bar / top bar / welcome)', !assets.some((f) => /AppLayout|Welcome/i.test(f)) && assetText(/app-tabbar|app-welcome|app-skel-pulse/).length === 0],
  ['no app start-up code (splash, back button, link handling)', assetText(/Press back again to exit|fadeOutDuration|OPENS_IN_THEIR_APP|toolbarColor|appUrlOpen|app-keyboard-open|app-net-banner|Save or send your file/).length === 0],
  // Capacitor plugins register as name + {web: …}; the website should contain none of the app's plugins
  ['no app plugins (haptics, share, network…)', assetText(/[`"'](Haptics|Network|Share|Filesystem|Browser|SplashScreen|Keyboard|CapacitorUpdater|PushNotifications)[`"'],\{web:/).length === 0],
  ['no app sign-in (Auth0 in a browser tab)', !assets.some((f) => /auth0Native/.test(f)) && assetText(/in\.fined\.app/).length === 0],
  ['no app live updates', assetText(/app-update\/manifest\.json|fined\.update\.ready/).length === 0],
  ['no app push notifications', assetText(/fined\.push\.|pushNotificationActionPerformed/).length === 0],
  // the website's Google Analytics comes from Google Tag Manager; the app's Firebase Analytics stays out
  ['no app analytics (Firebase Analytics)', assetText(/[`"']FirebaseAnalytics[`"']|firebase\/analytics|setCurrentScreen/).length === 0],
  ['no app-only style overrides', assetText(/hero-device-tip\{display:none!important|overscroll-behavior-y:none|layout-reels .scrolly-step{transition:none!important/).length === 0],
];

let failed = 0;
for (const [label, ok] of checks) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) failed++;
}
if (failed) {
  console.error(`\n${failed} website check(s) failed.`);
  process.exit(1);
}
console.log('\nWebsite build OK: nothing app-only leaked in.');
