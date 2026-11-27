// WinterArc Day 7 Chapter 3 — "Complaint Router": route tickets up an
// escalation ladder. For each ticket the reader fills Rung 1 ("complain
// to…") and Rung 2 ("if that fails, go to…") from destination chips, then
// taps Send. Skipping the company comes back stamped "Not yet"; for the
// unregistered WhatsApp scheme every regulator answers "Not registered with
// us". Steps: 3.1 ticket 1 · 3.2 tickets 2 and 3 · 3.3 the three ladders and
// their clocks (tap to open) · 3.4 ticket 4 · 3.5 ticket 5 · 3.6 the desk.
// Saved as state.desk = {[ticketId]: {r1, r2, tries, solved, first}, open}.
import { fill, routeTicket } from "./winterarcDays567Math";

function Ticket({ t, chips, s, onChange }) {
  const r1 = s.r1;
  const r2 = s.r2;
  const active = s.active || (r1 ? 2 : 1);
  const label = (id) => chips.find((ch) => ch.id === id)?.label;
  const result = s.last;
  // filling a rung moves on to Rung 2 (tap a rung to change it)
  const setRung = (n, id) => onChange({ [`r${n}`]: id, active: 2, last: null });
  return (
    <div className={`wf-ticket${s.solved ? " is-solved" : ""}`}>
      <div className="wf-ticket-head">
        <span>{t.label}</span>
        {s.solved && <em>{s.first ? "Right first time" : "Routed"}</em>}
      </div>
      <p className="wf-ticket-text">{t.text}</p>
      <div className="wf-rungs">
        {[1, 2].map((n) => (
          <button key={n} type="button" className={`wf-rung${active === n && !s.solved ? " is-active" : ""}${(n === 1 ? r1 : r2) ? " is-filled" : ""}`} disabled={s.solved} onClick={() => onChange({ active: n, last: null })}>
            <small>{n === 1 ? "Rung 1: complain to…" : "Rung 2: if that fails…"}</small>
            {label(n === 1 ? r1 : r2) || "Tap, then pick below"}
          </button>
        ))}
      </div>
      {!s.solved && (
        <>
          <div className="wf-chips" role="group" aria-label="Destinations">
            {chips.map((ch) => (
              <button key={ch.id} type="button" className="wf-chip" onClick={() => setRung(active, ch.id)}>
                {ch.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="wf-act"
            disabled={!r1 || !r2}
            onClick={() => {
              const res = routeTicket(t, r1, r2);
              const tries = (s.tries || 0) + 1;
              onChange({ tries, last: res, solved: res.ok, first: res.ok && tries === 1 });
            }}
          >
            Send
          </button>
        </>
      )}
      {result?.bounce && (
        <p className="wf-out is-warn">
          <strong className="wf-bounce">{result.bounce}</strong> {result.line}
        </p>
      )}
      {s.solved && <p className="wf-out">{t.feedback.right}</p>}
    </div>
  );
}

export default function ComplaintDesk({ step, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 5);
  const desk = state.desk || {};
  const update = (id) => (patch) => onState((prev) => ({ ...prev, desk: { ...(prev.desk || {}), [id]: { ...((prev.desk || {})[id] || {}), ...patch } } }));
  const ticket = (id) => c.tickets.find((t) => t.id === id);
  const onStep = [["t1"], ["t2", "t3"], null, ["t4"], ["t5"], null][at];

  if (at === 2) {
    const open = desk.open;
    return (
      <div className="wf-figure wf-desk">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wf-ladders">
          {c.ladders.map((l) => (
            <button key={l.id} type="button" className={`wf-ladder wf-tower--${l.tower}${open === l.id ? " is-open" : ""}`} aria-expanded={open === l.id} onClick={() => onState((prev) => ({ ...prev, desk: { ...(prev.desk || {}), open: open === l.id ? null : l.id } }))}>
              <strong>{l.label}</strong>
              <ol>
                {(open === l.id ? l.rungs : l.rungs.slice(0, 2)).map((r) => (
                  <li key={r.step}>
                    <span>{r.step}</span>
                    {r.clock && <em>{r.clock}</em>}
                  </li>
                ))}
              </ol>
              {open !== l.id && l.rungs.length > 2 && <small>Tap for all {l.rungs.length} rungs</small>}
            </button>
          ))}
        </div>
        <p className="wf-out">{c.texts.clocks}</p>
      </div>
    );
  }

  if (at === 5) {
    const solved = c.tickets.filter((t) => desk[t.id]?.solved);
    const first = c.tickets.filter((t) => desk[t.id]?.first).length;
    const skipped = c.tickets.some((t) => (desk[t.id]?.tries || 0) > 1);
    return (
      <div className="wf-figure wf-desk">
        <p className="wf-note">{c.notes[5]}</p>
        <ul className="wf-board">
          {c.tickets.map((t) => (
            <li key={t.id} className={desk[t.id]?.first ? "is-first" : desk[t.id]?.solved ? "is-solved" : ""}>
              <span>{t.short}</span>
              <em>{desk[t.id]?.first ? "Right first time" : desk[t.id]?.solved ? "Bounced, then routed" : "Not routed"}</em>
            </li>
          ))}
        </ul>
        <div className="wf-kit">
          <strong>Complaint kit</strong>
          {c.kit.map((k) => (
            <span key={k}>{k}</span>
          ))}
        </div>
        <p className="wf-out">
          {fill(c.texts.desk_score, { n: first, of: c.tickets.length })}
          {skipped ? ` ${c.texts.rule}` : ""}
          {solved.length < c.tickets.length ? ` ${c.texts.unrouted}` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="wf-figure wf-desk">
      <p className="wf-note">{c.notes[at]}</p>
      {onStep.map((id) => (
        <Ticket key={id} t={ticket(id)} chips={c.chips} s={desk[id] || {}} onChange={update(id)} />
      ))}
    </div>
  );
}
