import { useEffect } from "react";
import { Link } from "react-router-dom";
import "./NotFoundPage.css";

export default function NotFoundPage() {
  useEffect(() => {
    document.title = "Page Not Found | FinEd";
  }, []);

  return (
    <div className="notfound-page">
      <div className="notfound-badge">404</div>
      <h1>Page not found</h1>
      <p>The page you’re looking for doesn’t exist or may have moved. Let’s get you back on track.</p>
      <Link to="/" className="notfound-btn">Back to Home</Link>
    </div>
  );
}
