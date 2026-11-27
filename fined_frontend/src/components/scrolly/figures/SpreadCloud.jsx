// WinterArc Day 9 Chapter 1 — "The spread": risk as how widely results land.
//   1.1 three clouds of 100 possible years (deposit, bond-like, shares-like);
//       "Roll a year" pulls the next stored dot out of the shares cloud;
//   1.2 the reader guesses on the card; then the shares dots below 0% turn
//       red: 27 of 100;
//   1.3 a horizon switch (1 · 5 · 10 years, starting at the hero's pick):
//       each dot is the average yearly return, the cloud squeezes (27 → 9 → 3);
//   1.4 one dot at +40% glows, then the whole cloud lights up behind it.
// Saved as state.cloud = {rolled, horizon}. All dots are stored (seeded), so
// every reader sees the same counts.
import { useMemo } from "react";
import { Seg } from "./WaKit";
import { saver, stepAt } from "./waState";
import { cloudDots, countBelow, fill, pct } from "./winterarcDays815Math";

const W = 300;
const H = 220;

function layout(dots, cx, sd, yOf) {
  if (!sd) {
    // a deposit: the same result every year, drawn as one tight block
    return dots.map((v, k) => ({ v, x: cx - 18 + (k % 10) * 4, y: yOf(v) - 18 + Math.floor(k / 10) * 4 }));
  }
  const bins = {};
  return [...dots]
    .map((v, k) => ({ v, k }))
    .sort((a, b) => a.v - b.v)
    .map(({ v, k }) => {
      const b = Math.round(v / 2.5);
      const n = (bins[b] = (bins[b] || 0) + 1) - 1;
      const side = n % 2 ? -1 : 1;
      return { v, k, x: cx + side * Math.ceil(n / 2) * 4.2, y: yOf(v) };
    });
}

export default function SpreadCloud({ step, steps, state = {}, onState, config: c, hero }) {
  const at = stepAt(step, 3);
  const s = state.cloud || {};
  const save = saver(onState, "cloud");
  const guessed = state.guesses?.[steps?.[1]?.step_id] !== undefined;
  const heroH = c.horizons.includes(hero?.answers?.amount) ? hero.answers.amount : c.defaultHorizon;
  const horizon = at === 2 ? (s.horizon ?? heroH) : 1;
  const hIdx = c.horizons.indexOf(horizon);
  const [lo, hi] = c.axis;
  const yOf = (v) => 10 + (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (H - 20);

  const cols = useMemo(
    () =>
      c.columns.map((col, i) => {
        const dots = cloudDots({ mean: col.mean, sd: col.sd / Math.sqrt(horizon), below: col.below[hIdx], seed: 11 + i * 7 + hIdx });
        return { ...col, dots, below: countBelow(dots), placed: layout(dots, 50 + i * 95, col.sd, yOf) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [horizon]
  );
  const shares = cols[2];
  const rolled = Math.min(s.rolled || 0, c.rolls);
  const rolledVals = shares.dots.slice(0, rolled);
  const showRed = (at === 1 && guessed) || at === 2;
  const glowK = at === 3 ? shares.placed.reduce((best, p) => (Math.abs(p.v - c.glow) < Math.abs(best.v - c.glow) ? p : best), shares.placed[0]).k : null;

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[at]}</p>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className={`wk-cloud${at === 3 ? " is-glow" : ""}`} role="img" aria-label={`Shares-like: ${shares.below} of 100 years below zero over ${horizon} year${horizon > 1 ? "s" : ""}`}>
        {[-20, 0, 20, 40].map((t) => (
          <g key={t}>
            <line x1="0" x2={W} y1={yOf(t)} y2={yOf(t)} className={t === 0 ? "wk-cloud-zero" : "wk-cloud-grid"} />
            <text x={W - 2} y={yOf(t) - 3} textAnchor="end" className="wk-cloud-tick">
              {pct(t, 0)}
            </text>
          </g>
        ))}
        {cols.map((col) =>
          col.placed.map((p, j) => {
            const red = showRed && col.id === "shares" && p.v < 0;
            const isRoll = at === 0 && col.id === "shares" && p.k != null && p.k < rolled;
            return <circle key={`${col.id}-${j}`} cx={p.x} cy={p.y} r="1.9" className={`wk-cloud-dot wk-cloud-dot--${col.id}${red ? " is-red" : ""}${isRoll ? " is-roll" : ""}${glowK != null && p.k === glowK && col.id === "shares" ? " is-star" : ""}`} />;
          })
        )}
        {cols.map((col, i) => (
          <text key={col.id} x={50 + i * 95} y={H + 14} textAnchor="middle" className="wk-cloud-label">
            {col.label}
          </text>
        ))}
      </svg>

      {at === 0 && (
        <>
          <button type="button" className="wf-act wf-act--ghost" disabled={rolled >= c.rolls} onClick={() => save({ rolled: rolled + 1 })}>
            🎲 {c.texts.roll} {rolled ? `(${rolled} of ${c.rolls})` : ""}
          </button>
          <p className="wf-out" aria-live="polite">
            {rolled ? fill(c.texts.rolled, { n: rolled, list: rolledVals.map((v) => pct(v)).join(", ") }) : "The deposit is one tight stack at 6.5%. The shares cloud sprawls. Roll a few years to feel it."}
          </p>
        </>
      )}
      {at === 1 && <p className="wf-out" aria-live="polite">{guessed ? fill(c.texts.reveal, { n: shares.below }) : "Tap your guess first."}</p>}
      {at === 2 && (
        <>
          <Seg label="How long you hold" value={horizon} onPick={(h) => save({ horizon: h })} options={c.horizons.map((h) => ({ id: h, label: `${h} year${h > 1 ? "s" : ""}` }))} />
          <p className="wf-out" aria-live="polite">
            Years with a loss: {shares.below} in 100. {horizon === 1 ? c.texts.h1 : horizon === 10 ? c.texts.h10 : fill(c.texts.h5, { n: shares.below })}
          </p>
        </>
      )}
      {at === 3 && <p className="wf-out">{c.texts.glow}</p>}
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
