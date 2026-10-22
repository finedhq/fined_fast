// PHONE TEST BUILD ONLY: never ship. The real app build (vite.config.app.js) with a fake
// signed-in admin in place of Auth0 (app-test/fakeAuth0.js), so the app can be tried before real
// Auth0 login exists. FAKE_LOGGED_OUT=1 swaps in a logged-out stand-in, to preview the welcome screen.
// API address comes from .env.apptest (`--mode apptest`); the phone reaches it over USB with
// `adb reverse`. Remove this file and app-test/ once the app has real Auth0 login.
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { mergeConfig } from 'vite';
import app from './vite.config.app.js';

const fakeAuth0 = fileURLToPath(
  new URL(process.env.FAKE_LOGGED_OUT ? './app-test/fakeAuth0LoggedOut.js' : './app-test/fakeAuth0.js', import.meta.url),
);

// REAL_LOGIN=1: keep the app's real Auth0 login (Phase 5.5) in a test build, to try sign-in on a phone
// against the local backend. Needs the Auth0 dashboard settings in MOBILE_APP.md.
export default process.env.REAL_LOGIN
  ? app
  : mergeConfig(app, {
      resolve: { alias: [{ find: /^@auth0\/auth0-react$/, replacement: fakeAuth0 }] },
    });
