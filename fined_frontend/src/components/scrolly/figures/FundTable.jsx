// WinterArc Day 15 Chapter 1 — "The wrong race" (a detective case file).
//   1.1 tap a crown onto one of three rows (A +14%, B +30%, C +12%);
//   1.2 category tags drop on and the table splits into two lanes;
//   1.3 each lane gets its benchmark: B gets a "WRONG RACE" stamp (−8 vs its
//       benchmark), the crown slides to A (+1); feedback by the first crown;
//   1.4 A's excess return over five made-up years: +1, −2, +3, −1, +2.
// Saved as state.table = {crown}.
import { saver, stepAt } from "./waState";
import { pct } from "./winterarcDays815Math";

export default function FundTable({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.table || {};
  const save = saver(onState, "table");
  const crown = s.crown;

  if (at === 3) {
    const max = Math.max(...c.excess.map(Math.abs));
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[3]}</p>
        <div className="wk-excess" role="img" aria-label={`Fund A against its benchmark: ${c.excess.map((v) => pct(v, 0)).join(", ")} points`}>
          {c.excess.map((v, k) => (
            <span key={k} className={`wk-excess-col${v < 0 ? " is-neg" : ""}`}>
              <i style={{ height: `${(Math.abs(v) / max) * 50}%` }} />
              <small>{pct(v, 0)}</small>
              <b>Y{k + 1}</b>
            </span>
          ))}
        </div>
        <p className="wf-out">{c.texts.long}</p>
        <p className="wf-foot">Made-up years. Points above or below the benchmark.</p>
      </div>
    );
  }

  const lanes = at === 0 ? [{ cat: null, funds: c.funds }] : [...new Set(c.funds.map((f) => f.cat))].map((cat) => ({ cat, funds: c.funds.filter((f) => f.cat === cat) }));
  const shownCrown = at === 2 ? c.best : crown;

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[at]}</p>
      <div className="wk-case">
        {lanes.map((lane) => (
          <div key={lane.cat || "all"} className="wk-lane">
            {lane.cat && (
              <div className="wk-lane-tag">
                {lane.cat}
                {at === 2 && <span> · benchmark {pct(lane.funds[0].bench, 0)}</span>}
              </div>
            )}
            {lane.funds.map((f) => {
              const diff = f.r - f.bench;
              return (
                <button key={f.id} type="button" className={`wk-frow${shownCrown === f.id ? " is-crown" : ""}`} aria-pressed={crown === f.id} disabled={at !== 0} onClick={() => save({ crown: f.id })}>
                  <span className="wk-frow-crown" aria-hidden="true">
                    {shownCrown === f.id ? "👑" : ""}
                  </span>
                  <strong>{f.label}</strong>
                  <span className="wk-frow-bar">
                    <i style={{ width: `${(f.r / 40) * 100}%` }} />
                    {at === 2 && <b className="wk-frow-bench" style={{ left: `${(f.bench / 40) * 100}%` }} title={`Benchmark ${pct(f.bench, 0)}`} />}
                  </span>
                  <em>{pct(f.r, 0)}</em>
                  {at === 2 && <small className={diff < 0 ? "is-neg" : "is-pos"}>{pct(diff, 0)} vs benchmark</small>}
                  {at === 2 && diff <= -5 && <span className="wf-stamp wk-wrong">{c.texts.stamp}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </div>
      <p className="wf-out" aria-live="polite">
        {at === 0 ? (crown ? `You crowned ${c.funds.find((f) => f.id === crown).label}.` : c.texts.crown_first) : at === 1 ? c.texts.labels : crown ? `${c.texts[crown]} ${crown !== c.best ? c.texts.moved : ""}` : c.texts.moved}
      </p>
      <p className="wf-foot">Made-up funds and benchmarks.</p>
    </div>
  );
}
