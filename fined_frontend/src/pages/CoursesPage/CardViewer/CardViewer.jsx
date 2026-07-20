import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import CardRenderer from "./CardRenderer";
import { getCard, updateCard } from "../../../services/api";
import { useAuth0 } from "@auth0/auth0-react";
import "./CardViewer.css";

function CardViewer() {
  const { courseId, moduleId, cardId } = useParams();
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

    getCard(courseId, moduleId, cardId, email)
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
  }, [courseId, moduleId, cardId, email]);

  const handleContinue = async () => {
    try {
      await updateCard(courseId, moduleId, cardId, { status: "completed", email });
    } catch {
      // Non-blocking — navigation should not stall on a logging failure
    }

    if (card?.nextCardId) {
      navigate(`/courses/course/${courseId}/module/${moduleId}/card/${card.nextCardId}`);
    } else if (card?.nextModuleFirstCard) {
      const { moduleId: nextModuleId, cardId: nextCardId } = card.nextModuleFirstCard;
      navigate(`/courses/course/${courseId}/module/${nextModuleId}/card/${nextCardId}`);
    } else {
      navigate(`/courses/course/${courseId}`);
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
        <Link to={`/courses/${courseId}`}>Back to course</Link>
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
      <div className="cv-card-box">
        {/* ── Header: module name + progress fraction ── */}
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

        {/* ── The card itself, rendered by the dispatcher ── */}
        <div className="cv-card-content">
          <CardRenderer card={card} onContinue={handleContinue} />
        </div>
      </div>
    </div>
  );
}

export default CardViewer;