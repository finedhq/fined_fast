// WinterArc Day 9 Chapter 3 — "Eggs and baskets".
//   3.1 tap companies (or a preset) into a basket; "N companies, M industries";
//   3.2 three headlines land, each card shows its year, the basket's result
//       counts up;
//   3.3 a range bar for every basket size (best and worst possible basket),
//       the reader's basket marked on its size's bar;
//   3.4 the trap: three EV makers share one cause; "Swap two EV makers" re-runs
//       the basket with Volt, Pixel Pay and Kisan Seeds (−22.3% → +6.3%).
// Saved as state.baskets = {picked, swapped}. Every result is made up.
import { useEffect, useMemo, useState } from "react";
import { saver, stepAt } from "./waState";
import { basketSummary, fill, pct, rangeBySize } from "./winterarcDays815Math";

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function useCountUp(target, run) {
  const animate = run && !reduced();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!animate) return undefined;
    let raf;
    let t0;
    const tick = (t) => {
      t0 ??= t;
      const k = Math.min(1, (t - t0) / 900);
      setV(target * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, animate]);
  return animate ? v : target;
}

export default function Baskets({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.baskets || {};
  const save = saver(onState, "baskets");
  const ids = s.picked || [];
  const byId = useMemo(() => Object.fromEntries(c.companies.map((k) => [k.id, k])), [c.companies]);
  const sum = basketSummary(ids, c.companies);
  const ranges = useMemo(() => rangeBySize(c.companies.map((k) => k.r)), [c.companies]);
  const counted = useCountUp(sum.r, at === 1 && sum.n > 0);
  const hitBy = (id) => c.news.find((n) => n.ids.includes(id));

  const toggle = (id) => save({ picked: ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id] });

  const cardGrid = (showResult) => (
    <div className="wk-co-grid" role="group" aria-label="Companies">
      {c.companies.map((k) => {
        const on = ids.includes(k.id);
        const hit = showResult && on && hitBy(k.id);
        return (
          <button key={k.id} type="button" className={`wk-co${on ? " is-on" : ""}${hit ? " is-hit" : ""}`} aria-pressed={on} disabled={showResult} onClick={() => toggle(k.id)}>
            <strong>{k.name}</strong>
            <small>{k.industry}</small>
            {showResult && on && <span className={`wk-co-r${k.r < 0 ? " is-neg" : ""}`}>{pct(k.r, 0)}</span>}
          </button>
        );
      })}
    </div>
  );

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wf-seg" role="group" aria-label="Presets">
          {c.presets.map((p) => (
            <button key={p.id} type="button" className={`wf-seg-btn${ids.length === p.ids.length && p.ids.every((x) => ids.includes(x)) ? " is-on" : ""}`} onClick={() => save({ picked: [...p.ids] })}>
              {p.label}
            </button>
          ))}
        </div>
        {cardGrid(false)}
        <div className="wk-basket" aria-live="polite">
          <span aria-hidden="true">🧺</span>
          <strong>{sum.n ? fill(c.texts.count, { n: sum.n, m: sum.m }) : c.texts.empty}</strong>
        </div>
        <p className="wf-foot">Fictional companies. Their results show up when the year runs.</p>
      </div>
    );
  }

  if (at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wk-news">
          {c.news.map((n, i) => (
            <div key={n.text} className="wk-news-card" style={{ "--d": `${i * 0.25}s` }}>
              <small>Breaking</small>
              {n.text}
            </div>
          ))}
        </div>
        {sum.n ? cardGrid(true) : null}
        <p className={`wf-out wk-result${sum.r < 0 ? " is-warn" : ""}`} aria-live="polite">
          {sum.n ? fill(c.texts.result, { r: pct(counted) }) : c.texts.empty}
        </p>
        <p className="wf-foot">One made-up year. The other companies moved modestly.</p>
      </div>
    );
  }

  if (at === 2) {
    const lo = -60;
    const hi = 40;
    const x = (v) => `${((v - lo) / (hi - lo)) * 100}%`;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wk-ranges" role="img" aria-label={ranges.map((r) => `${r.size}: ${pct(r.lo)} to ${pct(r.hi)}`).join("; ")}>
          <div className="wk-range-zero" style={{ left: x(0) }} aria-hidden="true" />
          {ranges.map((r) => (
            <div key={r.size} className={`wk-range-row${r.size === sum.n ? " is-mine" : ""}`}>
              <span className="wk-range-size">{r.size}</span>
              <div className="wk-range-track">
                <div className="wk-range-bar" style={{ left: x(r.lo), width: `max(4px, calc(${x(r.hi)} - ${x(r.lo)}))` }} />
                {r.size === sum.n && <div className="wk-range-me" style={{ left: x(sum.r) }} title={`Your basket: ${pct(sum.r)}`} />}
              </div>
              <span className="wk-range-val">{r.size === 10 ? pct(r.lo) : `${pct(r.lo, 1)} to ${pct(r.hi, 1)}`}</span>
            </div>
          ))}
        </div>
        <p className="wf-out">{c.texts.range}</p>
        <p className="wf-foot">Number of companies in the basket · worst to best possible basket of that size · ● yours{sum.n ? ` (${pct(sum.r)})` : ""}</p>
      </div>
    );
  }

  const ev = basketSummary(c.evIds, c.companies).r;
  const mix = basketSummary(c.swap, c.companies).r;
  const shown = s.swapped ? c.swap : c.evIds;
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <div className={`wk-trap${s.swapped ? " is-swapped" : ""}`}>
        <div className="wk-trap-cause">{s.swapped ? "Three different reasons" : `One cause: ${c.news[1].text}`}</div>
        <div className="wk-trap-row">
          {shown.map((id) => (
            <div key={id} className={`wk-co is-on${byId[id].r < 0 ? " is-hit" : ""}`}>
              <strong>{byId[id].name}</strong>
              <small>{byId[id].industry}</small>
              <span className={`wk-co-r${byId[id].r < 0 ? " is-neg" : ""}`}>{pct(byId[id].r, 0)}</span>
            </div>
          ))}
        </div>
        <p className={`wk-trap-total${(s.swapped ? mix : ev) < 0 ? " is-warn" : ""}`}>Basket: {pct(s.swapped ? mix : ev)}</p>
      </div>
      <button type="button" className="wf-act wf-act--ghost" onClick={() => save({ swapped: !s.swapped })}>
        {s.swapped ? "Back to three EV makers" : c.texts.swap_btn}
      </button>
      {s.swapped && <p className="wf-out" aria-live="polite">{fill(c.texts.swapped, { ev: pct(ev), mix: pct(mix) })}</p>}
    </div>
  );
}
