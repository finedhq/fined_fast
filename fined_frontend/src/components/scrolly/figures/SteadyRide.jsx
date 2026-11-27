// WinterArc Day 15 Chapter 3 — "Steady or rollercoaster".
//   3.1 two made-up 5-year paths: X +45, −10, +8, +25, +2 and Y +12, +10,
//       +14, +11, +13, both about 12% a year;
//   3.2 pick X or Y for a goal due after year 2; a cut line at year 2 (X ₹1,305,
//       Y ₹1,232); then replay X's years in a different order: ₹972;
//   3.3 a 5-star badge on X dims to 3 stars after its −10% year (made up);
//   3.4 tap six cards into a checklist ladder; a suggested order appears
//       beside it (goal first, last year's return last, middle four any order).
// Saved as state.ride = {pick, reordered, order}.
import { MiniLines } from "./WaKit";
import { saver, stepAt } from "./waState";
import { inr, pathValues } from "./winterarcDays815Math";

export default function SteadyRide({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.ride || {};
  const save = saver(onState, "ride");
  const xs = [c.start, ...pathValues(c.start, s.reordered && at === 1 ? c.xReorder : c.x)];
  const ys = [c.start, ...pathValues(c.start, c.y)];
  const years = ["Start", "Y1", "Y2", "Y3", "Y4", "Y5"];

  if (at === 0 || at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[at]}</p>
        <MiniLines
          lines={[
            { id: "x", values: xs, tone: 3, label: "X" },
            { id: "y", values: ys, tone: 1, label: "Y" },
          ]}
          yMin={800}
          xLabels={years}
          marker={at === 1 ? c.cut : null}
          ariaLabel={`Fund X ends at ${inr(xs[5])}, Fund Y at ${inr(ys[5])}`}
        />
        {at === 0 && <p className="wf-out">{c.texts.same}</p>}
        {at === 1 && (
          <>
            <div className="wf-seg" role="group" aria-label="Your pick">
              {["x", "y"].map((id) => (
                <button key={id} type="button" className={`wf-seg-btn${s.pick === id ? " is-on" : ""}`} aria-pressed={s.pick === id} onClick={() => save({ pick: id })}>
                  Fund {id.toUpperCase()}
                </button>
              ))}
            </div>
            {s.pick && (
              <div className="wf-meters" aria-live="polite">
                <span className={s.pick === "x" ? "is-on" : ""}>
                  X at year 2: <strong>{inr(xs[c.cut])}</strong>
                </span>
                <span className={s.pick === "y" ? "is-on" : ""}>
                  Y at year 2: <strong>{inr(ys[c.cut])}</strong>
                </span>
              </div>
            )}
            {s.pick && (
              <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ reordered: !s.reordered })}>
                {s.reordered ? "Back to X's first order" : c.texts.replay}
              </button>
            )}
            <p className="wf-out">{s.pick ? (s.reordered ? c.texts.cut : "Now replay X with the same years in a different order.") : c.texts.pick}</p>
          </>
        )}
        <p className="wf-foot">Made-up funds. ₹1,000 at the start.</p>
      </div>
    );
  }

  if (at === 2) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wk-stars">
          <div>
            <small>Before</small>
            <strong aria-label={`${c.stars.before} stars`}>{"★".repeat(c.stars.before)}</strong>
          </div>
          <div className="is-dim">
            <small>After X's −10% year</small>
            <strong aria-label={`${c.stars.after} stars`}>
              {"★".repeat(c.stars.after)}
              <span>{"★".repeat(c.stars.before - c.stars.after)}</span>
            </strong>
          </div>
        </div>
        <p className="wf-out">{c.texts.stars}</p>
      </div>
    );
  }

  const order = s.order || [];
  const left = c.checklist.filter((k) => !order.includes(k.id));
  const full = order.length === c.checklist.length;
  const good = full && order[0] === c.firstId && order[order.length - 1] === c.lastId;
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      {!full && (
        <div className="wf-sort-tray" role="group" aria-label="Checklist cards">
          {left.map((k) => (
            <button key={k.id} type="button" className="wf-sort-card" onClick={() => save({ order: [...order, k.id] })}>
              {k.label}
            </button>
          ))}
        </div>
      )}
      <div className={`wk-ladders${full ? " is-full" : ""}`}>
        <ol className="wk-checklist" aria-label="Your checklist">
          {order.map((id) => (
            <li key={id}>{c.checklist.find((k) => k.id === id).label}</li>
          ))}
        </ol>
        {full && (
          <ol className="wk-checklist is-suggested" aria-label="Suggested order">
            {c.checklist.map((k) => (
              <li key={k.id}>{k.label}</li>
            ))}
          </ol>
        )}
      </div>
      {full && <p className="wf-out" aria-live="polite">{`${c.texts.built} ${good ? c.texts.good : c.texts.tweak}`}</p>}
      {order.length > 0 && (
        <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ order: [] })}>
          Start over
        </button>
      )}
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
