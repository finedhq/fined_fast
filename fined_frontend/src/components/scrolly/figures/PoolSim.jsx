// WinterArc Day 5 Chapter 1 — "The Pool": 100 students in a 10×10 grid.
//   1.1 Arjun's dot, and what one ₹2,00,000 hospital stay means to him;
//   1.2 guess each person's share (₹600 · ₹6,000 · ₹20,000 · ₹60,000); on
//       lock 3 dots turn red and the ₹6,00,000 splits into 100 coins;
//   1.3 Join (₹7,500 a year) or Go solo, then Play 5 years: the seeded years
//       hit 3 dots each, Arjun's in year 4; a counter tallies what he paid;
//   1.4 two lanes, Solo and Pool: average cost vs worst year;
//   1.5 (the day's deliberate pause) the 97 who didn't claim, labelled.
// Saved as state.pool = {guess, choice, played}. Seeded, made-up numbers.
import { useEffect, useState } from "react";
import { expectedLoss, fill, inr, poolShare } from "./winterarcDays567Math";

const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function Grid({ size, me, red = [], coins = false, protectedLabel = false }) {
  const redSet = new Set(red);
  return (
    <div className={`wf-pool-grid${coins ? " has-coins" : ""}`} role="img" aria-label={`${size} students; ${red.length} with a hospital bill${redSet.has(me) ? ", including Arjun" : ""}`}>
      {Array.from({ length: size }, (_, k) => (
        <i key={k} className={`${k === me ? "is-me" : ""}${redSet.has(k) ? " is-hit" : ""}${protectedLabel && !redSet.has(k) ? " is-safe" : ""}`} />
      ))}
    </div>
  );
}

// Plays the five seeded years once mounted (Play remounts it); skippable.
function Replay({ c, choice, onEnd }) {
  const [year, setYear] = useState(() => (reduceMotion() ? c.years.length : 1));
  useEffect(() => {
    const id = setInterval(() => setYear((y) => (y >= c.years.length ? y : y + 1)), 1600);
    return () => clearInterval(id);
  }, [c.years.length]);
  const ended = year >= c.years.length;
  useEffect(() => {
    if (ended) onEnd?.();
    // once per play: onEnd is a new function on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);
  const hitYear = c.years.findIndex((ys) => ys.includes(c.me)) + 1;
  const paid = choice === "join" ? year * c.price : year >= hitYear ? c.bill : 0;
  return (
    <>
      <div className="wf-pool-year">
        Year <strong>{year}</strong> of {c.years.length}
        {year < c.years.length && (
          <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => setYear(c.years.length)}>
            Skip
          </button>
        )}
      </div>
      <Grid size={c.size} me={c.me} red={c.years[year - 1]} />
      <p className="wf-out" aria-live="polite">
        Arjun paid <strong>{inr(paid)}</strong> so far{year >= hitYear ? (choice === "join" ? ". Year 4 hit him; the pool paid the bill." : ". Year 4 hit him; the bill was all his.") : "."}
      </p>
    </>
  );
}

export default function PoolSim({ step, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 4);
  const p = state.pool || {};
  const save = (patch) => onState((prev) => ({ ...prev, pool: { ...(prev.pool || {}), ...patch } }));
  const share = poolShare(c.sick, c.bill, c.size);
  const [run, setRun] = useState(0);
  const lastYear = c.years[c.years.length - 1];

  if (at === 0) {
    return (
      <div className="wf-figure wf-pool">
        <p className="wf-note">{c.notes[0]}</p>
        <Grid size={c.size} me={c.me} />
        <div className="wf-pool-bill">
          <strong>{inr(c.bill)}</strong>
          <span>{c.texts.bill_vs}</span>
          <div className="wf-pool-stipends" aria-hidden="true">
            {Array.from({ length: Math.ceil(c.bill / c.stipend) }, (_, k) => (
              <i key={k} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (at === 1) {
    const guess = p.guess;
    const exact = guess === share;
    const line = guess == null ? "" : exact ? c.texts.guess_exact : guess < share ? c.texts.guess_low : c.texts.guess_high;
    return (
      <div className="wf-figure wf-pool">
        <p className="wf-note">{c.notes[1]}</p>
        <Grid size={c.size} me={c.me} red={guess != null ? c.years[0] : []} coins={guess != null} />
        {guess == null ? (
          <div className="wf-seg" role="group" aria-label="Each person's share">
            {c.buckets.map((b) => (
              <button key={b} type="button" className="wf-seg-btn" onClick={() => save({ guess: b })}>
                {inr(b)}
              </button>
            ))}
          </div>
        ) : (
          <div className="wf-pool-split">
            <span>
              3 × {inr(c.bill)} = <strong>{inr(c.sick * c.bill)}</strong>
            </span>
            <span>
              ÷ {c.size} = <strong className="wf-coin-amt">{inr(share)}</strong> each
            </span>
          </div>
        )}
        {line && <p className="wf-out">{fill(line, { guess: inr(guess), share: inr(share) })}</p>}
      </div>
    );
  }

  if (at === 2) {
    return (
      <div className="wf-figure wf-pool">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wf-seg" role="group" aria-label="Join or go solo">
          {[
            ["join", `Join (${inr(c.price)} a year)`],
            ["solo", "Go solo (₹0)"],
          ].map(([id, label]) => (
            <button key={id} type="button" className={`wf-seg-btn${p.choice === id ? " is-on" : ""}`} aria-pressed={p.choice === id} onClick={() => save({ choice: id, played: false })}>
              {label}
            </button>
          ))}
        </div>
        {p.choice && run > 0 ? (
          // playing (or just played) in this visit
          <Replay key={`${p.choice}-${run}`} c={c} choice={p.choice} onEnd={() => save({ played: true })} />
        ) : p.played ? (
          // came back later: the finished year, not a re-run
          <Grid size={c.size} me={c.me} red={c.years[c.years.findIndex((ys) => ys.includes(c.me))]} />
        ) : (
          <Grid size={c.size} me={c.me} />
        )}
        {p.choice && (p.played ? <p className="wf-out">{p.choice === "join" ? c.texts.result_join : c.texts.result_solo}</p> : null)}
        {p.choice && (
          <button type="button" className={`wf-act${p.played ? " wf-act--ghost" : ""}`} onClick={() => setRun((r) => r + 1)}>
            {p.played || run > 0 ? "Play again" : "Play 5 years"}
          </button>
        )}
      </div>
    );
  }

  if (at === 3) {
    const avgSolo = expectedLoss(c.sick, c.size, c.bill, c.years.length);
    const lanes = [
      { id: "solo", label: "Solo", avg: avgSolo, worst: c.bill },
      { id: "join", label: "Pool", avg: c.price * c.years.length, worst: c.price },
    ];
    return (
      <div className="wf-figure wf-pool">
        <p className="wf-note">{c.notes[3]}</p>
        <div className="wf-lanes">
          {lanes.map((l) => (
            <div key={l.id} className={`wf-lane${p.choice === l.id ? " is-mine" : ""}`}>
              <div className="wf-lane-name">
                {l.label}
                {p.choice === l.id && <small>your pick</small>}
              </div>
              <div className="wf-lane-row">
                <span>Average cost, 5 years</span>
                <strong>{inr(l.avg)}</strong>
              </div>
              <div className="wf-lane-row is-worst">
                <span>Worst single year</span>
                <strong>{inr(l.worst)}</strong>
              </div>
            </div>
          ))}
        </div>
        <p className="wf-out">{c.texts.honest}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure wf-pool">
      <p className="wf-note">{c.notes[4]}</p>
      <Grid size={c.size} me={c.me} red={lastYear} protectedLabel />
      <p className="wf-out">{c.texts.protected}</p>
    </div>
  );
}
