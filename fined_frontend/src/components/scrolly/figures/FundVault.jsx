// WinterArc Day 11 Chapter 2 — "Who holds your money".
//   2.1 sort five roles onto five jobs (SortBoard, tap to place); each right
//       match locks a ring around the investors' money;
//   2.2 the AMC card reaches for the vault and bounces off the custodian ring;
//   2.3 the cost drag: 0.5 · 1.0 · 1.5% a year on ₹1 lakh for 20 years at a
//       made-up 10%; three lines, the pick highlighted, plus a leaking bucket.
// Saved as state.vault = {placed, done, cost}.
import SortBoard from "./SortBoard";
import { MiniLines, Seg } from "./WaKit";
import { saver, stepAt } from "./waState";
import { afterCost, fill, inrBig } from "./winterarcDays815Math";

const lakh2 = (v) => `₹${(v / 1e5).toFixed(2)} lakh`;

function Vault({ rings, blocked }) {
  return (
    <div className={`wk-vault${blocked ? " is-blocked" : ""}`} role="img" aria-label={`${rings} of 5 safety rings locked`}>
      {Array.from({ length: 5 }, (_, k) => (
        <i key={k} className={`wk-vault-ring${k < rings ? " is-on" : ""}`} style={{ "--k": k }} />
      ))}
      <span className="wk-vault-core">₹ Investors' money</span>
      {blocked && <span className="wk-vault-amc">AMC ✋</span>}
    </div>
  );
}

export default function FundVault({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 2);
  const s = state.vault || {};
  const save = saver(onState, "vault");
  const placed = s.placed || {};
  const right = c.cards.filter((k) => placed[k.id] === k.zone).length;

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <Vault rings={s.done ? right : 0} />
        <SortBoard cards={c.cards} zones={c.zones} placed={placed} onPlace={(id, z) => save({ placed: { ...placed, [id]: z } })} done={s.done} onDone={() => save({ done: true })} doneLabel="Lock it in" columns={1} />
        {s.done && <p className="wf-out">{fill(c.texts.placed, { n: right })} {right < 5 ? `Right answers: ${c.cards.map((k) => `${k.label} → ${c.zones.find((z) => z.id === k.zone).label.toLowerCase()}`).join("; ")}.` : ""}</p>}
      </div>
    );
  }

  if (at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <Vault rings={5} blocked />
        <p className="wf-out">{c.texts.blocked}</p>
        <p className="wf-out is-warn">{c.texts.blocked_note}</p>
      </div>
    );
  }

  const cost = c.costs.includes(s.cost) ? s.cost : c.costs[1];
  const years = Array.from({ length: c.years + 1 }, (_, y) => y);
  const series = c.costs.map((k) => years.map((y) => afterCost(c.start, c.gross, k, y)));
  const end = (k) => afterCost(c.start, c.gross, k, c.years);
  const leak = afterCost(c.start, c.gross, 0, c.years) - end(cost);
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[2]}</p>
      <Seg label="Yearly cost" value={cost} onPick={(v) => save({ cost: v })} options={c.costs.map((k) => ({ id: k, label: `${k.toFixed(1)}%` }))} />
      <div className="wk-drag">
        <MiniLines
          lines={c.costs.map((k, i) => ({ id: String(k), values: series[i], tone: k === cost ? 1 : 0, faint: k !== cost, label: `${k.toFixed(1)}%` }))}
          yMin={c.start}
          xLabels={years.map((y) => (y % 5 ? "" : `${y}y`))}
          ariaLabel={c.costs.map((k) => `${k}%: ${lakh2(end(k))}`).join(", ")}
        />
        <div className="wk-bucket" style={{ "--leak": cost }} role="img" aria-label={`Cost leak at ${cost}% a year`}>
          <span className="wk-bucket-body">🪣</span>
          {Array.from({ length: Math.round(cost * 2) }, (_, k) => (
            <i key={k} className="wk-drop" style={{ "--k": k }} />
          ))}
        </div>
      </div>
      <p className="wf-out" aria-live="polite">
        {fill(c.texts.cost, { cost: `${cost.toFixed(1)}%`, end: lakh2(end(cost)) })} {fill(c.texts.leak, { leak: lakh2(leak) })}
      </p>
      <p className="wf-out">{fill(c.texts.gap, { gap: inrBig(end(c.costs[0]) - end(c.costs[2])) })}</p>
      <p className="wf-foot">Made-up return and costs. The NAV you see is already after costs.</p>
    </div>
  );
}
