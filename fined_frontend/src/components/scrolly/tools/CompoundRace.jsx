// "Race to ₹10 lakh" — a `model` card with model_kind "compound_race"
// (WinterArc Day 3). A target to hit with two choices that fight each other:
// when to start, and how much to put in each month (chips, no sliders). Each
// "Run it" adds a try: one bar at age 50 split into "your money" and "growth
// on growth", against a dashed goal line, with Dev from Chapter 2 as a faint
// ghost bar. The reader's best (least of their own money that still reaches
// the goal) is kept. A toggle shows the result in today's prices (made-up
// inflation), tying Chapter 1 to Chapter 2. Never scored. Rules in
// winterarcGames.js (raceResult).
import SafeText from "../SafeText";
import { inrWords } from "../figures/blocksMath";
import { fill, raceBest, raceMin, raceResult, raceToday } from "./winterarcGames";
import { ToolHead } from "./toolKit";

function Chips({ label, options, value, onPick }) {
  return (
    <div className="cr-row">
      <div className="cr-row-label">{label}</div>
      <div className="cr-chips" role="group" aria-label={label}>
        {options.map((o) => (
          <button key={o.id} type="button" className={`cr-chip${o.id === value ? " is-on" : ""}`} aria-pressed={o.id === value} onClick={() => onPick(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultBar({ label, r, scale, goal, today, config, ghost }) {
  const show = (v) => (today ? raceToday(config, v) : v);
  const pct = (v) => `${Math.min(100, (show(v) / scale) * 100)}%`;
  return (
    <div className={`cr-bar${ghost ? " is-ghost" : ""}`}>
      <div className="cr-bar-head">
        <span>{label}</span>
        <strong>{inrWords(show(r.total))}</strong>
      </div>
      <div className="cr-track" aria-hidden="true">
        <div className="cr-fill cr-fill--mine" style={{ width: pct(r.putIn) }} />
        <div className="cr-fill cr-fill--growth" style={{ left: pct(r.putIn), width: `calc(${pct(r.total)} - ${pct(r.putIn)})` }} />
        <span className="cr-goal" style={{ left: pct(goal) }} />
      </div>
    </div>
  );
}

export default function CompoundRace({ card, state = {}, onState }) {
  const d = card.card_data || {};
  const config = d.config || {};
  const t = config.texts || {};
  const pick = {
    start: state.start ?? config.defaults?.start,
    amount: state.amount ?? config.defaults?.amount,
    length: state.length ?? config.defaults?.length,
  };
  const tries = state.tries || [];
  const last = tries[tries.length - 1];
  const result = last ? raceResult(config, last) : null;
  const ghostPick = config.ghost;
  const ghost = ghostPick ? raceResult(config, ghostPick) : null;
  const best = raceBest(config, tries);
  const today = !!state.today;
  const set = (key) => (value) => onState((prev) => ({ ...prev, [key]: value }));
  const runIt = () => onState((prev) => ({ ...prev, tries: [...(prev.tries || []), { start: pick.start, amount: pick.amount, length: pick.length }] }));
  const goal = config.goal;
  const shown = (v) => (today ? raceToday(config, v) : v);
  const scale = Math.max(shown(goal) * 1.25, result ? shown(result.total) : 0, ghost ? shown(ghost.total) : 0);
  const pickLabel = (p) =>
    fill(t.try_label || "From {start}, {amount} a month, {length}", {
      start: p.start,
      amount: inrWords(p.amount),
      length: (config.lengths.find((l) => l.id === p.length)?.label || "").toLowerCase(),
    });

  return (
    <div className="tool-card compound-race">
      <ToolHead data={d} />

      <div className="cr-picks">
        <Chips label={t.start_label || "Start at age"} options={config.starts.map((a) => ({ id: a, label: String(a) }))} value={pick.start} onPick={set("start")} />
        <Chips label={t.amount_label || "Put in each month"} options={config.amounts.map((a) => ({ id: a, label: inrWords(a) }))} value={pick.amount} onPick={set("amount")} />
        <Chips label={t.length_label || "Keep paying in"} options={config.lengths.map((l) => ({ id: l.id, label: l.label }))} value={pick.length} onPick={set("length")} />
        <button type="button" className="cr-run" onClick={runIt}>
          {tries.length ? t.run_again || "Run it again" : t.run || "Run it to 50"}
        </button>
      </div>

      {result && (
        <div className="cr-result" aria-live="polite">
          <div className="cr-legend" aria-hidden="true">
            <span>
              <i className="cr-sw cr-sw--mine" /> {t.mine_label || "Your money"}
            </span>
            <span>
              <i className="cr-sw cr-sw--growth" /> {t.growth_label || "Growth"}
            </span>
            <span>
              <i className="cr-sw cr-sw--goal" /> {fill(t.goal_label || "Goal: {goal}", { goal: inrWords(shown(goal)) })}
            </span>
          </div>
          <ResultBar label={t.you_label || "You, at 50"} r={result} scale={scale} goal={goal} today={today} config={config} />
          {ghost && <ResultBar label={ghostPick.label} r={ghost} scale={scale} goal={goal} today={today} config={config} ghost />}
          <p className={`cr-verdict${result.reached ? " is-made" : " is-short"}`}>
            {result.reached
              ? fill(t.made_it, { total: inrWords(result.total), put_in: inrWords(result.putIn), growth: inrWords(result.growth) })
              : fill(t.short, { total: inrWords(result.total), gap: inrWords(goal - result.total), put_in: inrWords(result.putIn) })}
          </p>
          <label className="cr-today">
            <input type="checkbox" checked={today} onChange={(e) => set("today")(e.target.checked)} />
            <span>{t.today_toggle || "Show in today's prices"}</span>
          </label>
          {today && <p className="cr-today-line">{fill(t.today_line, { total: inrWords(result.total), real: inrWords(raceToday(config, result.total)) })}</p>}
        </div>
      )}

      {tries.length > 0 && (
        <ol className="cr-tries">
          {tries.map((p, k) => {
            const r = raceResult(config, p);
            const isBest = best && best.start === p.start && best.amount === p.amount && best.length === p.length;
            return (
              <li key={k} className={`${r.reached ? "is-made" : ""}${isBest ? " is-best" : ""}`}>
                <span className="cr-try-pick">{pickLabel(p)}</span>
                <span className="cr-try-out">
                  {inrWords(r.total)} · {r.reached ? "✓" : "short"}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      {best && <p className="cr-best">{fill(best.putIn <= (raceMin(config) ?? 0) ? t.best_min || t.best : t.best, { put_in: inrWords(best.putIn) })}</p>}

      {config.footnote && (
        <p className="gs-foot">
          <SafeText text={config.footnote} />
        </p>
      )}
    </div>
  );
}
