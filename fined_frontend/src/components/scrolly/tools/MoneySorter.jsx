// "Where Should This Money Live?" — a `model` card with model_kind
// "money_sorter" (Module 10), ported from the prototype's MoneySorter.js. Four
// made-up goals and four places, all on screen at once: tap a goal, then tap a
// place (on a computer a goal can also be dragged onto a place). Every
// placement shows that pair's trade-off note from the settings, never "right"
// or "wrong"; a placed goal can be picked up and moved. Saved as
// state.placements; finished (and paid) once `min_controls_to_complete` goals
// are placed. Then the summary line appears.
import { useState } from "react";
import { sorterDone, sorterNote } from "./toolRules";
import { ToolHead } from "./toolKit";

export default function MoneySorter({ card, state = {}, onState }) {
  const d = card.card_data || {};
  const config = d.config || {};
  const placements = state.placements || {};
  const [picked, setPicked] = useState(null);
  const label = (list, id) => (config[list] || []).find((x) => x.id === id)?.label || "";

  const place = (cardId, zoneId) => {
    if (!cardId) return;
    onState((prev) => ({ ...prev, placements: { ...(prev.placements || {}), [cardId]: zoneId } }));
    setPicked(null);
  };
  const done = sorterDone(d, state);

  return (
    <div className="tool-card money-sorter">
      <ToolHead data={d} />
      <p className="sorter-howto">{picked ? `Now tap where "${label("cards", picked)}" should live.` : "Tap a goal, then tap the place you'd put it."}</p>

      <div className="sorter-cards" role="group" aria-label="Goals">
        {(config.cards || []).map((c) => {
          const zone = placements[c.id];
          return (
            <button
              key={c.id}
              type="button"
              className={`sorter-card${picked === c.id ? " selected" : ""}${zone ? " placed" : ""}`}
              aria-pressed={picked === c.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", c.id)}
              onClick={() => setPicked(picked === c.id ? null : c.id)}
            >
              <span className="sorter-card-label">{c.label}</span>
              {zone && <span className="sorter-card-placed">→ {label("zones", zone)}</span>}
            </button>
          );
        })}
      </div>

      <div className="sorter-zones">
        {(config.zones || []).map((z) => {
          const here = (config.cards || []).filter((c) => placements[c.id] === z.id);
          return (
            <div
              key={z.id}
              role="button"
              tabIndex={0}
              className={`sorter-zone${picked ? " is-ready" : ""}`}
              aria-label={`Place in ${z.label}`}
              onClick={() => place(picked, z.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  place(picked, z.id);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                place(e.dataTransfer.getData("text/plain"), z.id);
              }}
            >
              <div className="sorter-zone-label">{z.label}</div>
              <div aria-live="polite">
                {here.map((c) => (
                  <div key={c.id} className="sorter-feedback-line">
                    <strong>{c.label}:</strong> {sorterNote(config, c.id, z.id)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {done && config.summary && <div className="sorter-summary">{config.summary}</div>}
      {config.neutrality_note && <p className="control-note">{config.neutrality_note}</p>}
    </div>
  );
}
