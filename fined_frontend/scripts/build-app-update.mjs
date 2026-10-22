// Publishes a live update for the Android app alongside the website (Phase 4).
// Runs at the end of `npm run build`, but only on Vercel production deploys (or with FINED_APP_UPDATE=1).
//
// It builds the app's web code (vite.config.app.js) and writes, inside the website's dist/:
//   dist/app-update/manifest.json          what the app checks (no-cache; see vercel.json)
//   dist/app-update/files/<sha256>/<name>  every file, so phones download only what changed
//   dist/app-update/<build>.zip            the whole bundle, the fallback if the file-by-file download fails
//
// The website must never break because of the app, so ANY problem here only prints a warning and
// skips the app update; the website build still succeeds. Phones then simply keep their current version.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, relative, sep } from 'node:path';
import { zipSync } from 'fflate';
import { nativeFingerprint, readRecord, root } from './app-native.mjs';

const enabled = process.env.VERCEL_ENV === 'production' || process.env.FINED_APP_UPDATE === '1';
if (!enabled) {
  console.log('App live update: skipped (only built on Vercel production deploys, or with FINED_APP_UPDATE=1).');
  process.exit(0);
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

function listFiles(dir, base = dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) listFiles(full, base, out);
    else out.push(relative(base, full).split(sep).join('/'));
  }
  return out;
}

function buildId() {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14); // 20261022153000
  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7);
  return `${stamp}-${sha}`;
}

function publish() {
  const record = readRecord();
  const fingerprint = nativeFingerprint();
  if (record.fingerprint !== fingerprint) {
    throw new Error(
      'native pieces changed (a Capacitor plugin, capacitor.config.json or android/) since the last Play Store release, ' +
        "so today's web code may not run on installed apps. Ship a Play Store release, then run `npm run app:native-bump`.",
    );
  }

  const dist = join(root, 'dist');
  if (!existsSync(join(dist, 'index.html'))) throw new Error('website build missing (dist/index.html)');

  const build = buildId();
  const out = mkdtempSync(join(tmpdir(), 'fined-app-update-'));
  try {
    execFileSync(process.execPath, [join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'build', '--config', 'vite.config.app.js', '--outDir', out, '--emptyOutDir'], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, FINED_APP_BUILD: build },
    });

    const files = listFiles(out).sort();
    if (!files.includes('index.html')) throw new Error('app build has no index.html');

    // Never publish a test build to real phones.
    const code = files.filter((f) => /\.(js|html)$/.test(f)).map((f) => readFileSync(join(out, f), 'utf8')).join('\n');
    if (/fakeAuth0|Local Admin|localhost:8765/.test(code)) throw new Error('app build contains phone-test pieces (fake login or local API)');
    if (!code.includes(build)) throw new Error('app build is missing its build id');

    const target = join(dist, 'app-update');
    rmSync(target, { recursive: true, force: true });
    mkdirSync(join(target, 'files'), { recursive: true });

    const entries = [];
    const zipInput = {};
    for (const file of files) {
      const bytes = readFileSync(join(out, file));
      const hash = sha256(bytes);
      const name = basename(file);
      mkdirSync(join(target, 'files', hash), { recursive: true });
      copyFileSync(join(out, file), join(target, 'files', hash, name));
      entries.push({ file_name: file, file_hash: hash, download_url: `files/${hash}/${encodeURIComponent(name)}` });
      zipInput[file] = new Uint8Array(bytes);
    }

    const zip = Buffer.from(zipSync(zipInput, { level: 9 }));
    writeFileSync(join(target, `${build}.zip`), zip);

    const manifest = {
      build,
      minVersionCode: record.minVersionCode,
      createdAt: new Date().toISOString(),
      zip: { url: `${build}.zip`, checksum: sha256(zip), bytes: zip.length },
      files: entries,
    };
    writeFileSync(join(target, 'manifest.json'), `${JSON.stringify(manifest)}\n`);
    console.log(`App live update ${build}: ${entries.length} files, zip ${(zip.length / 1024 / 1024).toFixed(1)} MB, for app versionCode >= ${record.minVersionCode}.`);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

try {
  publish();
} catch (error) {
  console.warn(`\n⚠️  APP LIVE UPDATE NOT PUBLISHED: ${error.message}\n   The website is unaffected; phones keep their current app version.\n`);
}
