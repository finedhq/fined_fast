// Run after a Play Store release that changed native pieces (a Capacitor plugin added or upgraded,
// capacitor.config.json, anything under android/):  npm run app:native-bump
// Records the new native fingerprint and sets minVersionCode to the current versionCode, so live
// updates resume - but only for phones that have installed that Play Store release.
import { writeFileSync } from 'node:fs';
import { androidVersionCode, nativeFingerprint, nativePlugins, readRecord, recordPath } from './app-native.mjs';

const before = readRecord();
const record = {
  _about: before._about,
  minVersionCode: androidVersionCode(),
  fingerprint: nativeFingerprint(),
  plugins: nativePlugins(),
};
writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);
console.log(`app-native.json: minVersionCode ${before.minVersionCode} -> ${record.minVersionCode}, fingerprint updated.`);
if (before.fingerprint && record.minVersionCode === before.minVersionCode && before.fingerprint !== record.fingerprint) {
  console.log(
    'Note: versionCode was not raised. Phones on the current Play Store build would get web code that needs the new native pieces.\n' +
      'Raise versionCode in android/app/build.gradle for the release, then run this again.',
  );
}
