// WinterArc Day 6 Chapter 3 — "Goal Forge": wishes into plans that fit.
//   3.1 pick up to 3 wish cards (Arjun's three if none);
//   3.2 each is forged: amount · month · per month (rounded up to ₹100);
//   3.3 the goals' monthly total stacks against the spare money (money in −
//       must-pay − the jar saving from Chapter 2); any overflow is named;
//   3.4 fix it: later month, smaller amount, or drop a card; each move's
//       trade-off is named; a "Plan fits" seal when it fits;
//   3.5 the goals slide into lanes by time, the emergency jar first in line.
// Saved as state.goals = {picked, edits: {id: {amount, months}}, removed}.
// Fixes apply from 3.4 on, so scrolling back to 3.3 shows the first plan.
import { fill, goalLane, goalMonthly, goalPlan, heroMonth, inr, monthLabel } from "./winterarcDays567Math";

export default function GoalForge({ step, state = {}, onState, config: c, hero, pageSteps }) {
  const at = Math.min(Math.max(step ?? 0, 0), 4);
  const g = state.goals || {};
  const save = (patch) => onState((prev) => ({ ...prev, goals: { ...(prev.goals || {}), ...patch } }));
  const picked = g.picked?.length ? g.picked : at === 0 ? [] : c.defaults;
  const fixing = at >= 3;
  const removed = fixing ? g.removed || [] : [];
  const goals = picked
    .filter((id) => !removed.includes(id))
    .map((id) => {
      const base = c.presets.find((p) => p.id === id);
      const e = fixing ? g.edits?.[id] || {} : {};
      return { ...base, amount: e.amount ?? base.amount, months: e.months ?? base.months, base };
    });
  const { income, must, surplus } = heroMonth(hero, c);
  const jarSaving = Math.min(surplus, pageSteps?.[c.fundChapter]?.fund?.saving ?? c.defaultSave);
  const spare = Math.max(0, income - must - jarSaving);
  const plan = goalPlan(goals, spare);
  const edit = (id, patch) => save({ edits: { ...(g.edits || {}), [id]: { ...(g.edits?.[id] || {}), ...patch } } });
  const toggle = (id) => {
    const cur = g.picked || [];
    save({ picked: cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= 3 ? cur : [...cur, id] });
  };

  // the trade-off of each change made at 3.4
  const moves = fixing
    ? picked.flatMap((id) => {
        const base = c.presets.find((p) => p.id === id);
        const was = goalMonthly(base.amount, base.months);
        if (removed.includes(id)) return [fill(c.texts.dropped, { goal: base.label, freed: inr(was) })];
        const now = goals.find((x) => x.id === id);
        if (now.months === base.months && now.amount === base.amount) return [];
        return [
          fill(now.months !== base.months ? c.texts.moved : c.texts.shrunk, {
            goal: base.label,
            when: monthLabel(now.months),
            amount: inr(now.amount),
            now: inr(goalMonthly(now.amount, now.months)),
            was: inr(was),
          }),
        ];
      })
    : [];

  if (at === 0) {
    return (
      <div className="wf-figure wf-forge">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wf-wishes" role="group" aria-label="Pick up to three">
          {c.presets.map((p) => {
            const on = (g.picked || []).includes(p.id);
            return (
              <button key={p.id} type="button" className={`wf-wish${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => toggle(p.id)}>
                {p.label}
                <small>{inr(p.amount)}</small>
              </button>
            );
          })}
        </div>
        <div className="wf-anvil" aria-live="polite">
          {(g.picked || []).length ? (g.picked || []).map((id) => <span key={id}>{c.presets.find((p) => p.id === id).label}</span>) : <em>{c.texts.pick}</em>}
        </div>
      </div>
    );
  }

  if (at === 4) {
    const lanes = [
      { id: "short", label: "Under 1 year" },
      { id: "medium", label: "1 to 5 years" },
      { id: "long", label: "Over 5 years" },
    ];
    return (
      <div className="wf-figure wf-forge">
        <p className="wf-note">{c.notes[4]}</p>
        <div className="wf-lanes3">
          {lanes.map((l) => (
            <div key={l.id} className="wf-lane3">
              <div className="wf-lane3-head">{l.label}</div>
              {l.id === "short" && <div className="wf-goal-chip is-jar">Emergency jar first</div>}
              {plan.rows
                .filter((r) => goalLane(r.months) === l.id)
                .map((r) => (
                  <div key={r.id} className="wf-goal-chip">
                    {r.label}
                    <small>{monthLabel(r.months)}</small>
                  </div>
                ))}
            </div>
          ))}
        </div>
        <p className="wf-out">{c.texts.lanes}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure wf-forge">
      <p className="wf-note">{c.notes[at]}</p>
      <div className="wf-goals">
        {plan.rows.map((r) => (
          <div key={r.id} className={`wf-goal${at >= 1 ? " is-forged" : ""}`}>
            <div className="wf-goal-name">
              {r.label}
              {at === 3 && (
                <button type="button" className="wf-goal-x" aria-label={`Drop ${r.label}`} onClick={() => save({ removed: [...removed, r.id] })}>
                  ✕
                </button>
              )}
            </div>
            <div className="wf-goal-fields">
              <span>{inr(r.amount)}</span>
              <span>{monthLabel(r.months)}</span>
              <strong>{inr(r.monthly)}/mo</strong>
            </div>
            {at === 3 && (
              <div className="wf-goal-ctrls">
                <button type="button" className="wf-mini" disabled={r.months >= 60} onClick={() => edit(r.id, { months: r.months + 1 })}>
                  Later
                </button>
                <button type="button" className="wf-mini" disabled={r.months <= 1} onClick={() => edit(r.id, { months: r.months - 1 })}>
                  Sooner
                </button>
                <button type="button" className="wf-mini" disabled={r.amount <= 500} onClick={() => edit(r.id, { amount: r.amount - 500 })}>
                  −₹500
                </button>
              </div>
            )}
          </div>
        ))}
        {removed.length > 0 && (
          <button type="button" className="wf-mini wf-mini--undo" onClick={() => save({ removed: [] })}>
            Bring back dropped goals
          </button>
        )}
      </div>
      {at >= 2 && (
        <div className="wf-fit" aria-live="polite">
          <div className={`wf-fit-row${plan.fits ? "" : " is-over"}`}>
            <span>Goals need</span>
            <strong>{inr(plan.need)}/mo</strong>
          </div>
          <div className="wf-fit-row">
            <span>Spare money</span>
            <strong>{inr(spare)}/mo</strong>
          </div>
          <div className="wf-fit-track" aria-hidden="true">
            <span className="wf-fit-spare" style={{ width: `${Math.min(100, (spare / Math.max(spare, plan.need, 1)) * 100)}%` }} />
            <span className={`wf-fit-need${plan.fits ? "" : " is-over"}`} style={{ width: `${Math.min(100, (plan.need / Math.max(spare, plan.need, 1)) * 100)}%` }} />
          </div>
          {plan.fits && at === 3 && <div className="wf-seal">Plan fits</div>}
        </div>
      )}
      <p className={`wf-out${at >= 2 && !plan.fits ? " is-warn" : ""}`}>
        {at === 1
          ? c.texts.forged
          : at === 2
            ? plan.fits
              ? fill(c.texts.fits, { left: inr(plan.left) })
              : fill(c.texts.over, { need: inr(plan.need), spare: inr(spare), over: inr(plan.over), income: inr(income), must: inr(must), jar: inr(jarSaving) })
            : plan.fits
              ? fill(c.texts.fits, { left: inr(plan.left) })
              : fill(c.texts.still_over, { over: inr(plan.over) })}
      </p>
      {at === 3 && moves.length > 0 && (
        <ul className="wf-lines">
          {moves.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
