import { NavLink, useNavigate, Link } from "react-router-dom";
import { isAdminUser } from "../services/auth";
import { useState, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [hidden, setHidden] = useState(false);

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
      </div>

      <ul className="nav-links">
        <li><NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>Home</NavLink></li>
        <li><a href="#">Courses</a></li>
        <li><NavLink to="/articles" className={({ isActive }) => isActive ? "active" : ""}>Articles</NavLink></li>
        <li><NavLink to="/contact" className={({ isActive }) => isActive ? "active" : ""}>Contact Us</NavLink></li>
      </ul>

      <div className="nav-right">
        <div className="nav-divider"></div>
        <button className="btn-signin">Sign in</button>
        {isAdminUser() && (
          <button className="btn-nav-register" onClick={() => navigate("/admin")}>
            Admin Dashboard
          </button>
        )}
      </div>
    </nav>
  );
}