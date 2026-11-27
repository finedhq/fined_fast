// WinterArc Day 5 Chapter 2 — "Claim Machine": a hospital bill cut clause by
// clause, with the policy card on show all chapter.
//   2.1 the receipt prints; the sum-insured gauge fills;
//   2.2 the reader guesses the payout (− / + or the slider, ₹5,000 steps) and
//       locks it; the guess stays pinned for the rest of the chapter;
//   2.3–2.5 one stamp per step (room-rent limit, not payable, co-pay), each
//       moving money into the "Arjun pays" tray; 2.5 measures the guess;
//   2.6 a sandbox: remove the co-pay / room limit, switch to a ₹4 lakh bill;
//       a premium meter and a "pays" meter move together;
//   2.7 a policy-age dial: inside the waiting period the claim pays ₹0.
// Saved as state.claim = {guess, locked, noCopay, noRoom, big, age}. Stamps
// come from the step, so scrolling back peels them off in reverse.
import { claimRun, fill, inr } from "./winterarcDays567Math";

function Receipt({ c, lines, stamps, result, totalStamp }) {
  return (
    <div className="wf-receipt">
      <div className="wf-receipt-head">{c.texts.receipt_title}</div>
      <ul>
        {lines.map((l, k) => {
          const stamp = stamps.find((s) => s.line === l.id);
          return (
            <li key={l.id} style={{ animationDelay: `${k * 120}ms` }} className={stamp ? "is-stamped" : ""}>
              <span>{l.label}</span>
              <strong>
                {stamp?.after != null ? (
                  <>
                    <s>{inr(l.amount)}</s> {inr(stamp.after)}
                  </>
                ) : (
                  inr(l.amount)
                )}
              </strong>
              {stamp && <em className="wf-claim-stamp">{stamp.label}</em>}
            </li>
          );
        })}
        <li className="wf-receipt-total">
          <span>Total</span>
          <strong>{inr(result.total)}</strong>
          {totalStamp && <em className="wf-claim-stamp">{totalStamp}</em>}
        </li>
      </ul>
    </div>
  );
}

function Policy({ c, rules }) {
  return (
    <div className="wf-policy" aria-label="Arjun's policy (made up)">
      <span>Sum insured {inr(c.policy.sumInsured)}</span>
      <span className={rules.room ? "" : "is-off"}>Room {inr(c.policy.roomLimit)}/day</span>
      <span className={rules.copay ? "" : "is-off"}>Co-pay {c.policy.copay}%</span>
      <span>Premium {inr(rules.premium)}/yr</span>
    </div>
  );
}

export default function ClaimMachine({ step, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 6);
  const s = state.claim || {};
  const save = (patch) => onState((prev) => ({ ...prev, claim: { ...(prev.claim || {}), ...patch } }));
  const guess = s.guess ?? c.guess.start;

  // Sandbox settings apply at 2.6 only; elsewhere the policy is as sold.
  const sandbox = at === 5;
  const rules = { room: !(sandbox && s.noRoom), copay: !(sandbox && s.noCopay) };
  rules.premium = c.premiums[`${rules.copay ? "c" : "n"}${rules.room ? "r" : "n"}`];
  const lines = sandbox && s.big ? c.lines.map((l) => (l.id === c.bigLine ? { ...l, amount: c.bigAmount } : l)) : c.lines;
  const age = at === 6 ? (s.age ?? c.ages[0]) : Infinity;
  const result = claimRun(lines, c.policy, rules, age, c.policy.waitMonths);
  const base = claimRun(c.lines, c.policy, { room: true, copay: true });

  // stamps by step (2.3 room, 2.4 not payable, 2.5 co-pay; all from 2.5 on)
  const roomLine = c.lines.find((l) => l.kind === "room");
  const npLine = c.lines.find((l) => l.kind === "nonpayable");
  const stamps = [];
  if (at >= 2 && rules.room) stamps.push({ line: roomLine.id, label: "Room-rent limit", after: roomLine.amount - result.roomCut });
  if (at >= 3) stamps.push({ line: npLine.id, label: "Not payable", after: 0 });
  const tray = at < 2 ? 0 : at === 2 ? result.roomCut : at === 3 ? result.roomCut + result.nonPayable : result.patient;
  const insurerSoFar = at < 2 ? null : at === 2 ? result.total - result.roomCut : at === 3 ? result.admissible : result.insurer;
  const gap = base.insurer - guess;
  const guessLine =
    Math.abs(gap) <= c.guess.step ? c.texts.guess_close : guess >= base.total ? c.texts.guess_full : fill(c.texts.guess_other, { guess: inr(guess), gap: inr(Math.abs(gap)) });

  return (
    <div className="wf-figure wf-claim">
      <p className="wf-note">{c.notes[at]}</p>
      <Policy c={c} rules={rules} />

      {at === 6 && (
        <div className="wf-seg" role="group" aria-label="How old the policy is">
          {c.ages.map((m) => (
            <button key={m} type="button" className={`wf-seg-btn${age === m ? " is-on" : ""}`} aria-pressed={age === m} onClick={() => save({ age: m })}>
              {m < 12 ? `${m} mo` : `${m / 12} yr${m > 12 ? "s" : ""}`}
            </button>
          ))}
        </div>
      )}

      <div className={`wf-claim-body${result.waiting ? " is-waiting" : ""}`}>
        <Receipt c={c} lines={lines} stamps={stamps} result={result} totalStamp={at >= 4 && rules.copay ? `Co-pay ${c.policy.copay}%` : null} />
        {result.waiting && <div className="wf-claim-wait">{c.texts.waiting_stamp}</div>}
      </div>

      {at === 0 && (
        <div className="wf-gauge-bar" aria-label={`Bill is ${Math.round((base.total / c.policy.sumInsured) * 100)}% of the sum insured`}>
          <span style={{ width: `${(base.total / c.policy.sumInsured) * 100}%` }} />
          <small>
            {inr(base.total)} of {inr(c.policy.sumInsured)} sum insured
          </small>
        </div>
      )}

      {at === 1 && !s.locked && (
        <div className="wf-guess">
          <label className="wf-guess-label" htmlFor="wf-claim-guess">
            The insurer pays: <strong>{inr(guess)}</strong>
          </label>
          <div className="wf-act-row">
            <button type="button" className="stepper-btn" aria-label="₹5,000 less" onClick={() => save({ guess: Math.max(0, guess - c.guess.step) })}>
              −
            </button>
            <input id="wf-claim-guess" type="range" min="0" max={base.total} step={c.guess.step} value={guess} onChange={(e) => save({ guess: Number(e.target.value) })} />
            <button type="button" className="stepper-btn" aria-label="₹5,000 more" onClick={() => save({ guess: Math.min(base.total, guess + c.guess.step) })}>
              +
            </button>
          </div>
          <button type="button" className="wf-act" onClick={() => save({ guess, locked: true })}>
            Lock my guess
          </button>
        </div>
      )}

      {at >= 1 && s.locked && at <= 4 && (
        <div className="wf-claim-totals">
          <span>
            Your guess <strong>{inr(guess)}</strong>
          </span>
          {insurerSoFar != null && (
            <span>
              Insurer pays <strong>{inr(insurerSoFar)}</strong>
            </span>
          )}
          {tray > 0 && (
            <span className="is-tray">
              Arjun pays <strong>{inr(tray)}</strong>
            </span>
          )}
        </div>
      )}
      {at >= 1 && !s.locked && at > 1 && at <= 4 && <p className="wf-out">{c.texts.no_guess}</p>}
      {at === 4 && (
        <p className="wf-out">
          {c.texts.copay_line} {s.locked ? guessLine : ""}
        </p>
      )}

      {at === 5 && (
        <>
          <div className="wf-act-row">
            <button type="button" className={`wf-seg-btn${s.noCopay ? " is-on" : ""}`} aria-pressed={!!s.noCopay} onClick={() => save({ noCopay: !s.noCopay })}>
              Remove co-pay
            </button>
            <button type="button" className={`wf-seg-btn${s.noRoom ? " is-on" : ""}`} aria-pressed={!!s.noRoom} onClick={() => save({ noRoom: !s.noRoom })}>
              Remove room limit
            </button>
            <button type="button" className={`wf-seg-btn${s.big ? " is-on" : ""}`} aria-pressed={!!s.big} onClick={() => save({ big: !s.big })}>
              {s.big ? "₹4 lakh bill" : "₹1.5 lakh bill"}
            </button>
          </div>
          <div className="wf-meters">
            <div>
              <span>Premium</span>
              <strong>{inr(rules.premium)}/yr</strong>
            </div>
            <div>
              <span>Insurer pays</span>
              <strong>{inr(result.insurer)}</strong>
            </div>
            <div className="is-tray">
              <span>Arjun pays</span>
              <strong>{inr(result.patient)}</strong>
            </div>
          </div>
          <p className="wf-out" aria-live="polite">
            {result.capped
              ? c.texts.capped
              : rules.premium === c.premiums.cr
                ? c.texts.sandbox_start
                : fill(c.texts.sandbox_line, { more: inr(rules.premium - c.premiums.cr), saved: inr(base.patient - result.patient) })}
          </p>
        </>
      )}

      {at === 6 && <p className={`wf-out${result.waiting ? " is-warn" : ""}`}>{result.waiting ? c.texts.waiting : fill(c.texts.covered, { paid: inr(result.insurer) })}</p>}
    </div>
  );
}
