// WinterArc Day 3 Chapter 1 — "thali": inflation shown on one plate and one
// ₹100 note instead of a chart, with something to do at every step.
//   1.1 flip Last year / This year: the price tag goes ₹100 → ₹105 and the
//       plate loses the slice the note can no longer pay for;
//   1.2 set a price tag for 10 years on (− / +), lock it, then see the real
//       ₹163, each year's tag laid out, and the gap to the guess;
//   1.3 Arjun's ₹10,000 as 100 thalis; after the step's guess, "After a year"
//       shows ₹10,300 buying 98 (2 fade out);
//   1.4 a dial for the RBI's real 2%–6% band: move the needle, it says
//       inside or outside the band.
// Saved as state.thali = {year, guess, locked, after, needle}. Every price
// and rate is made up except the RBI band, and the figure says which.
import { inr, priceAfter, thalisFor } from "./winterarcFigureMath";

const fill = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));

function Plate({ share, price, label }) {
  const pct = Math.max(0, Math.min(1, share)) * 100;
  return (
    <div className="wf-plate-wrap">
      <div className="wf-plate" style={{ "--share": `${pct}%` }} role="img" aria-label={`${label}: the ₹100 note pays for ${Math.round(pct)}% of a thali costing ${inr(price)}`}>
        <span className="wf-plate-inner" />
      </div>
      <span className="wf-tag">{inr(price)}</span>
    </div>
  );
}

function Stepper({ label, value, text, min, max, step, onChange, less, more }) {
  return (
    <div className="wf-stepper">
      <span className="wf-stepper-label">{label}</span>
      <button type="button" className="stepper-btn" aria-label={less} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))}>
        −
      </button>
      <strong>{text}</strong>
      <button type="button" className="stepper-btn" aria-label={more} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))}>
        +
      </button>
    </div>
  );
}

export default function ThaliPlate({ step, steps, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 3);
  const t = state.thali || {};
  const save = (patch) => onState((prev) => ({ ...prev, thali: { ...(prev.thali || {}), ...patch } }));
  const guessed = state.guesses?.[steps?.[at]?.step_id] !== undefined;
  const tags = Array.from({ length: c.years + 1 }, (_, y) => Math.round(priceAfter(c.price, c.rate, y)));
  const future = tags[c.years];

  if (at === 0) {
    const year = t.year || "last";
    const price = year === "last" ? c.price : tags[1];
    return (
      <div className="wf-figure wf-thali">
        <p className="wf-note">{c.notes[0]}</p>
        <div className="wf-seg" role="group" aria-label="Which year">
          {[
            ["last", "Last year"],
            ["this", "This year"],
          ].map(([id, label]) => (
            <button key={id} type="button" className={`wf-seg-btn${year === id ? " is-on" : ""}`} aria-pressed={year === id} onClick={() => save({ year: id })}>
              {label}
            </button>
          ))}
        </div>
        <div className="wf-thali-row">
          <div className="wf-note100" aria-hidden="true">
            ₹100
          </div>
          <Plate share={c.price / price} price={price} label={year === "last" ? "Last year" : "This year"} />
        </div>
        <p className="wf-out">{year === "last" ? c.texts.last : fill(c.texts.this, { short: inr(price - c.price) })}</p>
      </div>
    );
  }

  if (at === 1) {
    const guess = t.guess ?? c.guess.start;
    const gap = future - guess;
    const feedback = Math.abs(gap) <= c.guess.step / 2 ? c.texts.exact : gap > 0 ? c.texts.under : c.texts.over;
    return (
      <div className="wf-figure wf-thali">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wf-thali-row">
          <div className="wf-tag-big is-guess">
            <small>Your guess</small>
            {inr(guess)}
          </div>
          {t.locked && (
            <div className="wf-tag-big is-real">
              <small>In {c.years} years</small>
              {inr(future)}
            </div>
          )}
        </div>
        {t.locked ? (
          <>
            <ol className="wf-tags" aria-label="The price each year">
              {tags.map((p, y) => (
                <li key={y} style={{ animationDelay: `${y * 70}ms` }} className={y === c.years ? "is-last" : ""}>
                  <small>{y === 0 ? "Now" : `Yr ${y}`}</small>
                  {p}
                </li>
              ))}
            </ol>
            <p className="wf-out">{fill(feedback, { guess: inr(guess), answer: inr(future), gap: inr(Math.abs(gap)) })}</p>
          </>
        ) : (
          <div className="wf-act-row">
            <Stepper
              label="Price tag"
              value={guess}
              text={inr(guess)}
              min={c.guess.min}
              max={c.guess.max}
              step={c.guess.step}
              onChange={(v) => save({ guess: v })}
              less={`Lower, by ${inr(c.guess.step)}`}
              more={`Higher, by ${inr(c.guess.step)}`}
            />
            <button type="button" className="wf-act" onClick={() => save({ guess, locked: true })}>
              Lock my guess
            </button>
          </div>
        )}
      </div>
    );
  }

  if (at === 2) {
    const after = guessed && !!t.after;
    const price = after ? tags[1] : c.price;
    const money = after ? c.savings * (1 + c.saverRate / 100) : c.savings;
    const count = thalisFor(money, price);
    const total = thalisFor(c.savings, c.price);
    return (
      <div className="wf-figure wf-thali">
        <p className="wf-note">{c.notes[2]}</p>
        {guessed && (
          <div className="wf-seg" role="group" aria-label="When">
            {[
              [false, "Today"],
              [true, "After a year"],
            ].map(([id, label]) => (
              <button key={label} type="button" className={`wf-seg-btn${after === id ? " is-on" : ""}`} aria-pressed={after === id} onClick={() => save({ after: id })}>
                {label}
              </button>
            ))}
          </div>
        )}
        <div className="wf-grid-head">
          <span>
            Arjun has <strong>{inr(money)}</strong>
          </span>
          <span>
            Thali <strong>{inr(price)}</strong>
          </span>
        </div>
        <div className="wf-grid" role="img" aria-label={`${inr(money)} buys ${count} thalis at ${inr(price)}`}>
          {Array.from({ length: total }, (_, k) => (
            <i key={k} className={k < count ? "" : "is-gone"} />
          ))}
        </div>
        <p className="wf-out">{after ? fill(c.texts.after, { count, lost: total - count }) : guessed ? c.texts.today_after_guess : c.texts.today}</p>
      </div>
    );
  }

  // at === 3: the RBI's band (real), with a needle the reader moves
  const needle = t.needle ?? c.band.target;
  const angle = (needle / c.band.max) * 180 - 90;
  const arc = (from, to) => {
    const p = (v) => {
      const a = Math.PI - (v / c.band.max) * Math.PI;
      return `${60 + 50 * Math.cos(a)},${60 - 50 * Math.sin(a)}`;
    };
    return `M ${p(from)} A 50 50 0 0 1 ${p(to)}`;
  };
  const where = needle < c.band.low ? c.texts.below : needle > c.band.high ? c.texts.above : needle === c.band.target ? c.texts.target : c.texts.inside;
  return (
    <div className="wf-figure wf-thali">
      <p className="wf-note">{c.notes[3]}</p>
      <svg className="wf-gauge" viewBox="0 0 120 70" role="img" aria-label={`Inflation ${needle}%. ${where}`}>
        <path d={arc(0, c.band.max)} className="wf-gauge-track" />
        <path d={arc(c.band.low, c.band.high)} className="wf-gauge-band" />
        <line x1="60" y1="60" x2="60" y2="16" className="wf-gauge-needle" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "60px 60px" }} />
        <circle cx="60" cy="60" r="4" className="wf-gauge-hub" />
        <text x="10" y="68" className="wf-gauge-lbl">0%</text>
        <text x="110" y="68" textAnchor="end" className="wf-gauge-lbl">{c.band.max}%</text>
      </svg>
      <Stepper label="Inflation" value={needle} text={`${needle}%`} min={0} max={c.band.max} step={1} onChange={(v) => save({ needle: v })} less="One point lower" more="One point higher" />
      <p className={`wf-out${needle < c.band.low || needle > c.band.high ? " is-warn" : ""}`}>{where}</p>
    </div>
  );
}
