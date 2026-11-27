// WinterArc Day 12 Chapter 1 — "The monthly habit".
//   1.1 a 12-month NAV line (100 → 70 → 110) with a bucket of units under each
//       month: ₹1,000 ÷ that month's NAV, low months fill taller buckets;
//   1.2 month 3, NAV ₹80 and falling, the crowd mood meter at "Fear":
//       Keep the SIP or Pause for four months; the year finishes on the pick
//       with the other as a ghost (₹14,271 vs ₹8,728);
//   1.3 the reader guesses on the card; then lump sum ₹13,200 vs SIP ₹14,271;
//   1.4 "Play a rising year": lump sum ₹18,600 vs SIP ₹14,865.
// Saved as state.sip = {choice, rising}.
import { CoinStack, MiniLines } from "./WaKit";
import { saver, stepAt } from "./waState";
import { inr, lumpRun, sipRun } from "./winterarcDays815Math";

const u1 = (v) => v.toFixed(1).replace(/\.0$/, "");

function Buckets({ navs, amount, skip = [], months, upto = navs.length }) {
  const max = amount / Math.min(...navs);
  return (
    <div className="wk-buckets" role="img" aria-label="Units bought each month">
      {navs.map((n, k) => {
        const off = skip.includes(k) || k >= upto;
        const u = amount / n;
        return (
          <span key={k} className={`wk-bucket-col${off ? " is-off" : ""}`}>
            <i style={{ height: `${off ? 4 : (u / max) * 100}%` }} />
            <small>{off ? "–" : u1(u)}</small>
            <b>{months[k][0]}</b>
          </span>
        );
      })}
    </div>
  );
}

function Mood({ m }) {
  return (
    <div className="wk-mood" role="img" aria-label={`Crowd mood: ${m.label}`}>
      <span aria-hidden="true">{m.face}</span>
      <div className="wk-mood-bar">
        <i style={{ width: `${m.fear}%` }} />
      </div>
      <small>Crowd mood: {m.label}</small>
    </div>
  );
}

export default function SipSim({ step, steps, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.sip || {};
  const save = saver(onState, "sip");
  const keep = sipRun(c.navs, c.amount);
  const pause = sipRun(c.navs, c.amount, c.pause);
  const lump = lumpRun(c.navs, c.amount * c.navs.length);

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <MiniLines lines={[{ id: "nav", values: c.navs, tone: 1, label: "NAV" }]} yMin={60} yMax={120} xLabels={c.months.map((m, k) => (k % 3 ? "" : m))} ariaLabel="NAV falls from ₹100 to ₹70, then climbs to ₹110" height={120} />
        <Buckets navs={c.navs} amount={c.amount} months={c.months} />
        <p className="wf-out">{c.texts.buckets}</p>
        <p className="wf-foot">{c.texts.foot}</p>
      </div>
    );
  }

  if (at === 1) {
    if (!s.choice) {
      const shown = c.navs.slice(0, c.decideAt + 1);
      return (
        <div className="wf-figure">
          <p className="wf-note">{c.notes[1]}</p>
          <div className="wk-ticker" aria-hidden="true">
            {c.headlines.map((h) => (
              <span key={h}>📉 {h}</span>
            ))}
          </div>
          <MiniLines lines={[{ id: "nav", values: shown, tone: 3, label: `₹${shown[shown.length - 1]}` }]} yMin={60} yMax={120} xLabels={c.months.slice(0, shown.length)} ariaLabel="NAV falling for three months" height={110} />
          <Mood m={c.mood[c.mood.length - 1]} />
          <div className="wf-act-row">
            <button type="button" className="wf-act" onClick={() => save({ choice: "keep" })}>
              {c.texts.keep}
            </button>
            <button type="button" className="wf-act wf-act--warn" onClick={() => save({ choice: "pause" })}>
              {c.texts.pause}
            </button>
          </div>
        </div>
      );
    }
    const mine = s.choice === "keep" ? keep : pause;
    const other = s.choice === "keep" ? pause : keep;
    return (
      <div className="wf-figure">
        <p className="wf-note">You chose: {s.choice === "keep" ? c.texts.keep : c.texts.pause}.</p>
        <MiniLines lines={[{ id: "nav", values: c.navs, tone: 1, label: "NAV" }]} yMin={60} yMax={120} xLabels={c.months.map((m, k) => (k % 3 ? "" : m))} ariaLabel="The full year" height={110} />
        <Buckets navs={c.navs} amount={c.amount} months={c.months} skip={s.choice === "pause" ? c.pause : []} />
        <div className="wk-coin-row">
          <CoinStack value={mine.value} max={keep.value * 1.1} label={inr(mine.value)} caption={`Yours: ${inr(mine.paid)} in`} tone="gold" />
          <CoinStack value={other.value} max={keep.value * 1.1} label={inr(other.value)} caption={`${s.choice === "keep" ? "Pause" : "Keep"}: ${inr(other.paid)} in`} tone="purple" ghost />
        </div>
        <p className={`wf-out${s.choice === "pause" ? " is-warn" : ""}`} aria-live="polite">
          {s.choice === "keep" ? c.texts.kept : c.texts.paused} Gain: {inr(mine.value - mine.paid)}.
        </p>
        <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={() => save({ choice: null })}>
          Replay month 3
        </button>
      </div>
    );
  }

  if (at === 2) {
    const guessed = state.guesses?.[steps?.[2]?.step_id] !== undefined;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wk-coin-row">
          <CoinStack value={guessed ? lump.value : 12000} max={keep.value * 1.1} label={guessed ? inr(lump.value) : "?"} caption={`Lump sum: ${lump.units.toFixed(0)} units at ₹${c.navs[0]}`} tone="purple" />
          <CoinStack value={guessed ? keep.value : 12000} max={keep.value * 1.1} label={guessed ? inr(keep.value) : "?"} caption={`SIP: ${keep.units.toFixed(2)} units, average ₹${keep.avgCost.toFixed(2)}`} tone="gold" />
        </div>
        <p className="wf-out" aria-live="polite">{guessed ? c.texts.lump : c.texts.guess_first}</p>
      </div>
    );
  }

  const rs = sipRun(c.rising, c.amount);
  const rl = lumpRun(c.rising, c.amount * c.rising.length);
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      {s.rising ? (
        <>
          <MiniLines lines={[{ id: "nav", values: c.rising, tone: 2, label: "NAV" }]} yMin={90} yMax={160} xLabels={c.months.map((m, k) => (k % 3 ? "" : m))} ariaLabel="NAV rises from ₹100 to ₹155" height={110} />
          <div className="wk-coin-row">
            <CoinStack value={rl.value} max={rl.value * 1.05} label={inr(rl.value)} caption="Lump sum" tone="purple" />
            <CoinStack value={rs.value} max={rl.value * 1.05} label={inr(rs.value)} caption={`SIP: ${rs.units.toFixed(2)} units`} tone="gold" />
          </div>
          <p className="wf-out" aria-live="polite">{c.texts.rising}</p>
        </>
      ) : (
        <button type="button" className="wf-act" onClick={() => save({ rising: true })}>
          ▶ {c.texts.play}
        </button>
      )}
      <p className="wf-foot">{c.texts.foot}</p>
    </div>
  );
}
