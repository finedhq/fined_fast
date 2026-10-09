// Reusable figure — "who gets paid first" when a company shuts down. The
// reader puts the claimant cards in the order they think the law pays them
// (tap a card to place it in the next free slot, tap a placed card to take it
// back; on a computer the cards can also be dragged onto a slot). "Pay out"
// then shows the real order: the pot drains down the queue and runs out
// before it reaches the owners. The answer is saved (state.queueOrder) and
// stays answered; a restored answer is shown without replaying the animation.
// Optional `playOut: {kind: "timeline", button, title, days}` (Module 4 on)
// plays the right order out on a day-by-day timeline instead of the pot, and
// `labels` renames the columns; `feedbackId` picks the item the feedback names.
import { useEffect, useState } from "react";
import { inrFull, payOut, placesRight, queueFeedback } from "./blocksMath";

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const LABELS = { items: "Groups", slots: "Paid in this order", slot: "Paid" };

export default function LiquidationQueue({ config, state, onState }) {
  const { claimants, pot } = config;
  const n = claimants.length;
  const slots = state.queueSlots || Array(n).fill(null);
  const order = state.queueOrder;
  const revealed = Array.isArray(order) && order.length === n;
  const label = (id) => claimants.find((c) => c.id === id)?.label;
  const words = { ...LABELS, ...config.labels };
  const timeline = config.playOut?.kind === "timeline";

  // Animate only a fresh answer, not one restored from earlier.
  const [animate, setAnimate] = useState(false);
  const [drained, setDrained] = useState(revealed);
  useEffect(() => {
    if (!animate) return undefined;
    const raf = requestAnimationFrame(() => setDrained(true));
    return () => cancelAnimationFrame(raf);
  }, [animate]);

  const setSlots = (fn) => onState((current) => ({ queueSlots: fn(current.queueSlots || Array(n).fill(null)) }));
  const place = (id, at) =>
    setSlots((cur) => {
      const next = cur.map((x) => (x === id ? null : x));
      const target = at ?? next.indexOf(null);
      if (target < 0) return cur;
      next[target] = id;
      return next;
    });
  const takeBack = (at) => setSlots((cur) => cur.map((x, i) => (i === at ? null : x)));
  const payOutNow = () => {
    if (slots.some((x) => !x)) return;
    setAnimate(true);
    onState({ queueOrder: [...slots] });
  };

  const onDragStart = (id) => (e) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (at) => (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (claimants.some((c) => c.id === id)) place(id, at);
  };

  if (!revealed) {
    const pool = (config.startOrder || claimants.map((c) => c.id)).filter((id) => !slots.includes(id));
    const full = slots.every(Boolean);
    return (
      <div className="lq-figure">
        <p className="lq-prompt">{config.prompt}</p>
        <div className="lq-board">
        <div className="lq-pool" aria-label={`${words.items} waiting to be placed`}>
          <span className="lq-col-label">{words.items}</span>
          {pool.map((id) => (
            <button key={id} type="button" className="lq-card" draggable onDragStart={onDragStart(id)} onClick={() => place(id)}>
              {label(id)}
            </button>
          ))}
          {!pool.length && <span className="lq-pool-empty">All placed. Tap one to take it back.</span>}
        </div>
        <ol className="lq-slots" aria-label={words.slots}>
          {slots.map((id, i) => (
            <li key={i} className={`lq-slot${id ? " filled" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop(i)}>
              <span className="lq-slot-num">{ORDINALS[i]}</span>
              {id ? (
                <button type="button" className="lq-card lq-card--placed" draggable onDragStart={onDragStart(id)} onClick={() => takeBack(i)} aria-label={`${label(id)}, ${words.slot.toLowerCase()} ${ORDINALS[i]}. Tap to take back.`}>
                  {label(id)}
                </button>
              ) : (
                <span className="lq-slot-empty">{words.slot} {ORDINALS[i]}</span>
              )}
            </li>
          ))}
        </ol>
        </div>
        <button type="button" className="lq-go" disabled={!full} onClick={payOutNow}>
          {timeline ? config.playOut.button : `Pay out ${inrFull(pot)}`}
        </button>
      </div>
    );
  }

  const right = placesRight(order, config.correctOrder);
  const yours = (
    <>
      <div className="lq-yours">
        Your order: {order.map((id, i) => `${i + 1}. ${label(id)}`).join(" · ")} — {right} of {n} places right.
      </div>
      <div className="lq-feedback" aria-live="polite">
        {queueFeedback(config, order)}
      </div>
    </>
  );

  if (timeline) {
    return (
      <div className={`lq-figure lq-figure--revealed${animate ? " lq-figure--animate" : ""}`}>
        <p className="lq-prompt">{config.playOut.title}</p>
        <ol className="lq-days">
          {config.playOut.days.map((day) => (
            <li key={day.label} className="lq-day">
              <span className="lq-day-label">{day.label}</span>
              <ol className="lq-result">
                {day.items.map((id) => {
                  const i = config.correctOrder.indexOf(id);
                  return (
                    <li key={id} className={`lq-row lq-row--event${id === config.feedbackId ? " lq-row--key" : ""}`} style={{ "--lq-delay": `${i * 0.45}s` }}>
                      <span className="lq-row-name">
                        {ORDINALS[i]} · {label(id)}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
        {yours}
      </div>
    );
  }

  const paid = payOut(claimants, config.correctOrder, pot);
  return (
    <div className={`lq-figure lq-figure--revealed${animate ? " lq-figure--animate" : ""}`}>
      <p className="lq-prompt">What the law actually does with {inrFull(pot)}:</p>
      <ol className="lq-result">
        {paid.map((c, i) => (
          <li key={c.id} className={`lq-row${c.id === config.ownerId ? " lq-row--owner" : ""}${c.paid === 0 ? " lq-row--nothing" : ""}`} style={{ "--lq-delay": `${i * 0.55}s` }}>
            <div className="lq-row-head">
              <span className="lq-row-name">
                {ORDINALS[i]} · {c.label}
              </span>
              <strong className="lq-row-paid">
                {c.paid === 0 ? "₹0 — nothing left" : c.claim == null || c.paid === c.claim ? `gets ${inrFull(c.paid)}` : `gets ${inrFull(c.paid)} of ${inrFull(c.claim)}`}
              </strong>
            </div>
            <div className="lq-meter" aria-hidden="true">
              <div className="lq-meter-fill" style={{ width: drained ? `${(c.paid / pot) * 100}%` : "0%" }}></div>
            </div>
            <div className="lq-row-note">
              {c.claim == null ? "owed whatever is left" : `owed ${inrFull(c.claim)}`} · {inrFull(c.leftAfter)} left after
            </div>
          </li>
        ))}
      </ol>
      {yours}
    </div>
  );
}
