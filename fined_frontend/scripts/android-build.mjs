// Builds the Android app with Java 21 (Android Studio's bundled Java is too new for this Gradle).
//   node scripts/android-build.mjs debug     -> android/app/build/outputs/apk/debug/app-debug.apk
//   node scripts/android-build.mjs release   -> android/app/build/outputs/bundle/release/app-release.aab
// Java 21 is taken from JAVA21_HOME, or the newest jdk-21* folder in ~/.jdks.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kind = process.argv[2] || 'debug';
const task = { debug: 'assembleDebug', release: 'bundleRelease' }[kind];
if (!task) {
  console.error('Usage: node scripts/android-build.mjs [debug|release]');
  process.exit(1);
}

function findJava21() {
  if (process.env.JAVA21_HOME) return process.env.JAVA21_HOME;
  const jdks = join(homedir(), '.jdks');
  if (!existsSync(jdks)) return null;
  const found = readdirSync(jdks).filter((d) => /^jdk-21/.test(d)).sort().pop();
  return found ? join(jdks, found) : null;
}

const javaHome = findJava21();
if (!javaHome) {
  console.error('Java 21 not found. Set JAVA21_HOME or unpack a JDK 21 into ~/.jdks.');
  process.exit(1);
}

const androidDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'android');
if (kind === 'release' && !existsSync(join(androidDir, 'keystore.properties'))) {
  console.error('android/keystore.properties is missing, so the release build would be unsigned. See keystore.properties.example.');
  process.exit(1);
}

// A Play Store build must never contain the phone-test pieces (fake login, local test backend).
if (kind === 'release') {
  const web = join(androidDir, 'app', 'src', 'main', 'assets', 'public');
  const files = existsSync(join(web, 'assets')) ? readdirSync(join(web, 'assets')).filter((f) => f.endsWith('.js')) : [];
  const code = files.map((f) => readFileSync(join(web, 'assets', f), 'utf8')).join('\n');
  const problems = [
    [!files.length, 'no web build synced into android/ (run `npm run app:release`, not this script directly)'],
    [/fakeAuth0|Local Admin/.test(code), 'it contains the FAKE login from the phone-test build'],
    [/localhost:8765|http:\/\/localhost:8000/.test(code), 'it points at a local test backend, not the real API'],
    [!/capacitor\/\$\{|\/capacitor\/in\.fined\.app\/callback/.test(code), 'the real in-app Auth0 login is missing'],
  ].filter(([bad]) => bad);
  if (problems.length) {
    console.error('Refusing to build a Play Store release:');
    for (const [, why] of problems) console.error(`  - ${why}`);
    process.exit(1);
  }
}

// Full path to the wrapper: Windows may be set not to run programs from the current folder by name.
const isWindows = process.platform === 'win32';
const [cmd, args] = isWindows
  ? ['cmd.exe', ['/d', '/s', '/c', `""${join(androidDir, 'gradlew.bat')}" ${task} --console=plain"`]]
  : [join(androidDir, 'gradlew'), [task, '--console=plain']];
const result = spawnSync(cmd, args, {
  cwd: androidDir,
  stdio: 'inherit',
  windowsVerbatimArguments: isWindows,
  env: { ...process.env, JAVA_HOME: javaHome },
});
process.exit(result.status ?? 1);
