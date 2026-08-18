import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import CardRenderer from "./CardRenderer";
import { getBundleByCardSlug, updateCardBySlug } from "../../../services/api";
import { useAuth0 } from "@auth0/auth0-react";
import "./CardViewer.css";

// Fallback FinStar defaults per card type — mirrors the backend DEFAULT_FINSTARS map
const DEFAULT_FINSTARS = {
  cinematic: 0,
  concept: 2,
  chart: 2,
  scenario: 3,
  risk_spectrum: 2,
  slider_calculator: 2,
  pill_selector: 3,
  interactive: 2,
  quiz: 10,
  completion: 0,
};

function getCardFinstars(cardData, cardTemplate) {
  const val = cardData?.allotted_finstars;
  if (val === null || val === undefined) return DEFAULT_FINSTARS[cardTemplate] ?? 2;
  return val;
}


function CardViewer() {
  const { cardSlug } = useParams();
  const navigate = useNavigate();

  // In-memory module cache (fetched once per module)
  const [bundle, setBundle] = useState(null);
  const bundleRef = useRef(null);
  bundleRef.current = bundle;
  const [userAnswersMap, setUserAnswersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState("");

  const { user } = useAuth0();
  const email = user?.email || "";

  // Ref to track latest userAnswersMap for background sync and completion calculation
  const answersRef = useRef(userAnswersMap);
  answersRef.current = userAnswersMap;

  // 1. Fetch entire module bundle once on module entry
  useEffect(() => {
    if (!email || !cardSlug) return;

    // Check if we already have this card in our current bundle
    const currentBundle = bundleRef.current;
    if (currentBundle && currentBundle.cards && currentBundle.cards.some(c => c.slug === cardSlug || c.card_id === cardSlug)) {
      return; // Already have it, don't refetch!
    }

    let isCancelled = false;
    setLoading(true);
    setError("");

    getBundleByCardSlug(cardSlug, email)
      .then((data) => {
        if (isCancelled) return;
        setBundle(data);

        // Pre-populate user answers & completed statuses from bundle
        const initialMap = {};
        (data.cards || []).forEach((c) => {
          if (c.status === "completed" || c.userAnswer) {
            initialMap[c.card_id] = {
              status: c.status,
              userAnswer: c.userAnswer,
            };
          }
        });
        setUserAnswersMap(initialMap);
      })
      .catch((err) => {
        if (!isCancelled) {
          setError(err.message || "Failed to load module.");
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [cardSlug, email]);

  // 2. Instant resolution of active card from memory
  let activeCard = null;
  if (bundle && bundle.cards && bundle.cards.length > 0) {
    const rawCard = bundle.cards.find(
      (c) => c.slug === cardSlug || c.card_id === cardSlug
    ) || bundle.cards[0];

    if (rawCard) {
      const currentIdx = bundle.cards.findIndex((c) => c.card_id === rawCard.card_id);
      const userProgress = userAnswersMap[rawCard.card_id] || {
        status: rawCard.status || "incompleted",
        userAnswer: rawCard.userAnswer || null,
      };

      activeCard = {
        ...rawCard,
        card_data: { ...(rawCard.card_data || {}) },
        status: userProgress.status,
        userAnswer: userProgress.userAnswer,
        prevCardId: currentIdx > 0 ? bundle.cards[currentIdx - 1].card_id : null,
        prevCardSlug: currentIdx > 0 ? bundle.cards[currentIdx - 1].slug : null,
        nextCardId: currentIdx < bundle.cards.length - 1 ? bundle.cards[currentIdx + 1].card_id : null,
        nextCardSlug: currentIdx < bundle.cards.length - 1 ? bundle.cards[currentIdx + 1].slug : null,
        module_total_cards: bundle.module_total_cards || bundle.cards.length,
        module_title: bundle.module_title,
        module_order_index: bundle.module_order_index,
        module_progress: rawCard.order_index || (currentIdx + 1),
        isFirstCardInModule: currentIdx === 0,
        isLastCardInModule: currentIdx === bundle.cards.length - 1,
        prevModuleFirstCard: bundle.prevModuleFirstCard,
        nextModuleFirstCard: bundle.nextModuleFirstCard,
      };

      // Dynamic calculation for CompletionCard
      if (rawCard.card_template === "completion") {
        let totalStars = 0;
        bundle.cards.forEach((c) => {
          const prog = userAnswersMap[c.card_id] || { status: c.status, userAnswer: c.userAnswer };
          if (prog.status === "completed") {
            const cd = c.card_data || {};
            let stars = getCardFinstars(cd, c.card_template);
            if (cd.card_type === "quiz") {
              const userAns = prog.userAnswer;
              const opts = cd.options || [];
              const isCorrect = opts.some((opt) => opt.id === userAns && opt.is_correct);
              if (!isCorrect) stars = 0;
            }
            totalStars += stars;
          }
        });
        activeCard.card_data.total_finstars = totalStars;
      }

      // Dynamic finstars teaser for CinematicCard — sum all non-completion cards
      if (rawCard.card_template === "cinematic") {
        const moduleMaxStars = bundle.cards.reduce((sum, c) => {
          if (c.card_template === "completion") return sum;
          return sum + getCardFinstars(c.card_data || {}, c.card_template);
        }, 0);
        activeCard.card_data = { ...activeCard.card_data, finstars: moduleMaxStars };
      }
    }
  }

  // 3. Continue: fade out → swap URL → fade in
  const handleContinue = (userAnswer = null, finStarsEarned = 0) => {
    if (!activeCard || transitioning) return;

    const currentCardId = activeCard.card_id;
    const currentCardSlug = activeCard.slug || cardSlug;

    // 1. Immediately update local state
    setUserAnswersMap((prev) => ({
      ...prev,
      [currentCardId]: {
        status: "completed",
        userAnswer: userAnswer || null,
        finStars: finStarsEarned || 0,
      },
    }));

    // 2. Fade out, then navigate
    setTransitioning(true);
    setTimeout(() => {
      if (activeCard.nextCardSlug || activeCard.nextCardId) {
        navigate(`/cards/${activeCard.nextCardSlug || activeCard.nextCardId}`);
      } else if (activeCard.nextModuleFirstCard) {
        // Completion card: go to next module's first card
        const nextCardSlug = activeCard.nextModuleFirstCard.cardSlug || activeCard.nextModuleFirstCard.cardId;
        navigate(`/cards/${nextCardSlug}`);
      } else {
        // Last module in course → back to course page
        navigate(bundle?.course_slug ? `/courses/${bundle.course_slug}` : `/courses`);
      }
      // Fade back in after URL (and thus card content) has swapped
      setTimeout(() => setTransitioning(false), 50);
    }, 200);

    // 3. Fire background save with silent auto-retry on network glitches
    const saveToBackend = async (retries = 2) => {
      try {
        await updateCardBySlug(currentCardSlug, {
          status: "completed",
          email,
          finStars: finStarsEarned || 0,
          userAnswer: userAnswer || null,
        });
      } catch (err) {
        if (retries > 0) {
          setTimeout(() => saveToBackend(retries - 1), 1500);
        } else {
          console.warn("Background progress save failed:", err);
        }
      }
    };
    saveToBackend();
  };

  // Loading state (only shown once when opening the module)
  const backToCourseLink = bundle?.course_slug ? `/courses/${bundle.course_slug}` : "/courses";

  if (loading) {
    return (
      <div className="cv-page">
        <div className="cv-top-left-nav">
          <Link to="/" className="cv-logo" aria-label="FinEd Home">
            <img src="/logo.ico" alt="FinEd" />
          </Link>
          {bundle?.course_slug && (
            <Link to={backToCourseLink} className="cv-back-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Course</span>
            </Link>
          )}
        </div>

        <div className="cv-top-section cv-skeleton-shimmer">
          <div className="cv-header">
            <div className="cv-skeleton-pill" style={{ width: "120px", height: "18px" }}></div>
            <div className="cv-skeleton-pill" style={{ width: "40px", height: "18px" }}></div>
          </div>
          <div className="cv-progress-track">
            <div className="cv-progress-fill" style={{ width: "15%" }} />
          </div>
        </div>

        <div className="cv-main-container cv-loader-container">
          <div className="cv-spinner-orbit">
            <div className="cv-spinner-dot"></div>
          </div>
          <p className="cv-loader-text">Loading module experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cv-status">
        <p>{error}</p>
        <Link to={backToCourseLink}>Back to course</Link>
      </div>
    );
  }

  if (!activeCard) {
    return (
      <div className="cv-status">
        <p>Card not found.</p>
        <Link to={backToCourseLink}>Back to course</Link>
      </div>
    );
  }

  const total = activeCard.module_total_cards || 0;
  const current = activeCard.module_progress || 0;
  const percent = total ? (current / total) * 100 : 0;

  return (
    <div className="cv-page">
      <div className="cv-top-left-nav">
        <Link to="/" className="cv-logo" aria-label="FinEd Home">
          <img src="/logo.ico" alt="FinEd" />
        </Link>
        <Link to={backToCourseLink} className="cv-back-btn" title="Back to Course Overview">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Back to Course</span>
        </Link>
      </div>

      <div className="cv-top-section">
        <div className="cv-header">
          <span className="cv-module-name">
            {activeCard.module_order_index ? `Module ${activeCard.module_order_index}: ` : ""}
            {activeCard.module_title || "Module"}
          </span>
          <span className="cv-progress-fraction">
            {current}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="cv-progress-track">
          <div className="cv-progress-fill" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="cv-main-container">
        <div className={`cv-card-box${transitioning ? " cv-card-transitioning" : ""}`}>
          <CardRenderer card={activeCard} onContinue={handleContinue} />
        </div>
      </div>
    </div>
  );
}

export default CardViewer;