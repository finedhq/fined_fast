// WinterArc Day 4 Chapter 1 — "EMI calendar": a loan as a calendar of
// monthly payments instead of a chart.
//   1.1 the reader borrows the made-up ₹1 lakh (a tap) and sees what's owed;
//   1.2 length chips (1, 2, 3, 5 years) lay out 12–60 month tiles, one EMI
//       each; the EMI shrinks as the calendar grows;
//   1.3 after the step's guess, every tile splits into the part that repays
//       the loan and the part that is interest (early months are mostly
//       interest), and the total interest is named. The chips stay live.
// Saved as state.emi = {borrowed, months}. Every number is made up.
import { emiFor, emiSchedule, inr, totalInterest } from "./winterarcFigureMath";

const fill = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const yearsLabel = (months) => (months === 12 ? "1 year" : `${months / 12} years`);

export default function EmiCalendar({ step, steps, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 2);
  const e = state.emi || {};
  const save = (patch) => onState((prev) => ({ ...prev, emi: { ...(prev.emi || {}), ...patch } }));
  const guessed = state.guesses?.[steps?.[at]?.step_id] !== undefined;
  const months = e.months ?? c.start;

  if (at === 0) {
    return (
      <div className="wf-figure wf-emi">
        <p className="wf-note">{c.notes[0]}</p>
        <div className={`wf-cash${e.borrowed ? " is-taken" : ""}`} aria-hidden="true">
          {Array.from({ length: 5 }, (_, k) => (
            <i key={k} style={{ "--k": k }}>₹</i>
          ))}
          <strong>{inr(c.principal)}</strong>
        </div>
        <button type="button" className="wf-act" disabled={e.borrowed} onClick={() => save({ borrowed: true })}>
          {e.borrowed ? "Borrowed" : `Borrow ${inr(c.principal)}`}
        </button>
        <p className="wf-out" aria-live="polite">
          {e.borrowed ? c.texts.borrowed : c.texts.borrow_hint}
        </p>
      </div>
    );
  }

  const split = at === 2 && guessed;
  const emi = emiFor(c.principal, c.monthlyRate, months);
  const schedule = emiSchedule(c.principal, c.monthlyRate, months);
  const interest = totalInterest(c.principal, c.monthlyRate, months);
  return (
    <div className="wf-figure wf-emi">
      <p className="wf-note">{at === 1 ? c.notes[1] : split ? c.notes[2].after : c.notes[2].before}</p>
      <div className="wf-seg" role="group" aria-label="Loan length">
        {c.lengths.map((m) => (
          <button key={m} type="button" className={`wf-seg-btn${months === m ? " is-on" : ""}`} aria-pressed={months === m} onClick={() => save({ months: m })}>
            {yearsLabel(m)}
          </button>
        ))}
      </div>
      <div className="wf-emi-head">
        <span>
          {months} EMIs of <strong>{inr(emi)}</strong>
        </span>
        {split && (
          <span>
            Interest <strong className="is-cost">{inr(interest)}</strong>
          </span>
        )}
      </div>
      <div className={`wf-cal${split ? " is-split" : ""}`} role="img" aria-label={split ? fill(c.texts.split_label, { months, emi: inr(emi), interest: inr(interest) }) : `${months} monthly payments of ${inr(emi)}`}>
        {schedule.map((m, k) => (
          <i key={`${months}-${k}`} style={{ "--int": `${(m.interest / m.emi) * 100}%`, animationDelay: `${Math.min(k, 40) * 12}ms` }} />
        ))}
      </div>
      {split && (
        <div className="wf-legend" aria-hidden="true">
          <span>
            <i className="wf-sw wf-sw--repay" /> Repays the loan
          </span>
          <span>
            <i className="wf-sw wf-sw--int" /> Interest
          </span>
        </div>
      )}
      <p className="wf-out" aria-live="polite">
        {split
          ? fill(c.texts.split, { back: inr(c.principal + interest), interest: inr(interest), first: Math.round((schedule[0].interest / emi) * 100) })
          : fill(c.texts.calendar, { months, emi: inr(emi), years: yearsLabel(months) })}
      </p>
    </div>
  );
}
