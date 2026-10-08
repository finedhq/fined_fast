// The learner count, just under the hero. The number counts up once when the
// strip comes into view (shown straight away with reduced motion).
import { useEffect, useRef } from "react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";

const LEARNERS = 2000;

export default function LearnersStrip() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const count = useMotionValue(reduce ? LEARNERS : 0);
  const shown = useTransform(count, (v) => String(Math.round(v)));

  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) {
      count.set(LEARNERS);
      return undefined;
    }
    const controls = animate(count, LEARNERS, { duration: 1.4, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduce, count]);

  return (
    <div className="lp-learners-wrap">
      <div className="lp-learners" ref={ref}>
        <div className="lp-learners-avatars" aria-hidden="true">
          <span className="lp-av lp-av-1">A</span>
          <span className="lp-av lp-av-2">B</span>
          <span className="lp-av lp-av-3">C</span>
        </div>
        <p className="lp-learners-text">
          Join <strong><motion.span>{shown}</motion.span>+</strong> learners building their financial future
        </p>
      </div>
    </div>
  );
}
