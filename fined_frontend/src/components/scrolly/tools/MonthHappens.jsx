// "The Month Happens" — a `model` card with model_kind "month_happens"
// (WinterArc Day 1). A month's budget as pots (numbers and a fill, never
// colour alone); unplanned events arrive one at a time as phone messages and
// the reader picks where the money comes from. A choice a pot can't cover is
// unavailable and says why. A `forced` event (a need that just costs more)
// has one button and takes from the pots in order. At the end, lines written
// from this reader's own choices, then the same closing line for everyone.
// No points, no right answer. Saved as state.choices; "Play again" clears it.
// Rules in toolRules.js (monthRun, monthBlocked, monthEnding).
import SafeText from "../SafeText";
import { monthBlocked, monthEnding, monthRun } from "./toolRules";
import { ToolHead } from "./toolKit";

const rupees = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

function takesText(config, takes) {
  const parts = Object.entries(takes)
    .filter(([, v]) => v > 0)
    .map(([pot, v]) => `−${rupees(v)} ${config.pots.find((p) => p.id === pot)?.label || pot}`);
  return parts.length ? parts.join(" · ") : "₹0";
}

export default function MonthHappens({ card, state = {}, onState }) {
  const d = card.card_data || {};
  const config = d.config || { pots: [], events: [] };
  const choices = state.choices || {};
  const run = monthRun(config, choices);
  const choose = (eventId, choiceId) => onState((prev) => ({ ...prev, choices: { ...(prev.choices || {}), [eventId]: choiceId } }));
  const reset = () => onState((prev) => ({ ...prev, choices: {} }));
  const ev = run.next;
  const ending = run.done ? monthEnding(config, run) : [];
  const when = ev ? ev.when : config.end_label;

  return (
    <div className="tool-card month-happens">
      <ToolHead data={d} />

      <div className="mh-pots" aria-live="polite">
        <div className="mh-date">{when || config.start_label}</div>
        {config.pots.map((p) => {
          const left = run.pots[p.id];
          return (
            <div key={p.id} className={`mh-pot mh-pot--${p.id}${left < p.amount ? " is-used" : ""}`}>
              <div className="mh-pot-head">
                <span>{p.label}</span>
                <strong>{rupees(left)}</strong>
              </div>
              <div className="mh-pot-track" aria-hidden="true">
                <div className="mh-pot-fill" style={{ width: `${p.amount ? (left / p.amount) * 100 : 0}%` }} />
              </div>
              {p.note && <small className="mh-pot-note">{p.note}</small>}
            </div>
          );
        })}
      </div>

      {run.log.length > 0 && (
        <ol className="mh-log">
          {run.log.map((l) => (
            <li key={l.event.id}>
              <span className="mh-log-when">{l.event.when}</span>
              <span className="mh-log-what">{l.choice ? l.choice.label : l.event.forced.button}</span>
              <span className="mh-log-take">{takesText(config, l.takes)}</span>
            </li>
          ))}
        </ol>
      )}

      {ev && (
        <div className="mh-event" key={ev.id}>
          <div className="mh-msg" role="status">
            <div className="mh-msg-head">
              <span className="mh-msg-from">{ev.sender}</span>
              <span className="mh-msg-when">{ev.when}</span>
            </div>
            <p className="mh-msg-text">{ev.text}</p>
          </div>
          {ev.forced ? (
            <>
              <p className="mh-forced">{ev.forced.text}</p>
              <div className="mh-choices">
                <button type="button" className="mh-choice" onClick={() => choose(ev.id, "auto")}>
                  {ev.forced.button}
                </button>
              </div>
            </>
          ) : (
            <div className="mh-choices" role="group" aria-label={`Your call: ${ev.short}`}>
              {ev.choices.map((c) => {
                const blocked = monthBlocked(config, run.pots, c);
                return (
                  <button key={c.id} type="button" className="mh-choice" disabled={!!blocked} onClick={() => choose(ev.id, c.id)}>
                    <span>{c.label}</span>
                    <small>{blocked || takesText(config, c.take || {})}</small>
                  </button>
                );
              })}
            </div>
          )}
          <p className="mh-progress">
            {run.log.length + 1} of {config.events.length}
          </p>
        </div>
      )}

      {run.done && (
        <div className="mh-ending" aria-live="polite">
          {ending.map((line, i) => (
            <p key={i} className={i === 0 ? "mh-ending-lead" : undefined}>
              {line}
            </p>
          ))}
          {config.compare && (
            <p className="mh-compare">
              <span className="mh-compare-label">Without a plan</span>
              {config.compare}
            </p>
          )}
          {config.closing && (
            <p className="mh-closing">
              <SafeText text={config.closing} />
            </p>
          )}
          <button type="button" className="mh-again" onClick={reset}>
            Play the month again
          </button>
        </div>
      )}

      {config.neutrality_note && <p className="control-note">{config.neutrality_note}</p>}
    </div>
  );
}
