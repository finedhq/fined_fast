// Site navbar (every page under MainLayout): a floating pill that hides while
// you scroll down and comes back when you scroll up (article pages also hide /
// show it with their own events). A soft highlight follows the mouse across the
// links and rests on the current page. On phones the links open in a
// full-screen menu.
import { useAuth0 } from "@auth0/auth0-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import {
  PiCaretDownBold,
  PiGearSixBold,
  PiGraduationCapBold,
  PiListBold,
  PiSignOutBold,
  PiStarFill,
  PiUserBold,
  PiXBold,
} from "react-icons/pi";
import { isAdminUser } from "../services/auth";
import { useUserProfile } from "../context/UserProfileContext";
import { getUserLevel } from "../utils/level";
import "./Navbar.css";

const EASE = [0.16, 1, 0.3, 1];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [hovered, setHovered] = useState(null);
  const profileRef = useRef(null);

  const { profile, openEditModal } = useUserProfile();
  const { user, loginWithRedirect, isAuthenticated, logout } = useAuth0();

  const displayName = profile?.full_name || profile?.display_name || user?.name || user?.email?.split("@")[0] || "Learner";
  const firstName = displayName.split(" ")[0];
  const userInitial = (firstName[0] || "L").toUpperCase();
  const levelLabel = getUserLevel(profile).label;
  const homePath = isAuthenticated ? "/dashboard" : "/";

  const links = [
    { to: homePath, label: "Home", end: true },
    { to: "/courses", label: "Courses", badge: "New" },
    { to: "/articles", label: "Articles" },
    { to: "/contact", label: "Contact Us" },
  ];
  const isActive = (l) => (l.end ? pathname === l.to : pathname.startsWith(l.to));
  const activeIndex = links.findIndex(isActive);
  const highlight = hovered ?? (activeIndex >= 0 ? activeIndex : null);

  // Hide on the way down, show on the way up (and near the top).
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setScrolled(y > 12);
    if (menuOpen) return;
    setHidden(y > prev && y > 80);
  });

  // Article pages drive the navbar with their own events.
  useEffect(() => {
    const show = () => setHidden(false);
    const hide = () => setHidden(true);
    window.addEventListener("articleReaderOpen", show);
    window.addEventListener("articleReaderClose", show);
    window.addEventListener("articleScrollDown", hide);
    window.addEventListener("articleScrollUp", show);
    return () => {
      window.removeEventListener("articleReaderOpen", show);
      window.removeEventListener("articleReaderClose", show);
      window.removeEventListener("articleScrollDown", hide);
      window.removeEventListener("articleScrollUp", show);
    };
  }, []);

  // Profile menu: close on an outside click or Escape.
  useEffect(() => {
    if (!profileOpen) return undefined;
    const onDown = (e) => profileRef.current && !profileRef.current.contains(e.target) && setProfileOpen(false);
    const onKey = (e) => e.key === "Escape" && setProfileOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [profileOpen]);

  // Phone menu: lock the page behind it, close on Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    document.body.classList.add("no-scroll");
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("no-scroll");
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);
  const signOut = () => logout({ logoutParams: { returnTo: window.location.origin } });

  return (
    <>
      <nav className={`fn-nav${hidden ? " is-hidden" : ""}${scrolled ? " is-scrolled" : ""}`} aria-label="Main">
        <button type="button" className="fn-logo" onClick={() => navigate(homePath)} aria-label="FinEd home">
          <img src="/logo.ico" alt="" />
        </button>

        <ul className="fn-links" onMouseLeave={() => setHovered(null)}>
          {links.map((l, i) => (
            <li key={l.label} onMouseEnter={() => setHovered(i)}>
              <NavLink to={l.to} end={l.end} className={() => `fn-link${isActive(l) ? " is-active" : ""}`}>
                {highlight === i && (
                  <motion.span
                    layoutId="fn-nav-highlight"
                    className="fn-link-bg"
                    transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="fn-link-text">{l.label}</span>
                {l.badge && <span className="fn-new">{l.badge}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="fn-right" ref={profileRef}>
          {isAuthenticated ? (
            <>
              {isAdminUser(user) && (
                <button type="button" className="fn-text-btn" onClick={() => navigate("/admin")}>
                  Admin
                </button>
              )}
              <button
                type="button"
                className="fn-profile"
                onClick={() => setProfileOpen((o) => !o)}
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                aria-label="Your profile menu"
              >
                <span className="fn-avatar">{userInitial}</span>
                <span className="fn-profile-name">{firstName}</span>
                <PiCaretDownBold className={`fn-caret${profileOpen ? " is-open" : ""}`} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    className="fn-menu"
                    role="menu"
                    initial={reduce ? false : { opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: EASE }}
                  >
                    <div className="fn-menu-head">
                      <span className="fn-avatar fn-avatar-lg">{userInitial}</span>
                      <div className="fn-menu-who">
                        <strong>{displayName}</strong>
                        {(profile?.email || user?.email) && <span>{profile?.email || user?.email}</span>}
                      </div>
                    </div>
                    <div className="fn-menu-tags">
                      <span className="fn-tag">
                        <PiGraduationCapBold aria-hidden="true" /> {profile?.career_stage || "Student"}
                      </span>
                      <span className="fn-tag fn-tag-level">{levelLabel}</span>
                    </div>
                    <div className="fn-menu-stats">
                      <div>
                        <span>FinScore</span>
                        <strong>{profile?.fin_score ?? profile?.finscore ?? 0}</strong>
                      </div>
                      <div>
                        <span>FinStars</span>
                        <strong className="fn-stars">
                          <PiStarFill aria-hidden="true" /> {profile?.fin_stars ?? profile?.finstars ?? 0}
                        </strong>
                      </div>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="fn-menu-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate("/profile");
                      }}
                    >
                      <PiUserBold aria-hidden="true" /> View Profile
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="fn-menu-item"
                      onClick={() => {
                        setProfileOpen(false);
                        openEditModal();
                      }}
                    >
                      <PiGearSixBold aria-hidden="true" /> Profile &amp; Username Settings
                    </button>
                    <button type="button" role="menuitem" className="fn-menu-item fn-menu-danger" onClick={signOut}>
                      <PiSignOutBold aria-hidden="true" /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <>
              <button type="button" className="fn-text-btn" onClick={() => loginWithRedirect()}>
                Log In
              </button>
              <button type="button" className="fn-signup" onClick={() => loginWithRedirect()}>
                Sign Up
              </button>
            </>
          )}
        </div>

        <button type="button" className="fn-burger" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
          <PiListBold aria-hidden="true" />
        </button>
      </nav>

      {/* Phone menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fn-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -24 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            <div className="fn-sheet-head">
              <button type="button" className="fn-logo" onClick={() => { closeMenu(); navigate(homePath); }} aria-label="FinEd home">
                <img src="/logo.ico" alt="" />
              </button>
              <button type="button" className="fn-burger fn-close" onClick={closeMenu} aria-label="Close menu">
                <PiXBold aria-hidden="true" />
              </button>
            </div>

            <ul className="fn-sheet-links">
              {[
                ...links,
                ...(isAuthenticated
                  ? [{ to: "/profile", label: "My Profile" }, ...(isAdminUser(user) ? [{ to: "/admin", label: "Admin Dashboard" }] : [])]
                  : []),
              ].map((l, i) => (
                <motion.li
                  key={l.label}
                  initial={reduce ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.06 + i * 0.05, ease: EASE }}
                >
                  <NavLink to={l.to} end={l.end} onClick={closeMenu} className={() => (isActive(l) ? "is-active" : "")}>
                    {l.label}
                    {l.badge && <span className="fn-new">{l.badge}</span>}
                  </NavLink>
                </motion.li>
              ))}
            </ul>

            <div className="fn-sheet-foot">
              {isAuthenticated ? (
                <button type="button" className="fn-sheet-btn fn-sheet-ghost" onClick={signOut}>
                  Logout
                </button>
              ) : (
                <>
                  <button type="button" className="fn-sheet-btn fn-signup" onClick={() => { closeMenu(); loginWithRedirect(); }}>
                    Sign Up
                  </button>
                  <button type="button" className="fn-sheet-btn fn-sheet-ghost" onClick={() => { closeMenu(); loginWithRedirect(); }}>
                    Log In
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
