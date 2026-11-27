// WinterArc Day 10 Chapter 3 — "What the index measures" (the FinEd Five).
//   3.1 a treemap of five fictional companies sized by weight; a dial at 1,000;
//   3.2 the reader guesses on the card; then Kisan +20% grows, Big Bank −5%
//       shrinks, the dial settles at 996 with a points breakdown;
//   3.3 − / + on any tile (−20% to +20%, 5% snaps), the dial live, and a
//       side quest: hit exactly 1,050;
//   3.4 a Full market cap / Free float toggle: Big Bank's promoter holds half,
//       so its tile halves under free float; Nifty 50 and Sensex labels.
// Saved as state.index = {moves, free}.
import { Seg } from "./WaKit";
import { saver, stepAt } from "./waState";
import { indexLevel, pct, weights } from "./winterarcDays815Math";

function Treemap({ rows, caps, moves = {}, onMove, range, snap }) {
  const sized = Object.fromEntries(Object.entries(caps).map(([id, v]) => [id, v * (1 + (moves[id] || 0) / 100)]));
  const total = Object.values(sized).reduce((a, b) => a + b, 0);
  const w = weights(sized);
  return (
    <div className="wk-tree">
      {rows.map((row) => {
        const rowSum = row.reduce((a, id) => a + sized[id.id], 0);
        return (
          <div key={row[0].id} className="wk-tree-row" style={{ flexGrow: rowSum / total }}>
            {row.map((k) => {
              const m = moves[k.id] || 0;
              return (
                <div key={k.id} className={`wk-tile${m > 0 ? " is-up" : m < 0 ? " is-down" : ""}`} style={{ flexGrow: sized[k.id] / rowSum }}>
                  <strong>{k.name}</strong>
                  <small>
                    {w[k.id].toFixed(0)}%{m ? ` · ${pct(m, 0)}` : ""}
                  </small>
                  {onMove && (
                    <span className="wk-tile-btns">
                      <button type="button" aria-label={`${k.name} down 5%`} disabled={m <= range[0]} onClick={() => onMove(k.id, m - snap)}>
                        −
                      </button>
                      <button type="button" aria-label={`${k.name} up 5%`} disabled={m >= range[1]} onClick={() => onMove(k.id, m + snap)}>
                        +
                      </button>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const Dial = ({ level, label = "FinEd Five" }) => (
  <div className="wk-dial" aria-live="polite">
    <small>{label}</small>
    <strong>{Math.round(level * 10) / 10}</strong>
  </div>
);

export default function IndexBuilder({ step, steps, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.index || {};
  const save = saver(onState, "index");
  const byId = Object.fromEntries(c.companies.map((k) => [k.id, k]));
  const rows = c.rows.map((r) => r.map((id) => byId[id]));
  const caps = Object.fromEntries(c.companies.map((k) => [k.id, k.cap]));

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <Dial level={indexLevel(caps, {}, c.divisor).level} />
        <Treemap rows={rows} caps={caps} />
        <p className="wf-out">{c.texts.start}</p>
        <p className="wf-foot">Made-up companies and values (₹ crore).</p>
      </div>
    );
  }

  if (at === 1) {
    const guessed = state.guesses?.[steps?.[1]?.step_id] !== undefined;
    const moves = guessed ? c.guessMoves : {};
    const { level, parts } = indexLevel(caps, moves, c.divisor);
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <Dial level={level} />
        <Treemap rows={rows} caps={caps} moves={moves} />
        <p className="wf-out" aria-live="polite">
          {guessed
            ? parts
                .filter((p) => p.points)
                .map((p) => `${byId[p.id].name} ${p.points > 0 ? "+" : "−"}${Math.abs(p.points)} points`)
                .join(" · ")
            : c.texts.guess_first}
        </p>
        {guessed && <p className="wf-out">{c.texts.after}</p>}
      </div>
    );
  }

  if (at === 2) {
    const moves = s.moves || {};
    const { level, parts } = indexLevel(caps, moves, c.divisor);
    const hit = Math.abs(level - c.target) < 1e-6;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wk-dial-row">
          <Dial level={level} />
          <span className={`wk-target${hit ? " is-hit" : ""}`}>🎯 {c.target.toLocaleString("en-IN")}</span>
        </div>
        <Treemap rows={rows} caps={caps} moves={moves} range={c.range} snap={c.snap} onMove={(id, v) => save({ moves: { ...moves, [id]: v } })} />
        <p className="wf-out" aria-live="polite">
          {parts.some((p) => p.points)
            ? parts
                .filter((p) => p.points)
                .map((p) => `${byId[p.id].name} ${p.points > 0 ? "+" : "−"}${Math.abs(Math.round(p.points * 10) / 10)}`)
                .join(" · ")
            : "Every company at its starting price."}
        </p>
        {hit && <p className="wf-stamp">{c.texts.hit}</p>}
        {parts.some((p) => p.points) && (
          <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ moves: {} })}>
            Reset prices
          </button>
        )}
      </div>
    );
  }

  const free = s.free ?? true;
  const shownCaps = free ? caps : Object.fromEntries(c.companies.map((k) => [k.id, k.full || k.cap]));
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <Seg label="Weights" value={free} onPick={(v) => save({ free: v })} options={[{ id: false, label: "Full market cap" }, { id: true, label: "Free float" }]} />
      <Treemap rows={rows} caps={shownCaps} />
      <p className="wf-out" aria-live="polite">{free ? c.texts.free : c.texts.full}</p>
      <p className="wf-out">{c.texts.real}</p>
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
