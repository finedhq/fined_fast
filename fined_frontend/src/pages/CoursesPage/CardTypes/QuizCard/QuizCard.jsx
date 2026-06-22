import { useState } from "react";
import "./QuizCard.css";

function QuizCard({ card, onContinue }) {
  const {
    title = "",
    question = "",
    options = [],
    explanation = "",
    cta_text = "Continue",
  } = card?.card_data || {};

  const [selectedOptionId, setSelectedOptionId] = useState(null);

  const handleSelect = (optionId) => {
    if (selectedOptionId) return; // already answered
    setSelectedOptionId(optionId);
  };

  const getOptionClass = (opt) => {
    if (!selectedOptionId) return "quiz-option-btn";
    if (opt.is_correct) return "quiz-option-btn correct";
    if (selectedOptionId === opt.id) return "quiz-option-btn wrong";
    return "quiz-option-btn disabled";
  };

  const isAnsweredCorrectly = () => {
    if (!selectedOptionId) return false;
    const selectedOpt = options.find((o) => o.id === selectedOptionId);
    return selectedOpt?.is_correct || false;
  };

  return (
    <div className="quiz-root">
      <h2 className="quiz-title">{title}</h2>
      
      <div className="quiz-question">
        {question}
      </div>

      <div className="quiz-options-grid">
        {options.map((opt, idx) => (
          <button
            key={opt.id}
            className={getOptionClass(opt)}
            onClick={() => handleSelect(opt.id)}
            disabled={selectedOptionId !== null}
          >
            <span className="quiz-opt-letter">{String.fromCharCode(65 + idx)}</span>
            {opt.text}
          </button>
        ))}
      </div>

      {selectedOptionId && (
        <div className={`quiz-explanation-box show`}>
          <div className="quiz-exp-title">
            {isAnsweredCorrectly() ? "✅ Correct" : "❌ Incorrect"}
          </div>
          <p>{explanation}</p>
          <div className="quiz-finstars-reward">⭐ +10 FinStars earned</div>
          
          <button className="quiz-btn-primary" onClick={onContinue} style={{ marginTop: "16px" }}>
            {cta_text} →
          </button>
        </div>
      )}
    </div>
  );
}

export default QuizCard;
