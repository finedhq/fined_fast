import LegalPage, { Section, Bullets, Callout } from './LegalPage';

const LAST_UPDATED = '4 October 2026';
const CONTACT = 'support@myfined.com';

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      intro="This policy explains what personal data FinEd collects, why we collect it, who we share it with, and the choices you have. We have tried to write it in plain language rather than legal boilerplate."
    >
      <Section heading="1. Who we are">
        <p>
          FinEd is an interactive financial education platform for students and young investors in
          India, available at myfined.com. FinEd is currently operated by its founding team and is
          not yet incorporated as a registered company. If that changes, we will update this page.
        </p>
        <p>
          For any question about this policy or about your data, contact us at{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#4100BC] font-semibold hover:underline">
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section heading="2. Who can use FinEd">
        <p>
          You can read our articles, browse the course catalogue and view course overviews{' '}
          <strong>without creating an account or giving us any personal details</strong>. An account
          is only needed to take lessons, track your progress and use rewards.
        </p>
        <p>
          FinEd accounts are for people aged 18 and over. We do not knowingly collect personal data
          from anyone under 18. If we discover that we hold data belonging to a child, we will delete
          it promptly. If you believe a child has created an account, please write to us at{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#4100BC] font-semibold hover:underline">
            {CONTACT}
          </a>{' '}
          and we will remove it.
        </p>
      </Section>

      <Section heading="3. What we collect">
        <p className="font-semibold text-[#171321]">When you browse without an account</p>
        <Bullets
          items={[
            'Standard technical information sent by your browser, such as IP address, device type and pages visited, used for analytics and security.',
            'Analytics events via Google Analytics (see section 6).',
          ]}
        />

        <p className="font-semibold text-[#171321] pt-2">When you create an account</p>
        <p>
          We use Auth0 to handle sign-in, so we never see or store your password. If you sign in with
          Google, Google shares your basic profile with us. We receive and store:
        </p>
        <Bullets
          items={[
            'Your name, email address and profile picture.',
            'A unique account identifier from Auth0.',
          ]}
        />

        <Callout>
          <p className="font-semibold mb-2">If you sign in with Google</p>
          <p>
            We request only your basic profile and email address. We use that data solely to create
            and operate your FinEd account — to identify you, show your name and picture in the app,
            and contact you about the service. We do not use Google user data for advertising, we do
            not sell it, and we do not share it with anyone other than the service providers listed in
            section 7 who help us run FinEd. We no longer request access to your Gmail or any other
            Google service (see section 8). You can revoke FinEd's access at any time from your Google
            Account permissions page, and you can ask us to delete the data we hold.
          </p>
        </Callout>

        <p className="font-semibold text-[#171321] pt-2">As you learn</p>
        <Bullets
          items={[
            'Course and module progress, completed lessons and quiz results.',
            'Your FinScore, FinStars, streaks, level and leaderboard position.',
            'Certificates you earn.',
          ]}
        />

        <p className="font-semibold text-[#171321] pt-2">When you choose to send us something</p>
        <Bullets
          items={[
            'Messages you send through our contact or feedback forms.',
            'Article ratings and responses to in-article questions.',
            'Your email address, if you join our newsletter or waitlist.',
            'Answers you give to Personal Lens (see section 5).',
          ]}
        />
      </Section>

      <Section heading="4. Why we use it">
        <Bullets
          items={[
            'To create and run your account and keep you signed in.',
            'To save your learning progress and show it back to you across devices.',
            'To calculate FinScore, FinStars, streaks and leaderboard standings.',
            'To send you service messages, and newsletters if you asked for them.',
            'To answer your questions and act on your feedback.',
            'To understand which content is useful, so we can improve it.',
            'To keep the platform secure and diagnose faults.',
          ]}
        />
        <p>
          We do not sell your personal data. We do not use it for advertising, and we do not share it
          with advertisers.
        </p>
      </Section>

      <Section heading="5. Personal Lens and AI">
        <p>
          Personal Lens lets you answer a few short questions so an article can be explained in terms
          closer to your situation. Those answers are sent to Google's Gemini API to generate the
          explanation.
        </p>
        <p>
          We cache the generated explanation against an anonymised key derived from the answers, not
          against your identity, so the same set of answers can reuse a previous result. Please do not
          enter account numbers, PAN, Aadhaar or other sensitive identifiers into Personal Lens — it
          does not need them.
        </p>
      </Section>

      <Section heading="6. Cookies and analytics">
        <p>
          We use Google Analytics to understand how the site is used in aggregate — which pages are
          read, how far people get through a course. This relies on cookies and similar technologies.
        </p>
        <p>
          Auth0 also sets what is needed to keep you signed in. Those are essential: without them you
          could not stay logged in.
        </p>
        <p>
          You can block or delete cookies in your browser settings. If you block the essential ones,
          signing in will not work.
        </p>
      </Section>

      <Section heading="7. Who we share data with">
        <p>
          We do not sell your data. We share it only with the service providers that make FinEd work,
          and only to the extent they need it:
        </p>
        <Bullets
          items={[
            'Auth0 (Okta) — authentication and sign-in.',
            'Supabase — our database and file storage, where your account and progress live.',
            'Vercel — hosts the website you are reading.',
            'Heroku (Salesforce) — hosts our backend API.',
            'Google Analytics — usage analytics.',
            'Google Gemini API — generates Personal Lens explanations.',
            'Sentry — error reporting, to help us find and fix crashes.',
            'Zoho Mail — handles our email.',
          ]}
        />
        <p>
          Some of these providers process and store data on servers outside India. We may also
          disclose data where the law requires it.
        </p>
      </Section>

      <Section heading="8. The retired expense tracker">
        <Callout>
          <p className="font-semibold mb-2">A feature we have removed</p>
          <p>
            FinEd previously offered an expense tracker (FinTracker) which, with your explicit
            permission, could read bank notification emails from your Gmail account to list your
            transactions.
          </p>
        </Callout>
        <p>
          That feature has been discontinued. The code has been removed from FinEd, the Google
          credentials behind it have been deleted — which revokes any access permission that was
          previously granted — and the associated data and stored access tokens are being deleted.
        </p>
        <p>
          The feature never left alpha testing. FinEd no longer requests or holds access to anyone's
          email, and no longer asks Google for any permission beyond your basic profile and email
          address.
        </p>
      </Section>

      <Section heading="9. How long we keep it">
        <p>
          We keep your account data for as long as your account exists. If you ask us to delete your
          account, we will remove your personal data, except where we are required to keep something
          by law.
        </p>
        <p>
          Aggregated or anonymised statistics that cannot identify you may be kept to understand how
          our content performs.
        </p>
      </Section>

      <Section heading="10. Your rights">
        <p>You can ask us to:</p>
        <Bullets
          items={[
            'Give you a copy of the personal data we hold about you.',
            'Correct anything that is wrong or out of date.',
            'Delete your account and the personal data attached to it.',
            'Withdraw a consent you previously gave, such as newsletter emails.',
          ]}
        />
        <p>
          Write to{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#4100BC] font-semibold hover:underline">
            {CONTACT}
          </a>{' '}
          and we will respond as quickly as we reasonably can. If you are unhappy with how we have
          handled your data or your request, tell us at the same address and we will work with you to
          resolve it.
        </p>
      </Section>

      <Section heading="11. Security">
        <p>
          Sign-in is handled by Auth0 so we never hold your password. Traffic to FinEd is encrypted in
          transit, and access to our systems is limited to the people who need it.
        </p>
        <p>
          No service can promise perfect security, but if a breach affects your personal data we will
          tell you and the relevant authority as required.
        </p>
      </Section>

      <Section heading="12. Changes to this policy">
        <p>
          We will update this page when our practices change, and we will change the "last updated"
          date at the top. If a change materially affects you, we will make a greater effort to bring
          it to your attention than simply editing this page.
        </p>
      </Section>

      <Section heading="13. Contact us">
        <p>
          Questions, requests or complaints about privacy:{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#4100BC] font-semibold hover:underline">
            {CONTACT}
          </a>
          .
        </p>
      </Section>
    </LegalPage>
  );
}
