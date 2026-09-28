// A quick check, drawn from a `quiz` card — a port of the prototype's
// _renderCheckpoint (engine.js): badge + reward, question, A–D options, and an
// explanation that opens once answered. One try; the answer stays answered
// (the right option turns green, a wrong pick amber). It can be skipped, as in
// the prototype. The saved answer is the option's id (the course quiz bonus
// compares ids).
import SafeText from "./SafeText";
import { getCardFinstars } from "../../utils/finstars";
import { isCorrectOption } from "./progress";

export default function Checkpoint({ card, picked, onPick }) {
  const d = card.card_data || {};
  const options = d.options || [];
  const answered = picked !== undefined && picked !== null;
  const isCorrect = answered && isCorrectOption(d, picked);

  return (
    <section className="checkpoint-section" id={`checkpoint-${card.slug}`} data-part={card.slug}>
      <div className="checkpoint-container">
        <div className="checkpoint-badge">
          <span>Quick check</span>
          <span className="checkpoint-reward">+{getCardFinstars(d, "quiz")} FinStars</span>
        </div>
        <h2 className="checkpoint-question">{d.question}</h2>
        <div className="checkpoint-options-grid">
          {options.map((o, i) => {
            const mark = !answered ? "" : o.is_correct ? " correct" : o.id === picked ? " wrong" : "";
            return (
              <button
                key={o.id ?? i}
                type="button"
                className={`checkpoint-option-btn${mark}`}
                disabled={answered}
                onClick={() => onPick(o.id)}
              >
                <span className="option-badge-letter">{String.fromCharCode(65 + i)}</span>
                <span>{o.text}</span>
              </button>
            );
          })}
        </div>
        <div className={`checkpoint-explanation-box${answered ? ` visible ${isCorrect ? "is-correct" : "is-wrong"}` : ""}`}>
          <div className="exp-header">{answered ? (isCorrect ? "Correct" : "Not quite — here's why") : ""}</div>
          <div className="exp-body">
            <SafeText text={d.explanation} />
          </div>
        </div>
      </div>
    </section>
  );
}
