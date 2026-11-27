// WinterArc Day 5 Chapter 3 — "Shield Loadout".
//   3.1 sort six risks into Insure · Save for it · Live with it (SortBoard);
//   3.2 the zones dissolve onto a 2×2 grid (how big × how likely); cards the
//       reader placed differently keep a tag of their pick, with one line each;
//   3.3 a shield for the reader's situation (from the hero's pick): health,
//       vehicle, life (life lit only when someone depends on their income);
//   3.4 cover-only vs mixed life plan, hidden until the step's guess;
//   3.5 three rights stamped into a "policy passport", one tap each.
// Saved as state.shield = {placed, done, stamps}. Explains covers; never
// recommends one (the footer says so).
import SortBoard from "./SortBoard";
import { fill } from "./winterarcDays567Math";

export default function ShieldLoadout({ step, steps, state = {}, onState, config: c, hero }) {
  const at = Math.min(Math.max(step ?? 0, 0), 4);
  const sh = state.shield || {};
  const placed = sh.placed || {};
  const save = (patch) => onState((prev) => ({ ...prev, shield: { ...(prev.shield || {}), ...patch } }));
  const guessed = state.guesses?.[steps?.[at]?.step_id] !== undefined;
  const ok = (card) => card.zones.includes(placed[card.id]);

  if (at === 0) {
    return (
      <div className="wf-figure wf-shield">
        <p className="wf-note">{c.notes[0]}</p>
        <SortBoard
          cards={c.cards}
          zones={c.zones}
          placed={placed}
          onPlace={(card, zone) => save({ placed: { ...placed, [card]: zone } })}
          done={!!sh.done}
          onDone={() => save({ done: true })}
        />
        {sh.done && <p className="wf-out">{c.texts.sorted}</p>}
      </div>
    );
  }

  if (at === 1) {
    const right = c.cards.filter(ok).length;
    const zoneLabel = (id) => c.zones.find((z) => z.id === id)?.label;
    return (
      <div className="wf-figure wf-shield">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wf-matrix" role="img" aria-label="Risks by how big and how likely">
          <span className="wf-matrix-y">Bigger loss ↑</span>
          <span className="wf-matrix-x">More likely →</span>
          {c.cards.map((card) => (
            <div key={card.id} className={`wf-matrix-card${sh.done && !ok(card) ? " is-miss" : ""}`} style={{ left: `${card.x}%`, top: `${card.y}%` }}>
              {card.short}
              {sh.done && !ok(card) && <small>you: {zoneLabel(placed[card.id])}</small>}
            </div>
          ))}
          <span className="wf-matrix-q wf-matrix-q--tl">Insure</span>
          <span className="wf-matrix-q wf-matrix-q--br">Save for it</span>
        </div>
        <p className="wf-out">{sh.done ? fill(c.texts.score, { n: right, of: c.cards.length }) : c.texts.not_sorted}</p>
        {sh.done && (
          <ul className="wf-lines">
            {c.cards
              .filter((card) => !ok(card))
              .map((card) => (
                <li key={card.id}>{card.miss}</li>
              ))}
          </ul>
        )}
      </div>
    );
  }

  if (at === 2) {
    const sit = hero?.answers?.savings || c.defaultSituation;
    const lifeOn = sit === "earner_family";
    return (
      <div className="wf-figure wf-shield">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wf-shield-badge" aria-hidden="true">
          <span className="wf-seg-health">Health</span>
          <span className="wf-seg-vehicle">Vehicle</span>
          <span className={`wf-seg-life${lifeOn ? "" : " is-off"}`}>Life</span>
        </div>
        <ul className="wf-lines">
          <li>
            <strong>Health:</strong> {c.texts.health}
          </li>
          <li>
            <strong>Vehicle:</strong> {c.texts.vehicle}
          </li>
          <li className={lifeOn ? "" : "is-dim"}>
            <strong>Life:</strong> {lifeOn ? c.texts.life_on : c.texts.life_off}
          </li>
        </ul>
        <p className="wf-out">{c.situations[sit] || c.situations[c.defaultSituation]}</p>
        <p className="wf-foot">{c.texts.not_advice}</p>
      </div>
    );
  }

  if (at === 3) {
    return (
      <div className="wf-figure wf-shield">
        <p className="wf-note">{c.notes[3]}</p>
        <div className="wf-plans">
          {c.plans.map((pl) => (
            <div key={pl.id} className={`wf-plan${guessed && pl.id === "cover" ? " is-pulse" : ""}`}>
              <div className="wf-plan-name">{pl.label}</div>
              <small>₹10,000 a year</small>
              <div className="wf-plan-cover">{guessed ? pl.cover : "?"}</div>
              <small>life cover{guessed && pl.extra ? `, ${pl.extra}` : ""}</small>
            </div>
          ))}
        </div>
        <p className="wf-out">{guessed ? c.texts.plans_after : c.texts.plans_before}</p>
        <p className="wf-foot">{c.texts.plans_note}</p>
      </div>
    );
  }

  const stamped = sh.stamps || [];
  const next = c.rights.find((r) => !stamped.includes(r.id));
  return (
    <div className="wf-figure wf-shield">
      <p className="wf-note">{c.notes[4]}</p>
      <div className={`wf-passport${next ? "" : " is-closed"}`}>
        <div className="wf-passport-head">Policy passport</div>
        <ul>
          {c.rights.map((r) => (
            <li key={r.id} className={stamped.includes(r.id) ? "is-in" : ""}>
              <strong>{r.label}</strong>
              {stamped.includes(r.id) ? <span>{r.line}</span> : <span className="is-dim">Not stamped yet</span>}
            </li>
          ))}
        </ul>
      </div>
      {next ? (
        <button type="button" className="wf-act" onClick={() => save({ stamps: [...stamped, next.id] })}>
          Stamp: {next.label}
        </button>
      ) : (
        <p className="wf-out">{c.texts.passport_done}</p>
      )}
    </div>
  );
}
