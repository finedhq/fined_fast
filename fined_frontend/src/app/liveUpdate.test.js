// Rules of the app's live updates (src/app/liveUpdate.js), with the native plugins faked.
// Run: npm test
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const updater = {
  notifyAppReady: vi.fn(async () => ({})),
  set: vi.fn(() => new Promise(() => {})), // reloads the app: never resolves
  download: vi.fn(),
};
const app = { getInfo: vi.fn(async () => ({ build: '3' })), addListener: vi.fn() };
const http = { get: vi.fn() };
const splash = { show: vi.fn(async () => {}), hide: vi.fn(async () => {}) };

vi.mock('@capgo/capacitor-updater', () => ({ CapacitorUpdater: updater }));
vi.mock('@capacitor/app', () => ({ App: app }));
vi.mock('@capacitor/splash-screen', () => ({ SplashScreen: splash }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => true, isPluginAvailable: () => true },
  CapacitorHttp: http,
}));

// In-memory localStorage (tests run in Node)
const memory = new Map();
globalThis.localStorage = {
  getItem: (k) => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: (k) => memory.delete(k),
};
const stored = (k) => JSON.parse(localStorage.getItem(k));
const store = (k, v) => localStorage.setItem(k, JSON.stringify(v));

const MANIFEST = {
  build: 'B2',
  minVersionCode: 1,
  zip: { url: 'B2.zip', checksum: 'abc' },
  files: [{ file_name: 'index.html', file_hash: 'h1', download_url: 'files/h1/index.html' }],
};

async function start({ build = 'B1', mode = 'production' } = {}) {
  vi.resetModules();
  vi.stubEnv('MODE', mode);
  vi.stubEnv('VITE_APP_BUILD', build);
  const mod = await import('./liveUpdate.js');
  return mod.setupLiveUpdates();
}

beforeEach(() => {
  vi.useFakeTimers();
  memory.clear();
  for (const fn of [...Object.values(updater), ...Object.values(app), http.get, splash.show, splash.hide]) fn.mockClear();
  http.get.mockResolvedValue({ status: 200, data: MANIFEST });
  updater.download.mockResolvedValue({ id: 'bundle-2', version: 'B2' });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

describe('live updates', () => {
  it('always confirms the running version started (rollback protection), even in test builds', async () => {
    await start({ mode: 'apptest' });
    expect(updater.notifyAppReady).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(10000);
    expect(http.get).not.toHaveBeenCalled(); // test builds never update
  });

  it('downloads a newer version in the background, file by file, without switching yet', async () => {
    expect(await start()).toBe(false);
    await vi.advanceTimersByTimeAsync(6000);
    expect(http.get.mock.calls[0][0].url).toBe('https://myfined.com/app-update/manifest.json');
    expect(updater.download).toHaveBeenCalledWith({
      url: 'https://myfined.com/app-update/B2.zip',
      version: 'B2',
      manifest: [{ file_name: 'index.html', file_hash: 'h1', download_url: 'https://myfined.com/app-update/files/h1/index.html' }],
    });
    expect(updater.set).not.toHaveBeenCalled();
    expect(stored('fined.update.ready')).toEqual({ build: 'B2', id: 'bundle-2', versionCode: 3 });
  });

  it('falls back to the whole zip (with checksum) if the file-by-file download fails', async () => {
    updater.download.mockRejectedValueOnce(new Error('delta failed')).mockResolvedValueOnce({ id: 'bundle-2' });
    await start();
    await vi.advanceTimersByTimeAsync(6000);
    expect(updater.download).toHaveBeenLastCalledWith({ url: 'https://myfined.com/app-update/B2.zip', version: 'B2', checksum: 'abc' });
    expect(stored('fined.update.ready')?.id).toBe('bundle-2');
  });

  it('switches on the next cold start, keeping the splash up', async () => {
    store('fined.update.ready', { build: 'B2', id: 'bundle-2', versionCode: 3 });
    expect(await start()).toBe(true);
    expect(updater.set).toHaveBeenCalledWith({ id: 'bundle-2' });
    expect(stored('fined.update.trying')).toBe('B2');
  });

  it('once running the new version, clears the bookkeeping', async () => {
    store('fined.update.trying', 'B2');
    store('fined.update.ready', { build: 'B2', id: 'bundle-2', versionCode: 3 });
    expect(await start({ build: 'B2' })).toBe(false);
    expect(stored('fined.update.trying')).toBeNull();
    expect(stored('fined.update.ready')).toBeNull();
    expect(updater.set).not.toHaveBeenCalled();
  });

  it('never retries a version that failed to start (the plugin rolled back)', async () => {
    store('fined.update.trying', 'B2');
    store('fined.update.ready', { build: 'B2', id: 'bundle-2', versionCode: 3 });
    expect(await start({ build: 'B1' })).toBe(false);
    expect(stored('fined.update.failed')).toEqual(['B2']);
    expect(updater.set).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(6000);
    expect(updater.download).not.toHaveBeenCalled(); // manifest still says B2: ignored
  });

  it('ignores versions that need a newer Play Store build', async () => {
    http.get.mockResolvedValue({ status: 200, data: { ...MANIFEST, minVersionCode: 4 } });
    await start();
    await vi.advanceTimersByTimeAsync(6000);
    expect(updater.download).not.toHaveBeenCalled();
  });

  it('drops a download made before a Play Store update', async () => {
    store('fined.update.ready', { build: 'B2', id: 'bundle-2', versionCode: 2 });
    expect(await start()).toBe(false);
    expect(updater.set).not.toHaveBeenCalled();
    expect(stored('fined.update.ready')).toBeNull();
  });

  it('does nothing when already up to date or offline', async () => {
    http.get.mockResolvedValueOnce({ status: 200, data: { ...MANIFEST, build: 'B1' } });
    await start();
    await vi.advanceTimersByTimeAsync(6000);
    expect(updater.download).not.toHaveBeenCalled();

    http.get.mockRejectedValueOnce(new Error('offline'));
    await start();
    await vi.advanceTimersByTimeAsync(6000);
    expect(updater.download).not.toHaveBeenCalled();
  });

  it('switches when the user comes back after 30+ minutes, not after a quick switch away', async () => {
    await start();
    await vi.advanceTimersByTimeAsync(6000);
    const onState = app.addListener.mock.calls.find(([name]) => name === 'appStateChange')[1];

    onState({ isActive: false });
    await vi.advanceTimersByTimeAsync(60 * 1000); // 1 minute away (e.g. sharing to WhatsApp)
    onState({ isActive: true });
    await vi.advanceTimersByTimeAsync(10);
    expect(updater.set).not.toHaveBeenCalled();

    onState({ isActive: false });
    await vi.advanceTimersByTimeAsync(31 * 60 * 1000);
    onState({ isActive: true });
    await vi.advanceTimersByTimeAsync(10);
    expect(splash.show).toHaveBeenCalled();
    expect(updater.set).toHaveBeenCalledWith({ id: 'bundle-2' });
  });
});
