import { useAuth0 } from "@auth0/auth0-react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { isAdminUser } from "../services/auth";
import { useState, useEffect, useRef } from "react";
import { FiMenu, FiX, FiChevronDown } from "react-icons/fi";
import { useUserProfile } from "../context/UserProfileContext";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);
  
  // User profile context
  const { profile, openEditModal } = useUserProfile();

  // Auth0 authentication
  const { user, loginWithRedirect, isAuthenticated, logout } = useAuth0();

  const displayName = profile?.full_name || profile?.display_name || user?.name || "Rashi Karule";
  const firstName = displayName.split(" ")[0] || "Rashi";
  const userInitial = (firstName[0] || "R").toUpperCase();
  const financialLevel = profile?.financial_level || "";
  const shortLevelDisplay = financialLevel.includes("Intermediate")
    ? "Level 2 • Intermediate"
    : financialLevel.includes("Advanced")
    ? "Level 3 • Advanced"
    : "Level 1 • Beginner";

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setIsProfileDropdownOpen(false);
      }
    };
    if (isProfileDropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isProfileDropdownOpen]);


  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY = currentScrollY;
    };

    const handleReaderOpen = () => setHidden(false);
    const handleReaderClose = () => setHidden(false);
    const handleScrollDown = () => setHidden(true);
    const handleScrollUp = () => setHidden(false);

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("articleReaderOpen", handleReaderOpen);
    window.addEventListener("articleReaderClose", handleReaderClose);
    window.addEventListener("articleScrollDown", handleScrollDown);
    window.addEventListener("articleScrollUp", handleScrollUp);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("articleReaderOpen", handleReaderOpen);
      window.removeEventListener("articleReaderClose", handleReaderClose);
      window.removeEventListener("articleScrollDown", handleScrollDown);
      window.removeEventListener("articleScrollUp", handleScrollUp);
    };
  }, []);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`site-nav${hidden ? " site-nav--hidden" : ""}`}>
        <div className="logo" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")} style={{ cursor: 'pointer' }}>
          <img src="/logo.ico" alt="FinEd" className="logo-icon-1" />
        </div>

        <div className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <FiMenu size={28} />
        </div>

        <div className="nav-menu-wrapper">
          <ul className="nav-links">
            <li><NavLink to={isAuthenticated ? "/dashboard" : "/"} className={({ isActive }) => `cube-link ${isActive && !isAuthenticated ? "active" : ""}`}><span className="cube-wrapper" data-text="Home">Home</span></NavLink></li>
            <li className="nav-item-with-badge">
              <NavLink to="/courses" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}>
                <span className="cube-wrapper" data-text="Courses">Courses</span>
              </NavLink>
              <span className="nav-badge live-badge">New!</span>
            </li>
            <li><NavLink to="/articles" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Articles">Articles</span></NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Contact Us">Contact Us</span></NavLink></li>
          </ul>

          <div className="nav-right" ref={profileDropdownRef}>
            {isAuthenticated ? (
              <div className="relative flex items-center gap-3">
                {isAdminUser(user) && (
                  <button className="btn-signin cube-link" onClick={() => navigate("/admin")}>
                    <span className="cube-wrapper" data-text="Admin">Admin</span>
                  </button>
                )}
                
                {/* Interactive User Profile Pill */}
                <button
                  type="button"
                  onClick={() => setIsProfileDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 py-1.5 pl-1.5 pr-3 bg-white border border-slate-200 rounded-full shadow-xs hover:border-slate-300 hover:shadow-sm transition cursor-pointer select-none"
                  aria-expanded={isProfileDropdownOpen}
                  aria-label="User profile menu"
                >
                  {/* Navy Blue circular avatar */}
                  <span className="w-8 h-8 rounded-full bg-[#0047AB] text-white flex items-center justify-center font-bold text-sm tracking-wide shadow-xs">
                    {userInitial}
                  </span>
                  <span className="font-bold text-sm text-slate-800 tracking-tight">
                    {firstName}
                  </span>
                  <FiChevronDown
                    className={`text-slate-400 text-sm transition-transform duration-200 ${
                      isProfileDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Google Account-Style Dropdown Card */}
                {isProfileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-[330px] bg-white rounded-3xl border border-slate-200 shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Top Profile Card */}
                    <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 text-center flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-[#0047AB] text-white flex items-center justify-center text-2xl font-black shadow-inner">
                        {userInitial}
                      </div>
                      <h3 className="mt-2.5 font-extrabold text-base text-slate-900 tracking-tight">
                        {displayName}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">
                        {profile?.email || user?.email || "karulerashi@gmail.com"}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100/80 rounded-full text-[11px] font-bold">
                          🎓 {profile?.career_stage || "Student"}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100/80 rounded-full text-[11px] font-bold">
                          {shortLevelDisplay}
                        </span>
                      </div>
                    </div>

                    {/* Quick Metrics Strip */}
                    <div className="bg-[#FEF9E7] border border-[#FDE68A] rounded-2xl py-3 px-4 my-3.5 flex items-center justify-around text-center">
                      <div>
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          FINSCORE
                        </span>
                        <span className="text-xl font-black text-slate-900 tracking-tight">
                          {profile?.fin_score ?? profile?.finscore ?? 0}
                        </span>
                      </div>
                      <div className="w-[1px] h-7 bg-[#FDE68A]"></div>
                      <div>
                        <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                          FINSTARS
                        </span>
                        <span className="text-xl font-black text-amber-500 flex items-center justify-center gap-1 tracking-tight">
                          ⭐ {profile?.fin_stars ?? profile?.finstars ?? 0}
                        </span>
                      </div>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                      >
                        <span className="text-base">👤</span>
                        <span>View Profile</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          openEditModal();
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
                      >
                        <span className="text-base">⚙️</span>
                        <span>Profile &amp; Username Settings</span>
                      </button>

                      <div className="border-t border-slate-100 my-1"></div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileDropdownOpen(false);
                          logout({ logoutParams: { returnTo: window.location.origin } });
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition text-left cursor-pointer"
                      >
                        <span className="text-base">🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="btn-signin cube-link" onClick={() => loginWithRedirect()}>
                  <span className="cube-wrapper" data-text="Log In">Log In</span>
                </button>
                <button className="btn-nav-register" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Dedicated Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="logo" onClick={() => { setIsMobileMenuOpen(false); navigate(isAuthenticated ? "/dashboard" : "/"); }} style={{ cursor: 'pointer' }}>
            <img src="/logo.ico" alt="FinEd" className="logo-icon-1" />
          </div>
          <div className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
            <FiX size={28} />
          </div>
        </div>
        <ul className="mobile-nav-links">
          <li><NavLink to={isAuthenticated ? "/dashboard" : "/"} onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink></li>
          <li className="mobile-nav-item-with-badge">
            <NavLink to="/courses" onClick={() => setIsMobileMenuOpen(false)}>
              Courses
              <span className="nav-badge live-badge mobile-badge">New!</span>
            </NavLink>
          </li>
          <li><NavLink to="/articles" onClick={() => setIsMobileMenuOpen(false)}>Articles</NavLink></li>
          <li><NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</NavLink></li>
          {isAuthenticated ? (
            <>
              <li><NavLink to="/profile" onClick={() => setIsMobileMenuOpen(false)}>My Profile</NavLink></li>
              {isAdminUser(user) && (
                <li><NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</NavLink></li>
              )}
              <li><a href="#" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); logout({ logoutParams: { returnTo: window.location.origin } }); }}>Logout</a></li>
            </>
          ) : (
              <li className="mobile-nav-auth-wrapper">
                <div className="mobile-nav-auth-footer">
                  <button className="mobile-btn-primary" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); loginWithRedirect({ authorizationParams: { screen_hint: "signup" } }); }}>Sign Up</button>
                  <button className="mobile-btn-outline" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); loginWithRedirect(); }}>Log In</button>
                </div>
              </li>
          )}
        </ul>
      </div>
    </>
  );
}
