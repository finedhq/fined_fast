// EXPERIMENTAL (mobile layout mock, 2026-10-13): a chapter as one Instagram-
// Stories-style screen. The figure stays put on top and animates between
// steps; one step card at a time below it. Tap anywhere on the screen (or
// swipe left on the card) to go forward; tap the left edge (or swipe right)
// to go back. On the last step a tap moves on down the page. No buttons. The chapter reports its step through onStep, exactly like the scroll
// observer does on the normal page, so stars and progress work unchanged.
import { Suspense, useEffect, useRef, useState } from "react";
import { Step } from "../Chapter";
import { FIGURES } from "../figures/registry";
import { scrollToElement } from "../scroll";

// Taps on these never turn the page: the figures' own controls (sliders,
// steppers, switches, draggable cards — all buttons/inputs), tap-guess
// buttons, glossary words and links.
const INTERACTIVE = "button, a, input, select, label, .jargon, [role='button'], [role='switch'], [draggable='true']";
const BACK_ZONE = 0.25; // left quarter of the screen = back

export default function StoriesChapter({ card, chapterNum, chapterCount, figureState, onFigureState, onStep }) {
  const d = card.card_data || {};
  const steps = d.steps || [];
  const figure = FIGURES[d.figure?.kind];
  const Figure = figure?.component;
  const state = figureState || {};
  const notes = figure?.stepNotes ? figure.stepNotes(state) : {};
  const guesses = state.guesses || {};
  const onGuess = (stepId, optionId) => onFigureState((current) => ({ guesses: { ...(current.guesses || {}), [stepId]: optionId } }));

  const rootRef = useRef(null);
  const [seen, setSeen] = useState(false);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState("down");
  const onStepRef = useRef(onStep);
  useEffect(() => {
    onStepRef.current = onStep;
  });

  // The figure starts (step 0) once the chapter is mostly on screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (seen) onStepRef.current?.({ chapter: card.slug, step: index, direction });
  }, [seen, index, direction, card.slug]);

  const last = index === steps.length - 1;
  const go = (delta) => {
    const next = index + delta;
    if (next < 0 || next >= steps.length) return;
    setDirection(delta > 0 ? "down" : "up");
    setIndex(next);
  };
  const continueDown = () => scrollToElement(rootRef.current?.nextElementSibling);

  // A tap = press and release without moving (so drags and scrolls inside
  // the figure or card never count as taps).
  const press = useRef(null);
  const onPointerDown = (e) => {
    press.current = { x: e.clientX, y: e.clientY };
  };
  const onScreenClick = (e) => {
    const start = press.current;
    press.current = null;
    if (!start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 10) return;
    if (e.target.closest(INTERACTIVE)) return;
    const box = e.currentTarget.getBoundingClientRect();
    if (e.clientX - box.left < box.width * BACK_ZONE) go(-1);
    else if (last) continueDown();
    else go(1);
  };

  const touch = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  };

  const step = steps[index];
  return (
    <section
      className="scrolly-section story-chapter"
      id={`section-${card.slug}`}
      data-part={card.slug}
      ref={rootRef}
      onPointerDown={onPointerDown}
      onClick={onScreenClick}
    >
      <div className="story-progress" aria-hidden="true">
        {steps.map((s, i) => (
          <span key={s.step_id || i} className={i < index ? "is-done" : i === index ? "is-current" : undefined}></span>
        ))}
      </div>
      <div className="story-meta">
        <span className="story-chapter-count">
          Chapter {chapterNum} <span>of {chapterCount}</span>
        </span>
        <span className="story-chapter-title">{d.title}</span>
      </div>

      <figure className="story-figure">
        <div className="chart-title-tag">{d.figure?.title}</div>
        <div className="viz-content">
          {Figure && (
            <Suspense fallback={null}>
              <Figure step={seen ? index : undefined} direction={direction} steps={steps} state={state} onState={onFigureState} config={figure.config} />
            </Suspense>
          )}
        </div>
      </figure>

      <div className="story-card-wrap" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {step && (
          <Step
            key={step.step_id || index}
            className={`story-card story-card--${direction}`}
            step={step}
            index={index}
            chapterNum={chapterNum}
            chapterSlug={card.slug}
            active
            figureNote={notes[index]}
            guess={guesses[step.step_id]}
            onGuess={onGuess}
          />
        )}
      </div>

      <div className="story-nav">
        <span className="story-count">
          {index + 1} / {steps.length}
        </span>
        {index === 0 && !last && <span className="story-hint">Tap anywhere for next</span>}
        {last && <span className="story-hint">Tap to continue ↓</span>}
      </div>
    </section>
  );
}
