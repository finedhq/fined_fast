// WinterArc Day 13 Chapter 3 — "Rate-rise day": FD, bond, debt fund.
//   3.1 for each of three tiles, "Value changes today" or "Doesn't change
//       today"; once all three are in, the tiles flip: "You got N of 3";
//   3.2 a four-row comparison card that fills one row per tap ("Next row");
//   3.3 pick the feature that matters most; the column(s) built for it light
//       up, with no winner crowned.
// Saved as state.lenders = {answers, rows, feature}.
import { saver, stepAt } from "./waState";
import { fill } from "./winterarcDays815Math";

function Table({ c, rows, hi = [] }) {
  return (
    <div className="wk-table-wrap">
      <table className="wk-table">
        <thead>
          <tr>
            <th scope="col" />
            {c.cols.map((h, i) => (
              <th key={h} scope="col" className={hi.includes(i) ? "is-hi" : ""}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.rows.slice(0, rows).map((r) => (
            <tr key={r.label} className="wk-table-row">
              <th scope="row">{r.label}</th>
              {r.cells.map((cell, i) => (
                <td key={i} className={hi.includes(i) ? "is-hi" : ""}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ThreeLenders({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.lenders || {};
  const save = saver(onState, "lenders");
  const answers = s.answers || {};
  const all = c.tiles.every((t) => answers[t.id]);
  const right = c.tiles.filter((t) => answers[t.id] === t.answer).length;

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wk-flips">
          {c.tiles.map((t) => (
            <div key={t.id} className={`wk-flip${all ? " is-flipped" : ""}${all && answers[t.id] !== t.answer ? " is-miss" : ""}`}>
              <strong>{t.label}</strong>
              {all ? (
                <p>{t.reveal}</p>
              ) : (
                <div className="wf-seg" role="group" aria-label={t.label}>
                  {[
                    ["moves", c.texts.changes],
                    ["same", c.texts.same],
                  ].map(([id, l]) => (
                    <button key={id} type="button" className={`wf-seg-btn${answers[t.id] === id ? " is-on" : ""}`} aria-pressed={answers[t.id] === id} onClick={() => save({ answers: { ...answers, [t.id]: id } })}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        {all && (
          <>
            <p className="wf-out" aria-live="polite">
              {fill(c.texts.score, { n: right })} {c.texts.fund_note}
            </p>
            <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ answers: {} })}>
              Try again
            </button>
          </>
        )}
      </div>
    );
  }

  if (at === 1) {
    const rows = Math.max(1, Math.min(c.rows.length, s.rows || 1));
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <Table c={c} rows={rows} />
        {rows < c.rows.length && (
          <button type="button" className="wf-act wf-act--ghost" onClick={() => save({ rows: rows + 1 })}>
            {c.texts.next_row} ({rows} of {c.rows.length})
          </button>
        )}
        <p className="wf-foot">{c.texts.foot}</p>
      </div>
    );
  }

  const f = c.features.find((x) => x.id === s.feature);
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <div className="wf-seg" role="group" aria-label="What matters most">
        {c.features.map((x) => (
          <button key={x.id} type="button" className={`wf-seg-btn${s.feature === x.id ? " is-on" : ""}`} aria-pressed={s.feature === x.id} onClick={() => save({ feature: x.id })}>
            {x.label}
          </button>
        ))}
      </div>
      <Table c={c} rows={c.rows.length} hi={f ? f.cols : []} />
      <p className="wf-out" aria-live="polite">{f ? `${f.text} No winner, just different jobs.` : "Tap the one that matters most to you."}</p>
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
