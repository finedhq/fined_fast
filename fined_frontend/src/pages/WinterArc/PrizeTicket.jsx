// The gold WinterArc prize ticket: the prize pool counting up from 0, "in cash
// prizes", and a tilted FREE ENTRY stamp. Used in the home page popup and the
// /winterarc hero. Set --ticket-notch to the background colour behind it so the
// ticket's side notches look cut out.
import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";
import { PiGiftFill } from "react-icons/pi";
import "./PrizeTicket.css";

function PrizeCount({ value, delay }) {
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const target = Number(String(value).replace(/[^0-9]/g, "")) || 0;
  useEffect(() => {
    const el = ref.current;
    if (!el || reduce || !target) return undefined;
    const controls = animate(0, target, {
      duration: 1.4,
      delay,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => { el.textContent = `₹${Math.round(v).toLocaleString("en-IN")}`; },
    });
    return () => controls.stop();
  }, [reduce, target, delay]);
  return <span ref={ref} className="pt-num">{value}</span>;
}

export default function PrizeTicket({ amount, label = "in cash prizes", delay = 0.35, className = "", ...rest }) {
  return (
    <div className={`pt-ticket ${className}`} {...rest}>
      <PiGiftFill className="pt-icon" aria-hidden="true" />
      <div className="pt-text">
        <PrizeCount value={amount} delay={delay} />
        <span className="pt-label">{label}</span>
      </div>
      <span className="pt-stamp">Free<br />entry</span>
    </div>
  );
}
