// WinterArc Day 7 Chapter 1 — "Money City": four referees and their players.
//   1.1 four towers (RBI, SEBI, IRDAI, PFRDA), each with a one-line remit and
//       its own pattern (never colour alone); eight players wait;
//   1.2 the reader sorts the eight players onto towers (SortBoard), Done;
//   1.3 roads: each tower lists its real players; anyone placed elsewhere is
//       marked with where the reader put them and one line on why;
//   1.4 AMFI arrives: pick a tower or "Not a referee"; it lands in a small
//       "Players' clubhouse" beside SEBI's district;
//   1.5 each tower's licence · rulebook · whistle, and a fake "SEBI-approved
//       5% a month" banner stamped "No such thing".
// Saved as state.city = {placed, done, amfi}.
import SortBoard from "./SortBoard";
import { fill } from "./winterarcDays567Math";

function Tower({ t, children, pulse }) {
  return (
    <div className={`wf-tower wf-tower--${t.id}${pulse ? " is-pulse" : ""}`}>
      <div className="wf-tower-name">{t.label}</div>
      <small>{t.remit}</small>
      {children}
    </div>
  );
}

export default function CityMap({ step, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 4);
  const s = state.city || {};
  const placed = s.placed || {};
  const save = (patch) => onState((prev) => ({ ...prev, city: { ...(prev.city || {}), ...patch } }));
  const towerLabel = (id) => c.towers.find((t) => t.id === id)?.label || id;

  if (at === 1) {
    return (
      <div className="wf-figure wf-city">
        <p className="wf-note">{c.notes[1]}</p>
        <SortBoard
          cards={c.players}
          zones={c.towers.map((t) => ({ id: t.id, label: t.label, sub: t.remit }))}
          placed={placed}
          onPlace={(card, zone) => save({ placed: { ...placed, [card]: zone } })}
          done={!!s.done}
          onDone={() => save({ done: true })}
          columns={2}
          zoneClass="wf-zones-towers"
        />
        {s.done && <p className="wf-out">{c.texts.after_done}</p>}
      </div>
    );
  }

  if (at === 2) {
    const right = c.players.filter((p) => placed[p.id] === p.tower).length;
    const misses = c.players.filter((p) => s.done && placed[p.id] && placed[p.id] !== p.tower);
    return (
      <div className="wf-figure wf-city">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wf-towers">
          {c.towers.map((t) => (
            <Tower key={t.id} t={t}>
              <ul className="wf-road">
                {c.players
                  .filter((p) => p.tower === t.id)
                  .map((p) => (
                    <li key={p.id} className={s.done && placed[p.id] !== t.id ? "is-moved" : ""}>
                      {p.label}
                      {s.done && placed[p.id] !== t.id && <small>you: {towerLabel(placed[p.id])}</small>}
                    </li>
                  ))}
              </ul>
            </Tower>
          ))}
        </div>
        <p className="wf-out">{s.done ? fill(c.texts.score, { n: right, of: c.players.length }) : c.texts.not_sorted}</p>
        {misses.length > 0 && (
          <ul className="wf-lines">
            {misses.map((p) => (
              <li key={p.id}>{p.why}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (at === 3) {
    const pick = s.amfi;
    const options = [...c.towers.map((t) => ({ id: t.id, label: t.label })), { id: "none", label: "Not a referee" }];
    return (
      <div className="wf-figure wf-city">
        <p className="wf-note">{c.notes[3]}</p>
        <div className="wf-towers wf-towers--small">
          {c.towers.map((t) => (
            <Tower key={t.id} t={t} pulse={pick && t.id === "sebi"}>
              {t.id === "sebi" && pick && (
                <div className="wf-clubhouse">
                  <strong>Players' clubhouse</strong>
                  <span>AMFI</span>
                </div>
              )}
            </Tower>
          ))}
        </div>
        {!pick ? (
          <>
            <div className="wf-token-big">AMFI</div>
            <div className="wf-seg" role="group" aria-label="Where does AMFI go?">
              {options.map((o) => (
                <button key={o.id} type="button" className="wf-seg-btn" onClick={() => save({ amfi: o.id })}>
                  {o.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="wf-out">{pick === "none" ? c.texts.amfi_right : pick === "sebi" ? c.texts.amfi_close : c.texts.amfi_other}</p>
        )}
        {pick && <p className="wf-foot">{c.texts.amfi_body}</p>}
      </div>
    );
  }

  return (
    <div className="wf-figure wf-city">
      <p className="wf-note">{c.notes[at]}</p>
      <div className="wf-towers">
        {c.towers.map((t) => (
          <Tower key={t.id} t={t}>
            {at === 4 && (
              <div className="wf-tower-icons" aria-label="Licence, rulebook, whistle">
                <span>Licence</span>
                <span>Rulebook</span>
                <span>Whistle</span>
              </div>
            )}
          </Tower>
        ))}
      </div>
      {at === 0 && (
        <div className="wf-bus" aria-label="Players waiting">
          {c.players.map((p) => (
            <span key={p.id} className="wf-bus-token">
              {p.label}
            </span>
          ))}
        </div>
      )}
      {at === 4 && (
        <div className="wf-fake">
          <span>{c.texts.fake_banner}</span>
          <em>No such thing</em>
        </div>
      )}
    </div>
  );
}
