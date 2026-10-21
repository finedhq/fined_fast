// Mobile app shell (app build only): top bar + page + bottom tab bar, in place of the
// website's Navbar and Footer. MainLayout switches to this when IS_NATIVE_APP is true.
import { Suspense } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import {
  PiArrowLeft,
  PiBell,
  PiCaretRight,
  PiChatCircleText,
  PiEnvelopeSimple,
  PiFileText,
  PiGift,
  PiGraduationCap,
  PiGraduationCapFill,
  PiHouse,
  PiHouseFill,
  PiNewspaper,
  PiNewspaperFill,
  PiPencilSimple,
  PiQuestion,
  PiShieldCheck,
  PiSignOut,
  PiStarFill,
  PiTrophy,
  PiUser,
  PiUserFill,
} from 'react-icons/pi';
import { useUserProfile } from '../context/UserProfileContext';
import { APP_TABS, TAB_ROOTS, isHiddenInApp, tabForPath, titleForPath } from './nativeApp';
import Welcome from './Welcome';
import './AppLayout.css';

const TAB_ICONS = {
  home: [PiHouse, PiHouseFill],
  courses: [PiGraduationCap, PiGraduationCapFill],
  articles: [PiNewspaper, PiNewspaperFill],
  profile: [PiUser, PiUserFill],
};

function TopBar({ pathname }) {
  const navigate = useNavigate();
  const { profile } = useUserProfile();
  const isTabRoot = TAB_ROOTS.includes(pathname);

  if (!isTabRoot) {
    const goBack = () => {
      // React Router keeps the history position in state.idx; 0 means nothing to go back to.
      if ((window.history.state?.idx ?? 0) > 0) navigate(-1);
      else navigate(tabForPath(pathname)?.to ?? '/dashboard', { replace: true });
    };
    return (
      <header className="app-topbar">
        <button type="button" className="app-icon-btn" onClick={goBack} aria-label="Go back">
          <PiArrowLeft aria-hidden="true" />
        </button>
        <h1 className="app-topbar-title">{titleForPath(pathname)}</h1>
        <span className="app-icon-btn" aria-hidden="true" />
      </header>
    );
  }

  const stars = profile?.fin_stars ?? profile?.finstars ?? 0;
  return (
    <header className="app-topbar">
      <span className="app-wordmark" aria-label="FinEd">
        Fin<b>Ed</b>
      </span>
      <div className="app-topbar-actions">
        <button type="button" className="app-stars" onClick={() => navigate('/rewards')} aria-label={`${stars} FinStars, open rewards`}>
          <PiStarFill aria-hidden="true" />
          {stars}
        </button>
        <button type="button" className="app-icon-btn" onClick={() => navigate('/notifications')} aria-label="Notifications">
          <PiBell aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}

function TabBar({ pathname }) {
  const active = tabForPath(pathname)?.key;
  return (
    <nav className="app-tabbar" aria-label="App">
      {APP_TABS.map((tab) => {
        const [Icon, ActiveIcon] = TAB_ICONS[tab.key];
        const isActive = tab.key === active;
        const Shown = isActive ? ActiveIcon : Icon;
        return (
          <NavLink key={tab.key} to={tab.to} replace className={`app-tab${isActive ? ' is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>
            <span className="app-tab-icon">
              <Shown aria-hidden="true" />
            </span>
            <span className="app-tab-label">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function PageSkeleton() {
  return (
    <div className="app-skeleton" aria-busy="true" aria-label="Loading">
      <div className="app-skel app-skel-title" />
      <div className="app-skel app-skel-line" />
      <div className="app-skel app-skel-card" />
      <div className="app-skel app-skel-card" />
    </div>
  );
}

// Things the website keeps in its navbar menu and footer, listed under the Profile tab.
function ProfileMenu() {
  const navigate = useNavigate();
  const { logout } = useAuth0();
  const { openEditModal } = useUserProfile();
  const groups = [
    [
      { icon: PiPencilSimple, label: 'Edit profile', onClick: () => openEditModal?.() },
      { icon: PiGift, label: 'Rewards', to: '/rewards' },
      { icon: PiTrophy, label: 'Leaderboard', to: '/leaderboard' },
      { icon: PiBell, label: 'Notifications', to: '/notifications' },
    ],
    [
      { icon: PiQuestion, label: 'Help', to: '/help' },
      { icon: PiChatCircleText, label: 'Send feedback', to: '/feedback' },
      { icon: PiEnvelopeSimple, label: 'Contact us', to: '/contact' },
    ],
    [
      { icon: PiShieldCheck, label: 'Privacy policy', to: '/privacy-policy' },
      { icon: PiFileText, label: 'Terms of service', to: '/termsofservice' },
    ],
  ];

  return (
    <section className="app-menu" aria-label="Account and app">
      {groups.map((items, i) => (
        <ul key={i} className="app-menu-group">
          {items.map(({ icon: Icon, label, to, onClick }) => (
            <li key={label}>
              <button type="button" className="app-menu-row" onClick={() => (to ? navigate(to) : onClick())}>
                <Icon className="app-menu-icon" aria-hidden="true" />
                <span>{label}</span>
                <PiCaretRight className="app-menu-caret" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ))}
      <button
        type="button"
        className="app-menu-row app-menu-logout"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        <PiSignOut className="app-menu-icon" aria-hidden="true" />
        <span>Log out</span>
      </button>
    </section>
  );
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const { isAuthenticated, isLoading } = useAuth0();

  // "/" is where the website's login guard sends logged-out users: show the welcome screen there.
  if (pathname === '/') {
    if (isLoading) return null;
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Welcome />;
  }
  if (isHiddenInApp(pathname)) return <Navigate to="/dashboard" replace />;

  return (
    <div className="app-shell">
      <TopBar pathname={pathname} />
      <main className="app-main">
        {/* keyed by path so each screen plays its entry animation: tabs fade, inner screens slide in */}
        <div key={pathname} className={`app-page ${TAB_ROOTS.includes(pathname) ? 'app-page-tab' : 'app-page-inner'}`}>
          {/* placeholder while a screen's code loads, so the top bar and tabs stay put */}
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
            {pathname === '/profile' && <ProfileMenu />}
          </Suspense>
        </div>
      </main>
      <TabBar pathname={pathname} />
    </div>
  );
}
