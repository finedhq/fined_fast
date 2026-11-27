// WinterArc Day 14 Chapter 3 — "Card battle" (collectible asset cards).
//   3.1 a property card with four stat bars beside a smaller REIT card;
//   3.2 five challenges, one at a time: tap a card from a hand of six; a
//       right play wins the round, a wrong one shows the stat that loses;
//   3.3 the final round, "Need ₹20,000 next week": every card loses (too slow,
//       locked, might be down), then the emergency jar slides in and wins;
//   3.4 the round-up: "N of 6" and the whole deck fanned out with one-line jobs.
// Saved as state.battle = {plays, first, tried, final}. Unscored: the score
// (first-try wins, plus the final round) is only shown.
import { saver, stepAt } from "./waState";
import { fill } from "./winterarcDays815Math";

const Card = ({ k, onClick, state = "", disabled }) => (
  <button type="button" className={`wk-tcard ${state}`} onClick={onClick} disabled={disabled}>
    <span aria-hidden="true">{k.icon}</span>
    <strong>{k.label}</strong>
  </button>
);

export default function CardBattle({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.battle || {};
  const save = saver(onState, "battle");
  const plays = s.plays || {};
  const first = s.first || {};
  const byId = Object.fromEntries([...c.hand, c.jar].map((k) => [k.id, k]));
  const won = c.challenges.filter((ch) => first[ch.id] === ch.win).length + (s.final ? 1 : 0);

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wk-prop">
          {["home", "reit"].map((who) => (
            <div key={who} className={`wk-prop-card wk-prop-card--${who}`}>
              <strong>{who === "home" ? "🏠 Real estate" : "🏢 REIT"}</strong>
              {c.property.map((p) => (
                <div key={p.label} className="wk-stat">
                  <span>
                    {p.label}
                    {p.note ? ` (${p.note})` : ""}
                  </span>
                  <i style={{ width: `${p[who]}%` }} />
                </div>
              ))}
            </div>
          ))}
        </div>
        <p className="wf-foot">{c.texts.property_foot}</p>
      </div>
    );
  }

  if (at === 1) {
    const current = c.challenges.find((ch) => plays[ch.id] !== ch.win) || null;
    const last = current && plays[current.id];
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wk-rounds" aria-label="Rounds">
          {c.challenges.map((ch) => (
            <i key={ch.id} className={plays[ch.id] === ch.win ? "is-won" : ch === current ? "is-now" : ""} />
          ))}
        </div>
        {current ? (
          <>
            <div className="wk-challenge">
              <small>Challenge</small>
              <strong>{current.text}</strong>
            </div>
            {last && <p className="wf-out is-warn">{byId[last].label} loses: {current.lose}</p>}
            <div className="wk-hand">
              {c.hand.map((k) => (
                <Card key={k.id} k={k} state={last === k.id ? "is-lost" : ""} onClick={() => save({ plays: { ...plays, [current.id]: k.id }, first: { [current.id]: k.id, ...first } })} />
              ))}
            </div>
          </>
        ) : (
          <p className="wf-out wf-stamp">All five rounds won.</p>
        )}
        {Object.keys(plays).length > 0 && !current && (
          <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ plays: {}, first: {} })}>
            Play again
          </button>
        )}
      </div>
    );
  }

  if (at === 2) {
    const tried = s.tried;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wk-challenge is-hard">
          <small>Final challenge</small>
          <strong>{c.final.text}</strong>
        </div>
        {!tried ? (
          <div className="wk-hand">
            {c.hand.map((k) => (
              <Card key={k.id} k={k} onClick={() => save({ tried: k.id })} />
            ))}
          </div>
        ) : (
          <>
            <div className="wk-hand">
              {c.hand.map((k) => (
                <div key={k.id} className={`wk-tcard is-lost${k.id === tried ? " is-pick" : ""}`}>
                  <span aria-hidden="true">{k.icon}</span>
                  <strong>{k.label}</strong>
                  <small>{c.final.lose[k.id]}</small>
                </div>
              ))}
            </div>
            {s.final ? (
              <>
                <div className="wk-tcard is-won wk-jar-card">
                  <span aria-hidden="true">{c.jar.icon}</span>
                  <strong>{c.jar.label}</strong>
                  <small>{c.jar.job}</small>
                </div>
                <p className="wf-out" aria-live="polite">{c.texts.final}</p>
              </>
            ) : (
              <button type="button" className="wf-act" onClick={() => save({ final: true })}>
                {c.texts.jar_in}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <p className="wf-out">{fill(c.texts.score, { n: won })}</p>
      <div className="wk-fan">
        {[...c.hand, c.jar].map((k, i) => (
          <div key={k.id} className="wk-tcard is-fan" style={{ "--i": i }}>
            <span aria-hidden="true">{k.icon}</span>
            <strong>{k.label}</strong>
            <small>{k.job}</small>
          </div>
        ))}
      </div>
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
