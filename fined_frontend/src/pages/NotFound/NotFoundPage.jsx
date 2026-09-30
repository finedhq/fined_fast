import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import planeImg from "../../assets/newnewplane.png";
import "./NotFoundPage.css";

// Same dashed flight path language as the home hero, but the plane loses its way
const DETOUR_PATH =
  "M 10,190 C 70,180 90,120 60,95 C 30,70 70,30 110,60 C 150,90 120,140 160,140 C 200,140 190,80 230,70 C 260,62 280,50 292,30";

export default function NotFoundPage() {
  const { pathname } = useLocation();

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

  return (
    <section className="nf-page" aria-labelledby="nf-title">
      <div className="nf-flight" aria-hidden="true">
        <svg viewBox="0 0 300 200" className="nf-flight-svg">
          <mask id="nf-flight-mask">
            <path className="nf-flight-reveal" d={DETOUR_PATH} fill="none" stroke="white" strokeWidth="6" />
          </mask>
          <path
            d={DETOUR_PATH}
            fill="none"
            stroke="#00b4d8"
            strokeWidth="4"
            strokeDasharray="8 8"
            strokeLinecap="round"
            mask="url(#nf-flight-mask)"
          />
        </svg>
        <img src={planeImg} alt="" className="nf-plane" />
      </div>

      <div className="nf-content">
        <p className="nf-code" aria-label="Error 404">
          <span>4</span>
          <span className="nf-coin">₹</span>
          <span>4</span>
        </p>

        <h1 id="nf-title" className="nf-title">
          This page took a <span className="nf-highlight">wrong turn</span>
        </h1>

        <p className="nf-sub">
          We couldn’t find <code className="nf-path">{pathname}</code>. The link may be
          broken or the page may have moved.
        </p>

        <div className="nf-actions">
          <Link to="/" className="nf-btn-primary">Back to Home</Link>
          <Link to="/courses" className="nf-btn-secondary">Explore Courses</Link>
        </div>
      </div>
    </section>
  );
}
