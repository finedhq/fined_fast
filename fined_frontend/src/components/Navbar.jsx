import { useAuth0 } from "@auth0/auth0-react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { isAdminUser } from "../services/auth";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);
  
  // This must be INSIDE the component function
  const { loginWithRedirect } = useAuth0();

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

  return (
    <nav className={`site-nav${hidden ? " site-nav--hidden" : ""}`}>
      <div className="logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>
        <img src="/logo.ico" alt="FinEd" className="logo-icon-1" />
      </div>

      <ul className="nav-links">
        <li><NavLink to="/" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Home">Home</span></NavLink></li>
        <li><NavLink to="/courses" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Courses">Courses</span></NavLink></li>
        <li><NavLink to="/articles" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Articles">Articles</span></NavLink></li>
        <li><NavLink to="/contact" className={({ isActive }) => `cube-link ${isActive ? "active" : ""}`}><span className="cube-wrapper" data-text="Contact Us">Contact Us</span></NavLink></li>
      </ul>

      <div className="nav-right">
        <div className="nav-divider"></div>
        {/* The updated button is placed here */}
          <button className="btn-signin cube-link" onClick={() => loginWithRedirect()}>
          <span className="cube-wrapper" data-text="Sign in">Sign in</span>
        </button>
        {isAdminUser() && (
          <button className="btn-nav-register" onClick={() => navigate("/admin")}>
            Admin Dashboard
          </button>
        )}
      </div>
    </nav>
  );
}
