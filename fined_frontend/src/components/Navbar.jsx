import { NavLink, useNavigate } from "react-router-dom";
import { isAdminUser } from "../services/auth";

export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="site-nav">
      <div className="logo" onClick={() => navigate("/")} style={{cursor: 'pointer'}}>
        {/* SVG Logo is handled in CSS/bg usually, or we can leave it empty like original */}
      </div>

      <ul className="nav-links">
        <li><NavLink to="/" className={({isActive}) => isActive ? "active" : ""}>Home</NavLink></li>
        <li><a href="#">Courses</a></li>
        <li><NavLink to="/articles" className={({isActive}) => isActive ? "active" : ""}>Articles</NavLink></li>
        <li><a href="#">About Us</a></li>
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
