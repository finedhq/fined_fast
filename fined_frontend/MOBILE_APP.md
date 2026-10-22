# FinEd Android app (Capacitor) — handoff notes

The app is the existing React site wrapped with **Capacitor 8**, Android first. App name **FinEd**, app ID **`in.fined.app`** (permanent — never change it).

**Golden rule: the website must never break.** Every app change is app-only, and the website is checked after every change (see "Website safety").

## Status (2026-10-22)

| Phase | What | Status |
|---|---|---|
| 0 | Capacitor + Android project, Lenis off in the app | Done, tested on a real phone |
| 1 | Bundled fonts, no Google Tag Manager in the app, Sentry `platform` tag, FinEd icon + splash, release-signing setup | Done (Auth0 login deferred, see below) |
| 2 | App navigation: top bar + 4-tab bar (Home, Courses, Articles, Profile), Profile settings list, welcome screen, Android back button, in-app browser for outside links, screen transitions, App Links | Done, tested on a real phone |
| 3 | Native feel: white system bars + light-only theme, no browser behaviours, keyboard handling, offline banner, loading skeleton, native share + certificate save, haptics, smoother module scrolling | **Done, tested on a real phone** (OPPO CPH2577, Android 15, 2026-10-22): all 7 checks in "Phase 3 phone test checklist" passed. Fixed during testing: share links and certificate QR codes said localhost (now myfined.com), certificate PDF went from ~29 s to ~12 s with a spinner while it works |
| 4 | Live updates (new modules without a store release), self-hosted | **Built, not yet tried on a phone.** Unit-tested (`npm test`) and the publish step tested locally. Goes live with the first Vercel production deploy after merge |
| 5 | Push notifications (Firebase): everything in the in-app bell also goes to the phone | **Built, switched off** until the owner creates the Firebase project (see "Owner setup"). Backend tested with fakes |
| 5.5 | Real Auth0 login in the app (browser tab that returns to the app) | **Sign-in, sign-up and sign-out tested on a real phone** (OPPO CPH2577, 2026-10-22, Google account, practice backend): lands on Home, stays signed in after reopening, Log out returns to the welcome screen |
| 6 | Play Store: in-app + web account deletion, release-only safety, store listing drafts | **Built** (deletion page, API, release guard, debug-only cleartext, no backups). **In-app account deletion tested on a real phone** (2026-10-22, throwaway Google account, practice backend): data rows and the Auth0 login both removed. A table missing from a database (practice lacks `reward_notifications`) is skipped instead of stopping the deletion. Store listing, data safety and release steps: `PLAY_STORE.md`. Needs the owner's accounts and decisions |
| 7 | Offline modules, iOS, extras | Later (owner's decision) |

## How the app differs from the website (and stays out of it)

- **`vite.config.app.js`** is the app build. It removes GTM + Google Fonts from the app's `index.html`, turns off pinch-zoom, adds `src/app/appEntry.js` (start-up code), sets `import.meta.env.VITE_NATIVE_APP`, and swaps `src/app/appShell.js` (empty on the website) for `appShell.app.js` (the tab-bar layout).
- **All app code lives in `src/app/`.** The website never imports it, except `MainLayout.jsx`, which imports `appShell.js` (`null` on the website).
- **Shared files touched** (website behaviour unchanged):
  - `MainLayout.jsx` (the app-shell switch)
  - `main.jsx` (Sentry `platform` tag)
  - six pages that now use `src/hooks/useSmoothScroll.js` (Lenis, skipped in the app; also fixes an animation loop that never stopped)
  - `ContactPage.jsx` (unused import removed)
- Sharing, certificate downloads and haptics work **without changing website code**: `shareAndSave.js` gives the app `navigator.share` / `window.saveAs` backed by Android's share sheet, and `haptics.js` reacts to classes the module pages already set.
- **Login (5.5):** the app build points `@auth0/auth0-react` at `src/app/auth0Native.jsx`, which wraps the real library. Sign-in/out open in a Chrome Custom Tab; Auth0 returns to `in.fined.app://<auth0 domain>/capacitor/in.fined.app/callback` (intent filter in `AndroidManifest.xml`). Website components are untouched.
  - Auth0 only accepts the token request from a web page whose address is on its *Allowed Origins (CORS)* list, and that list can only be edited with *Allow Cross-Origin Authentication* switched on for the whole tenant. Instead, `auth0Native.jsx` sends just that one request (`/oauth/token`: sign-in and refresh) through Android with `CapacitorHttp`, where the browser rule doesn't apply. No tenant setting changes.
  - "Create free account" opens the same Auth0 page as "Log in", like the website's Sign up button: FinEd signs in with Google, and a first sign-in creates the account. Asking Auth0 for its separate sign-up screen (`screen_hint: 'signup'`) fails with "connection not found for the client".
- **Live updates (4):** `src/app/liveUpdate.js` + `scripts/build-app-update.mjs`, details below.
- **Push (5):** `src/app/push.js` (app), `push_service.py` / `push_repo.py` + `migrations/004_push_tokens.sql` (backend). In-app notifications (`notification_service.send`) also go to phones.
- **Account deletion (6), the one website addition:** a new page `/delete-account` (`src/pages/Account/DeleteAccountPage.jsx`) on the site and in the app (Profile → Delete account), `deleteMyAccount()` in `services/api.js`, and `DELETE /api/v1/users/me` on the backend. Google needs both the in-app option and a web address.

## Website safety

```bash
npm run check:website
```
This builds the site and fails if anything app-only leaked in (now also the in-app login, live updates and push), or if GTM / Google Fonts / pinch-zoom went missing. Also open key pages in a browser (Home, Courses, Articles, About, Contact, Help). Note: `npm run app:test` overwrites `dist/`, so never inspect `dist/` after an app build and call it the website.

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

- `REAL_LOGIN=1 npx vite build --config vite.config.apptest.js --mode apptest && npx cap sync android && npm run app:android:debug`: test build with the **real Auth0 login** (needs the Auth0 settings in "Owner setup") against the local backend.

**Debugging:** debug builds allow Chrome DevTools on the WebView (`chrome://inspect`).

**Automated checks** (no phone needed): `npm test` (live-update rules), `npm run check:website`, and in `fined_backend`: `pytest tests/test_mobile_app.py` (push, tokens, account deletion; database, Firebase and Auth0 are faked).

## Phase 3 phone test checklist

**All 7 passed on the OPPO CPH2577 on 2026-10-22.** Kept as a checklist for future releases.

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

## Phase 4–6 phone tests (after the owner setup below)

| # | Test | Steps | Pass if |
|---|---|---|---|
| 1 | Real login | `REAL_LOGIN=1` test build (above). Welcome → Log in; sign in with Google; then Profile → Log out. | A browser sheet opens over the app, Google sign-in works, it closes by itself and you land on Home signed in. Log out returns to the welcome screen. Close and reopen the app: still signed in. |
| 2 | Sign-up | Welcome → Create free account. | Auth0 opens on the same page as Log in (Continue with Google); a new Google account lands on Home (or onboarding). |
| 3 | Push | Build with `android/app/google-services.json` present. Home shows "Keep your streak going" → Turn on → Allow. On the practice database, trigger a streak message (or send a test message from Firebase console → Messaging to the phone's token). | Notification shows with the star icon, purple tint. Tapping it opens Notifications. With the app open, it shows as a toast instead. |
| 4 | Account deletion | Profile → Delete account → type DELETE → delete. Use a throwaway account on the **practice** setup. | "Your account has been deleted", then the welcome screen. That account's rows are gone from practice Supabase and the user is gone from Auth0. |
| 5 | Live update | Needs a release build installed (live updates are off in test builds). Deploy a visible text change to production. Open the app, wait ~10 s, close it fully (swipe away), reopen. | The change appears on the second open. If not: `chrome://inspect` → console, and check `myfined.com/app-update/manifest.json` shows the new build. |

## Live updates (Phase 4): how they work and the one rule to remember

- Every **Vercel production deploy** runs `scripts/build-app-update.mjs` at the end of `npm run build`. It builds the app's web code and publishes it under `myfined.com/app-update/`: `manifest.json`, every file by content hash, and a zip as fallback. Preview deploys and local builds skip it (`FINED_APP_UPDATE=1` forces it). If anything goes wrong it **only warns**: the website deploy still succeeds and phones keep their version.
- The app checks the manifest at start-up and on return (at most every 30 min), downloads only changed files, and switches **behind the splash**: on the next cold start, or on return after 30+ minutes away. Nobody is reloaded mid-module.
- If a new version fails to start, the plugin rolls back by itself and the app never tries that version again.
- No Capgo account or cloud: `autoUpdate` and `statsUrl` are off in `capacitor.config.json`.
- **The rule: web code can't bring new native pieces.** `app-native.json` records the native shell: Capacitor plugins, `capacitor.config.json`, `android/` (including `google-services.json`). If any of these change, the deploy prints `APP LIVE UPDATE NOT PUBLISHED` and updates pause until you:
  1. raise the version (`npm run app:version`) and ship a Play Store release;
  2. run `npm run app:native-bump` and commit `app-native.json`.

  From then on, updates go only to phones with that release. Older installs keep their last version until they update from the Play Store.

## Owner setup (one-time, in this order)

**1. Auth0, so the app can sign in** (Auth0 dashboard → Applications → the FinEd website application → Settings). Replace `<AUTH0_DOMAIN>` with the `VITE_AUTH0_DOMAIN` value from `.env`:
- *Allowed Callback URLs*: add `in.fined.app://<AUTH0_DOMAIN>/capacitor/in.fined.app/callback`
- *Allowed Logout URLs*: add the same address
- *Allowed Web Origins*: add `https://localhost` (the app's own origin)
- Leave *Cross-Origin Authentication* and its *Allowed Origins (CORS)* box alone: the app doesn't need them (see "Login (5.5)" above)
- Advanced → Grant Types: *Refresh Token* ticked. Refresh Token Rotation: on. (The website already uses refresh tokens, so these are probably set already.)

**2. Auth0, so account deletion can remove the login** (Applications → Create Application → *Machine to Machine* → authorise **Auth0 Management API** with only the **`delete:users`** permission). Put its Client ID and Client Secret in the backend's environment as `AUTH0_MGMT_CLIENT_ID` / `AUTH0_MGMT_CLIENT_SECRET`. If `AUTH0_DOMAIN` is a custom domain (not `*.auth0.com`), also set `AUTH0_MGMT_DOMAIN` to the tenant's `*.auth0.com` domain. Until this is set, account deletion politely refuses and asks people to email support.

**3. Firebase, for push** (console.firebase.google.com):
- Create a project (Analytics not needed) → *Add app* → Android → package name `in.fined.app`.
- Download `google-services.json` → put it in `fined_frontend/android/app/` and **commit it** (it holds no secrets, and the live-update build needs it to know push is on).
- Project settings → Service accounts → *Generate new private key*. Put the whole JSON, on **one line**, in the backend's environment as `FIREBASE_SERVICE_ACCOUNT`. This one **is** secret: never commit it.

**4. Database:** run `fined_backend/migrations/004_push_tokens.sql` in the Supabase SQL editor, on practice first, then production.

**5. Backend dependency:** the backend host installs `google-auth` from `requirements.txt` on the next deploy.

**6. Vercel:** nothing to set. The build command must stay `npm run build` (the default), since it publishes the app updates.

## Releasing to the Play Store (Phase 6)

Full checklist, store listing text and data safety answers: **`PLAY_STORE.md`**. In short:
1. Owner setup above done; phone tests pass on a release build.
2. `npm run app:version -- 1.0` (raises versionCode; `1.0` is what users see).
3. `npm run app:release` builds the web code, syncs it into Android and builds the signed bundle `android/app/build/outputs/bundle/release/app-release.aab`. It **refuses** if the bundle contains the fake login, a local backend, or lacks the real login.
4. If native pieces changed since the last release: `npm run app:native-bump`, commit.
5. Upload to Play Console.

## Test-only pieces (kept for phone testing; they can't reach a release)

- `vite.config.apptest.js`, `app-test/`, `.env.apptest`: only used by `npm run app:test`. The release build uses `vite.config.app.js`, and `npm run app:release` refuses a bundle containing them.
- Unencrypted traffic to `http://localhost:8765` is allowed only in **debug** builds (`android/app/src/debug/AndroidManifest.xml`). It used to be in `capacitor.config.json`, which Capacitor also copies into release builds; removed.
- Live updates are off in test builds, so a test app never swaps itself for the production one.

## Decisions so far (owner)

- Capacitor, no Ionic; keep React + Tailwind and the site's design.
- Tab bar option A (classic full-width).
- App icon and splash use `resources/app-logo.png` (full logo with wordmark) only.
- Contact page stays reachable in the app (from Profile). Landing, About and admin pages are hidden.
- Module scrolling in the app drops two phone-layout effects (step height animation, sticky-figure shadow). Measured on a Helio G85 phone: stutter frames fell from ~8% to ~2.5%. The website keeps both.
- Live updates: free and self-hosted (open-source Capgo plugin, files on myfined.com), published with every production website deploy.
- Push: whatever lands in the in-app bell also goes to the phone. No separate marketing pushes yet.
- Account deletion: instant and self-serve (data, then the Auth0 login), plus `myfined.com/delete-account` for the web.
- App data is not backed up to the cloud or copied to new phones (`allowBackup="false"`): users sign in again on a new phone.
