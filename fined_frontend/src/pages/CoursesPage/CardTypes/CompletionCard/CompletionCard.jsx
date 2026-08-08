import React from "react";
import "./CompletionCard.css";
import { parseBoldText } from "../../../../utils/textFormatters";

function CompletionCard({ card, onContinue }) {
  const {
    card_label,
    badge_icon = "🔔",
    title = "Module Completed",
    subtitle = "You have successfully finished all topics in this module.",
    total_finstars,
    learnings = [],
    next_module_teaser,
    cta_text = "Continue",
  } = card?.card_data || {};

  return (
    <div className="comp-root">
      {card_label && <div className="comp-card-label">{card_label}</div>}
      <div className="comp-badge">{badge_icon}</div>
      <h2 className="comp-title" dangerouslySetInnerHTML={{ __html: parseBoldText(title) }}></h2>
      <p className="comp-sub" dangerouslySetInnerHTML={{ __html: parseBoldText(subtitle) }}></p>

      {total_finstars != null && (
        <div className="comp-finstars-total">
          <div className="comp-fs-num">{total_finstars}</div>
          <div className="comp-fs-label">FinStars earned ⭐</div>
        </div>
      )}

      {learnings && learnings.length > 0 && (
        <div className="comp-learnings-list">
          {learnings.map((learning, idx) => (
            <div key={idx} className="comp-learning-item">
              <span className="comp-check">✓</span>
              <span dangerouslySetInnerHTML={{ __html: parseBoldText(learning) }} />
            </div>
          ))}
        </div>
      )}

      {next_module_teaser && (
        <div className="comp-next-teaser">
          <div className="comp-next-label">{next_module_teaser.label || "Up next"}</div>
          <div className="comp-next-title" dangerouslySetInnerHTML={{ __html: parseBoldText(next_module_teaser.title) }}></div>
          <div className="comp-next-desc" dangerouslySetInnerHTML={{ __html: parseBoldText(next_module_teaser.description) }}></div>
        </div>
      )}

      <div className="comp-actions">
        <button className="comp-btn-primary" onClick={onContinue}>
          {cta_text}
        </button>
      </div>
    </div>
  );
}

export default CompletionCard;
