// What learners say: the four real quotes, laid out like notes pinned at
// slightly different angles; they settle into place as they scroll in, and
// straighten up when you hover one.
import { motion, useReducedMotion } from "motion/react";
import "./TestimonialsSection.css";

const QUOTES = [
  {
    quote: "The articles explain complex financial topics in a way that's actually easy to understand. I finally feel confident reading about investing.",
    name: "Gaurav",
    age: 20,
  },
  {
    quote: "I wish I had access to content like this when I started college. It's practical and doesn't overwhelm beginners.",
    name: "Rahul",
    age: 25,
  },
  {
    quote: "FinEd's mission of making financial education free and accessible is something I genuinely support. Financial literacy shouldn't be a privilege.",
    name: "Priya",
    age: 24,
  },
  {
    quote: "The content is concise, engaging, and easy to revisit whenever I need a quick refresher.",
    name: "Ananya",
    age: 19,
  },
];
const TILT = [-2.2, 1.6, -1.2, 2.4];

export default function TestimonialsSection() {
  const reduce = useReducedMotion();
  return (
    <section className="lp-tst">
      <div className="lp-tst-inner">
        <div className="lp-tst-head">
          <h2 className="lp-tst-title">
            Every path leads <span>somewhere</span>
          </h2>
          <p className="lp-tst-sub">See what learners achieved after taking their first step.</p>
        </div>
        {/* The row animates in as a whole, so on phones the next note already
            peeks in from the edge and shows there's more to swipe. */}
        <motion.ul
          className="lp-tst-grid"
          initial={reduce ? false : "hidden"}
          whileInView="shown"
          viewport={{ once: true, amount: 0.3 }}
        >
          {QUOTES.map((q, i) => (
            <motion.li
              key={q.name}
              className={`lp-tst-card lp-tst-card--${i + 1}`}
              custom={i}
              variants={{
                hidden: (n) => ({ opacity: 0, y: 50, rotate: TILT[n] * 3 }),
                shown: (n) => ({ opacity: 1, y: 0, rotate: TILT[n] }),
              }}
              whileHover={reduce ? undefined : { rotate: 0, y: -6 }}
              transition={{ type: "spring", stiffness: 140, damping: 18, delay: reduce ? 0 : i * 0.08 }}
            >
              <span className="lp-tst-mark" aria-hidden="true">
                “
              </span>
              <blockquote>{q.quote}</blockquote>
              <div className="lp-tst-who">
                <span className="lp-tst-av" aria-hidden="true">
                  {q.name[0]}
                </span>
                <span>
                  {q.name}, {q.age}
                </span>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
