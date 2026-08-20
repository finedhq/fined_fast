import React, { useState } from "react";
import { FiChevronLeft, FiArrowRight } from "react-icons/fi";

export default function LensQuestionnaire({
  questions = [],
  currentIndex = 0,
  answers = {},
  onSelectOption,
  onPrevStep,
}) {
  const [animatingKey, setAnimatingKey] = useState(null);

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;
  const qIdentifier = currentQuestion.id || currentQuestion.question || `q_${currentIndex}`;
  const currentAnswer = answers[qIdentifier];

  const handleOptionClick = (opt, idx) => {
    const label = typeof opt === "string" ? opt : (opt.label || opt.text || String(opt));
    const optKey = typeof opt === "string" ? `opt_${idx}` : (opt.id || `opt_${idx}`);
    
    setAnimatingKey(optKey);
    // Tactile delay so user perceives the futuristic selection state before advancing
    setTimeout(() => {
      onSelectOption(qIdentifier, optKey, label, currentQuestion.question);
      setAnimatingKey(null);
    }, 180);
  };

  return (
    <div className="pl-quest-body" key={currentIndex}>
      {/* Progress Header */}
      <div className="pl-progress-wrap">
        <div className="pl-progress-meta">
          <span className="pl-step-indicator">
            Step {currentIndex + 1} of {totalQuestions}
          </span>
          {currentIndex > 0 && (
            <button
              type="button"
              className="pl-step-nav-btn"
              onClick={onPrevStep}
              title="Previous question"
            >
              <FiChevronLeft size={13} />
              <span>Back</span>
            </button>
          )}
        </div>
        <div className="pl-progress-bar-bg">
          <div
            className="pl-progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Question Title */}
      <h3 className="pl-quest-title">{currentQuestion.question}</h3>

      {/* Options List - Clean & Sleek (No Tickboxes) */}
      <div className="pl-options-list">
        {(currentQuestion.options || []).map((opt, idx) => {
          const label = typeof opt === "string" ? opt : (opt.label || opt.text || String(opt));
          const optKey = typeof opt === "string" ? `opt_${idx}` : (opt.id || `opt_${idx}`);
          const isSelected =
            animatingKey === optKey ||
            currentAnswer?.option_id === optKey ||
            currentAnswer?.label === label;

          return (
            <button
              key={optKey}
              type="button"
              className={`pl-option-item ${isSelected ? "selected" : ""}`}
              onClick={() => handleOptionClick(opt, idx)}
            >
              <span className="pl-option-item-text">{label}</span>
              <FiArrowRight className="pl-option-arrow" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
