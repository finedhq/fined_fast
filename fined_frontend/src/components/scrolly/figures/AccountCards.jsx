// WinterArc Day 2 Chapter 2 — "accounts": three account cards the reader
// uses, one per step, instead of a chart. Savings: pay by UPI and the money
// leaves at once (access). FD: a padlock; trying to break it early explains
// the penalty (no number: it differs by bank). RD: a jar of 12 monthly slots
// the reader fills one tap at a time. Step 4 lines them up; the FD glows once
// the step's guess is answered. Saved as state.acct = {upi, broke, rd}.
// Every rate is made up and the cards say so.
import { inr } from "./winterarcFigureMath";

export default function AccountCards({ step, steps, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 3);
  const acct = state.acct || {};
  const upi = acct.upi || 0;
  const rd = acct.rd || 0;
  const guessed = state.guesses?.[steps?.[at]?.step_id] !== undefined;
  const save = (patch) => onState((prev) => ({ ...prev, acct: { ...(prev.acct || {}), ...patch } }));
  const balance = c.savings.amount - upi * c.savings.upi;
  const shown = { savings: true, fd: at >= 1, rd: at >= 2 };
  const focus = ["savings", "fd", "rd", "all"][at];

  const card = (id, title, rate, body, extra) => (
    <div
      key={id}
      className={`wf-acct wf-acct--${id}${shown[id] ? "" : " is-hidden"}${focus === id ? " is-focus" : ""}${at === 3 && guessed && id === "fd" ? " is-pulse" : ""}`}
      aria-hidden={shown[id] ? undefined : true}
    >
      <div className="wf-acct-name">{title}</div>
      <div className="wf-acct-rate">{rate}</div>
      {shown[id] ? body : <div className="wf-acct-q">?</div>}
      {shown[id] && extra}
    </div>
  );

  return (
    <div className="wf-figure wf-accounts">
      <p className="wf-note">{c.notes[at]}</p>
      <div className="wf-acct-row">
        {card(
          "savings",
          "Savings",
          `${c.savings.rate}% a year`,
          <div className="wf-acct-big">{inr(balance)}</div>,
          <div className="wf-acct-small">≈ {inr(c.savings.interest)} interest in a year</div>,
        )}
        {card(
          "fd",
          "FD",
          `${c.fd.rate}%, 1 year`,
          <div className={`wf-lock${acct.broke && at === 1 ? " is-shake" : ""}`} aria-hidden="true">
            <span className="wf-lock-shackle" />
            <span className="wf-lock-body">{inr(c.fd.amount)}</span>
          </div>,
          <div className="wf-acct-small">≈ {inr(c.fd.interest)} at the end</div>,
        )}
        {card(
          "rd",
          "RD",
          `${inr(c.rd.monthly)} a month`,
          <div className="wf-jar" aria-label={`${rd} of ${c.rd.months} months paid in`}>
            {Array.from({ length: c.rd.months }, (_, k) => (
              <i key={k} className={k < rd ? "is-in" : ""} />
            ))}
          </div>,
          <div className="wf-acct-small">{rd >= c.rd.months ? `${inr(c.rd.monthly * c.rd.months)} in, ≈ ${inr(c.rd.interest)} interest` : `${inr(c.rd.monthly * rd)} in so far`}</div>,
        )}
      </div>

      <div className="wf-panel" aria-live="polite">
        {at === 0 && (
          <>
            <button type="button" className="wf-act" disabled={balance <= c.savings.upi} onClick={() => save({ upi: upi + 1 })}>
              Pay {inr(c.savings.upi)} by UPI
            </button>
            <p className="wf-out">{upi ? fill(c.texts.upi_done, { left: inr(balance) }) : c.texts.upi_hint}</p>
          </>
        )}
        {at === 1 && (
          <>
            <button type="button" className="wf-act wf-act--warn" onClick={() => save({ broke: true })}>
              Break the FD early
            </button>
            <p className="wf-out">{acct.broke ? c.texts.fd_broke : c.texts.fd_hint}</p>
          </>
        )}
        {at === 2 && (
          <>
            <div className="wf-act-row">
              <button type="button" className="wf-act" disabled={rd >= c.rd.months} onClick={() => save({ rd: rd + 1 })}>
                Put in month {Math.min(rd + 1, c.rd.months)}'s {inr(c.rd.monthly)}
              </button>
              <button type="button" className="wf-act wf-act--ghost" disabled={rd >= c.rd.months} onClick={() => save({ rd: c.rd.months })}>
                Fill the year
              </button>
            </div>
            <p className="wf-out">{rd >= c.rd.months ? c.texts.rd_done : c.texts.rd_hint}</p>
          </>
        )}
        {at === 3 && <p className="wf-out">{guessed ? c.texts.compare_after : c.texts.compare_before}</p>}
      </div>
    </div>
  );
}

const fill = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
