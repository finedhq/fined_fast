# FinEd Android app (Capacitor) — handoff notes

The app is the existing React site wrapped with **Capacitor 8**, Android first. App name **FinEd**, app ID **`in.fined.app`** (permanent — never change it).

**Golden rule: the website must never break.** Every app change is app-only, and the website is checked after every change (see "Website safety").

## Status (2026-10-22)

| Phase | What | Status |
|---|---|---|
| 0 | Capacitor + Android project, Lenis off in the app | Done, tested on a real phone |
| 1 | Bundled fonts, no Google Tag Manager in the app, Sentry `platform` tag, FinEd icon + splash, release-signing setup | Done (Auth0 login deferred, see below) |
| 2 | App navigation: top bar + 4-tab bar (Home, Courses, Articles, Profile), Profile settings list, welcome screen, Android back button, in-app browser for outside links, screen transitions, App Links | Done, tested on a real phone |
| 3 | Native feel: white system bars + light-only theme, no browser behaviours, keyboard handling, offline banner, loading skeleton, native share + certificate save, haptics, smoother module scrolling | **Built; only partly tested on a phone** (status bar confirmed white). Still to test: keyboard on Feedback/Contact, share sheet, certificate save, haptics, offline banner (airplane mode), module scroll smoothness |
| 4 | Live updates (new modules without a store release) | Not started |
| 5 | Push notifications (Firebase) | Not started |
| 5.5 | **Real Auth0 login in the app** | Deferred by the owner — must be done before real-data testing and Phase 6 |
| 6 | Play Store launch | Not started |
| 7 | Offline modules, iOS, extras | Later |

## How the app differs from the website (and stays out of it)

- **`vite.config.app.js`** is the app build. It removes GTM + Google Fonts from the app's `index.html`, turns off pinch-zoom, adds `src/app/appEntry.js` (start-up code), sets `import.meta.env.VITE_NATIVE_APP`, and swaps `src/app/appShell.js` (empty on the website) for `appShell.app.js` (the tab-bar layout).
- **All app code lives in `src/app/`.** The website never imports it, except `MainLayout.jsx`, which imports `appShell.js` (`null` on the website).
- **Shared files touched** (website behaviour unchanged):
  - `MainLayout.jsx` (the app-shell switch)
  - `main.jsx` (Sentry `platform` tag)
  - six pages that now use `src/hooks/useSmoothScroll.js` (Lenis, skipped in the app; also fixes an animation loop that never stopped)
  - `ContactPage.jsx` (unused import removed)
- Sharing, certificate downloads and haptics work **without changing website code**: `shareAndSave.js` gives the app `navigator.share` / `window.saveAs` backed by Android's share sheet, and `haptics.js` reacts to classes the module pages already set.

## Website safety

```bash
npm run check:website
```
This builds the site and fails if anything app-only leaked in, or if GTM / Google Fonts / pinch-zoom went missing. Also open key pages in a browser (Home, Courses, Articles, About, Contact, Help). Note: `npm run app:test` overwrites `dist/`, so never inspect `dist/` after an app build and call it the website.

## Building and testing on a phone

**One-time setup**
1. Android Studio (for the SDK).
2. **Java 21** — Android Studio's bundled Java 25 is too new for this Gradle. Unpack Temurin 21 into `~/.jdks/` (or set `JAVA21_HOME`). `scripts/android-build.mjs` finds it.
3. If Gradle can't download itself (it timed out on GitHub on the owner's PC), fetch `gradle-8.14.3-all.zip` with curl into `~/.gradle/wrapper/dists/gradle-8.14.3-all/<hash>/` and re-run.
4. Phone: Developer options → USB debugging; accept "Allow USB debugging".
5. **`fined_frontend/.env`** (not in git; ask the owner for it). Even the fake-login test build needs `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` to be set: without them the app shows a **blank white screen** (`Auth0ProviderWithNavigate` renders nothing). Placeholder values are enough for `npm run app:test`.

**Build**
- `npm run app:test` — app build with a **fake signed-in admin** (`app-test/fakeAuth0.js`), API at `http://localhost:8765` (`.env.apptest`), then sync and debug APK.
- `FAKE_LOGGED_OUT=1 npx vite build --config vite.config.apptest.js --mode apptest && npx cap sync android && npm run app:android:debug` — logged-out build, to preview the welcome screen.
- Install: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`. Some phones (OPPO) ask for approval on screen.

**Backend for phone tests**
- The phone reaches the laptop over USB: `adb reverse tcp:8765 tcp:8765`.
- The owner tested against a local fake backend that isn't in the repo.
- Alternative: run the real backend locally on port 8765 with `ENVIRONMENT=development` against the **practice** Supabase. In development mode requests without a token are treated as admin, which matches the fake login.
- **Never point a test build at production.**

**Debugging:** debug builds allow Chrome DevTools on the WebView (`chrome://inspect`).

## Phase 3 phone test checklist

Already checked in a phone-sized desktop browser (2026-10-22, app test build, stand-in API): tab bar hides when the keyboard class is set; offline banner and "Back online" appear and clear; one buzz per quiz answer, FinStars pulse and confetti burst; certificate PNG and PDF saves go to the share sheet instead of a browser download; Profile, Feedback, Contact, Courses and Articles open inside the app shell. So on the phone, mainly confirm the **Android side** works.

Use `npm run app:test`, install, `adb reverse tcp:8765 tcp:8765`, backend running on the practice database. Keep `chrome://inspect` open to catch errors.

| # | Test | Steps | Pass if |
|---|---|---|---|
| 1 | Keyboard | Profile → Send feedback; tap Name, then a field low on the page (the last question). Repeat on Profile → Contact us. | Tab bar disappears while typing; the field you tapped stays visible above the keyboard; tab bar comes back when the keyboard closes; nothing jumps behind the white top bar. |
| 2 | Share sheet (article) | Open any article → Share → **Open Device Share Menu**. | Android share sheet opens with the article title and link; WhatsApp gets text + link. Cancelling shows no error toast. |
| 3 | Share sheet (certificate) | Course page or Profile → certificate → Share row → **More**. Needs a completed course on the practice database. | Share sheet offers the certificate **image** plus the text and verify link. (The LinkedIn and WhatsApp chips open the in-app browser instead.) |
| 4 | Certificate save | Certificate → **Download PDF**, then **Download image**. | Share sheet opens with the file ("Save to Files", Drive, WhatsApp…); the saved PDF opens and shows the certificate. |
| 5 | Haptics | Open a module; answer a quiz right, then another wrong; finish a module. | Short success buzz for right, firmer tap for wrong, light tap when FinStars tick up (not a double buzz), one celebration buzz at the confetti. Phone's "touch vibration" must be on. |
| 6 | Offline banner | On Home, turn on airplane mode; open a module; turn it off. | Dark "You're offline…" strip under the top bar on every screen, including the module; green "Back online" for about 2 seconds after reconnecting. |
| 7 | Module scrolling | Scroll a long module (e.g. Module 5) quickly, on the same OPPO. | Visibly smoother than the website in Chrome on the same phone; no figure jumping. For numbers: DevTools → Performance, record a scroll, compare dropped frames with the ~2.5% measured before. |

Note any failures with the screen, the phone model and Android version, and a screenshot.

## Test-only pieces to remove before any real release

- `vite.config.apptest.js`, `app-test/`, `.env.apptest`
- `"server": { "cleartext": true }` in `capacitor.config.json`
- `android:usesCleartextTraffic="true"` in `android/app/src/main/AndroidManifest.xml`

## Before the Play Store (Phase 6)

- **Auth0 in the app:**
  - native login via `@capacitor/browser` and an `in.fined.app://` callback;
  - add the callback / logout / origin URLs in the Auth0 dashboard (the owner does this).
- **Upload key:** the owner creates it; copy `android/keystore.properties.example` to `keystore.properties` (git-ignored); `npm run app:android:release` builds the signed bundle.
- **App Links:** publish `https://myfined.com/.well-known/assetlinks.json` with the release key's SHA-256 (the manifest filter is already in place).
- **Store listing:**
  - in-app account deletion (Google requires it);
  - data safety form;
  - "education, not financial services" declaration.

## Decisions so far (owner)

- Capacitor, no Ionic; keep React + Tailwind and the site's design.
- Tab bar option A (classic full-width).
- App icon and splash use `resources/app-logo.png` (full logo with wordmark) only.
- Contact page stays reachable in the app (from Profile). Landing, About and admin pages are hidden.
- Module scrolling in the app drops two phone-layout effects (step height animation, sticky-figure shadow). Measured on a Helio G85 phone: stutter frames fell from ~8% to ~2.5%. The website keeps both.
