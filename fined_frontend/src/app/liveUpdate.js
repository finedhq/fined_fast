// Live updates (app build only, Phase 4): new web code (e.g. Monday's module) reaches the app
// without a Play Store release. Self-hosted: every production website deploy also publishes
// https://myfined.com/app-update/manifest.json (scripts/build-app-update.mjs).
//
//  1. In the background, the app checks the manifest (at start-up and on return, at most every 30 min)
//     and downloads a newer version: only the files that changed, or the whole zip as a fallback.
//  2. The new version is switched to only behind the splash screen: on the next cold start, or when
//     the user returns after 30+ minutes away. Nobody is reloaded in the middle of a module.
//  3. If a new version fails to start, the plugin rolls back by itself (notifyAppReady never came)
//     and that version is never tried again.
//  4. Versions that need a newer Play Store build (manifest.minVersionCode) are ignored.
// Test builds (npm run app:test) never update, so they keep using the local test backend.
import { App } from '@capacitor/app';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

const MANIFEST_URL = 'https://myfined.com/app-update/manifest.json';
const THIS_BUILD = import.meta.env.VITE_APP_BUILD;
const ENABLED = import.meta.env.MODE === 'production';
const CHECK_EVERY_MS = 30 * 60 * 1000;
const APPLY_AFTER_AWAY_MS = 30 * 60 * 1000;

const READY_KEY = 'fined.update.ready'; // { build, id, versionCode }: downloaded, waiting to be switched to
const TRYING_KEY = 'fined.update.trying'; // build we just switched to; still set at next start = it failed
const FAILED_KEY = 'fined.update.failed'; // builds that failed to start: never again

let lastCheck = 0;
let hiddenAt = 0;
let checking = false;

function read(key, fallback = null) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function write(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: updates just wait for next time
  }
}

async function versionCode() {
  return Number((await App.getInfo()).build) || 0;
}

// Switch to the downloaded version. The plugin reloads the app into it, so set() never resolves;
// if it fails instead (the download was removed), forget it and carry on with this version.
function switchTo(ready) {
  write(TRYING_KEY, ready.build);
  CapacitorUpdater.set({ id: ready.id }).catch(() => {
    write(TRYING_KEY, null);
    write(READY_KEY, null);
    SplashScreen.hide().catch(() => {});
  });
}

// Called at start-up. Resolves true when the app is about to reload into a newer version
// (so the splash screen should stay up).
async function applyIfReady() {
  // Did the last switch fail? The plugin rolled back to an older version, so we're not on it.
  const tried = read(TRYING_KEY);
  if (tried) {
    write(TRYING_KEY, null);
    if (tried !== THIS_BUILD) {
      write(FAILED_KEY, [...read(FAILED_KEY, []), tried].slice(-20));
      write(READY_KEY, null);
      return false;
    }
  }

  const ready = read(READY_KEY);
  if (!ready) return false;
  if (ready.build === THIS_BUILD || read(FAILED_KEY, []).includes(ready.build)) {
    write(READY_KEY, null);
    return false;
  }
  // A Play Store update since the download replaces downloaded versions with the new built-in one.
  if (ready.versionCode !== (await versionCode())) {
    write(READY_KEY, null);
    return false;
  }
  switchTo(ready);
  return true;
}

async function fetchManifest() {
  const res = await CapacitorHttp.get({
    url: MANIFEST_URL,
    params: { t: String(Date.now()) },
    headers: { 'Cache-Control': 'no-cache' },
    responseType: 'json',
    connectTimeout: 15000,
    readTimeout: 15000,
  });
  if (res.status !== 200) return null;
  const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
  return data?.build && data?.zip?.url ? data : null;
}

async function download(manifest) {
  const abs = (path) => new URL(path, MANIFEST_URL).href;
  const zipUrl = abs(manifest.zip.url);
  if (manifest.files?.length) {
    try {
      // File by file: unchanged files are reused from the phone, so updates are small.
      const files = manifest.files.map((f) => ({ ...f, download_url: abs(f.download_url) }));
      return await CapacitorUpdater.download({ url: zipUrl, version: manifest.build, manifest: files });
    } catch {
      // fall back to the whole zip below
    }
  }
  return CapacitorUpdater.download({ url: zipUrl, version: manifest.build, checksum: manifest.zip.checksum });
}

async function checkForUpdate() {
  if (checking || Date.now() - lastCheck < CHECK_EVERY_MS) return;
  checking = true;
  lastCheck = Date.now();
  try {
    const manifest = await fetchManifest();
    if (!manifest || manifest.build === THIS_BUILD) return;
    if (read(FAILED_KEY, []).includes(manifest.build)) return;
    if (read(READY_KEY)?.build === manifest.build) return; // already downloaded
    const code = await versionCode();
    if (code < Number(manifest.minVersionCode || 0)) return; // needs a newer Play Store build

    const bundle = await download(manifest);
    write(READY_KEY, { build: manifest.build, id: bundle.id, versionCode: code });
  } catch {
    // offline, server down, download failed: try again later
  } finally {
    checking = false;
  }
}

function onAppState({ isActive }) {
  if (!isActive) {
    hiddenAt = Date.now();
    return;
  }
  const awayFor = hiddenAt ? Date.now() - hiddenAt : 0;
  hiddenAt = 0;
  if (awayFor > APPLY_AFTER_AWAY_MS && read(READY_KEY)) {
    // They've been away a while: switch now, behind the splash, instead of mid-session later.
    SplashScreen.show({ autoHide: false })
      .catch(() => {})
      .then(() => applyIfReady())
      .then((switching) => {
        if (!switching) SplashScreen.hide().catch(() => {});
      });
    return;
  }
  checkForUpdate();
}

// Returns a promise: true if the app is about to reload into a newer version.
export function setupLiveUpdates() {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('CapacitorUpdater')) return Promise.resolve(false);

  // Must come first, on every start: tells the plugin this version loaded fine (otherwise it rolls back).
  CapacitorUpdater.notifyAppReady().catch(() => {});
  if (!ENABLED) return Promise.resolve(false);

  const switching = applyIfReady().catch(() => false);
  switching.then((isSwitching) => {
    if (isSwitching) return;
    App.addListener('appStateChange', onAppState);
    setTimeout(checkForUpdate, 5000); // after start-up, so it doesn't compete with the first screen
  });
  return switching;
}
