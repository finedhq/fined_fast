// WinterArc Day 14 Chapter 1 — "Four ways to buy gold".
//   1.1 four shop counters with ₹10,000 each; tap the one you think wins;
//   1.2 each counter weighs out its gold value after made-up costs
//       (₹8,600 · ₹9,600 · ₹9,950 · ₹9,700), your pick outlined;
//   1.3 shields: ETF "SEBI-regulated", digital gold an open shield, jewellery
//       and coins "you hold it";
//   1.4 a silver bar with a wider wobble line, and an SGB card stamped "no new
//       issues since Feb 2024".
// Saved as state.gold = {pick}.
import { MiniLines } from "./WaKit";
import { saver, stepAt } from "./waState";
import { fill, inr } from "./winterarcDays815Math";

const SHIELD = { sebi: "🛡️", open: "⚠️", own: "🔐" };

export default function GoldCounter({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.gold || {};
  const save = saver(onState, "gold");
  const pick = c.routes.find((r) => r.id === s.pick);

  if (at === 3) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[3]}</p>
        <MiniLines
          lines={[
            { id: "gold", values: c.wobble.gold, tone: 2, label: "Gold" },
            { id: "silver", values: c.wobble.silver, tone: 0, label: "Silver" },
          ]}
          yMin={94}
          yMax={114}
          ariaLabel="Made-up price lines: silver swings wider than gold"
          height={110}
        />
        <p className="wf-out">{c.texts.silver}</p>
        <div className="wk-sgb">
          <strong>Sovereign Gold Bond</strong>
          <span className="wf-stamp">{c.texts.sgb}</span>
          <small>{c.texts.sgb_note}</small>
        </div>
        <p className="wf-foot">Made-up price lines.</p>
      </div>
    );
  }

  const max = c.amount;
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[at]}</p>
      <div className="wk-counters">
        {c.routes.map((r) => (
          <button key={r.id} type="button" className={`wk-counter${s.pick === r.id ? " is-pick" : ""}${at === 2 ? ` wk-counter--${r.shield}` : ""}`} aria-pressed={s.pick === r.id} disabled={at !== 0} onClick={() => save({ pick: r.id })}>
            <span className="wk-counter-icon" aria-hidden="true">
              {r.icon}
            </span>
            <strong>{r.label}</strong>
            {at === 0 && <small>{inr(c.amount)} on the counter</small>}
            {at === 1 && (
              <>
                <span className="wk-counter-bar">
                  <i style={{ width: `${(r.held / max) * 100}%` }} />
                </span>
                <em>{inr(r.held)}</em>
                <small>{r.why}</small>
              </>
            )}
            {at === 2 && (
              <small>
                <span aria-hidden="true">{SHIELD[r.shield]} </span>
                {r.shieldText}
              </small>
            )}
          </button>
        ))}
      </div>
      <p className="wf-out" aria-live="polite">
        {at === 0 ? (pick ? `You picked ${pick.label}.` : c.texts.pick) : at === 1 ? (pick ? fill(c.texts.picked, { route: pick.label, held: inr(pick.held) }) : "Pick a counter at 1.1 to see your result.") : "A gold ETF is a SEBI-regulated mutual fund product. In November 2025, SEBI warned that platform \"digital gold\" is outside its regulation."}
      </p>
      {at < 2 && <p className="wf-foot">{c.texts.foot}</p>}
    </div>
  );
}
