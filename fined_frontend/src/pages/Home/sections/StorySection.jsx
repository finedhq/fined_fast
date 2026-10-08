// "Nobody taught you this": the site's own line about money never being
// taught, lit up word by word as you scroll (reading pace = scroll pace),
// then what FinEd does about it, then the one marquee on the page: the topics
// the courses and articles cover. The marquee drifts on its own and follows
// the direction you scroll in.
import { useRef } from "react";
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { PiStarFill } from "react-icons/pi";
import "./StorySection.css";

const LEAD = "Most people never really learned about money. Not in school, not at home. Someone just handed you a salary one day and said good luck.";
const HIGHLIGHT_FROM = LEAD.split(" ").length - 2; // "good luck."
const FOLLOW = "FinEd fixes that, but without making it feel like homework. Every lesson is short enough to finish on a lunch break.";
// Everyday-life questions rather than textbook terms; each one is covered by
// a FinEd article or by the stock market course.
const TOPICS = [
  "Your first salary",
  "“No cost” EMIs",
  "Credit scores",
  "How UPI makes money",
  "Index funds",
  "TDS on your salary",
  "How IPOs work",
  "Credit vs debit cards",
  "Nifty & Sensex",
  "Investing in US stocks",
  "Why prices keep rising",
  "How dividends work",
];

function Word({ children, progress, range, highlight }) {
  const opacity = useTransform(progress, range, [0.16, 1]);
  return (
    <motion.span className={`lp-story-word${highlight ? " is-hl" : ""}`} style={{ opacity }}>
      {children}
    </motion.span>
  );
}

const wrap = (min, max, v) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

function TopicMarquee() {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 });
  const boost = useTransform(velocity, [-1000, 0, 1000], [-4, 0, 4], { clamp: false });
  const direction = useRef(-1);
  // Two copies of the list sit side by side, so moving by half wraps seamlessly.
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < 0) direction.current = 1;
    else if (b > 0) direction.current = -1;
    const move = direction.current * 1.6 * (delta / 1000) * (1 + Math.abs(b));
    baseX.set(baseX.get() + move);
  });

  const row = (copy) =>
    TOPICS.map((t, i) => (
      <span key={`${copy}-${t}`} className={`lp-topic${i % 2 ? " is-alt" : ""}`} aria-hidden={copy > 0 || undefined}>
        {t}
        <PiStarFill className="lp-topic-star" aria-hidden="true" />
      </span>
    ));

  return (
    <div className="lp-marquee" aria-label={`Topics we cover: ${TOPICS.join(", ")}`} role="region">
      <motion.div className="lp-marquee-track" style={reduce ? undefined : { x }}>
        {row(0)}
        {row(1)}
      </motion.div>
    </div>
  );
}

export default function StorySection() {
  const reduce = useReducedMotion();
  const leadRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: leadRef, offset: ["start 85%", "end 50%"] });
  const words = LEAD.split(" ");

  return (
    <section className="lp-story">
      <div className="lp-story-inner">
        <p className="lp-story-lead" ref={leadRef}>
          {words.map((w, i) =>
            reduce ? (
              <span key={i} className={`lp-story-word${i >= HIGHLIGHT_FROM ? " is-hl" : ""}`}>
                {w}
              </span>
            ) : (
              <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} highlight={i >= HIGHLIGHT_FROM}>
                {w}
              </Word>
            )
          )}
        </p>

        <motion.p
          className="lp-story-follow"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {FOLLOW}
        </motion.p>
      </div>

      <TopicMarquee />
    </section>
  );
}
