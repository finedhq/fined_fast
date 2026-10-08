// Hero visual: Module 1 playing itself in about six seconds, built from the
// module's real content (sample module from the API). The three chapters fill
// in, the hands-on tool and the quick checks pay their real FinStars, the
// first quick check pops up and gets answered (without showing which option
// is right, so the module isn't spoiled), and the module ends complete.
// Plays once when it comes into view; "Watch again" replays it. With reduced
// motion it shows the finished state straight away.
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { PiArrowCounterClockwiseBold, PiCheckBold, PiFlaskBold, PiStarFill } from "react-icons/pi";
import { getCardFinstars } from "../../../utils/finstars";
import "./ModulePreview.css";

const EASE = [0.16, 1, 0.3, 1];
const CONFETTI = ["#4100BC", "#4A3AFF", "#F5A623", "#FFB600", "#10B981"];

// step: 1 tool done after chapter 1, 2 chapter 2 read, 3 quick check shown,
// 4 quick check answered, 5 chapter 3 + second check, 6 module complete
const TIMELINE = [
  [1200, 1],
  [2300, 2],
  [2700, 3],
  [3700, 4],
  [5100, 5],
  [5800, 6],
];
const LAST = 6;

// What the card shows before the module arrives from the server, so it can
// appear with the rest of the hero instead of a second or more later. The
// live module replaces it as soon as it loads; refresh this if Module 1's
// title, chapters or first quick check change.
const SNAPSHOT = {
  badge: "Module 1 · Basics of the Stock Market",
  title: "Why does the stock market exist?",
  meta: ["4 min read", "3 short stages", "1 hands-on tool", "2 quick checks"],
  chapters: ["The Slow Leak", "Meera Needs ₹50 Lakh", "The Exit Problem"],
  toolStars: 10,
  check: {
    title: "Quick check",
    question: "Tiffin Theory has a bad year and makes a loss. Who still gets paid?",
    options: [
      { id: "a", text: "The people who bought a slice of the business", is_correct: false },
      { id: "b", text: "The bank that lent the money", is_correct: true },
      { id: "c", text: "Both, equally", is_correct: false },
      { id: "d", text: "Nobody — a loss cancels everything", is_correct: false },
    ],
  },
  checkStars: 5,
  lastStars: 5,
};

function moduleFrom(bundle) {
  const cards = [...(bundle?.cards || [])].sort((a, b) => a.order_index - b.order_index);
  const hero = cards.find((c) => c.card_template === "hero")?.card_data || {};
  const chapters = cards.filter((c) => c.card_template === "narrative").map((c) => c.card_data?.title || c.title);
  const tool = cards.find((c) => c.card_template === "model");
  const quizzes = cards.filter((c) => c.card_template === "quiz");
  if (chapters.length < 3 || !tool || quizzes.length < 2) return null;
  const stars = (c) => getCardFinstars(c.card_data || {}, c.card_template);
  return {
    badge: hero.badge || bundle.module_title,
    title: hero.short_title || bundle.module_title,
    meta: [hero.read_time ? `${String(hero.read_time).replace(/^~/, "")} read` : null, ...(hero.meta_chips || [])].filter(Boolean),
    chapters: chapters.slice(0, 3),
    toolStars: stars(tool),
    check: quizzes[0].card_data,
    checkStars: stars(quizzes[0]),
    lastStars: stars(quizzes[1]),
  };
}

function StarsPill({ value, max, bump }) {
  const mv = useMotionValue(value);
  const shown = useTransform(mv, (v) => String(Math.round(v)));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.6, ease: EASE });
    return () => c.stop();
  }, [value, mv]);

  return (
    <div className="lp-mp-stars">
      <motion.span
        key={bump}
        className="lp-mp-stars-inner"
        initial={bump ? { scale: 1.18 } : false}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 14 }}
      >
        <PiStarFill aria-hidden="true" />
        <motion.span>{shown}</motion.span>
        <span className="lp-mp-stars-of">/ {max} FinStars</span>
      </motion.span>
      <AnimatePresence>
        {bump > 0 && (
          <motion.span
            key={`plus-${bump}`}
            className="lp-mp-plus"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: [0, 1, 1, 0], y: [6, -10, -18, -30] }}
            transition={{ duration: 1.1, times: [0, 0.2, 0.7, 1] }}
          >
            +{bump}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function Confetti() {
  // Spread out by index (no randomness), so every burst looks the same.
  const pieces = Array.from({ length: 14 }, (_, i) => ({
    x: Math.sin(i * 2.4) * 110,
    y: -60 - ((i * 37) % 90),
    r: (i * 53) % 360,
    c: CONFETTI[i % CONFETTI.length],
  }));
  return (
    <div className="lp-mp-confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          style={{ backgroundColor: p.c }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 140], opacity: [1, 1, 0], rotate: p.r }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function ModulePreview({ bundle }) {
  const m = useMemo(() => moduleFrom(bundle) || SNAPSHOT, [bundle]);
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [played, setPlayed] = useState(0);
  const [run, setRun] = useState(0);
  const step = reduce ? LAST : played;

  useEffect(() => {
    if (reduce || !inView) return undefined;
    const timers = TIMELINE.map(([ms, s]) => setTimeout(() => setPlayed(s), ms));
    return () => timers.forEach(clearTimeout);
  }, [inView, reduce, run]);

  const replay = () => {
    setPlayed(0);
    setRun((r) => r + 1);
  };

  const max = m.toolStars + m.checkStars + m.lastStars;
  const stars = (step >= 1 ? m.toolStars : 0) + (step >= 4 ? m.checkStars : 0) + (step >= 5 ? m.lastStars : 0);
  const bump = step === 1 ? m.toolStars : step === 4 ? m.checkStars : step === 5 ? m.lastStars : 0;
  const chapterDone = [step >= 1, step >= 2, step >= 5];
  const done = step >= LAST;
  const checkShown = step === 3 || step === 4;

  return (
    <div className="lp-mp" ref={ref}>
      <motion.div
        className={`lp-mp-card${done ? " is-done" : ""}`}
        initial={reduce ? false : { opacity: 0, y: 40, rotate: 1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
      >
        <div className="lp-mp-badge">{m.badge}</div>
        <h2 className="lp-mp-title">{m.title}</h2>
        <ul className="lp-mp-meta">
          {m.meta.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>

        <ol className="lp-mp-chapters">
          {m.chapters.map((title, i) => (
            <li key={title} className={chapterDone[i] ? "is-done" : ""}>
              <span className="lp-mp-num">
                <AnimatePresence initial={false} mode="wait">
                  {chapterDone[i] ? (
                    <motion.span key="tick" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
                      <PiCheckBold aria-hidden="true" />
                    </motion.span>
                  ) : (
                    <motion.span key="num" exit={{ scale: 0 }}>
                      {i + 1}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
              <span className="lp-mp-ch-title">{title}</span>
              <span className="lp-mp-bar" aria-hidden="true">
                <motion.span
                  initial={false}
                  animate={{ scaleX: chapterDone[i] ? 1 : 0 }}
                  transition={{ duration: reduce ? 0 : 0.9, ease: EASE }}
                />
              </span>
            </li>
          ))}
        </ol>

        <div className="lp-mp-foot">
          <AnimatePresence mode="wait" initial={false}>
            {done ? (
              <motion.span key="done" className="lp-mp-status is-done" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <PiCheckBold aria-hidden="true" /> Module complete
              </motion.span>
            ) : step >= 1 ? (
              <motion.span key="tool" className="lp-mp-status" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <PiFlaskBold aria-hidden="true" /> Hands-on tool done
              </motion.span>
            ) : (
              <span key="idle" className="lp-mp-status is-idle">
                Reading…
              </span>
            )}
          </AnimatePresence>
          <StarsPill value={stars} max={max} bump={bump} />
          {done && !reduce && <Confetti key={run} />}
        </div>

        {done && !reduce && (
          <motion.button
            type="button"
            className="lp-mp-replay"
            onClick={replay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <PiArrowCounterClockwiseBold aria-hidden="true" /> Watch again
          </motion.button>
        )}
      </motion.div>

      {/* Shown only while it's being answered (steps 3-4), then the module moves on. */}
      <AnimatePresence>
        {checkShown && (
          <motion.div
            className="lp-mp-check"
            initial={{ opacity: 0, y: 30, scale: 0.92, rotate: -6 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: -2.5 }}
            exit={{ opacity: 0, y: 24, scale: 0.95, transition: { duration: 0.35 } }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <div className="lp-mp-check-label">{m.check.title || "Quick check"}</div>
            <p className="lp-mp-check-q">{m.check.question}</p>
            {/* Which option is right is never shown here: that's for the module. */}
            <ul className={`lp-mp-opts${step >= 4 ? " is-answered" : ""}`}>
              {(m.check.options || []).map((o) => (
                <li key={o.id}>{o.text}</li>
              ))}
            </ul>
            <AnimatePresence>
              {step >= 4 && (
                <motion.div
                  className="lp-mp-stamp"
                  initial={{ opacity: 0, scale: 1.6, rotate: -14 }}
                  animate={{ opacity: 1, scale: 1, rotate: -8 }}
                  transition={{ type: "spring", stiffness: 420, damping: 16 }}
                >
                  <PiCheckBold aria-hidden="true" /> Got it right
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
