import React from "react";
import {
  FiTarget,
  FiCompass,
  FiBookmark,
  FiCheckCircle,
  FiRefreshCw,
  FiArrowRight,
  FiZap,
} from "react-icons/fi";

export default function LensResultCard({ lens, onReset }) {
  if (!lens) return null;

  const scrollToHeading = (sectionName) => {
    // Attempt to match heading in document by text content
    const headings = document.querySelectorAll(".ar-body h2, .ar-body h3, .ar-h2, .ar-h3");
    let target = null;
    const cleanSection = sectionName.toLowerCase().replace(/[^a-z0-9]/g, "");

    headings.forEach((h) => {
      const text = h.textContent.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (text.includes(cleanSection) || cleanSection.includes(text)) {
        target = h;
      }
    });

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="pl-result-body">
      {/* 1. Why this matters to you */}
      <div className="pl-why-matters-box">
        <div className="pl-result-tag">
          <FiTarget />
          <span>Why This Matters to You</span>
        </div>
        <p className="pl-result-text" style={{ marginTop: "6px" }}>
          {lens.whyItMatters || lens.why_it_matters}
        </p>
      </div>

      {/* 2. Personalized Summary */}
      <div className="pl-result-block">
        <div className="pl-result-tag">
          <FiCompass />
          <span>Personalized Overview</span>
        </div>
        <p className="pl-result-text">
          {lens.personalSummary || lens.personal_summary}
        </p>
      </div>

      {/* 3. Focus Sections */}
      {((lens.focusSections || lens.focus_sections) || []).length > 0 && (
        <div className="pl-result-block">
          <div className="pl-result-tag">
            <FiBookmark />
            <span>Priority Focus Sections</span>
          </div>
          <div className="pl-focus-chips">
            {(lens.focusSections || lens.focus_sections).map((sec, idx) => (
              <button
                key={idx}
                type="button"
                className="pl-focus-chip"
                onClick={() => scrollToHeading(sec)}
                title="Click to jump to this section"
              >
                <span>{sec}</span>
                <FiArrowRight size={13} style={{ color: "#6366f1", flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. One Core Takeaway */}
      <div className="pl-takeaway-box">
        <div className="pl-result-tag">
          <FiZap />
          <span>One Core Takeaway</span>
        </div>
        <p className="pl-result-text" style={{ marginTop: "6px" }}>
          "{lens.takeaway}"
        </p>
      </div>

      {/* 5. What You Should Do */}
      {(lens.whatToDo || lens.what_to_do) && (
        <div className="pl-action-box">
          <div className="pl-result-tag">
            <FiCheckCircle />
            <span>What to Do Next</span>
          </div>
          <p className="pl-result-text" style={{ marginTop: "4px" }}>
            {lens.whatToDo || lens.what_to_do}
          </p>
        </div>
      )}

      {/* 6. Change Answers / Reset */}
      <button
        type="button"
        className="pl-reset-btn"
        onClick={onReset}
      >
        <FiRefreshCw size={12} />
        <span>Change my answers</span>
      </button>
    </div>
  );
}
