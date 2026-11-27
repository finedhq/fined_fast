// WinterArc Day 11 Chapter 3 — "The menu".
//   3.1 match four jobs to four fund types (SortBoard); matched tiles show a
//       made-up typical mix as a small bar;
//   3.2 the four types line up under Day 9's riskometer; tapping a type swings
//       the needle (liquid at the low end, equity at the high end);
//   3.3 the jar splits into two taps, "lump sum" and "every month", with an
//       index card beside them: tomorrow's topics.
// Saved as state.menu = {placed, done, dial}.
import SortBoard from "./SortBoard";
import { Riskometer } from "./WaKit";
import { saver, stepAt } from "./waState";
import { fill } from "./winterarcDays815Math";

const Mix = ({ mix }) => (
  <span className="wk-mix" role="img" aria-label={mix.map(([l, v]) => `${l} ${v}%`).join(", ")}>
    {mix.map(([l, v], i) => (
      <i key={l} className={`wk-mix-${i}`} style={{ width: `${v}%` }} title={`${l} ${v}%`} />
    ))}
  </span>
);

export default function FundMenu({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.menu || {};
  const save = saver(onState, "menu");
  const placed = s.placed || {};
  const right = c.cards.filter((k) => placed[k.id] === k.zone).length;

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <SortBoard cards={c.cards} zones={c.zones} placed={placed} onPlace={(id, z) => save({ placed: { ...placed, [id]: z } })} done={s.done} onDone={() => save({ done: true })} doneLabel="Check my matches" columns={2} />
        {s.done && (
          <>
            <div className="wk-types">
              {c.zones.map((z) => (
                <div key={z.id} className="wk-type">
                  <strong>{z.label}</strong>
                  <small>“{c.cards.find((k) => k.zone === z.id).label}”</small>
                  <Mix mix={z.mix} />
                  <small>{z.mix.map(([l, v]) => `${l} ${v}%`).join(" · ")}</small>
                </div>
              ))}
            </div>
            <p className="wf-out">{fill(c.texts.matched, { n: right })}</p>
          </>
        )}
      </div>
    );
  }

  if (at === 1) {
    const pick = c.zones.find((z) => z.id === s.dial) || c.zones[0];
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <Riskometer level={pick.level} caption={`${pick.label}: a made-up typical level. Every fund shows its own.`} />
        <div className="wf-seg" role="group" aria-label="Fund type">
          {c.zones.map((z) => (
            <button key={z.id} type="button" className={`wf-seg-btn${pick.id === z.id ? " is-on" : ""}`} aria-pressed={pick.id === z.id} onClick={() => save({ dial: z.id })}>
              {z.label}
            </button>
          ))}
        </div>
        <p className="wf-out">{c.texts.dial}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <div className="wk-taps">
        <div className="wk-tap">
          <span aria-hidden="true">🫙</span>
          <strong>Lump sum</strong>
          <small>All at once</small>
        </div>
        <div className="wk-tap">
          <span aria-hidden="true">🚰</span>
          <strong>Every month</strong>
          <small>A fixed amount, again and again</small>
        </div>
        <div className="wk-tap wk-tap--index">
          <span aria-hidden="true">📇</span>
          <strong>Copy an index</strong>
          <small>Like the FinEd Five from Day 10</small>
        </div>
      </div>
      <p className="wf-out">{c.texts.taps}</p>
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
