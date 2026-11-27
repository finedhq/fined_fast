// WinterArc Day 3 Chapter 2 — "growth lanes": compounding as two piles of
// coins the reader grows a year at a time, instead of a chart.
//   2.1 the simple pile: each "+1 year" adds the same ₹800 coin;
//   2.2 the compound pile joins: its coins get bigger every year (this
//       year's interest is shown, ₹800, ₹864, ₹933…);
//   2.3 jump to 10 / 20 / 30 years: the compound pile snowballs, the gap
//       is named;
//   2.4 Asha vs Dev from 20 to 50: two tracks (paying-in years shaded);
//       the results stay "?" until the step's guess, then the race plays.
// Saved as state.growth = {year}. Made-up rates, footnote always shown.
import { useEffect, useState } from "react";
import { compoundAt, inr, inrShort, saverPath, simpleAt } from "./winterarcFigureMath";

const fill = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Pile({ label, coins, base, total, scale, kind, last }) {
  // coins: amounts added each year (bottom first); base: the ₹ put in
  return (
    <div className={`wf-pile wf-pile--${kind}`}>
      <div className="wf-pile-total">{inr(total)}</div>
      {/* column-reverse: the first child sits at the bottom, so the ₹ put in goes first */}
      <div className="wf-pile-stack" aria-hidden="true">
        <b style={{ height: `${(base / scale) * 100}%` }}>{inr(base)}</b>
        {coins.map((v, k) => (
          // exact heights (no minimum), so the piles stay true to scale at 30 years
          <i key={k} className={k === coins.length - 1 && last ? "is-new" : ""} style={{ height: `${(v / scale) * 100}%` }} />
        ))}
      </div>
      <div className="wf-pile-label">{label}</div>
    </div>
  );
}

// The race plays once it is mounted (only after the guess): age ticks from
// `from` to `to`; with reduced motion it starts at the end.
function useTicker(from, to, ms) {
  const [n, setN] = useState(() => (reduceMotion() ? to : from));
  useEffect(() => {
    const id = setInterval(() => setN((x) => (x >= to ? x : x + 1)), ms);
    return () => clearInterval(id);
  }, [to, ms]);
  return n;
}

function Race({ c, guessed }) {
  // a new key on reveal remounts the tracks, so the race starts from age 20
  return guessed ? <RaceTracks key="run" c={c} revealed /> : <RaceTracks key="wait" c={c} />;
}

function RaceTracks({ c, revealed = false }) {
  const asha = saverPath({ ...c.race.asha, from: c.race.from, to: c.race.to, pct: c.rate });
  const dev = saverPath({ ...c.race.dev, from: c.race.from, to: c.race.to, pct: c.rate });
  const span = c.race.to - c.race.from;
  const ticked = useTicker(c.race.from, c.race.to, 70);
  const age = revealed ? ticked : c.race.from;
  const guessed = revealed;
  const top = Math.max(asha[span].value, dev[span].value);
  const row = (who, path, cfg) => {
    const now = path[age - c.race.from];
    return (
      <div className="wf-track">
        <div className="wf-track-head">
          <span>{who}</span>
          <strong>{guessed ? inrShort(now.value) : "?"}</strong>
        </div>
        <div className="wf-track-bar" aria-hidden="true">
          <span className="wf-track-pay" style={{ left: `${((cfg.payFrom - c.race.from) / span) * 100}%`, width: `${((cfg.payTo - cfg.payFrom) / span) * 100}%` }} />
          {guessed && <span className="wf-track-fill" style={{ width: `${(now.value / top) * 100}%` }} />}
        </div>
        <div className="wf-track-sub">{fill(c.texts.paid_in, { paid: inrShort(cfg.monthly * 12 * (cfg.payTo - cfg.payFrom)), from: cfg.payFrom, to: cfg.payTo - 1 })}</div>
      </div>
    );
  };
  return (
    <>
      <div className="wf-race-age">
        Age <strong>{age}</strong>
      </div>
      {row("Asha", asha, c.race.asha)}
      {row("Dev", dev, c.race.dev)}
      <div className="wf-track-axis" aria-hidden="true">
        <span>{c.race.from}</span>
        <span>{c.race.to}</span>
      </div>
    </>
  );
}

export default function GrowthLanes({ step, steps, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 3);
  const g = state.growth || {};
  const guessed = state.guesses?.[steps?.[at]?.step_id] !== undefined;
  const cap = at <= 1 ? 10 : c.maxYears;
  const year = Math.min(g.year ?? 0, cap);
  const setYear = (y) => onState((prev) => ({ ...prev, growth: { ...(prev.growth || {}), year: Math.max(0, Math.min(cap, y)) } }));

  if (at === 3) {
    return (
      <div className="wf-figure wf-growth">
        <p className="wf-note">{guessed ? c.notes[3].after : c.notes[3].before}</p>
        <Race c={c} guessed={guessed} />
        <p className="wf-foot">{c.footnote}</p>
      </div>
    );
  }

  const simpleCoins = Array.from({ length: year }, () => (c.amount * c.rate) / 100);
  const compoundCoins = Array.from({ length: year }, (_, k) => compoundAt(c.amount, c.rate, k + 1) - compoundAt(c.amount, c.rate, k));
  const simple = simpleAt(c.amount, c.rate, year);
  const compound = compoundAt(c.amount, c.rate, year);
  // one scale for both piles: the tallest they reach at this step's cap year
  // (or the current year, at 2.3), so a pile never jumps when a coin is added
  const scale = (at === 0 ? simpleAt(c.amount, c.rate, cap) : compoundAt(c.amount, c.rate, at === 1 ? cap : Math.max(year, 10))) * 1.04;
  const thisYear = year ? compoundCoins[year - 1] : 0;

  return (
    <div className="wf-figure wf-growth">
      <p className="wf-note">{c.notes[at]}</p>
      <div className="wf-piles">
        <Pile label="Simple" kind="simple" coins={simpleCoins} base={c.amount} total={simple} scale={scale} last={year > 0} />
        {at >= 1 ? (
          <Pile label="Compound" kind="compound" coins={compoundCoins} base={c.amount} total={compound} scale={scale} last={year > 0} />
        ) : (
          <div className="wf-pile wf-pile--ghost" aria-hidden="true">
            <div className="wf-pile-total">?</div>
            <div className="wf-pile-stack" />
            <div className="wf-pile-label">Compound</div>
          </div>
        )}
      </div>
      <div className="wf-act-row">
        <div className="wf-year">
          Year <strong>{year}</strong>
        </div>
        {at < 2 && (
          <button type="button" className="wf-act" disabled={year >= cap} onClick={() => setYear(year + 1)}>
            +1 year
          </button>
        )}
        {at < 2 ? (
          <button type="button" className="wf-act wf-act--ghost" disabled={year >= cap} onClick={() => setYear(cap)}>
            Jump to {cap}
          </button>
        ) : (
          [10, 20, 30].map((y) => (
            <button key={y} type="button" className={`wf-seg-btn${year === y ? " is-on" : ""}`} aria-pressed={year === y} onClick={() => setYear(y)}>
              {y} yrs
            </button>
          ))
        )}
      </div>
      <p className="wf-out" aria-live="polite">
        {year === 0
          ? c.texts.start
          : at === 0
            ? fill(c.texts.simple_year, { add: inr((c.amount * c.rate) / 100), total: inr(simple) })
            : at === 1
              ? fill(c.texts.compound_year, { simple: inr((c.amount * c.rate) / 100), compound: inr(thisYear) })
              : fill(c.texts.gap, { years: year, gap: inr(compound - simple) })}
      </p>
    </div>
  );
}
