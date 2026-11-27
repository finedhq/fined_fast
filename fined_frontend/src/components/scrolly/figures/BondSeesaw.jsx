// WinterArc Day 13 Chapter 2 — "The seesaw": rates up, prices down.
//   2.1 the reader's 7% bond card next to a fresh 8% card;
//   2.2 the haggle: set an asking price (₹9,000 to ₹10,500, ₹50 snaps), offer
//       it; five buyers walk to the 8% bond above ₹9,600, buy at or below;
//   2.3 a maturity switch (1 · 5 · 10 years): the seesaw tilts further for
//       longer bonds (₹9,907 · ₹9,601 · ₹9,329);
//   2.4 the rate lever (8% · 7% · 6%): at 6% the seesaw tips the other way.
// Saved as state.seesaw = {ask, offered, years, rate}.
import { Seg } from "./WaKit";
import { saver, stepAt } from "./waState";
import { bondPrice, fill, inr } from "./winterarcDays815Math";

function Seesaw({ price, face }) {
  const tilt = Math.max(-14, Math.min(14, ((face - price) / face) * 160));
  return (
    <div className="wk-seesaw" role="img" aria-label={`Bond price ${inr(price)}`}>
      <div className="wk-seesaw-beam" style={{ transform: `rotate(${tilt}deg)` }}>
        <span>Rate</span>
        <span>{inr(price)}</span>
      </div>
      <i className="wk-seesaw-pivot" />
    </div>
  );
}

export default function BondSeesaw({ step, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.seesaw || {};
  const save = saver(onState, "seesaw");
  const price = (years, y) => bondPrice({ face: c.face, coupon: c.coupon, years, yieldPct: y });
  const fair = price(c.years, c.newRate);

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wk-two">
          <div className="wk-bondcard">
            <small>Arjun's bond</small>
            <strong>{c.coupon}%</strong>
            <span>{c.years} years · {inr(c.face)}</span>
          </div>
          <div className="wk-bondcard is-fresh">
            <small>New bond</small>
            <strong>{c.newRate}%</strong>
            <span>{c.years} years · {inr(c.face)}</span>
          </div>
        </div>
        <p className="wf-out">Same length, same face value. The new one pays ₹{(c.face * c.newRate) / 100} a year; Arjun's pays ₹{(c.face * c.coupon) / 100}.</p>
      </div>
    );
  }

  if (at === 1) {
    const ask = s.ask ?? c.face;
    const sold = s.offered && ask <= c.price.accept;
    const set = (v) => save({ ask: Math.max(c.price.min, Math.min(c.price.max, v)), offered: false });
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wf-guess">
          <label className="wf-guess-label" htmlFor="wk-ask">
            Your asking price <strong>{inr(ask)}</strong>
          </label>
          <div className="wf-act-row">
            <button type="button" className="stepper-btn" aria-label="Lower" onClick={() => set(ask - c.price.step)}>
              −
            </button>
            <input id="wk-ask" type="range" min={c.price.min} max={c.price.max} step={c.price.step} value={ask} onChange={(e) => set(Number(e.target.value))} />
            <button type="button" className="stepper-btn" aria-label="Higher" onClick={() => set(ask + c.price.step)}>
              +
            </button>
          </div>
          <button type="button" className="wf-act" onClick={() => save({ ask, offered: true })}>
            {c.texts.offer}
          </button>
        </div>
        <div className={`wk-buyers${s.offered ? (sold ? " is-sold" : " is-gone") : ""}`} aria-hidden="true">
          {c.buyers.map((b, k) => (
            <span key={k} style={{ "--k": k }}>
              {b}
              {s.offered && !sold && k === 0 && <small>{c.texts.refuse}</small>}
            </span>
          ))}
        </div>
        {s.offered && (
          <p className={`wf-out${sold ? "" : " is-warn"}`} aria-live="polite">
            {fill(sold ? c.texts.sold : c.texts.refused, { ask: inr(ask) })}
          </p>
        )}
      </div>
    );
  }

  if (at === 2) {
    const years = c.maturities.includes(s.years) ? s.years : c.years;
    const p = price(years, c.newRate);
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <Seg label="Years left" value={years} onPick={(v) => save({ years: v })} options={c.maturities.map((m) => ({ id: m, label: `${m} year${m > 1 ? "s" : ""}` }))} />
        <Seesaw price={p} face={c.face} />
        <div className="wf-meters">
          {c.maturities.map((m) => (
            <span key={m} className={m === years ? "is-on" : ""}>
              {m}y: <strong>{inr(price(m, c.newRate))}</strong>
            </span>
          ))}
        </div>
        <p className="wf-out">{c.texts.longer}</p>
      </div>
    );
  }

  const rate = [c.newRate, c.coupon, c.lowRate].includes(s.rate) ? s.rate : c.newRate;
  const years = c.maturities.includes(s.years) ? s.years : c.years;
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <Seg label="Rate on new bonds" value={rate} onPick={(v) => save({ rate: v })} options={[c.newRate, c.coupon, c.lowRate].map((r) => ({ id: r, label: `${r}%` }))} />
      <Seesaw price={price(years, rate)} face={c.face} />
      <div className="wf-meters">
        {c.maturities.map((m) => (
          <span key={m}>
            {m}y: <strong>{inr(price(m, rate))}</strong>
          </span>
        ))}
      </div>
      <p className="wf-out" aria-live="polite">{rate === c.lowRate ? c.texts.fall : rate === c.coupon ? "At 7% the old bond is worth exactly its face value." : `At ${rate}%, about ${inr(fair)} for 5 years.`}</p>
      <p className="wf-out">{c.texts.hold}</p>
    </div>
  );
}
