// WinterArc Day 14 Chapter 2 — "The locked boxes".
//   2.1 three boxes (PPF, EPF, NPS) open one at a time on tap, each with a
//       label card: who can open it, who sets the rate, the limits;
//   2.2 place five boxes (plus a savings account and a gold ETF) on a timeline
//       from "today" to "retirement age" (SortBoard, tap to place); on Done,
//       wrongly placed boxes move to their zone: "N of 5 placed right";
//   2.3 three return dials: PPF set quarterly, EPF declared yearly, NPS a
//       wobbling needle.
// Saved as state.locks = {open, placed, done}.
import SortBoard from "./SortBoard";
import { saver, stepAt } from "./waState";
import { fill } from "./winterarcDays815Math";

export default function LockTimeline({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.locks || {};
  const save = saver(onState, "locks");
  const open = s.open || [];
  const placed = s.placed || {};
  const right = c.cards.filter((k) => placed[k.id] === k.zone).length;

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wk-boxes">
          {c.boxes.map((b) => {
            const isOpen = open.includes(b.id);
            return (
              <button key={b.id} type="button" className={`wk-box${isOpen ? " is-open" : ""}`} aria-expanded={isOpen} onClick={() => save({ open: isOpen ? open : [...open, b.id] })}>
                <span className="wk-box-lid" aria-hidden="true">
                  {isOpen ? "📭" : "📦"}
                </span>
                <strong>{b.label}</strong>
                {isOpen && (
                  <>
                    <small>{b.who}</small>
                    <small>{b.rate}</small>
                    <small>{b.extra}</small>
                  </>
                )}
              </button>
            );
          })}
        </div>
        <p className="wf-out">{open.length < c.boxes.length ? `${open.length} of ${c.boxes.length} opened.` : "All three open. Next: when can you get the money out?"}</p>
      </div>
    );
  }

  if (at === 1) {
    const shown = s.done ? Object.fromEntries(c.cards.map((k) => [k.id, k.zone])) : placed;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <SortBoard cards={c.cards} zones={c.zones.map((z) => ({ ...z, label: z.note ? `${z.label} (${z.note})` : z.label }))} placed={shown} onPlace={(id, z) => save({ placed: { ...placed, [id]: z } })} done={s.done} onDone={() => save({ done: true })} doneLabel="Lock the timeline" columns={1} zoneClass="wk-timeline-zones" />
        {s.done && <p className="wf-out">{fill(c.texts.placed, { n: right })}</p>}
        <p className="wf-foot">{c.texts.foot}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <div className="wk-dials">
        {c.boxes.map((b) => (
          <div key={b.id} className={`wk-rdial wk-rdial--${b.id}`}>
            <svg viewBox="0 0 100 60" aria-hidden="true">
              <path d="M10 55 A40 40 0 0 1 90 55" className="wk-rdial-arc" />
              <line x1="50" y1="55" x2="50" y2="20" className="wk-rdial-needle" />
            </svg>
            <strong>{b.label}</strong>
            <small>{b.dial}</small>
          </div>
        ))}
      </div>
      <p className="wf-out">Fixed by the government, declared yearly, or market-linked.</p>
    </div>
  );
}
