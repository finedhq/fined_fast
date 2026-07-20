import { useAuth0 } from "@auth0/auth0-react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { isAdminUser } from "../services/auth";
import { useState, useEffect } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // This must be INSIDE the component function
  const { user, loginWithRedirect, isAuthenticated, logout } = useAuth0();

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
        <div className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
          <img src="/logo.ico" alt="FinEd" className="logo-icon-1" />
        </div>

        <div className="mobile-menu-toggle" onClick={() => setIsMobileMenuOpen(true)}>
          <FiMenu size={28} />
        </div>

        <div className="nav-menu-wrapper">
          <ul className="nav-links">
            <li><NavLink to="/" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Home">Home</span></NavLink></li>
            <li>
              <NavLink to="/courses" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}>
                <span className="cube-wrapper" data-text="Courses">Courses</span>
              </NavLink>
            </li>
            <li><NavLink to="/articles" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Articles">Articles</span></NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Contact Us">Contact Us</span></NavLink></li>
          </ul>

          <div className="nav-right">
            {isAuthenticated ? (
              <>
                <button className="btn-signin" onClick={() => navigate("/dashboard")}>
                  Dashboard
                </button>
                {isAdminUser(user) && (
                  <button className="btn-signin" onClick={() => navigate("/admin")}>
                    Admin
                  </button>
                )}
                <button className="btn-nav-register" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="btn-signin" onClick={() => loginWithRedirect()}>
                  Log in
                </button>
                <button className="btn-nav-register" onClick={() => loginWithRedirect({ authorizationParams: { screen_hint: "signup" } })}>
                  Sign up
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Dedicated Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="logo" onClick={() => { setIsMobileMenuOpen(false); navigate("/"); }} style={{ cursor: 'pointer' }}>
            <img src="/logo.ico" alt="FinEd" className="logo-icon-1" />
          </div>
          <div className="mobile-menu-close" onClick={() => setIsMobileMenuOpen(false)}>
            <FiX size={28} />
          </div>
        </div>
        <ul className="mobile-nav-links">
          <li><NavLink to="/" onClick={() => setIsMobileMenuOpen(false)}>Home</NavLink></li>
          <li>
            <NavLink to="/courses" onClick={() => setIsMobileMenuOpen(false)}>
              Courses
            </NavLink>
          </li>
          <li><NavLink to="/articles" onClick={() => setIsMobileMenuOpen(false)}>Articles</NavLink></li>
          <li><NavLink to="/contact" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</NavLink></li>
          {isAuthenticated ? (
            <>
              <li><NavLink to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</NavLink></li>
              {isAdminUser(user) && (
                <li><NavLink to="/admin" onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</NavLink></li>
              )}
              <li><a href="#" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); logout({ logoutParams: { returnTo: window.location.origin } }); }}>Logout</a></li>
            </>
          ) : (
            <>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); loginWithRedirect(); }}>Log in</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); setIsMobileMenuOpen(false); loginWithRedirect({ authorizationParams: { screen_hint: "signup" } }); }}>Sign up</a></li>
            </>
          )}
        </ul>
      </div>
    </>
  );
}
