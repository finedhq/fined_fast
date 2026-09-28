// One chapter of the module page, drawn from a `narrative` card — a port of
// the prototype's _renderSection / _renderStep (engine.js): "Chapter N of M"
// header, the steps on one side and the sticky figure (with its step dots) on
// the other. The figure itself is a plug-in from figures/registry.js.
import { Suspense, useMemo } from "react";
import { Term, Tokens } from "./SafeText";
import { annotationText, linkText, stepBody } from "./text";
import { FIGURES } from "./figures/registry";

// The prototype's tap-to-guess (engine.js _renderTapGuess): once answered,
// every option locks, the chosen one is marked, the right one is revealed and
// the chosen option's feedback appears. Answers stay answered.
function TapGuess({ interaction, picked, onPick }) {
  const answered = picked !== undefined && picked !== null;
  const chosen = interaction.options.find((o) => o.id === picked);
  return (
    <div className="tap-guess">
      <div className="tap-guess-grid">
        {interaction.options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`tap-guess-btn${picked === o.id ? " selected" : ""}${answered && o.correct ? " was-correct" : ""}`}
            disabled={answered}
            onClick={() => onPick(o.id)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className={`tap-guess-feedback${answered ? " visible" : ""}`}>{chosen ? chosen.feedback : ""}</div>
    </div>
  );
}

function Step({ step, index, chapterNum, chapterSlug, active, figureNote, guess, onGuess }) {
  const { paragraphs, keyWords } = useMemo(() => stepBody(step.body, step.glossary_terms), [step.body, step.glossary_terms]);
  const note = step.annotation ? annotationText(step.annotation.text) : null;

  return (
    <div className={`scrolly-step${active ? " is-active" : ""}`} data-step-id={step.step_id} data-chapter={chapterSlug} data-step={index}>
      <div className="step-badge">
        <span className="step-num">
          {chapterNum}.{index + 1}
        </span>
        {step.badge_label}
      </div>
      <h3 className="step-title">{step.heading}</h3>
      <div className="step-body">
        {paragraphs.map((tokens, i) => (
          <p key={i}>
            <Tokens tokens={tokens} />
          </p>
        ))}
      </div>
      {step.stat && <div className="stat-chip">{step.stat}</div>}
      {keyWords.length > 0 && (
        <div className="key-words">
          <span className="key-words-label">Key word</span>
          {keyWords.map((t) => (
            <Term key={t.term} token={t} />
          ))}
        </div>
      )}
      {note && (
        <div className={`annotation annotation--${step.annotation.accent_type}`} data-annotation-for={step.step_id}>
          <span className="annotation-text">
            <Tokens tokens={linkText(note, { marks: false })} />
          </span>
        </div>
      )}
      {/* A figure can add a live line under a step (e.g. the basket's "You guessed ₹…"). */}
      {figureNote !== undefined && (
        <div className={`annotation annotation--highlight${figureNote ? "" : " is-empty"}`} data-annotation-for={step.step_id}>
          <span className="annotation-text">{figureNote}</span>
        </div>
      )}
      {step.interaction?.kind === "tap_guess" && (
        <TapGuess interaction={step.interaction} picked={guess} onPick={(id) => onGuess(step.step_id, id)} />
      )}
    </div>
  );
}

export default function Chapter({ card, chapterNum, chapterCount, activeStep, direction, figureState, onFigureState }) {
  const d = card.card_data || {};
  const steps = d.steps || [];
  const figure = FIGURES[d.figure?.kind];
  const Figure = figure?.component;
  const state = figureState || {};
  const notes = figure?.stepNotes ? figure.stepNotes(state) : {};
  const guesses = state.guesses || {};
  const onGuess = (stepId, optionId) => onFigureState((current) => ({ guesses: { ...(current.guesses || {}), [stepId]: optionId } }));

  return (
    <section className="scrolly-section" id={`section-${card.slug}`} data-part={card.slug}>
      <header className="chapter-header">
        <div className="chapter-count">
          Chapter {chapterNum} <span>of {chapterCount}</span>
        </div>
        <h2 className="chapter-title">{d.title}</h2>
      </header>

      <div className="scrolly-container">
        <article className="scrolly-article">
          {steps.map((step, i) => (
            <Step
              key={step.step_id || i}
              step={step}
              index={i}
              chapterNum={chapterNum}
              chapterSlug={card.slug}
              active={activeStep === i}
              figureNote={notes[i]}
              guess={guesses[step.step_id]}
              onGuess={onGuess}
            />
          ))}
        </article>

        <figure className="scrolly-figure">
          <div className="chart-header">
            <div className="chart-title-tag">{d.figure?.title}</div>
            <ol className="figure-steps" aria-label="Steps in this chapter">
              {steps.map((s, i) => (
                <li
                  key={s.step_id || i}
                  data-step-dot={s.step_id}
                  title={s.badge_label}
                  className={activeStep === i ? "is-current" : activeStep !== undefined && i < activeStep ? "is-done" : undefined}
                ></li>
              ))}
            </ol>
          </div>
          <div className="viz-content">
            {Figure && (
              <Suspense fallback={null}>
                <Figure step={activeStep} direction={direction} steps={steps} state={state} onState={onFigureState} config={figure.config} />
              </Suspense>
            )}
          </div>
        </figure>
      </div>
    </section>
  );
}
