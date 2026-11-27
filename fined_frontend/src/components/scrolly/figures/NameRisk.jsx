// WinterArc Day 9 Chapter 2 — "Name that risk".
//   2.1 match six situations to six risk tiles (SortBoard, tap to place);
//   2.2 tiles flip to show their shield; wrongly matched cards move to the
//       right tile with a "moved" mark; "N of 6 matched";
//   2.3 SEBI's riskometer: tap where a fund holding mostly company shares
//       would sit; the needle settles at Very High.
// Saved as state.risks = {placed, done, level}.
import SortBoard from "./SortBoard";
import { Riskometer } from "./WaKit";
import { saver, stepAt } from "./waState";
import { fill } from "./winterarcDays815Math";

const LEVELS = ["Low", "Low to Moderate", "Moderate", "Moderately High", "High", "Very High"];

export default function NameRisk({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.risks || {};
  const save = saver(onState, "risks");
  const placed = s.placed || {};
  const right = c.cards.filter((k) => placed[k.id] === k.zone).length;

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <SortBoard cards={c.cards} zones={c.zones} placed={placed} onPlace={(id, z) => save({ placed: { ...placed, [id]: z } })} done={s.done} onDone={() => save({ done: true })} doneLabel="Check my matches" columns={2} />
        {s.done && <p className="wf-out">{fill(c.texts.matched, { n: right })}</p>}
      </div>
    );
  }

  if (at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wk-shields">
          {c.zones.map((z) => {
            const card = c.cards.find((k) => k.zone === z.id);
            const moved = s.done && placed[card.id] !== z.id;
            return (
              <div key={z.id} className={`wk-shield${moved ? " is-moved" : ""}`}>
                <strong>{z.label}</strong>
                <span>🛡 {z.shield}</span>
                <small>
                  {moved ? "Moved here: " : ""}“{card.label}”
                </small>
              </div>
            );
          })}
        </div>
        <p className="wf-out">{s.done ? fill(c.texts.matched, { n: right }) : "Match the cards at 2.1 to see your score."}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <Riskometer level={s.level != null ? c.answerLevel : null} onPick={s.level == null ? (k) => save({ level: k }) : null} caption={c.texts.dial_foot} />
      <p className="wf-out" aria-live="polite">
        {s.level == null ? c.texts.dial_pick : fill(c.texts.dial_after, { pick: LEVELS[s.level] })}
      </p>
      {s.level != null && (
        <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ level: null })}>
          Try again
        </button>
      )}
    </div>
  );
}
