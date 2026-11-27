// WinterArc Day 12 Chapter 3 — "Copy the index" (the FinEd Five Index Fund).
//   3.1 ₹1,000 splits exactly like Day 10's weights (₹400 · 250 · 150 · 120 · 80);
//   3.2 "Apply the index change": the Kisan Seeds slice sells, Green Cart buys
//       in at the same weight, a "Follows the index" stamp;
//   3.3 index +12.0% vs fund +11.8%: the 0.2% gap labelled "costs".
// Saved as state.ifund = {applied}.
import { saver, stepAt } from "./waState";
import { inr } from "./winterarcDays815Math";

export default function IndexFund({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.ifund || {};
  const save = saver(onState, "ifund");

  if (at < 2) {
    const applied = at === 1 && s.applied;
    const rows = c.companies.map((k) => (applied && k.id === c.swap.out ? { ...c.swap.in, joined: true } : k));
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[at]}</p>
        <div className="wk-split">
          {rows.map((k) => (
            <div key={k.id} className={`wk-split-row${k.joined ? " is-new" : ""}${at === 1 && !applied && k.id === c.swap.out ? " is-leaving" : ""}`}>
              <span>{k.name}</span>
              <i style={{ width: `${k.w * 2}%` }} />
              <strong>{inr((c.amount * k.w) / 100)}</strong>
            </div>
          ))}
        </div>
        {at === 0 && <p className="wf-out">{c.texts.split}</p>}
        {at === 1 &&
          (applied ? (
            <>
              <p className="wf-stamp">{c.texts.stamp}</p>
              <p className="wf-out" aria-live="polite">{c.texts.applied}</p>
            </>
          ) : (
            <button type="button" className="wf-act" onClick={() => save({ applied: true })}>
              {c.texts.apply}
            </button>
          ))}
        <p className="wf-foot">Made-up fund and companies.</p>
      </div>
    );
  }

  const max = c.indexReturn;
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <div className="wk-gap">
        {[
          ["Index", c.indexReturn],
          ["Fund", c.fundReturn],
        ].map(([l, v]) => (
          <div key={l} className="wk-gap-col">
            <div className="wk-gap-bar" style={{ height: `${(v / max) * 100}%` }}>
              <strong>+{v.toFixed(1)}%</strong>
            </div>
            <span>{l}</span>
          </div>
        ))}
        <span className="wk-gap-label">← {(c.indexReturn - c.fundReturn).toFixed(1)}%: costs</span>
      </div>
      <p className="wf-out">{c.texts.gap}</p>
      <p className="wf-foot">A made-up year.</p>
    </div>
  );
}
