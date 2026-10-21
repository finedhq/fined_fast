import { useState } from "react";
import { FiChevronLeft } from "react-icons/fi";

export default function LensQuestionnaire({
  questions = [],
  currentIndex = 0,
  answers = {},
  onSelectOption,
  onPrevStep,
}) {
  const [animatingKey, setAnimatingKey] = useState(null);
  // Which way the next question slides in: forward from the right, Back from the left
  const [shownIndex, setShownIndex] = useState(currentIndex);
  const [direction, setDirection] = useState("fwd");
  if (shownIndex !== currentIndex) {
    setDirection(currentIndex > shownIndex ? "fwd" : "back");
    setShownIndex(currentIndex);
  }

  if (!questions || questions.length === 0) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const qIdentifier = currentQuestion.id || currentQuestion.question || `q_${currentIndex}`;
  const currentAnswer = answers[qIdentifier];

  const handleOptionClick = (opt, idx) => {
    const label = typeof opt === "string" ? opt : (opt.label || opt.text || String(opt));
    const optKey = typeof opt === "string" ? `opt_${idx}` : (opt.id || `opt_${idx}`);

    setAnimatingKey(optKey);
    // A short pause so the picked answer shows as selected before the next question
    setTimeout(() => {
      onSelectOption(qIdentifier, optKey, label, currentQuestion.question);
      setAnimatingKey(null);
    }, 180);
  };

  return (
    <div className="pl-quest-body">
      <div className="pl-progress-meta">
        <span className="pl-step-indicator">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
        <button type="button" className="pl-step-nav-btn" onClick={onPrevStep}>
          <FiChevronLeft size={15} />
          <span>Back</span>
        </button>
      </div>
      <div className="pl-progress-segs" aria-hidden="true">
        {questions.map((_, i) => (
          <span key={i} className={`pl-progress-seg${i <= currentIndex ? " is-done" : ""}`} />
        ))}
      </div>

      <div className={`pl-quest-step is-${direction}`} key={currentIndex}>
        <h3 className="pl-quest-title">{currentQuestion.question}</h3>

        <div className="pl-options-list" role="list">
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
                role="listitem"
                aria-pressed={isSelected}
                className={`pl-option-item${isSelected ? " selected" : ""}`}
                onClick={() => handleOptionClick(opt, idx)}
              >
                <span className="pl-option-radio" aria-hidden="true" />
                <span className="pl-option-item-text">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
