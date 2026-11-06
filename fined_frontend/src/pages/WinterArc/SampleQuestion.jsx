// A working sample question, so visitors feel what a WinterArc day is like.
// Pick an answer, see whether it was right and why. Nothing is saved.
import { useState } from "react";
import { PiCheckCircleFill, PiXCircleFill, PiArrowCounterClockwiseBold } from "react-icons/pi";
import { trackEvent } from "../../utils/analytics";

const QUESTION = {
  prompt: "Prices rise 6% this year. You keep ₹1,000 in cash at home. A year later, what can that ₹1,000 buy?",
  options: [
    "More than it can today",
    "Exactly the same as today",
    "About ₹943 worth of today's things",
    "Nothing, cash loses all its value",
  ],
  answer: 2,
  explanation:
    "Inflation makes each rupee buy a little less. ₹1,000 ÷ 1.06 is about ₹943 at today's prices. The notes stay the same; what they buy shrinks.",
};

export default function SampleQuestion() {
  const [picked, setPicked] = useState(null);
  const answered = picked !== null;
  const correct = picked === QUESTION.answer;

  const pick = (i) => {
    if (answered) return;
    setPicked(i);
    trackEvent("winterarc_sample_answer", { correct: i === QUESTION.answer ? "yes" : "no" });
  };

  return (
    <div className="wa-sample">
      <p className="wa-sample-tag">Sample question</p>
      <p className="wa-sample-q">{QUESTION.prompt}</p>
      <div className="wa-sample-opts" role="group" aria-label="Answers">
        {QUESTION.options.map((opt, i) => {
          const state = !answered
            ? ""
            : i === QUESTION.answer
              ? "is-right"
              : i === picked
                ? "is-wrong"
                : "is-dim";
          return (
            <button
              key={opt}
              type="button"
              className={`wa-opt ${state}`}
              onClick={() => pick(i)}
              disabled={answered}
              aria-pressed={picked === i}
            >
              <span className="wa-opt-key">{String.fromCharCode(65 + i)}</span>
              <span>{opt}</span>
              {answered && i === QUESTION.answer && <PiCheckCircleFill className="wa-opt-icon" aria-hidden="true" />}
              {answered && i === picked && !correct && <PiXCircleFill className="wa-opt-icon" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={`wa-explain ${correct ? "is-right" : "is-wrong"}`} role="status">
          <p className="wa-explain-head">{correct ? "Right." : "Not quite."}</p>
          <p>{QUESTION.explanation}</p>
          <button type="button" className="wa-link-btn" onClick={() => setPicked(null)}>
            <PiArrowCounterClockwiseBold aria-hidden="true" /> Try again
          </button>
        </div>
      )}
    </div>
  );
}
