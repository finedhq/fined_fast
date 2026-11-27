// WinterArc Day 6 Chapter 2 — "Size yours": the reader's own jar, from the
// hero's "your month" numbers (money in, must-pay; Arjun's by default).
//   2.1 months of must-pay costs (1–6, the 3-to-6 band shaded): the target;
//   2.2 a monthly saving (₹500 up to the surplus, − / +): "Ready by …";
//   2.3 three notches (₹5,000 · one month · target), each with its date, and
//       the Shock Deck's March replayed against the first notch.
// Saved as state.fund = {months, saving}; Goal Forge (Chapter 3) reads the
// saving. The hero's numbers stay in the browser (sessionStorage only).
import { fill, heroMonth, inr, monthLabel, monthsToBuild, notches } from "./winterarcDays567Math";

export default function FundSizer({ step, state = {}, onState, config: c, hero }) {
  const at = Math.min(Math.max(step ?? 0, 0), 2);
  const f = state.fund || {};
  const save = (patch) => onState((prev) => ({ ...prev, fund: { ...(prev.fund || {}), ...patch } }));
  const { income, must, surplus } = heroMonth(hero, c);
  const months = f.months ?? 3;
  const maxSave = Math.max(c.minSave, Math.floor(surplus / c.minSave) * c.minSave);
  const saving = Math.min(maxSave, f.saving ?? Math.min(maxSave, c.defaultSave));
  const target = must * months;
  const ready = monthsToBuild(target, saving);
  const marks = notches(c.firstNotch, must, target, saving);
  const scale = must * 6;

  return (
    <div className="wf-figure wf-fund">
      <p className="wf-note">{fill(c.notes[at], { income: inr(income), must: inr(must) })}</p>
      <div className="wf-fund-row">
        <div className="wf-jar-tall" aria-label={`Target ${inr(target)}`}>
          <span className="wf-jar-band" style={{ bottom: `${(3 / 6) * 100}%`, height: `${(3 / 6) * 100}%` }} title="3 to 6 months" />
          <span className="wf-jar-target" style={{ bottom: `${(target / scale) * 100}%` }}>
            <b>{inr(target)}</b>
          </span>
          {at === 2 &&
            marks.map((n) => (
              <span key={n.amount} className="wf-jar-notch" style={{ bottom: `${(n.amount / scale) * 100}%` }}>
                <b>
                  {inr(n.amount)} · {monthLabel(n.months)}
                </b>
              </span>
            ))}
        </div>
        <div className="wf-fund-side">
          <div className="wf-stepper">
            <span className="wf-stepper-label">Months</span>
            <button type="button" className="stepper-btn" aria-label="One month fewer" disabled={months <= 1} onClick={() => save({ months: months - 1 })}>
              −
            </button>
            <strong>{months}</strong>
            <button type="button" className="stepper-btn" aria-label="One month more" disabled={months >= 6} onClick={() => save({ months: months + 1 })}>
              +
            </button>
          </div>
          <p className="wf-fund-big">
            {months} × {inr(must)} = <strong>{inr(target)}</strong>
          </p>
          {at >= 1 && (
            <>
              <div className="wf-stepper">
                <span className="wf-stepper-label">Save a month</span>
                <button type="button" className="stepper-btn" aria-label="₹500 less" disabled={saving <= c.minSave} onClick={() => save({ saving: saving - c.minSave })}>
                  −
                </button>
                <strong>{inr(saving)}</strong>
                <button type="button" className="stepper-btn" aria-label="₹500 more" disabled={saving >= maxSave} onClick={() => save({ saving: saving + c.minSave })}>
                  +
                </button>
              </div>
              <p className="wf-fund-big">
                Ready by <strong>{monthLabel(ready)}</strong>
                <small> ({ready} months)</small>
              </p>
            </>
          )}
        </div>
      </div>
      <p className={`wf-out${at === 1 && saving >= maxSave ? " is-warn" : ""}`} aria-live="polite">
        {at === 0
          ? fill(c.texts.target, { target: inr(target), months })
          : at === 1
            ? saving >= maxSave
              ? c.texts.maxed
              : fill(c.texts.ready, { saving: inr(saving), months: ready, when: monthLabel(ready) })
            : fill(c.texts.notch, { first: inr(c.firstNotch), onCard: inr(Math.max(0, c.marchShock - c.firstNotch)), shock: inr(c.marchShock) })}
      </p>
    </div>
  );
}
