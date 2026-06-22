import { useState, useEffect } from "react";
import "./RiskSpectrumCard.css";

// Helper to map backend color strings to CSS classes
function getColorClass(colorStr) {
  switch (colorStr) {
    case "blue": return "rr-color-blue";
    case "green": return "rr-color-green";
    case "amber": return "rr-color-amber";
    case "red": return "rr-color-red";
    default: return "rr-color-blue";
  }
}

function RiskSpectrumCard({ card, onContinue }) {
  const { title = "", body_text = "", dots = [], highlight_line, cta_text = "Continue" } = card?.card_data || {};
  
  const [activeDotId, setActiveDotId] = useState(null);

  // Initialize the active dot to the first one when the component mounts or card changes
  useEffect(() => {
    if (dots.length > 0 && !activeDotId) {
      setActiveDotId(dots[0].id);
    }
  }, [dots, activeDotId]);

  const activeDot = dots.find(d => d.id === activeDotId) || dots[0];

  return (
    <div className="rr-root">
      <h2 className="rr-title">{title}</h2>
      {body_text && <p className="rr-body">{body_text}</p>}

      <p className="rr-hint">Tap any asset on the spectrum:</p>

      <div className="rr-spectrum">
        <div className="rr-track">
          {dots.map(dot => {
            const isActive = dot.id === activeDotId;
            const colorClass = getColorClass(dot.color);
            return (
              <div key={dot.id} style={{ position: "absolute", left: `${dot.position_pct}%`, top: "50%" }}>
                <div 
                  className={`rr-dot ${isActive ? "active" : ""} ${colorClass}`}
                  onClick={() => setActiveDotId(dot.id)}
                ></div>
                <div className={`rr-label ${isActive ? "active" : ""}`}>
                  {dot.label}
                </div>
              </div>
            );
          })}
        </div>
        <div className="rr-axis">
          <span>← Lower Risk, Lower Return</span>
          <span>Higher Risk, Higher Return →</span>
        </div>
      </div>

      {activeDot && (
        <div className="rr-info">
          <div className={`rr-info-title ${getColorClass(activeDot.color)}-text`}>{activeDot.title}</div>
          <div className="rr-info-desc">{activeDot.desc}</div>
          <div className="rr-info-stat-row">
            <div className="rr-stat-chip">Return: <span>{activeDot.return_text}</span></div>
            <div className="rr-stat-chip">Risk: <span className="rr-color-amber-text">{activeDot.risk_text}</span></div>
          </div>
        </div>
      )}

      {highlight_line && (
        <div className="rr-highlight-line">
          {highlight_line}
        </div>
      )}

      <button className="rr-btn-primary" onClick={onContinue}>
        {cta_text} →
      </button>
    </div>
  );
}

export default RiskSpectrumCard;
