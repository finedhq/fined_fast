import React from 'react';
import LegalPage, { Section, Bullets, Callout } from './LegalPage';

const LAST_UPDATED = '4 October 2026';
const CONTACT = 'support@myfined.com';

export default function TermsOfService() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      intro="These terms set out the agreement between you and FinEd when you use myfined.com. By using FinEd, you agree to them."
    >
      <Section heading="1. About FinEd">
        <p>
          FinEd is an interactive financial education platform for students and young investors in
          India, available at myfined.com. FinEd is currently operated by its founding team and is not
          yet incorporated as a registered company.
        </p>
        <p>
          You can contact us at{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#4100BC] font-semibold hover:underline">
            {CONTACT}
          </a>
          .
        </p>
      </Section>

      <Section heading="2. Education, not financial advice">
        <Callout>
          <p className="font-semibold mb-2">Please read this section carefully</p>
          <p>
            Everything on FinEd is published for <strong>educational purposes only</strong>. It is not
            investment advice, and it is not a recommendation to buy, sell or hold any security,
            scheme, fund or financial product.
          </p>
        </Callout>
        <p>
          FinEd is not registered with SEBI as an investment adviser or research analyst, and nothing
          here should be treated as a personalised recommendation. We do not know your circumstances,
          and our content does not take them into account.
        </p>
        <p>
          Investments in securities markets carry risk, including the loss of your capital. Past
          performance does not indicate future results. Before acting on anything you learn here,
          consider speaking to a SEBI-registered investment adviser.
        </p>
        <p>
          Any examples, figures or illustrations are used to explain a concept. They are not forecasts
          or promises of any outcome.
        </p>
      </Section>

      <Section heading="3. Who can use FinEd">
        <p>
          Our articles, course catalogue and course overviews are open to everyone, with no account
          needed.
        </p>
        <p>
          To create an account you must be at least 18 years old. By creating one you confirm that you
          are. If we learn that an account belongs to someone under 18, we will close it and delete
          the associated personal data.
        </p>
      </Section>

      <Section heading="4. Your account">
        <p>
          Sign-in is handled by Auth0, including the option to sign in with Google. You are responsible
          for keeping access to your account secure, and for what happens through it.
        </p>
        <p>
          Give us accurate information when you sign up, and tell us at{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#4100BC] font-semibold hover:underline">
            {CONTACT}
          </a>{' '}
          if you believe someone else has used your account.
        </p>
        <p>You can ask us to delete your account at any time.</p>
      </Section>

      <Section heading="5. Acceptable use">
        <p>When using FinEd, please do not:</p>
        <Bullets
          items={[
            'Break any applicable law, or use FinEd for anything unlawful.',
            'Copy, scrape, resell or republish our content without written permission.',
            'Attempt to gain unauthorised access to any part of the platform or another person’s account.',
            'Interfere with the service, overload it, or try to disrupt it for others.',
            'Manipulate FinScore, FinStars, streaks or the leaderboard by automated or dishonest means.',
            'Submit content through our forms that is unlawful, abusive, misleading or infringes someone else’s rights.',
          ]}
        />
        <p>We may suspend or close accounts that break these rules.</p>
      </Section>

      <Section heading="6. FinScore, FinStars and rewards">
        <p>
          FinScore, FinStars, streaks, levels, badges and leaderboard positions exist to make learning
          more engaging. They have <strong>no monetary value</strong>, are not currency, cannot be
          exchanged for cash, and cannot be transferred between accounts.
        </p>
        <p>
          We may adjust how they are calculated as the platform develops, and we may correct or remove
          balances obtained through error or manipulation.
        </p>
      </Section>

      <Section heading="7. Our content">
        <p>
          The courses, articles, illustrations, interactive figures, branding and design on FinEd
          belong to us or our licensors, and are protected by copyright and other rights.
        </p>
        <p>
          You may read, use and share our content for your own personal, non-commercial learning. You
          may not reproduce it commercially, or present it as your own, without our written permission.
        </p>
        <p>
          Certificates we issue record that you completed FinEd material. They are not an accredited
          or professional qualification.
        </p>
      </Section>

      <Section heading="8. Content you submit">
        <p>
          When you send us feedback, contact messages, ratings or answers to in-article questions, you
          keep ownership of what you wrote. You give us permission to use it to run and improve FinEd.
        </p>
        <p>Please do not send us anything confidential or sensitive through these forms.</p>
      </Section>

      <Section heading="9. Third parties and external links">
        <p>
          FinEd links to external websites, including sources cited in our articles and our own social
          media profiles. We do not control those sites and are not responsible for their content,
          accuracy or privacy practices.
        </p>
        <p>
          Where our courses or articles describe financial products such as deposits, funds or
          government schemes, they do so only to explain how such products work.{' '}
          <strong>
            We are not affiliated with, endorsed by, or acting on behalf of any bank, fund house,
            insurer or other financial institution.
          </strong>{' '}
          Rates, terms and eligibility change frequently, so always check the details directly with
          the provider before making any decision.
        </p>
      </Section>

      <Section heading="10. Availability and changes">
        <p>
          We are actively building FinEd. Features may be added, changed or withdrawn, and courses are
          sometimes released module by module. We may suspend the service for maintenance.
        </p>
        <p>
          We do not promise that FinEd will always be available or uninterrupted, and we do not
          guarantee that the platform will be free of errors.
        </p>
      </Section>

      <Section heading="11. Disclaimers and liability">
        <p>
          FinEd is provided "as is". While we work hard to keep our content accurate and up to date,
          we do not warrant that it is complete, current or error-free. Financial rules, rates and
          regulations change, and there may be a lag before our content reflects that.
        </p>
        <p>
          To the fullest extent permitted by law, we are not liable for any investment loss, lost
          profits, or indirect or consequential loss arising from your use of FinEd or from decisions
          you make based on its content. Your financial decisions are your own.
        </p>
        <p>Nothing in these terms limits any liability that cannot lawfully be limited.</p>
      </Section>

      <Section heading="12. Ending access">
        <p>
          You may stop using FinEd and ask us to delete your account at any time. We may suspend or
          end your access if you break these terms or if we need to protect the platform or its users.
        </p>
      </Section>

      <Section heading="13. Governing law">
        <p>
          These terms are governed by the laws of India, and the courts of India will have jurisdiction
          over any dispute arising from them.
        </p>
      </Section>

      <Section heading="14. Changes to these terms">
        <p>
          We may update these terms as FinEd develops. We will change the "last updated" date at the
          top, and for significant changes we will make a reasonable effort to tell you. Continuing to
          use FinEd after a change means you accept the updated terms.
        </p>
      </Section>

      <Section heading="15. Contact">
        <p>
          Questions about these terms:{' '}
          <a href={`mailto:${CONTACT}`} className="text-[#4100BC] font-semibold hover:underline">
            {CONTACT}
          </a>
          .
        </p>
        <p>
          See also our{' '}
          <a href="/privacy-policy" className="text-[#4100BC] font-semibold hover:underline">
            Privacy Policy
          </a>
          , which explains how we handle your personal data.
        </p>
      </Section>
    </LegalPage>
  );
}
