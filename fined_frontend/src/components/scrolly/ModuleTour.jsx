// First-visit tour of the module page: the page dims, one real part of it is
// lit up at a time, and a small card says what it is (Next / Back / Skip).
// Opens by itself the first time someone opens any module in this browser;
// the "?" button in the top bar replays it. It never touches progress.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { markSeen } from "./tourSteps";

const PAD = 8; // space between a lit-up part and the edge of its spotlight
const GAP = 14; // space between the spotlight and the card
const EDGE = 12; // closest the card gets to the screen edge

const reduceMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Resolve once the part stops moving (smooth scrolling, Reels snapping).
function settle(el, maxMs = 1500) {
  return new Promise((resolve) => {
    let last = null;
    let still = 0;
    const started = performance.now();
    const tick = () => {
      const top = Math.round(el.getBoundingClientRect().top);
      still = top === last ? still + 1 : 0;
      last = top;
      if (still >= 4 || performance.now() - started > maxMs) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

// `steps` come from tourSteps() when the tour opens.
export default function ModuleTour({ rootRef, reels, steps, onClose }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null); // lit-up part, in screen pixels
  const [ready, setReady] = useState(false); // false while scrolling to the next part
  const [cardPos, setCardPos] = useState(null);
  const cardRef = useRef(null);
  const primaryRef = useRef(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  const finish = useCallback(
    (completed) => {
      markSeen();
      const smooth = !reduceMotion();
      window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
      // After the last step, point at what to do first.
      if (completed) {
        const warmup = rootRef.current?.querySelector(".hero-warmup");
        if (warmup) {
          settle(warmup, 3000).then(() => {
            warmup.classList.remove("tour-nudge");
            void warmup.offsetWidth; // restart the animation
            warmup.classList.add("tour-nudge");
            setTimeout(() => warmup.classList.remove("tour-nudge"), 2600);
          });
        }
      }
      onClose();
    },
    [onClose, rootRef]
  );

  const measure = useCallback(() => {
    const el = step?.target && rootRef.current?.querySelector(step.target);
    if (!el) return setRect(null);
    let r = el.getBoundingClientRect();
    if (step.inner) {
      const parts = [...el.children].map((c) => c.getBoundingClientRect()).filter((c) => c.width > 0 && c.height > 0);
      if (parts.length) {
        const top = Math.min(...parts.map((c) => c.top));
        const left = Math.min(...parts.map((c) => c.left));
        const right = Math.max(...parts.map((c) => c.right));
        const bottom = Math.max(...parts.map((c) => c.bottom));
        r = { top, left, right, bottom, width: right - left, height: bottom - top };
      }
    }
    // A part taller than the screen is lit only where it's on screen (below the top bar).
    const tall = r.height > window.innerHeight - 80;
    const top = tall ? Math.max(r.top, 64) : r.top;
    const bottom = tall ? Math.min(r.bottom, window.innerHeight - 8) : r.bottom;
    setRect({ top: top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: Math.max(0, bottom - top) + PAD * 2 });
  }, [rootRef, step]);

  // Bring this step's part into view, wait for it to stop moving, then light it.
  useEffect(() => {
    let cancelled = false;
    const root = rootRef.current;
    const el = step?.target && root?.querySelector(step.target);
    const behavior = reduceMotion() ? "auto" : "smooth";
    if (el && step.scroll === "top") window.scrollTo({ top: 0, behavior });
    if (el && step.scroll === "center") {
      const anchor = (step.anchor && root.querySelector(step.anchor)) || el;
      anchor.scrollIntoView({ block: "center", behavior });
    }
    (el ? settle(el) : Promise.resolve()).then(() => {
      if (cancelled) return;
      measure();
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [index, step, rootRef, measure]);

  // Place the card next to the lit-up part (phones: a sheet at the bottom, or
  // the top when the part is low on the screen).
  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card || !ready) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    if (!rect) {
      setCardPos({ left: (vw - cw) / 2, top: (vh - ch) / 2 });
      return;
    }
    if (reels) {
      const low = rect.top + rect.height / 2 > vh * 0.55;
      const inTopBar = rect.top + rect.height < 120;
      setCardPos({ left: (vw - cw) / 2, top: inTopBar ? rect.top + rect.height + GAP : low ? 72 : vh - ch - 16 });
      return;
    }
    const clampX = (x) => Math.min(Math.max(x, EDGE), vw - cw - EDGE);
    const clampY = (y) => Math.min(Math.max(y, 72), vh - ch - EDGE);
    const centerX = rect.left + rect.width / 2 - cw / 2;
    const centerY = rect.top + rect.height / 2 - ch / 2;
    if (rect.top + rect.height + GAP + ch <= vh - EDGE) setCardPos({ left: clampX(centerX), top: rect.top + rect.height + GAP });
    else if (vw - (rect.left + rect.width) >= cw + GAP + EDGE) setCardPos({ left: rect.left + rect.width + GAP, top: clampY(centerY) });
    else if (rect.left >= cw + GAP + EDGE) setCardPos({ left: rect.left - GAP - cw, top: clampY(centerY) });
    else if (rect.top - GAP - ch >= 72) setCardPos({ left: clampX(centerX), top: rect.top - GAP - ch });
    else setCardPos({ left: clampX(centerX), top: vh - ch - EDGE });
  }, [rect, ready, reels, index]);

  useEffect(() => {
    if (ready) primaryRef.current?.focus({ preventScroll: true });
  }, [ready, index]);

  // `ready` goes false while the page moves to the next part.
  const goTo = useCallback((i) => {
    setReady(false);
    setIndex(i);
  }, []);
  const next = useCallback(() => (last ? finish(true) : goTo(index + 1)), [last, finish, goTo, index]);
  const back = useCallback(() => goTo(Math.max(0, index - 1)), [goTo, index]);

  // While the tour is open the page behind it can't be scrolled; the tour
  // does its own scrolling. Keys: Esc closes, arrows step through.
  useEffect(() => {
    const block = (e) => {
      if (cardRef.current?.contains(e.target) && e.type !== "wheel") return;
      e.preventDefault();
    };
    const onKey = (e) => {
      if (e.key === "Escape") return finish(false);
      if (e.key === "ArrowRight") return next();
      if (e.key === "ArrowLeft") return back();
      if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key) && !cardRef.current?.contains(e.target)) e.preventDefault();
    };
    // Keep the spotlight on its part if the page is still moving or resizes.
    let queued = false;
    const follow = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        measure();
      });
    };
    window.addEventListener("wheel", block, { passive: false });
    window.addEventListener("touchmove", block, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", follow);
    window.addEventListener("scroll", follow, { passive: true });
    return () => {
      window.removeEventListener("wheel", block);
      window.removeEventListener("touchmove", block);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", follow);
      window.removeEventListener("scroll", follow);
    };
  }, [finish, next, back, measure]);

  if (!step) return null;

  return (
    <div className={`module-tour${reels ? " is-reels" : ""}`}>
      {/* catches every click while the tour is open */}
      <div className={`tour-shade${rect && ready ? " has-spot" : ""}`} aria-hidden="true" />
      {rect && <div className={`tour-spot${ready ? " is-on" : ""}`} style={rect} aria-hidden="true" />}

      <div
        ref={cardRef}
        className={`tour-card${ready && cardPos ? " is-on" : ""}`}
        style={cardPos || { left: -9999, top: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
      >
        <div className="tour-card-top">
          <span className="tour-count">
            {index + 1} of {steps.length}
          </span>
          {!last && (
            <button type="button" className="tour-skip" onClick={() => finish(false)}>
              Skip tour
            </button>
          )}
        </div>
        <h3 id="tour-title" className="tour-title">{step.title}</h3>
        <p id="tour-text" className="tour-text" aria-live="polite">{step.text}</p>
        <div className="tour-actions">
          <div className="tour-dots" aria-hidden="true">
            {steps.map((_, i) => (
              <span key={i} className={i === index ? "is-current" : i < index ? "is-done" : ""} />
            ))}
          </div>
          {index > 0 && (
            <button type="button" className="tour-back" onClick={back}>
              Back
            </button>
          )}
          <button ref={primaryRef} type="button" className="tour-next" onClick={next}>
            {step.next || "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
