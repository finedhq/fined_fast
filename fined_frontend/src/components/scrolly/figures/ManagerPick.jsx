// WinterArc Day 12 Chapter 2 — "Pick the star" (ten made-up managers).
//   2.1 two cards: a manager with a magnifying glass (active, 1.5% a year) and
//       a photocopier copying Day 10's index (index, 0.2%), both made up;
//   2.2 ten cards with last year's returns, the index at +12%; tap one;
//   2.3 "Play next year": the game-show reshuffle, cards re-sort by next year
//       (index +10%), only 3 of 10 beat it, the pick outlined where it lands;
//   2.4 the real scoreboard: SPIVA India, 10 years to June 2026, and 2025's
//       mid/small-cap result for balance.
// Saved as state.mgr = {pick, played}.
import { saver, stepAt } from "./waState";
import { fill, pct } from "./winterarcDays815Math";

export default function ManagerPick({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.mgr || {};
  const save = saver(onState, "mgr");
  const pick = c.managers.find((m) => m.id === s.pick);

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wk-two">
          <div className="wk-two-card">
            <span aria-hidden="true">🔍</span>
            <strong>Active fund</strong>
            <small>A manager picks companies, aiming to beat an index.</small>
            <em>Cost {c.costs.active}% a year</em>
          </div>
          <div className="wk-two-card">
            <span aria-hidden="true">🖨️</span>
            <strong>Index fund</strong>
            <small>Holds what the index holds, in the same weights.</small>
            <em>Cost {c.costs.index}% a year</em>
          </div>
        </div>
      </div>
    );
  }

  const year = at === 1 ? "last" : "next";
  const played = at === 3 || (at === 2 && s.played);
  const key = played ? "next" : "last";
  const indexR = played ? c.indexNext : c.indexLast;
  const sorted = [...c.managers].sort((a, b) => b[key] - a[key]);
  const beat = c.managers.filter((m) => m.next > c.indexNext).length;

  if (at === 3) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[3]}</p>
        <div className="wk-score">
          <div className="wk-score-row">
            <span className="wk-score-bar" style={{ width: "72%" }} />
            <p>{c.texts.long}</p>
          </div>
          <div className="wk-score-row wk-score-row--alt">
            <span className="wk-score-bar" style={{ width: "55%" }} />
            <p>{c.texts.short}</p>
          </div>
        </div>
        <p className="wf-foot">
          {c.texts.source} {c.texts.foot}
        </p>
      </div>
    );
  }

  const feedback = !pick ? "" : pick.id === "m1" ? c.texts.star : pick.next > c.indexNext ? c.texts.beat : fill(c.texts.other, { r: pct(pick.next, 0) });

  return (
    <div className="wf-figure">
      <p className="wf-note">{at === 1 ? c.notes[1] : c.notes[2]}</p>
      <ol className={`wk-board-list${played ? " is-shuffled" : ""}`} aria-label={`Managers by ${year} year's return`}>
        {sorted.map((m, k) => {
          const r = m[key];
          const aboveLine = k > 0 && sorted[k - 1][key] > indexR && r <= indexR;
          return (
            <li key={m.id} className={aboveLine ? "has-line" : ""} data-index={aboveLine ? `Index ${pct(indexR, 0)}` : undefined}>
              <button type="button" className={`wk-mgr${s.pick === m.id ? " is-pick" : ""}${played && r > indexR ? " is-beat" : ""}`} aria-pressed={s.pick === m.id} disabled={played} onClick={() => save({ pick: m.id })}>
                <span>{m.name}</span>
                <strong>{pct(r, 0)}</strong>
                {played && <small>last year {pct(m.last, 0)}</small>}
              </button>
            </li>
          );
        })}
      </ol>
      {at === 1 && <p className="wf-out" aria-live="polite">{pick ? `You're backing ${pick.name} (${pct(pick.last, 0)} last year). Index: ${pct(c.indexLast, 0)}.` : `Index last year: ${pct(c.indexLast, 0)}.`}</p>}
      {at === 2 && !s.played && (
        <button type="button" className="wf-act" disabled={!pick} onClick={() => save({ played: true })}>
          🎲 {c.texts.play}
        </button>
      )}
      {at === 2 && !pick && <p className="wf-out">{"Tap a manager to back first."}</p>}
      {at === 2 && s.played && (
        <p className="wf-out" aria-live="polite">
          {feedback} {fill(c.texts.beat_count, { n: beat })}
        </p>
      )}
      <p className="wf-foot">Made-up managers and returns.</p>
    </div>
  );
}
