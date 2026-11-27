// WinterArc Day 15 Chapter 2 — "Same fund, two prices" (direct vs regular).
//   2.1 twin fund cards: Direct 0.6% a year, Regular 1.6% a year (made up);
//   2.2 predict the 15-year gap (₹10,000 to ₹5,00,000), lock it; then both SIP
//       lines grow: about ₹23.8 lakh vs ₹21.7 lakh, gap about ₹2.1 lakh shaded;
//   2.3 the regular plan's extra 1% becomes a "distributor's commission" tag
//       with an ARN badge.
// Saved as state.plans = {guess, locked}.
import { MiniLines, PredictMarker } from "./WaKit";
import { saver, stepAt } from "./waState";
import { fill, inrBig, monthlyPot } from "./winterarcDays815Math";

const lakh1 = (v) => `₹${(v / 1e5).toFixed(1)} lakh`;

export default function DirectRegular({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.plans || {};
  const save = saver(onState, "plans");
  const pot = (cost, m) => monthlyPot({ monthly: c.monthly, rate: c.gross - cost, payMonths: m, totalMonths: m });

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wk-two">
          {[
            ["Direct", c.direct],
            ["Regular", c.regular],
          ].map(([l, v]) => (
            <div key={l} className="wk-two-card">
              <span aria-hidden="true">📄</span>
              <strong>{l} plan</strong>
              <small>Same fund, same holdings, same manager</small>
              <em>{v}% a year</em>
            </div>
          ))}
        </div>
        <p className="wf-out">{c.texts.twins}</p>
      </div>
    );
  }

  if (at === 1) {
    const years = Array.from({ length: c.months / 12 + 1 }, (_, y) => y);
    const d = years.map((y) => pot(c.direct, y * 12));
    const r = years.map((y) => pot(c.regular, y * 12));
    const gap = d[d.length - 1] - r[r.length - 1];
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        {!s.locked ? (
          <PredictMarker id="wk-gap-guess" label="Your guess for the gap" min={c.guess.min} max={c.guess.max} step={c.guess.step} value={s.guess ?? c.guess.start} onChange={(v) => save({ guess: v })} onLock={(v) => save({ guess: v, locked: true })} format={inrBig} />
        ) : (
          <>
            <MiniLines
              lines={[
                { id: "direct", values: d, tone: 1, label: lakh1(d[d.length - 1]) },
                { id: "regular", values: r, tone: 0, label: lakh1(r[r.length - 1]) },
              ]}
              yMin={0}
              xLabels={years.map((y) => (y % 5 ? "" : `${y}y`))}
              ariaLabel={`Direct about ${lakh1(d[d.length - 1])}, regular about ${lakh1(r[r.length - 1])}`}
            />
            <div className="wf-meters">
              <span>
                Direct <strong>{lakh1(d[d.length - 1])}</strong>
              </span>
              <span>
                Regular <strong>{lakh1(r[r.length - 1])}</strong>
              </span>
              <span className="is-warn">
                Gap <strong>{lakh1(gap)}</strong>
              </span>
            </div>
            <p className="wf-out" aria-live="polite">
              {fill(c.texts.guessed, { guess: inrBig(s.guess), gap: lakh1(gap) })} {c.texts.invested}
            </p>
            <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ locked: false })}>
              Guess again
            </button>
          </>
        )}
        <p className="wf-foot">Made-up return and costs. Paid at the start of each month.</p>
      </div>
    );
  }

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <div className="wk-commission">
        <span className="wk-commission-base">{c.direct}% fund costs</span>
        <span className="wk-commission-extra">
          +{(c.regular - c.direct).toFixed(0)}% distributor's commission <b className="wk-arn">ARN</b>
        </span>
      </div>
      <p className="wf-out">{c.texts.fair}</p>
      <p className="wf-foot">Regular plan total: {c.regular}% a year (made up).</p>
    </div>
  );
}
