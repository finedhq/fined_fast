// Reusable figure (WinterArc Day 1 on) — "stack bars": side-by-side bars,
// each a stack of labelled pieces, drawn from `config` (see
// winterarcDay01Figures.js). Maths in stackMath.js.
//
// config: max (the value of a full-height bar), bars [{id, label}],
// segments {id: {label, value, tone}}, views (one per step), and optional
// sort (see below). Each view:
//   show      bar ids drawn (the others keep an empty slot)
//   unknown   bar ids drawn as a pale "?" placeholder
//   fill      {barId: [segment ids] | number}  (pieces, or one plain total)
//   tones     {barId: tone} for a plain-total bar
//   hideTotal bar ids whose total label shows "?"
//   guessHides segment ids drawn as a "?" piece until this step's
//             tap-to-guess is answered (the total shows "?" too)
//   pulse     a segment id that pulses (after the guess, on a guess step)
//   ghost     {barId: value} a dashed outline, e.g. a rule of thumb;
//             ghostFaint fades it. Anything above the outline is hatched.
//   legend    a bar id whose pieces are listed under the chart (label +
//             amount), so colour is never the only way to tell them apart
//   tag       {bar, text} a small label in a bar's slot; "{poll}" is replaced
//             with the reader's warm-up answer (hidden if they skipped it)
//   note      a line above the chart
//   sort      true: the reader sorts config.sort.chips into zones (tap a
//             chip, then a zone); placed chips stack into the zone's bar.
//             Saved as state.sort {chipId: zoneId}.
//   compare   true: a line comparing the reader's sort with the story's
//             (config.sort.compare), plus a note for each chip placed
//             differently (config.sort.notes)
// Scrolling back shows the earlier view again; the sort is kept.
import { useState } from "react";
import { barPieces, barTotal, compareLine, heightOf, inr, sortComplete, sortDifferences, sortTotals } from "./stackMath";

const UNKNOWN_H = 0.42; // a "?" bar's height
const HIDDEN_PIECE_H = 0.07; // a "?" piece's height

function pollLabel(hero) {
  const id = hero?.answers?.poll;
  return id ? hero?.poll?.options?.find((o) => o.id === id)?.label || "" : "";
}

export default function StackBars({ step, steps, state = {}, onState, config, hero }) {
  const at = Math.min(Math.max(step ?? 0, 0), config.views.length - 1);
  const view = config.views[at];
  const guessKey = steps?.[at]?.step_id;
  const guessed = !!(guessKey && state.guesses?.[guessKey] !== undefined);
  const hidden = new Set(guessed ? [] : view.guessHides || []);
  const sort = state.sort || {};
  const [picked, setPicked] = useState(null);
  const show = new Set(view.show || config.bars.map((b) => b.id));
  const unknown = new Set(view.unknown || []);
  const pulse = view.pulse && (!view.guessHides || guessed) ? view.pulse : null;

  const place = (zoneId) => {
    if (!picked) return;
    onState((prev) => ({ ...prev, sort: { ...(prev.sort || {}), [picked]: zoneId } }));
    setPicked(null);
  };

  const tagText = view.tag ? view.tag.text.replace("{poll}", pollLabel(hero)) : "";
  const showTag = view.tag && (!view.tag.text.includes("{poll}") || pollLabel(hero));

  const bars = config.bars.map((b) => {
    const pieces = barPieces(config, view, b.id, sort);
    const total = barTotal(pieces);
    const totalHidden = (view.hideTotal || []).includes(b.id) || pieces.some((p) => hidden.has(p.id));
    return { ...b, pieces, total, totalHidden };
  });
  const legendBar = view.legend ? bars.find((b) => b.id === view.legend) : null;
  const summary = bars
    .filter((b) => show.has(b.id))
    .map((b) => (unknown.has(b.id) ? `${b.label}: not shown yet` : `${b.label}: ${b.totalHidden ? "total hidden" : inr(b.total)}${b.pieces.length > 1 ? ` (${b.pieces.map((p) => `${p.label} ${hidden.has(p.id) ? "hidden" : inr(p.value)}`).join(", ")})` : ""}`))
    .join(". ");

  const totals = view.sort || view.compare ? sortTotals(config, sort) : null;
  const done = config.sort && sortComplete(config, sort);
  const diffs = view.compare ? sortDifferences(config, sort) : [];

  return (
    <div className={`sb-figure${view.sort ? " is-sorting" : ""}`}>
      <div className={`nb-note sb-note${view.note ? "" : " is-empty"}`}>{view.note || " "}</div>
      <div className="sb-plot" role="img" aria-label={summary} style={{ gridTemplateColumns: `repeat(${bars.length}, 1fr)` }}>
        {bars.map((b) => {
          const isShown = show.has(b.id);
          const isUnknown = unknown.has(b.id);
          const ghost = view.ghost?.[b.id];
          let y = 0;
          return (
            <div key={b.id} className={`sb-col${isShown ? "" : " sb-col--hidden"}`} aria-hidden={isShown ? undefined : true}>
              <div className="sb-track">
                {showTag && view.tag.bar === b.id && <span className="sb-tag">{tagText}</span>}
                {isUnknown ? (
                  <div className="sb-bar sb-bar--unknown" style={{ height: `${UNKNOWN_H * 100}%` }}>
                    <span className="sb-total">?</span>
                  </div>
                ) : (
                  <div className="sb-stack">
                    {b.pieces.map((p, k) => {
                      const h = hidden.has(p.id) ? HIDDEN_PIECE_H : heightOf(p.value, config.max);
                      const bottom = y;
                      y += h;
                      return (
                        <div
                          key={p.id}
                          className={`sb-piece sb-tone-${p.tone ?? k % 7}${hidden.has(p.id) ? " sb-piece--unknown" : ""}${pulse === p.id ? " sb-piece--pulse" : ""}`}
                          style={{ bottom: `${bottom * 100}%`, height: `${h * 100}%`, transitionDelay: `${k * 90}ms` }}
                          title={p.label}
                        >
                          {hidden.has(p.id) && <span>?</span>}
                        </div>
                      );
                    })}
                    {(b.pieces.length > 0 || view.sort) && (
                      <span className="sb-total" style={{ bottom: `calc(${Math.min(1, y) * 100}% + 4px)` }}>
                        {b.totalHidden ? "?" : inr(b.total)}
                      </span>
                    )}
                    {ghost != null && (
                      <>
                        <div className={`sb-ghost${view.ghostFaint ? " is-faint" : ""}`} style={{ height: `${heightOf(ghost, config.max) * 100}%` }}>
                          <span>{inr(ghost)}</span>
                        </div>
                        {b.total > ghost && !view.ghostFaint && (
                          <div
                            className="sb-over"
                            style={{ bottom: `${heightOf(ghost, config.max) * 100}%`, height: `${(heightOf(b.total, config.max) - heightOf(ghost, config.max)) * 100}%` }}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="nb-label">{b.label}</div>
            </div>
          );
        })}
      </div>

      {legendBar && (
        <ul className="sb-legend" aria-hidden="true">
          {legendBar.pieces.map((p, k) => (
            <li key={p.id} className={pulse === p.id ? "is-pulse" : ""}>
              <span className={`sb-swatch sb-tone-${p.tone ?? k % 7}`} />
              <span className="sb-legend-label">{p.label}</span>
              <strong>{hidden.has(p.id) ? "?" : inr(p.value)}</strong>
            </li>
          ))}
        </ul>
      )}

      {view.sort && config.sort && (
        <div className="sb-sort">
          <p className="sb-sort-howto" aria-live="polite">
            {picked ? `${config.segments[picked].label}: tap ${config.sort.zones.map((z) => z.label).join(" or ")}.` : done ? config.sort.done_text : config.sort.howto}
          </p>
          <div className="sb-chips" role="group" aria-label="Arjun's spending">
            {config.sort.chips.map((id) => {
              const zone = config.sort.zones.find((z) => z.id === sort[id]);
              return (
                <button
                  key={id}
                  type="button"
                  className={`sb-chip${picked === id ? " selected" : ""}${zone ? " placed" : ""}`}
                  aria-pressed={picked === id}
                  onClick={() => setPicked(picked === id ? null : id)}
                >
                  <span>{config.segments[id].label}</span>
                  <small>
                    {inr(config.segments[id].value)}
                    {zone ? ` · ${zone.label}` : ""}
                  </small>
                </button>
              );
            })}
          </div>
          <div className="sb-zones">
            {config.sort.zones.map((z) => (
              <button key={z.id} type="button" className="sb-zone" disabled={!picked} onClick={() => place(z.id)}>
                {z.label}
                {totals && <small>{inr(totals[z.id] || 0)}</small>}
              </button>
            ))}
          </div>
        </div>
      )}

      {view.compare && config.sort && (
        <div className="sb-compare" aria-live="polite">
          <p className="sb-compare-line">{compareLine(config, sort)}</p>
          {diffs.length > 0 && (
            <ul className="sb-diffs">
              {diffs.map((id) => (
                <li key={id}>
                  <strong>{config.segments[id].label}:</strong> {config.sort.notes[id]}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
