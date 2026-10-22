// Raise the app's version before each Play Store release:
//   npm run app:version            -> versionCode +1 (e.g. 3 -> 4), versionName unchanged
//   npm run app:version -- 1.2     -> versionCode +1 and versionName "1.2" (what users see)
// Google Play rejects an upload whose versionCode isn't higher than the last one.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './app-native.mjs';

const path = join(root, 'android', 'app', 'build.gradle');
let gradle = readFileSync(path, 'utf8');
const code = Number(gradle.match(/versionCode\s+(\d+)/)?.[1]);
const name = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
if (!code || !name) throw new Error('versionCode / versionName not found in android/app/build.gradle');

const newName = process.argv[2] || name;
if (!/^\d+(\.\d+){0,2}$/.test(newName)) throw new Error(`versionName should look like 1.2 or 1.2.3, got "${newName}"`);
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${code + 1}`).replace(/versionName\s+"[^"]+"/, `versionName "${newName}"`);
writeFileSync(path, gradle);
console.log(`versionCode ${code} -> ${code + 1}, versionName "${name}" -> "${newName}"`);
