// Small shared pieces for the WinterArc Day 8–15 figures: the predict marker
// (guess on a slider, then lock it, as in Day 5's Claim Machine), a dot grid,
// a riskometer dial, a mini line chart and a coin stack. Every control works
// by tap (no drag needed), so nothing fights the page scroll.
import { inr } from "./winterarcDays567Math";

/** Guess a number with − / + or the slider, then lock it. Controlled. */
export function PredictMarker({ id, label, min, max, step, value, onChange, onLock, format = inr, lockLabel = "Lock my guess" }) {
  const v = value ?? Math.round((min + max) / 2 / step) * step;
  return (
    <div className="wf-guess">
      <label className="wf-guess-label" htmlFor={id}>
        {label} <strong>{format(v)}</strong>
      </label>
      <div className="wf-act-row">
        <button type="button" className="stepper-btn" aria-label="Less" onClick={() => onChange(Math.max(min, v - step))}>
          −
        </button>
        <input id={id} type="range" min={min} max={max} step={step} value={v} onChange={(e) => onChange(Number(e.target.value))} />
        <button type="button" className="stepper-btn" aria-label="More" onClick={() => onChange(Math.min(max, v + step))}>
          +
        </button>
      </div>
      <button type="button" className="wf-act" onClick={() => onLock(v)}>
        {lockLabel}
      </button>
    </div>
  );
}

/** n dots; `tone(k)` gives each dot's class ("is-red", "is-me", …). */
export function DotGrid({ n = 100, cols = 10, tone = () => "", label }) {
  return (
    <div className="wk-dots" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }} role="img" aria-label={label}>
      {Array.from({ length: n }, (_, k) => (
        <i key={k} className={tone(k)} style={{ animationDelay: `${(k % cols) * 25 + Math.floor(k / cols) * 25}ms` }} />
      ))}
    </div>
  );
}

const LEVELS = ["Low", "Low to Moderate", "Moderate", "Moderately High", "High", "Very High"];

/** SEBI's six-level riskometer. `level` 0–5 or null; `onPick` makes it tappable. */
export function Riskometer({ level, onPick, labels = LEVELS, caption }) {
  const angle = level == null ? -90 : -75 + level * 30;
  const arc = (k) => {
    const a0 = (Math.PI * (180 - k * 30)) / 180;
    const a1 = (Math.PI * (180 - (k + 1) * 30)) / 180;
    const p = (a, r) => `${100 + r * Math.cos(a)} ${100 - r * Math.sin(a)}`;
    return `M ${p(a0, 86)} A 86 86 0 0 1 ${p(a1, 86)} L ${p(a1, 52)} A 52 52 0 0 0 ${p(a0, 52)} Z`;
  };
  return (
    <div className="wk-risk">
      <svg viewBox="0 0 200 112" className="wk-risk-dial" role="img" aria-label={level == null ? "Riskometer" : `Riskometer: ${labels[level]}`}>
        {labels.map((l, k) => (
          <path key={l} d={arc(k)} className={`wk-risk-seg wk-risk-seg--${k}${level === k ? " is-on" : ""}`} />
        ))}
        <line x1="100" y1="100" x2="100" y2="30" className="wk-risk-needle" style={{ transform: `rotate(${angle}deg)`, transformOrigin: "100px 100px" }} />
        <circle cx="100" cy="100" r="7" className="wf-gauge-hub" />
      </svg>
      {onPick && (
        <div className="wk-risk-picks" role="group" aria-label="Pick a level">
          {labels.map((l, k) => (
            <button key={l} type="button" className={`wf-seg-btn wf-act--sm${level === k ? " is-on" : ""}`} aria-pressed={level === k} onClick={() => onPick(k)}>
              {l}
            </button>
          ))}
        </div>
      )}
      {caption && <p className="wf-foot wk-center">{caption}</p>}
    </div>
  );
}

/**
 * A small line chart: lines = [{id, values, tone, dashed, faint, label}],
 * values from x = 0. Optional y range, x labels, a pause marker.
 */
export function MiniLines({ lines, yMin, yMax, xLabels, height = 150, marker, ariaLabel, zero }) {
  const all = lines.flatMap((l) => l.values);
  const lo = yMin ?? Math.min(...all);
  const hi = yMax ?? Math.max(...all);
  const n = Math.max(...lines.map((l) => l.values.length)) - 1 || 1;
  const W = 300;
  const H = 120;
  const x = (k) => 8 + (k / n) * (W - 70);
  const y = (v) => 8 + (1 - (v - lo) / (hi - lo || 1)) * (H - 16);
  return (
    <svg viewBox={`0 0 ${W} ${H + 14}`} className="wk-lines" style={{ height }} role="img" aria-label={ariaLabel}>
      {zero != null && <line x1="8" x2={W - 62} y1={y(zero)} y2={y(zero)} className="wk-lines-zero" />}
      {marker != null && <line x1={x(marker)} x2={x(marker)} y1="4" y2={H - 4} className="wk-lines-marker" />}
      {lines.map((l) => {
        const pts = l.values.map((v, k) => `${x(k)},${y(v)}`).join(" ");
        const last = l.values.length - 1;
        return (
          <g key={l.id} className={`wk-line wk-line--${l.tone || 0}${l.faint ? " is-faint" : ""}${l.dashed ? " is-dashed" : ""}`}>
            <polyline points={pts} />
            <circle cx={x(last)} cy={y(l.values[last])} r="3.5" />
            {l.label && (
              <text x={x(last) + 6} y={y(l.values[last]) + 4}>
                {l.label}
              </text>
            )}
          </g>
        );
      })}
      {xLabels && xLabels.map((t, k) => t && (
        <text key={k} x={x(k)} y={H + 12} className="wk-lines-x" textAnchor="middle">
          {t}
        </text>
      ))}
    </svg>
  );
}

/** A coin stack whose height is `value / max`; label on top, caption under. */
export function CoinStack({ value, max, label, caption, tone = "gold", ghost, height = 150 }) {
  const h = Math.max(4, Math.min(1, value / max) * height);
  const coins = Math.max(1, Math.round(h / 9));
  return (
    <div className={`wk-coins wk-coins--${tone}${ghost ? " is-ghost" : ""}`}>
      <span className="wk-coins-label">{label}</span>
      <span className="wk-coins-stack" style={{ height }}>
        <span style={{ height: h }}>
          {Array.from({ length: coins }, (_, k) => (
            <i key={k} />
          ))}
        </span>
      </span>
      {caption && <small>{caption}</small>}
    </div>
  );
}

/** Two to four chips, one pressed. */
export function Seg({ options, value, onPick, label }) {
  return (
    <div className="wf-seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" className={`wf-seg-btn${value === o.id ? " is-on" : ""}`} aria-pressed={value === o.id} onClick={() => onPick(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
