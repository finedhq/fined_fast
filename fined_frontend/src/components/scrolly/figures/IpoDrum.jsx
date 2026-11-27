// WinterArc Day 10 Chapter 2 — "The IPO lottery".
//   2.1 a lane toggle: IPO day (rupees go to the company) / any day after
//       listing (rupees go to another investor);
//   2.2 pick 1 or 5 lots, tap Apply: the subscription meter races to 15×;
//   2.3 the reader's application is one ball among 15 whatever the lots; the
//       drum spins (or skip) and, by seed, another ball wins;
//   2.4 the drum folds into a made-up listing-day line that wobbles both ways.
// Saved as state.ipo = {lane, lots, applied, drawn}.
import { MiniLines, Seg } from "./WaKit";

// no spin animation (so no animationend) when motion is reduced
const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
import { saver, stepAt } from "./waState";

export default function IpoDrum({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.ipo || {};
  const save = saver(onState, "ipo");
  const lots = s.lots || 1;

  if (at === 0) {
    const lane = s.lane || "ipo";
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <Seg label="When you buy" value={lane} onPick={(v) => save({ lane: v })} options={[{ id: "ipo", label: "IPO day" }, { id: "after", label: "Any day after listing" }]} />
        <div className={`wk-flow wk-flow--${lane}`} aria-live="polite">
          <span className="wk-flow-end">🧑 You</span>
          <span className="wk-flow-coins" aria-hidden="true">
            ₹ ₹ ₹
          </span>
          <span className="wk-flow-end">{lane === "ipo" ? `🛵 ${c.company}` : "🧑‍💼 Another investor"}</span>
        </div>
        <p className="wf-out">{lane === "ipo" ? c.texts.lane_ipo : c.texts.lane_after}</p>
      </div>
    );
  }

  if (at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <Seg label="Lots" value={lots} onPick={(v) => save({ lots: v })} options={[{ id: 1, label: "1 lot" }, { id: 5, label: "5 lots" }]} />
        <button type="button" className="wf-act" disabled={s.applied} onClick={() => save({ applied: true })}>
          {s.applied ? `Applied for ${lots} lot${lots > 1 ? "s" : ""}` : c.texts.apply}
        </button>
        <div className="wk-meter" role="img" aria-label={s.applied ? `Subscribed ${c.times} times` : "Subscription meter"}>
          <div className={`wk-meter-fill${s.applied ? " is-on" : ""}`} />
          {c.meter.map((m) => (
            <span key={m} className="wk-meter-tick" style={{ left: `${(m / c.times) * 100}%` }}>
              {m}×
            </span>
          ))}
        </div>
        <p className="wf-out" aria-live="polite">{s.applied ? c.texts.applied : "Pick your lots, then apply."}</p>
      </div>
    );
  }

  if (at === 2) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className={`wk-drum${s.spinning ? " is-spin" : ""}`} onAnimationEnd={() => save({ spinning: false, drawn: true })} role="img" aria-label={s.drawn ? "Another ball won" : "15 balls in a drum, one is yours"}>
          {Array.from({ length: c.balls }, (_, k) => (
            <i key={k} className={`wk-ball${k === 0 ? " is-me" : ""}${s.drawn && k === c.winner ? " is-win" : ""}`} style={{ "--k": k }}>
              {k === 0 ? "You" : ""}
            </i>
          ))}
        </div>
        {!s.applied ? (
          <p className="wf-out">{c.texts.pick_first}</p>
        ) : !s.drawn ? (
          <div className="wf-act-row">
            <button type="button" className="wf-act" disabled={s.spinning} onClick={() => save(reduced() ? { drawn: true } : { spinning: true })}>
              🎡 {c.texts.spin}
            </button>
            <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ spinning: false, drawn: true })}>
              {c.texts.skip}
            </button>
          </div>
        ) : (
          <p className="wf-out is-warn" aria-live="polite">
            {lots > 1 ? c.texts.lost5 : c.texts.lost1} {c.texts.both}
          </p>
        )}
        <p className="wf-foot">{s.applied ? `You applied for ${lots} lot${lots > 1 ? "s" : ""}: still one ball.` : "Made-up IPO numbers."}</p>
      </div>
    );
  }

  const values = [c.ipoPrice, ...c.listing];
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <MiniLines
        lines={[
          { id: "ipo", values: values.map(() => c.ipoPrice), tone: 0, dashed: true, label: `IPO price ₹${c.ipoPrice}` },
          { id: "price", values, tone: 1, label: "Market price" },
        ]}
        yMin={94}
        yMax={110}
        xLabels={["IPO", "Open", ...c.listing.slice(1).map(() => "")]}
        ariaLabel="A made-up listing-day price that wobbles above and below its open"
      />
      <p className="wf-out">{c.texts.listing}</p>
      <p className="wf-foot">Made-up prices, no direction implied.</p>
    </div>
  );
}
