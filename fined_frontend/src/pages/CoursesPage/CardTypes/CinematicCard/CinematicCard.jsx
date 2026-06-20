import { useEffect, useState, useRef } from "react";
import "./CinematicCard.css";

// card.card_data shape for this type:
// {
//   lines: [{ text: string, emphasis: "" | "em" | "em2" }],  // 2-5 lines
//   tagline: string,
//   cta_text: string,
//   finstars: number
// }

const LINE_STAGGER_MS = 700;

function CinematicCard({ card, onContinue }) {
  const { lines = [], tagline = "", cta_text = "Continue", finstars = 0 } = card?.card_data || {};

  const [visibleCount, setVisibleCount] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const timers = useRef([]);

  const startCinematic = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setVisibleCount(0);
    setShowTagline(false);
    setShowCta(false);

    lines.forEach((_, i) => {
      const t = setTimeout(() => setVisibleCount(i + 1), i * LINE_STAGGER_MS);
      timers.current.push(t);
    });

    const taglineDelay = lines.length * LINE_STAGGER_MS + 300;
    timers.current.push(setTimeout(() => setShowTagline(true), taglineDelay));
    timers.current.push(setTimeout(() => setShowCta(true), taglineDelay + 500));
  };

  useEffect(() => {
    startCinematic();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.card_id]);

  return (
    <div className="cc-root">
      <div className="cc-lines">
        {lines.map((line, i) => (
          <p
            key={i}
            className={`cc-line ${line.emphasis ? `cc-line--${line.emphasis}` : ""} ${
              i < visibleCount ? "cc-line--visible" : ""
            }`}
          >
            {line.text}
          </p>
        ))}
      </div>

      <p className={`cc-tagline ${showTagline ? "cc-tagline--visible" : ""}`}>{tagline}</p>

      <button
        className={`cc-cta ${showCta ? "cc-cta--visible" : ""}`}
        onClick={onContinue}
        disabled={!showCta}
      >
        {cta_text} →
      </button>

      {finstars > 0 && (
        <p className={`cc-finstars ${showCta ? "cc-finstars--visible" : ""}`}>
          Earn up to <span>{finstars} FinStars</span> in this module
        </p>
      )}
    </div>
  );
}

export default CinematicCard;