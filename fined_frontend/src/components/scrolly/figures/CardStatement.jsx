// WinterArc Day 4 Chapter 2 — "card statement": Arjun's card statement, which
// the reader pays, instead of a chart.
//   2.1 pay the ₹10,000 in full by the due date: stamped "Paid, ₹0 interest";
//   2.2 the minimum appears: pay ₹500 or ₹10,000, and see what each does;
//   2.3 a fast-forward of paying only the minimum, month by month: hidden
//       ("?") until the step's guess, then it plays (balance falling slowly,
//       interest climbing, milestones at 1, 3 and 5 years, cleared in month
//       90) and can be replayed;
//   2.4 the statement's own warning, with the 5-year mark.
// Saved as state.bill = {full, choice}. Every number is made up.
import { useEffect, useMemo, useState } from "react";
import { inr, minimumOnly } from "./winterarcFigureMath";

const fill = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Statement({ c, minimum, children }) {
  return (
    <div className="wf-statement">
      <div className="wf-statement-head">
        <span>{c.texts.card_name}</span>
        <span>{c.texts.due}</span>
      </div>
      <div className="wf-statement-rows">
        <span>
          Total due <strong>{inr(c.bill)}</strong>
        </span>
        {minimum != null && (
          <span>
            Minimum due <strong>{inr(minimum)}</strong>
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// Plays from month 0 each time it is mounted; Replay remounts it (new key).
// With reduced motion it starts at the end.
function useTicker(to, ms) {
  const [n, setN] = useState(() => (reduceMotion() ? to : 0));
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x >= to ? x : x + 1)), ms);
    return () => clearInterval(id);
  }, [to, ms]);
  return n;
}

function FastForward({ c, path, guessed }) {
  const [run, setRun] = useState(0);
  return guessed ? <FastForwardRun key={`run-${run}`} c={c} path={path} guessed onReplay={() => setRun((r) => r + 1)} /> : <FastForwardRun key="wait" c={c} path={path} />;
}

function FastForwardRun({ c, path, guessed = false, onReplay }) {
  const last = path.length - 1;
  const ticked = useTicker(last, 35);
  const m = guessed ? ticked : 0;
  const now = path[m];
  const w = 300;
  const h = 70;
  const pts = path
    .slice(0, m + 1)
    .map((p) => `${(p.month / last) * w},${h - (p.balance / c.bill) * h}`)
    .join(" ");
  return (
    <div className="wf-ff">
      <div className="wf-ff-stats">
        <span>
          Month <strong>{guessed ? m : "?"}</strong>
        </span>
        <span>
          Still owed <strong>{guessed ? inr(now.balance) : "?"}</strong>
        </span>
        <span>
          Interest paid <strong className="is-cost">{guessed ? inr(now.interestSoFar) : "?"}</strong>
        </span>
      </div>
      <svg className="wf-ff-line" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1={h} x2={w} y2={h} className="wf-ff-base" />
        {guessed && <polyline points={pts} className="wf-ff-path" />}
      </svg>
      <ol className="wf-ff-marks">
        {c.marks.map((mk) => (
          <li key={mk.month} className={guessed && m >= mk.month ? "is-on" : ""}>
            <small>{mk.label}</small>
            {guessed && m >= mk.month ? (mk.month === last ? "Cleared" : inr(path[mk.month].balance)) : "?"}
          </li>
        ))}
      </ol>
      {guessed && m >= last && (
        <button type="button" className="wf-act wf-act--ghost" onClick={onReplay}>
          Replay
        </button>
      )}
    </div>
  );
}

export default function CardStatement({ step, steps, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 3);
  const b = state.bill || {};
  const save = (patch) => onState((prev) => ({ ...prev, bill: { ...(prev.bill || {}), ...patch } }));
  const guessed = state.guesses?.[steps?.[at]?.step_id] !== undefined;
  const minimum = Math.max(c.minFloor, Math.round((c.bill * c.minPct) / 100));
  const path = useMemo(() => minimumOnly({ bill: c.bill, monthlyPct: c.monthlyRate, minPct: c.minPct, minFloor: c.minFloor }), [c]);
  const fiveYears = path[60];

  if (at === 0) {
    return (
      <div className="wf-figure wf-card">
        <p className="wf-note">{c.notes[0]}</p>
        <Statement c={c}>{b.full && <div className="wf-stamp">{c.texts.paid_stamp}</div>}</Statement>
        <button type="button" className="wf-act" disabled={b.full} onClick={() => save({ full: true })}>
          Pay {inr(c.bill)} by the due date
        </button>
        <p className="wf-out" aria-live="polite">
          {b.full ? c.texts.paid_full : c.texts.pay_hint}
        </p>
      </div>
    );
  }

  if (at === 1) {
    const choice = b.choice;
    return (
      <div className="wf-figure wf-card">
        <p className="wf-note">{c.notes[1]}</p>
        <Statement c={c} minimum={minimum}>
          {choice && <div className={`wf-stamp${choice === "min" ? " is-warn" : ""}`}>{choice === "min" ? fill(c.texts.carried_stamp, { left: inr(c.bill - minimum) }) : c.texts.paid_stamp}</div>}
        </Statement>
        <div className="wf-act-row">
          <button type="button" className={`wf-act${choice === "min" ? " is-on" : " wf-act--ghost"}`} onClick={() => save({ choice: "min" })}>
            Pay {inr(minimum)}
          </button>
          <button type="button" className={`wf-act${choice === "full" ? " is-on" : " wf-act--ghost"}`} onClick={() => save({ choice: "full" })}>
            Pay {inr(c.bill)}
          </button>
        </div>
        <p className="wf-out" aria-live="polite">
          {choice === "min" ? fill(c.texts.chose_min, { left: inr(c.bill - minimum) }) : choice === "full" ? c.texts.paid_full : c.texts.min_hint}
        </p>
      </div>
    );
  }

  if (at === 2) {
    return (
      <div className="wf-figure wf-card">
        <p className="wf-note">{guessed ? c.notes[2].after : c.notes[2].before}</p>
        <FastForward c={c} path={path} guessed={guessed} />
      </div>
    );
  }

  return (
    <div className="wf-figure wf-card">
      <p className="wf-note">{c.notes[3]}</p>
      <Statement c={c} minimum={minimum}>
        <div className="wf-warning">
          <strong>{c.texts.warning_title}</strong>
          {c.texts.warning}
        </div>
      </Statement>
      <p className="wf-out">{fill(c.texts.five_years, { owed: inr(fiveYears.balance), interest: inr(fiveYears.interestSoFar) })}</p>
    </div>
  );
}
