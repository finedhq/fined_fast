// WinterArc Day 8 Chapter 1 — "Three doors": the same ₹10,000 behind three
// doors for ten years.
//   1.1 pick a door (all three play; the pick gets a ribbon);
//   1.2 guess door 1 in today's money and lock it; then flip rupees ↔
//       today's buying power (₹13,439 → ₹7,504);
//   1.3 door 2 plays to year 5 and pauses on an 18% drop ("panic" ticker);
//   1.4 hold or sell (a 5-second ring for the feeling, not a real timer); the
//       last five years play on the pick, the other as a ghost;
//   1.5 door 3 becomes 100 dots: about 88 made a net loss (SEBI, FY26).
// Saved as state.doors = {door, guess, locked, today, choice}. Scrolling back
// above 1.4 shows the paused year-5 state; the choice is kept.
import { useState } from "react";
import { DotGrid, MiniLines, PredictMarker } from "./WaKit";
import { saver, stepAt } from "./waState";
import { fill, inr, pathValues, real, savingsValues, seededSet, sellBranch } from "./winterarcDays815Math";

export default function DoorSim({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 4);
  const s = state.doors || {};
  const save = saver(onState, "doors");
  const [clockDone, setClockDone] = useState(false);

  const years = c.path.length;
  const savings = [c.start, ...savingsValues(c.start, c.saveRate, years)];
  const hold = [c.start, ...pathValues(c.start, c.path)];
  const sell = [c.start, ...sellBranch(c.start, c.path, c.pauseAt, c.saveRate)];
  const today = !!s.today && at >= 1;
  const show = (vals) => (today ? vals.map((v, k) => real(v, c.inflation, k)) : vals);
  const atYear = (vals, k) => (today ? real(vals[k], c.inflation, k) : vals[k]);

  const lane1 = at >= 1 && s.locked ? show(savings) : [c.start];
  const lane2 = at < 2 ? [c.start] : at === 2 || !s.choice ? show(hold).slice(0, c.pauseAt + 1) : show(s.choice === "sell" ? sell : hold);
  const ghost = at >= 3 && s.choice ? show(s.choice === "sell" ? hold : sell) : null;
  const max = Math.max(...hold) * 1.05;
  const red = seededSet(100, c.losers, 8);
  const xLabels = Array.from({ length: years + 1 }, (_, k) => (k % 5 === 0 ? `yr ${k}` : ""));

  return (
    <div className="wf-figure wk-doors">
      <p className="wf-note">{c.notes[at]}</p>

      {at === 0 && (
        <div className="wk-door-row" role="group" aria-label="Pick a door">
          {c.doors.map((d) => (
            <button key={d.id} type="button" className={`wk-door${s.door === d.id ? " is-on" : ""}`} aria-pressed={s.door === d.id} onClick={() => save({ door: d.id })}>
              <span className="wk-door-num">{d.label}</span>
              <strong>{d.name}</strong>
              <small>{d.line}</small>
              {s.door === d.id && <em className="wk-ribbon">Your door</em>}
            </button>
          ))}
        </div>
      )}
      {at === 0 && <p className="wf-out">{s.door ? `${inr(c.start)} sits at the start of each lane.` : c.texts.pick}</p>}

      {at >= 1 && at <= 3 && (
        <div className={`wk-lanes${at === 2 ? " is-panic" : ""}`}>
          <div className="wk-lane-head">
            <span>
              Door 1 · savings{s.door === "save" && <em className="wk-ribbon">Your door</em>}
            </span>
            <strong>{s.locked ? inr(atYear(savings, years)) : "?"}</strong>
          </div>
          <div className="wk-lane-head">
            <span>
              Door 2 · investing{s.door === "invest" && <em className="wk-ribbon">Your door</em>}
            </span>
            <strong className={at === 2 ? "is-cost" : ""}>{at >= 2 ? inr(lane2[lane2.length - 1]) : inr(c.start)}</strong>
          </div>
          <MiniLines
            lines={[
              { id: "save", values: lane1, tone: 0, label: "1" },
              ...(ghost ? [{ id: "ghost", values: ghost, tone: 1, dashed: true, faint: true }] : []),
              { id: "invest", values: lane2, tone: at === 2 ? 3 : 1, label: "2" },
            ]}
            yMin={0}
            yMax={max}
            xLabels={xLabels}
            marker={at === 2 || (at === 3 && !s.choice) ? c.pauseAt : null}
            ariaLabel="Door 1 and door 2, year by year (made up)"
          />
          {at >= 1 && s.locked && (
            <div className="wf-seg" role="group" aria-label="Show in">
              <button type="button" className={`wf-seg-btn${!s.today ? " is-on" : ""}`} aria-pressed={!s.today} onClick={() => save({ today: false })}>
                Rupees
              </button>
              <button type="button" className={`wf-seg-btn${s.today ? " is-on" : ""}`} aria-pressed={!!s.today} onClick={() => save({ today: true })}>
                Today's buying power
              </button>
            </div>
          )}
        </div>
      )}

      {at === 1 && !s.locked && (
        <PredictMarker id="wk-door-guess" label={c.texts.guess_label} {...c.guess} value={s.guess ?? c.guess.start} onChange={(v) => save({ guess: v })} onLock={(v) => save({ guess: v, locked: true, today: false })} />
      )}
      {at === 1 && s.locked && (
        <p className="wf-out" aria-live="polite">
          {fill(c.texts.guess_result, { guess: inr(s.guess), rupees: inr(savings[years]), real: inr(real(savings[years], c.inflation, years)) })}
        </p>
      )}

      {at === 2 && (
        <>
          <div className="wk-ticker" aria-hidden="true">
            <span>{c.headlines.join("   •   ")}   •   {c.headlines.join("   •   ")}</span>
          </div>
          <p className="wf-out is-warn">{fill(c.texts.paused, { before: inr(hold[c.pauseAt - 1]), after: inr(hold[c.pauseAt]) })}</p>
        </>
      )}

      {at === 3 && !s.choice && (
        <div className="wk-panic">
          <span className="wk-clock" aria-hidden="true" onAnimationEnd={() => setClockDone(true)} style={{ "--secs": `${c.countdown}s` }} />
          <p className="wf-out is-warn">{clockDone ? c.texts.clock_done : c.texts.clock}</p>
          <div className="wf-act-row">
            <button type="button" className="wf-act" onClick={() => save({ choice: "hold" })}>
              Hold
            </button>
            <button type="button" className="wf-act wf-act--warn" onClick={() => save({ choice: "sell" })}>
              Sell and move to savings
            </button>
          </div>
        </div>
      )}
      {at === 3 && s.choice && (
        <>
          <div className="wf-meters">
            <div className={s.choice === "hold" ? "is-pick" : ""}>
              <span>Held</span>
              <strong>{inr(hold[years])}</strong>
              <small>{inr(real(hold[years], c.inflation, years))} today</small>
            </div>
            <div className={s.choice === "sell" ? "is-pick" : ""}>
              <span>Sold in year 5</span>
              <strong>{inr(sell[years])}</strong>
              <small>{inr(real(sell[years], c.inflation, years))} today</small>
            </div>
          </div>
          <p className="wf-out" aria-live="polite">
            {s.choice === "hold" ? c.texts.hold : c.texts.sell} {c.texts.both}
          </p>
          <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ choice: null })}>
            Decide again
          </button>
        </>
      )}

      {at === 4 && (
        <>
          <DotGrid n={100} cols={10} tone={(k) => (red.has(k) ? "is-red" : "")} label={`${c.losers} of 100 dots red`} />
          <p className="wf-out">{c.texts.grid}</p>
          <p className="wf-foot">{c.texts.grid_foot}</p>
        </>
      )}
    </div>
  );
}
