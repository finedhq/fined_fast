import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import CardRenderer from "./CardRenderer";
import { getCard, updateCard } from "../../../services/api";
import { useAuth0 } from "@auth0/auth0-react";
import "./CardViewer.css";

function CardViewer() {
  const { courseSlug, moduleSlug, cardSlug } = useParams();
  const navigate = useNavigate();

  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { user } = useAuth0();
  const email = user?.email || "";

  useEffect(() => {
    if (!email) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    getCard(courseSlug, moduleSlug, cardSlug, email)
      .then((data) => {
        if (!cancelled) setCard(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load card.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseSlug, moduleSlug, cardSlug, email]);

  const handleContinue = async () => {
    try {
      await updateCard(courseSlug, moduleSlug, cardSlug, { status: "completed", email });
    } catch {
      // Non-blocking — navigation should not stall on a logging failure
    }

    if (card?.nextCardSlug || card?.nextCardId) {
      navigate(`/courses/${courseSlug}/${moduleSlug}/${card.nextCardSlug || card.nextCardId}`);
    } else if (card?.nextModuleFirstCard) {
      const nextModSlug = card.nextModuleFirstCard.moduleSlug || card.nextModuleFirstCard.moduleId;
      const nextCardSlug = card.nextModuleFirstCard.cardSlug || card.nextModuleFirstCard.cardId;
      navigate(`/courses/${courseSlug}/${nextModSlug}/${nextCardSlug}`);
    } else {
      navigate(`/courses/${courseSlug}`);
    }
  };

  if (loading) {
    return (
      <div className="cv-status">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cv-status">
        <p>{error}</p>
        <Link to={`/courses/${courseSlug}`}>Back to course</Link>
      </div>
    );
  }

  const total = card?.module_total_cards || 0;
  const current = card?.module_progress || 0;
  const percent = total ? (current / total) * 100 : 0;
  console.log("current", current)
  console.log("total", total)

  return (
    <div className="cv-page">
      <div className="cv-top-left-nav">
        <Link to="/" className="cv-logo" aria-label="FinEd Home">
          <img src="/logo.ico" alt="FinEd" />
        </Link>
        <Link to={`/courses/${courseSlug}`} className="cv-back-btn" title="Back to Course Overview">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Back to Course</span>
        </Link>
      </div>
      <div className="cv-top-section">
        <div className="cv-header">
          <span className="cv-module-name">{card?.module_title || "Module"}</span>
          <span className="cv-progress-fraction">
            {current}/{total}
          </span>
        </div>

        {/* ── Progress bar ── */}
        <div className="cv-progress-track">
          <div className="cv-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="cv-main-container">
        {/* ── The card itself, rendered by the dispatcher ── */}
        <div className="cv-card-box">
          <CardRenderer card={card} onContinue={handleContinue} />
        </div>
      </div>
    </div>
  );
}

export default CardViewer;