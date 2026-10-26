# FinEd on Google Play: launch checklist

Companion to `MOBILE_APP.md`. Everything here is a draft for the owner to check: store text, form answers and policy wording are FinEd's own statements to Google and to users.

## 1. Decisions only the owner can make

| # | Decision | Why it matters | Suggested |
|---|---|---|---|
| 1 | **Target age** in Play Console | The privacy policy says accounts are **18+**. FinEd's audience is 15–35. Choosing any age under 18 brings in Google's Families policy (stricter ads, data and content rules, teacher-approved reviews). | Declare **18+** for launch, matching the privacy policy. Revisit with a lawyer before inviting under-18s. |
| 2 | **Data shared with partners** | The data safety form says no data is shared with third parties (service providers don't count). If anonymised insights go to financial-institution partners, the form, the privacy policy and possibly user consent must change *before* that starts. | Launch with "not shared". Update both when the first partnership is signed. |
| 3 | **Developer account type** | An **organisation** account skips the personal-account rule of a 14-day closed test with 12+ testers before production. It needs a D-U-N-S number, which needs a registered business. The privacy policy says FinEd isn't incorporated yet. | If not incorporated: personal account, and recruit 12+ testers for 14 days (team, friends, WhatsApp community). |
| 4 | **Privacy policy update** (section 5 below) | Google checks that the policy covers what the app collects: push tokens, Firebase. | Approve the wording below, then it goes on the website. |

**Owner's decisions (2026-10-23):**
1. Target age: **18+**.
2. Data sharing: **not shared** (service providers only). Revisit before any partner data deal.
3. Account type: **personal** (chosen at signup). So a closed test with **12+ testers for 14 days in a row** is needed before production.
4. Privacy policy: approved with the app paragraphs and self-serve account deletion. Now in `src/pages/StaticPages/PrivacyPolicy.jsx` on this branch, so it goes live in the same website deploy as `/delete-account`. Set `LAST_UPDATED` to that day.

## 2. Accounts and keys (owner)

1. **Google Play developer account**: play.google.com/console, one-time US$25. Use a shared FinEd Google account, not a personal one.
2. **Upload key**: on your PC, once:
   ```bash
   keytool -genkeypair -v -keystore fined-upload.jks -alias fined-upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   Keep `fined-upload.jks` and its passwords in a password manager, plus one offline backup. **Never commit it.** Copy `android/keystore.properties.example` to `android/keystore.properties` and fill it in (git-ignored).
3. **Play App Signing**: accept it when creating the app (Google keeps the real signing key; the upload key above can be reset if lost).

## 3. Release checklist

- [ ] Owner setup in `MOBILE_APP.md` done (Auth0 ×2, Firebase, migration 004).
- [ ] Phase 3 and Phase 4–6 phone tests pass on a **release** build (`npm run app:release`, then install the `.aab` via Play's internal testing track).
- [ ] `npm run check:website` passes; website spot-checked.
- [ ] `npm run app:version -- 1.0`, then `npm run app:release` → `android/app/build/outputs/bundle/release/app-release.aab`.
- [ ] `npm run app:native-bump` and commit `app-native.json` (first release: records the shipped native shell, so live updates start).
- [ ] Play Console → create app "FinEd", default language English (India), App, Free.
- [ ] Store listing (section 4), graphics, data safety (section 6), declarations (section 7).
- [ ] Testing → Internal testing: upload the `.aab`, add the team, install from the Play link, run the phone tests once more.
- [ ] Closed testing (personal accounts: 12+ testers, 14 days) → Production.
- [ ] **App Links**: Play Console → Test and release → App integrity → App signing → copy the *Digital Asset Links JSON*. Save it as `fined_frontend/public/.well-known/assetlinks.json` and deploy the website. After that, myfined.com course and article links open straight in the app (the manifest side is already done).
- [ ] Data deletion URL in Play Console: `https://myfined.com/delete-account`.

## 4. Store listing (draft)

**App name** (30 max): `FinEd: Learn Money Skills`

**Short description** (80 max): `Learn personal finance in 10 minutes a day: bite-sized, interactive, free.`

**Full description** (4,000 max):

> Money skills nobody taught you in school, in 10 minutes a day.
>
> FinEd is a free, interactive way to learn personal finance, made for young Indians. No jargon, no lectures, no fees. Just short lessons you can finish on the bus.
>
> WHAT YOU'LL LEARN
> • How the stock market works, from a company's idea to its ticker
> • IPOs, demat accounts and what really happens when you buy a share
> • Reading price charts without the jargon
> • Inflation, diversification and building a sensible mix
> • Plus explainers on personal finance, IPOs, investing and the economy
>
> (Owner: check these lines against the courses that are live on launch day.)
>
> WHY FINED
> • Bite-sized modules: scroll through a story, with charts and tools that move as you learn
> • Quick checks after each idea, so it sticks
> • Earn FinStars, keep your streak, climb the leaderboard
> • Certificates you can share on LinkedIn
> • Plain-language articles on money, markets and the economy
> • New modules every week
>
> FinEd is for education only. It doesn't sell financial products or give personal investment advice.

**Category**: Education. **Tags**: Education, Finance-related learning.
**Contact email**: support@myfined.com. **Website**: https://myfined.com. **Privacy policy**: https://myfined.com/privacy-policy

**Graphics needed** (owner/design):
- App icon 512×512 PNG (from `resources/app-logo.png`).
- Feature graphic 1024×500 (Canva works well).
- 2–8 phone screenshots, portrait, e.g. 1080×2400: Home, a module mid-scroll, a quick check, Courses, a certificate. Take them on the phone from a release build with a real account.

## 5. Privacy policy additions (draft, for the owner to approve)

Add to *3. What we collect*, a new paragraph:
> **If you use the FinEd Android app.** We collect the same account and learning data as on the website. If you turn on notifications, we also store a notification token for your phone (from Google Firebase), so we can send you reminders and updates. We delete it when you sign out or delete your account. The app also sends crash reports (Sentry) so we can fix problems, and usage analytics via Google Analytics for Firebase (screens opened, actions such as sharing an article), linked to an app-installation ID rather than your name or email. It doesn't collect advertising IDs, and ad personalisation is off.

Add to *7. Who we share data with*, in the list:
> Google Firebase: delivering app notifications (Cloud Messaging) and measuring app usage (Google Analytics for Firebase).

(Done in `PrivacyPolicy.jsx`, 2026-10-25: the app uses Google Analytics for Firebase, linked to the website's GA4 property. Sentry session replays are off in the app.)

Add to *10. Your rights*, after the list:
> You can delete your account yourself at any time, in the app (Profile → Delete account) or at myfined.com/delete-account.

Then update `LAST_UPDATED` in `src/pages/StaticPages/PrivacyPolicy.jsx`.

## 6. Data safety form (draft answers)

Collection and security:
- Does the app collect or share user data? **Yes, collects.** Shared with third parties: **No** (only service providers acting for FinEd: Auth0, Supabase, Sentry, Firebase).
- Encrypted in transit: **Yes** (release builds only allow HTTPS).
- Users can request deletion: **Yes**. In the app, plus `https://myfined.com/delete-account`.

| Data type | Collected | Purpose | Optional? |
|---|---|---|---|
| Personal info → Name | Yes | Account management, app functionality | Required |
| Personal info → Email address | Yes | Account management, app functionality, developer communications | Required |
| Personal info → User IDs (Auth0 account id) | Yes | Account management | Required |
| App activity → App interactions (course progress, quiz answers, streaks; screens viewed and actions such as sharing, via Google Analytics for Firebase) | Yes | App functionality, Analytics | Required |
| App activity → Other user-generated content (feedback, contact messages, ratings) | Yes | App functionality | Optional |
| App info and performance → Crash logs, Diagnostics (Sentry) | Yes | App functionality (fixing crashes) | Required |
| Device or other IDs (notification token; Firebase app-installation ID for analytics) | Yes | App functionality (notifications), Analytics | Required (the analytics ID); the notification token only if notifications are allowed |
| Location, contacts, photos, files, messages, health, financial info | **No** | | |

Check before submitting: whether profile fields (career stage, financial level, onboarding answers) should be listed as "Other info". They are optional, used for personalisation.

## 7. Declarations in Play Console

- **Ads**: no ads.
- **Advertising ID**: the app does **not** use it. The `AD_ID` permission is removed in `AndroidManifest.xml` and ad-ID collection is off, so answer "No" to "Does your app use advertising ID?".
- **App access**: features need sign-in. Give reviewers a test account (email/password login on Auth0) with a few modules done. Without one, review often fails.
- **Content rating** (IARC questionnaire): Education; no violence, sexuality, gambling or user-to-user chat. Expected: Everyone / 3+.
- **Target audience**: 18+ (see decision 1).
- **Financial features**: "My app doesn't provide any financial features". FinEd teaches, it doesn't offer loans, trading, payments or advice. FinStar rewards: answer "no real-money gambling".
- **News app**: No (articles are explainers, not a news app).
- **Government app / Health / COVID**: No.
- **Data safety**: section 6.
- **Account deletion**: yes, in-app, plus web URL `https://myfined.com/delete-account`.
