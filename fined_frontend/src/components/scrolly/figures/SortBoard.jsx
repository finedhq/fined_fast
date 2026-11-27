// Shared piece (WinterArc Day 5 on): sort cards into zones. Tap a card, then
// tap a zone (works the same with a mouse; no drag needed, so no gesture
// fights the page scroll). Placed cards can be moved again until Done.
// Nothing is marked right or wrong here: the figure using it shows the
// reveal (a 2×2 grid on Day 5, roads on Day 7). Controlled: `placed`
// {cardId: zoneId}, `onPlace(cardId, zoneId)`, `done`, `onDone()`.
import { useState } from "react";

export default function SortBoard({ cards, zones, placed = {}, onPlace, done, onDone, doneLabel = "Done", howto, zoneClass = "", columns }) {
  const [picked, setPicked] = useState(null);
  const left = cards.filter((c) => !placed[c.id]);
  const label = (id) => cards.find((c) => c.id === id)?.label || "";
  const place = (zoneId) => {
    if (!picked || done) return;
    onPlace(picked, zoneId);
    setPicked(null);
  };
  return (
    <div className={`wf-sort${done ? " is-done" : ""}`}>
      {!done && (
        <p className="wf-sort-howto" aria-live="polite">
          {picked ? `${label(picked)}: now tap where it goes.` : left.length ? howto || "Tap a card, then tap where it goes." : "All placed. Tap a card to move it, or tap Done."}
        </p>
      )}
      {!done && left.length > 0 && (
        <div className="wf-sort-tray" role="group" aria-label="Cards to sort">
          {left.map((c) => (
            <button key={c.id} type="button" className={`wf-sort-card${picked === c.id ? " is-picked" : ""}`} aria-pressed={picked === c.id} onClick={() => setPicked(picked === c.id ? null : c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      )}
      <div className={`wf-sort-zones ${zoneClass}`} style={{ gridTemplateColumns: `repeat(${columns || Math.min(zones.length, 4)}, minmax(0, 1fr))` }}>
        {zones.map((z) => {
          const inZone = cards.filter((c) => placed[c.id] === z.id);
          return (
            <div key={z.id} className={`wf-zone wf-zone--${z.id}${picked && !done ? " is-ready" : ""}`}>
              <button type="button" className="wf-zone-head" disabled={!picked || done} onClick={() => place(z.id)}>
                {z.label}
                {z.sub && <small>{z.sub}</small>}
              </button>
              <ul className="wf-zone-list">
                {inZone.map((c) => (
                  <li key={c.id}>
                    <button type="button" className={`wf-sort-chip${picked === c.id ? " is-picked" : ""}`} disabled={done} onClick={() => setPicked(picked === c.id ? null : c.id)}>
                      {c.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {!done && (
        <button type="button" className="wf-act" disabled={left.length > 0} onClick={onDone}>
          {left.length ? `${left.length} to go` : doneLabel}
        </button>
      )}
    </div>
  );
}
