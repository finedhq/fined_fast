// Build config for the mobile app (Capacitor). The website keeps using vite.config.js unchanged.
// Differences from the website build:
//  - fonts are bundled (src/app/appFonts.css) instead of loaded from Google Fonts
//  - Google Tag Manager is left out of the app
//  - src/app/appEntry.js runs at start-up (splash screen, fonts)
//  - import.meta.env.VITE_NATIVE_APP is 'true', for app-only code paths
//  - src/app/appShell.js (empty on the website) becomes the tab bar + top bar layout
//  - '@auth0/auth0-react' becomes src/app/auth0Native.jsx: sign-in in a browser tab that returns to the app
import { existsSync } from 'node:fs';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import base from './vite.config.js';

const appShell = fileURLToPath(new URL('./src/app/appShell.app.js', import.meta.url));
// Real Auth0 login for the app (src/app/auth0Native.jsx wraps the original library)
const auth0Native = fileURLToPath(new URL('./src/app/auth0Native.jsx', import.meta.url));
const auth0Original = fileURLToPath(new URL('./node_modules/@auth0/auth0-react/dist/auth0-react.esm.js', import.meta.url));

const GTM_HEAD = /[ \t]*<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->\n?/;
const GTM_BODY = /[ \t]*<!-- Google Tag Manager \(noscript\) -->[\s\S]*?<!-- End Google Tag Manager \(noscript\) -->\n?/;
const GOOGLE_FONTS = /[ \t]*<link[^>]+fonts\.googleapis\.com[^>]*>\n?/;

function appHtml() {
  return {
    name: 'fined-app-html',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        for (const pattern of [GTM_HEAD, GTM_BODY, GOOGLE_FONTS]) {
          if (!pattern.test(html)) throw new Error(`vite.config.app.js: index.html no longer matches ${pattern}`);
          html = html.replace(pattern, '');
        }
        // app screens don't pinch-zoom (the website keeps zoom)
        const VIEWPORT = '<meta name="viewport" content="width=device-width, initial-scale=1.0" />';
        if (!html.includes(VIEWPORT)) throw new Error('vite.config.app.js: index.html viewport tag changed');
        html = html.replace(VIEWPORT, '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />');
        return html.replace(
          '<script type="module" src="/src/main.jsx"></script>',
          '<script type="module" src="/src/app/appEntry.js"></script>\n  <script type="module" src="/src/main.jsx"></script>',
        );
      },
    },
  };
}

export default mergeConfig(base, {
  plugins: [appHtml()],
  // the website imports an empty src/app/appShell.js; the app gets the real tab bar layout
  resolve: {
    alias: [
      { find: /^\.\.\/app\/appShell$/, replacement: appShell },
      { find: /^@auth0\/auth0-react$/, replacement: auth0Native },
      { find: /^@fined\/auth0-react-original$/, replacement: auth0Original },
    ],
  },
  define: {
    'import.meta.env.VITE_NATIVE_APP': JSON.stringify('true'),
    // push notifications only with Firebase configured; registering without it crashes the app (src/app/push.js)
    'import.meta.env.VITE_PUSH_ENABLED': JSON.stringify(String(existsSync(fileURLToPath(new URL('./android/app/google-services.json', import.meta.url))))),
    // identifies this web code for live updates (src/app/liveUpdate.js); set by scripts/build-app-update.mjs
    'import.meta.env.VITE_APP_BUILD': JSON.stringify(process.env.FINED_APP_BUILD || `builtin-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}`),
  },
});
