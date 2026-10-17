// One reader control shared by the figures (Module 6 on): a label with the
// current value, a slider, and − / + buttons for phones (the buttons step from
// the latest value, so quick taps never use a stale one). Styles: `ob-control`
// in scrolly-blocks.css.
export default function SliderControl({ label, valueText, value, min, max, step, onChange, lessLabel, moreLabel }) {
  const clamp = (v) => Math.min(max, Math.max(min, v));
  const nudge = (d) => onChange((v) => clamp(v + d));
  return (
    <div className="ob-control">
      <div className="ob-control-label">
        {label} <strong>{valueText}</strong>
      </div>
      <div className="ob-control-row">
        <button type="button" className="stepper-btn" aria-label={lessLabel} onClick={() => nudge(-step)}>
          −
        </button>
        <input type="range" min={min} max={max} step={step} value={value} aria-label={label} onChange={(e) => onChange(clamp(Number(e.target.value)))} />
        <button type="button" className="stepper-btn" aria-label={moreLabel} onClick={() => nudge(step)}>
          +
        </button>
      </div>
    </div>
  );
}
