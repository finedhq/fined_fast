// The end of the module page, drawn from the `completion` card — a port of
// the prototype's renderCompletion / fillCompletion / confetti
// (module1-app.js): eyebrow + badge, heading, "your first answer, revisited"
// (only if the hero poll was answered), FinStars earned with a meter, the
// takeaways, the "Up next" box and "Review from the top". Confetti falls once,
// when a quarter of the section is on screen (not with reduced motion).
//
// Differences from the prototype, both decided by the owner:
//   - "Up next" opens the next module (decision 7c);
//   - if a quick check or the tool was skipped, one line links back to the
//     first one still open (decision 7d) — the module only counts as
//     finished when every part is done.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import SafeText from "./SafeText";
import { replayText } from "./text";

const CONFETTI_COLORS = ["#4100BC", "#4A3AFF", "#F5A623", "#FFB600", "#10B981"];

function makeConfetti() {
  return Array.from({ length: 40 }, () => ({
    left: `${Math.random() * 100}%`,
    backgroundColor: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    animationDelay: `${Math.random() * 0.4}s`,
    animationDuration: `${1.2 + Math.random() * 0.8}s`,
    transform: `rotate(${Math.random() * 360}deg)`,
  }));
}

function SkippedLine({ open, onGoTo }) {
  if (!open.length) return null;
  const first = open[0];
  const link = (
    <a
      href={`#${first.slug}`}
      onClick={(e) => {
        e.preventDefault();
        onGoTo(first.slug);
      }}
    >
      {first.name}
    </a>
  );
  return (
    <p className="nc-skipped">
      {open.length === 1 ? (
        <>You skipped {link}. Finish it to complete this module.</>
      ) : (
        <>
          You skipped {open.length} parts, starting with {link}. Finish them to complete this module.
        </>
      )}
    </p>
  );
}

// `comingSoon`: the next module exists in the plan but isn't released yet (weekly
// releases, plan §0.2) — the "Up next" box says so instead of opening anything.
// `onSignup`: a visitor trying the module without an account — the "Up next"
// box asks them to sign up instead.
export default function Completion({ card, moduleNumber, heroPoll, pollChoice, stars, maxStars, open, nextHref, comingSoon, onSignup, onGoTo, onReviewTop, onReached }) {
  const d = card.card_data || {};
  const sectionRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [confetti, setConfetti] = useState(null);
  const reachedRef = useRef(onReached);
  useEffect(() => {
    reachedRef.current = onReached;
  });

  // Like the prototype: fill in the replay and drop confetti the first time a
  // quarter of the section is visible. That is also when this part is "reached".
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    let timer = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        observer.disconnect();
        setRevealed(true);
        reachedRef.current?.(); // the completion part counts as done (saved by the page)
        const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce) return;
        setConfetti(makeConfetti());
        timer = setTimeout(() => setConfetti(null), 2500);
      },
      { threshold: 0.25 }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  const replay = revealed ? replayText(d, heroPoll, pollChoice) : "";
  const teaser = d.next_module_teaser;
  const teaserBody = teaser && (
    <>
      <div className="next-module-tag">{teaser.label}</div>
      <div className="next-module-title">{teaser.title}</div>
      <div className="next-module-desc">{teaser.description}</div>
    </>
  );

  return (
    <>
      <div className="confetti-wrap" aria-hidden="true">
        {confetti && confetti.map((style, i) => <div key={i} className="confetti-piece" style={style} />)}
      </div>
      <section className="completion-section" id="section-completion" data-part={card.slug} ref={sectionRef}>
        <div className="completion-container">
          <div className="completion-eyebrow">
            {d.subtitle || `Module ${moduleNumber} complete`}
            {d.card_label && <span className="completion-badge">{d.card_label}</span>}
          </div>
          <h2 className="completion-heading">{d.title}</h2>

          <SkippedLine open={open} onGoTo={onGoTo} />

          <div className="completion-grid">
            <div className="completion-replay-card" style={{ display: replay ? "block" : "none" }}>
              <div className="card-label">Your first answer, revisited</div>
              <p className="completion-replay">{replay}</p>
            </div>
            <div className="total-finstars-card">
              <div className="card-label">FinStars earned</div>
              <div className="total-finstars-num">
                <span className="nc-final-fs-display">{stars}</span>
                <span className="total-finstars-of">/ {maxStars}</span>
              </div>
              <div className="finstars-meter">
                <div className="finstars-meter-fill" style={{ width: `${maxStars > 0 ? Math.min(100, (stars / maxStars) * 100) : 0}%` }}></div>
              </div>
            </div>
          </div>

          {(d.learnings || []).length > 0 && (
            <div className="key-takeaways">
              <h3 className="takeaways-title">What this module covered</h3>
              <ol className="takeaway-list">
                {d.learnings.map((l, i) => (
                  <li key={i} className="takeaway-item">
                    <SafeText text={l} />
                  </li>
                ))}
              </ol>
            </div>
          )}

          {onSignup ? (
            <button type="button" className="next-module-card nc-signup-card" onClick={onSignup}>
              {teaserBody}
              <span className="nc-signup-pill">Sign up free to keep going →</span>
            </button>
          ) : teaser &&
            (nextHref ? (
              <Link to={nextHref} className="next-module-card">
                {teaserBody}
              </Link>
            ) : (
              <div className={`next-module-card${comingSoon ? " nc-coming-soon" : ""}`}>
                {teaserBody}
                {comingSoon && <span className="nc-coming-soon-pill">Coming soon</span>}
              </div>
            ))}

          <a
            href="#hero"
            className="btn-secondary"
            onClick={(e) => {
              e.preventDefault();
              onReviewTop();
            }}
          >
            Review from the top
          </a>
        </div>
      </section>
    </>
  );
}
