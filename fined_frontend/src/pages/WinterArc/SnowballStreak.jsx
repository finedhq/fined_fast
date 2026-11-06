// "Your streak snowballs": as you scroll, a snowball rolls across the 30 days
// and grows, lighting up each streak bonus as it passes. Scroll-linked, so the
// visitor drives it. With reduced motion it shows the finished state.
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { WINTERARC as W } from "./winterarcConfig";

const BALL = 84; // px, the snowball's box at full size

export default function SnowballStreak() {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const trackW = useMotionValue(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start 88%", "end 38%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 26, mass: 0.6 });
  const p = reduce ? scrollYProgress : smooth;

  const marks = W.streakBonuses.map((b) => ({ ...b, at: (b.days - 1) / (W.totalDays - 1) }));
  const [reached, setReached] = useState(reduce ? marks.length : 0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(() => trackW.set(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, [trackW]);

  useMotionValueEvent(p, "change", (v) => {
    if (reduce) return;
    const n = marks.filter((m) => v >= m.at - 0.005).length;
    if (n !== reached) setReached(n);
  });

  const x = useTransform([p, trackW], ([v, tw]) => (reduce ? 1 : v) * Math.max(0, tw - BALL));
  const scale = useTransform(p, (v) => 0.34 + (reduce ? 1 : v) * 0.66);
  const rotate = useTransform(x, (v) => (v / (BALL / 2)) * (180 / Math.PI) * 0.6);
  const trail = useTransform([x, trackW], ([v, tw]) => (tw ? (v + BALL / 2) / tw : 0));
  const day = useTransform(p, (v) => `Day ${Math.round(1 + (reduce ? 1 : v) * (W.totalDays - 1))}`);

  return (
    <div className="wa-roll" style={{ "--ball": `${BALL}px` }}>
      <div className="wa-roll-track" ref={trackRef}>
        {marks.map((m, i) => (
          <div key={m.days} className={`wa-mark ${i < reached ? "is-hit" : ""}`} style={{ "--at": m.at }}>
            <span className="wa-mark-pts">+{m.points}</span>
            <span className="wa-mark-pin" aria-hidden="true" />
            <span className="wa-mark-day">{m.days} days</span>
          </div>
        ))}
        <div className="wa-roll-ground" aria-hidden="true" />
        <motion.div className="wa-roll-trail" style={{ scaleX: trail }} aria-hidden="true" />
        <motion.div className="wa-ball-box" style={{ x }} aria-hidden="true">
          <motion.span className="wa-ball-day">{day}</motion.span>
          <motion.div className="wa-ball" style={{ scale, rotate }} />
        </motion.div>
      </div>
      <p className="wa-sr">
        Streak bonuses: {W.streakBonuses.map((b) => `${b.points} points at ${b.days} days`).join(", ")}.
      </p>
    </div>
  );
}
