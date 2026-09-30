import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./NotFoundPage.css";

const QUICK_LINKS = [
  { to: "/courses", label: "Courses", hint: "Byte-sized lessons" },
  { to: "/articles", label: "Articles", hint: "Money, simplified" },
  { to: "/about", label: "About FinEd", hint: "Who we are" },
];

export default function NotFoundPage() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Page Not Found | FinEd";

    // A SPA always answers 200, so tell crawlers not to index this "soft 404"
    let meta = document.querySelector('meta[name="robots"]');
    const created = !meta;
    if (created) {
      meta = document.createElement("meta");
      meta.name = "robots";
      document.head.appendChild(meta);
    }
    const previous = meta.content;
    meta.content = "noindex, follow";
    return () => {
      if (created) meta.remove();
      else meta.content = previous;
    };
  }, []);

  const canGoBack = typeof window !== "undefined" && window.history.state?.idx > 0;

  return (
    <section className="notfound-page" aria-labelledby="notfound-title">
      <div className="notfound-card">
        <div className="notfound-art" aria-hidden="true">
          <span className="notfound-digit">4</span>
          <svg className="notfound-coin" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" className="coin-rim" />
            <circle cx="60" cy="60" r="42" className="coin-face" />
            <text x="60" y="76" textAnchor="middle" className="coin-symbol">₹</text>
          </svg>
          <span className="notfound-digit">4</span>
        </div>

        <p className="notfound-eyebrow">Error 404</p>
        <h1 id="notfound-title">This page went off-budget</h1>
        <p className="notfound-copy">
          We couldn’t find <code className="notfound-path">{pathname}</code>. It may have
          moved, or the link might have a typo. Your progress and FinStars are safe.
        </p>

        <div className="notfound-actions">
          <Link to="/" className="notfound-btn notfound-btn--primary">Back to Home</Link>
          {canGoBack && (
            <button type="button" className="notfound-btn notfound-btn--ghost" onClick={() => navigate(-1)}>
              Go back
            </button>
          )}
        </div>

        <nav className="notfound-links" aria-label="Popular pages">
          <p className="notfound-links-title">Or pick up where most learners go</p>
          <ul>
            {QUICK_LINKS.map(({ to, label, hint }) => (
              <li key={to}>
                <Link to={to}>
                  <span className="notfound-link-label">{label}</span>
                  <span className="notfound-link-hint">{hint}</span>
                  <span className="notfound-link-arrow" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
