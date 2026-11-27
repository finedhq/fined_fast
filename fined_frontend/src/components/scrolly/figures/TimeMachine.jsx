// WinterArc Day 8 Chapter 3 — "The time machine": starting early vs putting
// in more.
//   3.1 two lanes on an age line 21 → 60, each person's monthly ₹2,000 as
//       bricks (Arjun 21–31, Kabir 31–60); the reader guesses on the card;
//   3.2 both grow to 60 as coin stacks: about ₹74 lakh vs ₹41 lakh;
//   3.3 an age slider (20–35): the pot at 60, what went in, and the cost of
//       waiting one more year.
// Saved as state.time = {age}. Made-up steady 10% a year, shown on screen.
import { CoinStack } from "./WaKit";
import { saver, stepAt } from "./waState";
import { fill, inrBig, monthlyPot, startAt } from "./winterarcDays815Math";

export default function TimeMachine({ step, steps, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.time || {};
  const save = saver(onState, "time");
  const guessed = state.guesses?.[steps?.[0]?.step_id] !== undefined;
  const o = { monthly: c.monthly, rate: c.rate, end: c.end };
  const span = c.end - c.early.from;
  const earlyMonths = (c.early.to - c.early.from) * 12;
  const lateMonths = (c.late.to - c.late.from) * 12;
  const earlyAt = monthlyPot({ monthly: c.monthly, rate: c.rate, payMonths: earlyMonths, totalMonths: span * 12 });
  const lateAt = monthlyPot({ monthly: c.monthly, rate: c.rate, payMonths: lateMonths, totalMonths: lateMonths });
  const max = Math.max(earlyAt, lateAt);

  const lane = (p, months) => (
    <div className="wk-age-lane">
      <span className="wk-age-name">{p.name}</span>
      <div className="wk-age-track" aria-label={`${p.name} invests from ${p.from} to ${p.to}`}>
        <span className="wk-age-bricks" style={{ left: `${((p.from - c.early.from) / span) * 100}%`, width: `${((p.to - p.from) / span) * 100}%` }}>
          {Array.from({ length: Math.min(30, p.to - p.from) }, (_, k) => (
            <i key={k} />
          ))}
        </span>
      </div>
      <small>{inrBig(c.monthly * months)} put in</small>
    </div>
  );

  if (at <= 1) {
    const show = at === 1;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[at]}</p>
        {lane(c.early, earlyMonths)}
        {lane(c.late, lateMonths)}
        <div className="wk-age-axis" aria-hidden="true">
          <span>{c.early.from}</span>
          <span>{c.early.to}</span>
          <span>{c.end}</span>
        </div>
        {show && (
          <>
            <div className="wk-coin-row">
              <CoinStack value={earlyAt} max={max} label={`about ${inrBig(earlyAt)}`} caption={c.early.name} />
              <CoinStack value={lateAt} max={max} label={`about ${inrBig(lateAt)}`} caption={c.late.name} tone="purple" />
            </div>
            <p className="wf-out" aria-live="polite">
              {fill(c.texts.reveal, { early: c.early.name, earlyIn: inrBig(c.monthly * earlyMonths), earlyAt: inrBig(earlyAt), late: c.late.name, lateIn: inrBig(c.monthly * lateMonths), lateAt: inrBig(lateAt) })}
            </p>
          </>
        )}
        {!show && <p className="wf-out">{guessed ? "Locked in. Scroll to see who ends up with more." : "Tap your guess on the left (or above on a phone)."}</p>}
        <p className="wf-foot">{c.texts.foot}</p>
      </div>
    );
  }

  const age = s.age ?? c.defaultAge;
  const pot = startAt(age, o);
  const next = age < c.ages[1] ? startAt(age + 1, o) : null;
  const top = startAt(c.ages[0], o);
  const paid = c.monthly * (c.end - age) * 12;
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <div className="wf-act-row">
        <label className="wf-stepper-label" htmlFor="wk-age">
          Start at <strong>{age}</strong>
        </label>
        <input id="wk-age" type="range" min={c.ages[0]} max={c.ages[1]} step="1" value={age} onChange={(e) => save({ age: Number(e.target.value) })} />
      </div>
      <div className="wk-coin-row">
        <CoinStack value={pot} max={top} label={`about ${inrBig(pot)}`} caption="At 60" />
        <CoinStack value={paid} max={top} label={inrBig(paid)} caption="Put in" tone="purple" />
      </div>
      <p className="wf-out" aria-live="polite">
        {next != null ? fill(c.texts.wait, { cost: inrBig(pot - next) }) : "Starting at 35 still grows, just less than starting earlier."}
      </p>
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
