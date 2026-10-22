// Delete your account (website and app). Google Play requires account deletion inside the app
// and a web page for it; this page is both: Profile -> Delete account in the app, and
// myfined.com/delete-account on the web (the address given to Google Play).
import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import LegalPage, { Section, Bullets } from '../StaticPages/LegalPage';
import { deleteMyAccount } from '../../services/api';

const CONTACT = 'support@myfined.com';
const LAST_UPDATED = '22 October 2026';
const link = 'text-[#4100BC] font-semibold hover:underline';

const WHAT_GOES = [
  'Your profile, FinScore, FinStars, streaks and reward history.',
  'Your course progress, quiz answers and certificates (certificate links stop working).',
  'Your notifications, feedback, article ratings and messages to us.',
  'Newsletter and waitlist sign-ups made with your account email.',
  'Your FinEd login. To use FinEd again you would start a new account.',
];

export default function DeleteAccountPage() {
  const { isAuthenticated, isLoading, user, loginWithRedirect, logout } = useAuth0();
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState('idle'); // idle | deleting | done | error
  const [error, setError] = useState('');
  const confirmed = typed.trim().toUpperCase() === 'DELETE';

  async function onDelete() {
    setStatus('deleting');
    setError('');
    try {
      await deleteMyAccount();
      setStatus('done');
      setTimeout(() => logout({ logoutParams: { returnTo: window.location.origin } }), 2500);
    } catch (err) {
      setStatus('error');
      setError(err?.message || `Something went wrong. Please try again, or email ${CONTACT}.`);
    }
  }

  return (
    <LegalPage
      title="Delete your account"
      lastUpdated={LAST_UPDATED}
      intro="You can delete your FinEd account and the personal data attached to it at any time. Deletion is permanent and happens straight away."
    >
      <Section heading="What gets deleted">
        <Bullets items={WHAT_GOES} />
        <p>
          We keep only anonymised statistics that can't identify you (for example, how many people
          finished a module).
        </p>
      </Section>

      <Section heading={isAuthenticated ? 'Delete my account' : 'How to delete your account'}>
        {isLoading ? null : status === 'done' ? (
          <p role="status" className="font-semibold text-[#14532d]">
            Your account has been deleted. Signing you out…
          </p>
        ) : isAuthenticated ? (
          <div className="space-y-4">
            <p>
              You're signed in as <strong className="text-[#171321]">{user?.email}</strong>. Type{' '}
              <strong className="text-[#171321]">DELETE</strong> to confirm.
            </p>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="DELETE"
              autoCapitalize="characters"
              autoComplete="off"
              aria-label="Type DELETE to confirm"
              className="w-full max-w-xs rounded-xl border border-[#E6E1EC] px-4 py-3 text-[#171321] focus:outline-none focus:ring-2 focus:ring-[#4100BC]"
            />
            {status === 'error' && (
              <p role="alert" className="text-[#B42318] font-semibold">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={onDelete}
              disabled={!confirmed || status === 'deleting'}
              className="block rounded-xl bg-[#B42318] px-5 py-3 font-bold text-white disabled:opacity-40"
            >
              {status === 'deleting' ? 'Deleting…' : 'Permanently delete my account'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p>
              <button
                type="button"
                className={link}
                onClick={() => loginWithRedirect({ appState: { returnTo: '/delete-account' } })}
              >
                Sign in
              </button>{' '}
              and you can delete your account on this page. In the FinEd app, go to{' '}
              <strong className="text-[#171321]">Profile → Delete account</strong>.
            </p>
            <p>
              Can't sign in? Email{' '}
              <a href={`mailto:${CONTACT}?subject=Delete%20my%20FinEd%20account`} className={link}>
                {CONTACT}
              </a>{' '}
              from your account's email address with the subject "Delete my FinEd account". We'll
              delete it within 7 days and confirm by email.
            </p>
          </div>
        )}
      </Section>
    </LegalPage>
  );
}
