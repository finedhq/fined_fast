// WinterArc Day 7 Chapter 2 — "Follow Arjun's day": one Monday, three money
// moves. Each step is a route: a coin hops stop by stop while the referee
// watching that road pulses. 2.1 and 2.3 start on the reader's tap (Pay,
// Invest); 2.2 plays when reached; 2.4 lays all three routes side by side.
// Saved as state.day = {played: {routeId: true}}; a played route stays drawn.
import { useEffect, useState } from "react";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Hops the coin along once mounted.
function Hops({ stops, ms = 550 }) {
  const [at, setAt] = useState(() => (reduceMotion() ? stops.length - 1 : 0));
  useEffect(() => {
    const id = setInterval(() => setAt((x) => (x >= stops.length - 1 ? x : x + 1)), ms);
    return () => clearInterval(id);
  }, [stops.length, ms]);
  return <Stops stops={stops} at={at} />;
}

function Stops({ stops, at }) {
  return (
    <ol className="wf-route">
      {stops.map((s, k) => (
        <li key={s} className={`${k <= at ? "is-passed" : ""}${k === at ? " is-coin" : ""}`}>
          {s}
        </li>
      ))}
    </ol>
  );
}

function Route({ r, played, onPlay }) {
  return (
    <div className={`wf-route-card wf-tower--${r.tower}`}>
      <div className="wf-route-head">
        <span className="wf-clock">{r.time}</span>
        <strong>{r.label}</strong>
        <span className={`wf-ref${played ? " is-pulse" : ""}`}>{r.towerLabel}</span>
      </div>
      {played ? <Hops stops={r.stops} /> : <Stops stops={r.stops} at={-1} />}
      {!played && onPlay && (
        <button type="button" className="wf-act" onClick={onPlay}>
          {r.button}
        </button>
      )}
      {played && r.badge && <p className="wf-route-badge">{r.badge}</p>}
    </div>
  );
}

export default function RouteDay({ step, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 3);
  const d = state.day || {};
  const played = d.played || {};
  const play = (id) => onState((prev) => ({ ...prev, day: { ...(prev.day || {}), played: { ...((prev.day || {}).played || {}), [id]: true } } }));

  if (at === 3) {
    return (
      <div className="wf-figure wf-routes">
        <p className="wf-note">{c.notes[3]}</p>
        <div className="wf-route-all">
          {c.routes.map((r) => (
            <div key={r.id} className={`wf-route-row wf-tower--${r.tower}`}>
              <span className="wf-clock">{r.time}</span>
              <span>{r.label}</span>
              <strong>{r.towerLabel}</strong>
            </div>
          ))}
        </div>
        <p className="wf-out">{c.texts.counter}</p>
      </div>
    );
  }

  const r = c.routes[at];
  const auto = !r.button;
  return (
    <div className="wf-figure wf-routes">
      <p className="wf-note">{c.notes[at]}</p>
      <Route key={r.id} r={r} played={auto || !!played[r.id]} onPlay={auto ? null : () => play(r.id)} />
      {(auto || played[r.id]) && <p className="wf-out">{r.after}</p>}
    </div>
  );
}
