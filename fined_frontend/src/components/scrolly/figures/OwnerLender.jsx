// WinterArc Day 8 Chapter 2 — "Owner or lender": where a return comes from.
//   2.1 sort six cards into Lender · Owner · Holder (SortBoard);
//   2.2 each card shows what pays it; wrongly placed cards slide to the
//       right zone with one line each; "N of 6 sorted";
//   2.3 Chai Point Co.'s ₹100 of sales cut into costs, interest, tax and
//       owners; slide sales from a good year (₹100) to a bad one (₹85).
// Saved as state.owner = {placed, done, sales}.
import SortBoard from "./SortBoard";
import { saver, stepAt } from "./waState";
import { fill, profitSplit } from "./winterarcDays815Math";

const r2 = (v) => `₹${Number.isInteger(v) ? v : v.toFixed(2)}`;

export default function OwnerLender({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.owner || {};
  const save = saver(onState, "owner");
  const placed = s.placed || {};
  const right = c.cards.filter((k) => placed[k.id] === k.zone).length;

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <SortBoard cards={c.cards} zones={c.zones} placed={placed} onPlace={(id, z) => save({ placed: { ...placed, [id]: z } })} done={s.done} onDone={() => save({ done: true })} doneLabel="Show me what pays" columns={3} />
        {s.done && <p className="wf-out">{fill(c.texts.sorted, { n: right })} Scroll on to see what pays each one.</p>}
      </div>
    );
  }

  if (at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wk-pipes">
          {c.zones.map((z) => (
            <div key={z.id} className={`wk-pipe-zone wk-pipe-zone--${z.id}`}>
              <strong>{z.label}</strong>
              <ul>
                {c.cards
                  .filter((k) => k.zone === z.id)
                  .map((k) => {
                    const moved = s.done && placed[k.id] && placed[k.id] !== k.zone;
                    return (
                      <li key={k.id} className={moved ? "is-moved" : ""}>
                        <span>{k.label}</span>
                        <em>{k.pays}</em>
                        {(moved || k.why) && <small>{moved ? `Moved here. ${k.why || ""}` : k.why}</small>}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
        <p className="wf-out">{s.done ? fill(c.texts.sorted, { n: right }) : "Sort the cards at 2.1 to see your score."}</p>
      </div>
    );
  }

  const sales = s.sales ?? c.split.good;
  const p = profitSplit({ sales, costs: c.split.costs, interest: c.split.interest, taxRate: c.split.taxRate });
  const good = profitSplit({ sales: c.split.good, costs: c.split.costs, interest: c.split.interest, taxRate: c.split.taxRate });
  const pieces = [
    { id: "costs", label: "Costs", v: p.costs },
    { id: "interest", label: "Lenders", v: p.interest },
    { id: "tax", label: "Tax", v: p.tax },
    { id: "owners", label: "Owners", v: p.owners },
  ];
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <div className="wk-note-split" role="img" aria-label={`Sales ${r2(sales)}: owners get ${r2(p.owners)}`}>
        {pieces.map((x) => (
          <span key={x.id} className={`wk-note-piece wk-note-piece--${x.id}`} style={{ flexGrow: x.v }}>
            <b>{x.label}</b>
            <i>{r2(x.v)}</i>
          </span>
        ))}
        {sales < c.split.good && <span className="wk-note-gap" style={{ flexGrow: c.split.good - sales }} aria-hidden="true" />}
      </div>
      <div className="wf-act-row">
        <label className="wf-stepper-label" htmlFor="wk-sales">
          Sales this year: <strong>{r2(sales)}</strong>
        </label>
        <input id="wk-sales" type="range" min={c.split.bad} max={c.split.good} step={c.split.step} value={sales} onChange={(e) => save({ sales: Number(e.target.value) })} />
      </div>
      <div className="wf-act-row">
        <button type="button" className={`wf-seg-btn${sales === c.split.good ? " is-on" : ""}`} onClick={() => save({ sales: c.split.good })}>
          Good year
        </button>
        <button type="button" className={`wf-seg-btn${sales === c.split.bad ? " is-on" : ""}`} onClick={() => save({ sales: c.split.bad })}>
          Bad year
        </button>
      </div>
      <p className="wf-out" aria-live="polite">
        {sales === c.split.good ? c.texts.split_good : fill(c.texts.split_bad, { owners: r2(p.owners), drop: `${Math.round((1 - p.owners / good.owners) * 100)}%` })}
      </p>
      <p className="wf-foot">{c.texts.readout} All numbers made up.</p>
    </div>
  );
}
