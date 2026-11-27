// WinterArc Day 13 Chapter 1 — "Be the lender".
//   1.1 tap Buy: a bond card prints (face ₹10,000 · coupon 7% · 5 years);
//   1.2 a 5-year timeline: a ₹700 coin drops each year, then ₹10,000 returns;
//   1.3 the reader guesses on the card; then a risk dial beside each borrower,
//       the government low, Volt Scooters higher with a "might not repay" tag;
//   1.4 a ratings ladder (AAA → below), Volt slides to a made-up "A", the
//       interest offered rising down the ladder.
// Saved as state.bond = {bought}.
import { saver, stepAt } from "./waState";
import { inr } from "./winterarcDays815Math";

const Card = ({ who, face, coupon, years, fresh }) => (
  <div className={`wk-bondcard${fresh ? " is-fresh" : ""}`}>
    <small>{who}</small>
    <dl>
      <dt>Face value</dt>
      <dd>{inr(face)}</dd>
      <dt>Coupon</dt>
      <dd>{coupon}% a year</dd>
      <dt>Maturity</dt>
      <dd>{years} years</dd>
    </dl>
  </div>
);

const Dial = ({ pos, label, tag }) => (
  <div className="wk-minidial">
    <div className="wk-minidial-track">
      <i style={{ left: `${(pos / 5) * 100}%` }} />
    </div>
    <strong>{label}</strong>
    {tag && <small className="is-warn">{tag}</small>}
  </div>
);

export default function BondCard({ step, steps, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.bond || {};
  const save = saver(onState, "bond");
  const pay = (c.face * c.coupon) / 100;

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        {s.bought ? <Card who="Government of India (made-up bond)" face={c.face} coupon={c.coupon} years={c.years} fresh /> : (
          <button type="button" className="wf-act" onClick={() => save({ bought: true })}>
            {c.texts.buy} · {inr(c.face)}
          </button>
        )}
        {s.bought && <p className="wf-out">{c.texts.bought}</p>}
      </div>
    );
  }

  if (at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wk-timeline" role="img" aria-label={`${inr(pay)} each year for ${c.years} years, then ${inr(c.face)} back`}>
          {Array.from({ length: c.years }, (_, k) => (
            <span key={k} className="wk-timeline-yr" style={{ "--k": k }}>
              <i className="wk-coin-drop">{inr(pay)}</i>
              {k === c.years - 1 && <i className="wk-coin-drop is-big">+{inr(c.face)}</i>}
              <small>Year {k + 1}</small>
            </span>
          ))}
        </div>
        <p className="wf-out">{c.texts.collect}</p>
      </div>
    );
  }

  if (at === 2) {
    const guessed = state.guesses?.[steps?.[2]?.step_id] !== undefined;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wk-two">
          <Card who="Government (made up)" face={c.face} coupon={c.coupon} years={c.years} />
          <Card who={`${c.corp.name} (fictional)`} face={c.face} coupon={c.corp.coupon} years={c.years} />
        </div>
        {guessed && (
          <div className="wk-two">
            <Dial pos={c.dial.gov} label="Lower risk" />
            <Dial pos={c.dial.corp} label="Higher risk" tag="Chance it can't repay" />
          </div>
        )}
        <p className="wf-out" aria-live="polite">{guessed ? c.texts.risk : c.texts.guess_first}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <ol className="wk-ladder">
        {c.ladder.map((r) => (
          <li key={r.id} className={r.id === c.corp.rating ? "is-pick" : ""}>
            <strong>{r.id}</strong>
            <span>{r.id === c.corp.rating ? `🛵 ${c.corp.name}` : ""}</span>
            <em>~{r.rate}%</em>
          </li>
        ))}
      </ol>
      <p className="wf-out">{c.texts.ladder}</p>
      <p className="wf-foot">Made-up ratings and rates. Real ones vary by borrower and over time.</p>
    </div>
  );
}
