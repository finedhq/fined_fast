// True only in the mobile app build (vite.config.app.js sets VITE_NATIVE_APP). It's a build-time
// constant, so app-only code behind it is dropped from the website bundle entirely.
export const IS_NATIVE_APP = import.meta.env.VITE_NATIVE_APP === 'true';

// The four bottom tabs. `match` lists the screens that keep that tab highlighted.
export const APP_TABS = [
  { key: 'home', to: '/dashboard', label: 'Home', match: ['/dashboard'] },
  { key: 'courses', to: '/courses', label: 'Courses', match: ['/courses', '/certificate'] },
  { key: 'articles', to: '/articles', label: 'Articles', match: ['/articles', '/tags', '/authors'] },
  {
    key: 'profile',
    to: '/profile',
    label: 'Profile',
    match: ['/profile', '/rewards', '/leaderboard', '/notifications', '/feedback', '/contact', '/help', '/privacy-policy', '/termsofservice', '/delete-account'],
  },
];

export const TAB_ROOTS = APP_TABS.map((t) => t.to);

// Website-only pages the app never shows (landing, About and admin pages). Contact stays: Profile links to it.
export function isHiddenInApp(pathname) {
  return pathname === '/' || pathname === '/about' || pathname.startsWith('/admin');
}

export function tabForPath(pathname) {
  return APP_TABS.find((t) => t.match.some((m) => pathname === m || pathname.startsWith(`${m}/`)));
}

// Title shown in the top bar on screens below a tab.
const TITLES = [
  ['/courses/', 'Course'],
  ['/articles/', 'Article'],
  ['/tags/', 'Articles'],
  ['/authors/', 'Author'],
  ['/certificate/', 'Certificate'],
  ['/rewards', 'Rewards'],
  ['/leaderboard', 'Leaderboard'],
  ['/notifications', 'Notifications'],
  ['/feedback', 'Send feedback'],
  ['/contact', 'Contact us'],
  ['/help', 'Help'],
  ['/privacy-policy', 'Privacy policy'],
  ['/termsofservice', 'Terms of service'],
  ['/delete-account', 'Delete account'],
];

export function titleForPath(pathname) {
  return TITLES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? 'FinEd';
}
