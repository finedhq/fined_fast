// Reusable figure — a bar comparison drawn from settings (plan P3b.1, the
// "declarative bars"). Settings: `series` (each with the numbers a view can
// measure) and one `view` per step: { measure, axis, scale: "linear" | "log",
// note?, detail?, split? }. Value labels are always on. A log view says so in
// its note; `split: {id, factor}` redraws that bar as `factor` equal pieces of
// the same total (same company, its shares divided up).
import { barHeights, formatMeasure, indianWords, inrFull, measureValue, splitSeries } from "./blocksMath";

export default function Bars({ step, config }) {
  const s = Math.min(step ?? 0, config.views.length - 1);
  const view = config.views[s];
  const series = config.series.map((x) => (view.split?.id === x.id ? splitSeries(x, view.split.factor) : x));
  const values = series.map((x) => measureValue(x, view.measure));
  const heights = barHeights(values, view.scale);
  const summary = `${view.axis}: ${series.map((x, i) => `${x.label} ${formatMeasure(values[i], view.measure)}`).join(", ")}.`;

  return (
    <div className="nb-figure">
      <div className="nb-head">
        <div className="nb-axis">{view.axis}</div>
        <div className={`nb-note${view.note ? "" : " is-empty"}`}>{view.note || " "}</div>
      </div>
      <div className="nb-plot" role="img" aria-label={summary}>
        {series.map((x, i) => {
          const pieces = view.split?.id === x.id ? view.split.factor : 0;
          return (
            <div className="nb-col" key={x.id}>
              <div className="nb-track">
                <div className={`nb-bar nb-bar--${i}${pieces ? " nb-bar--split" : ""}`} style={{ height: `${Math.max(1.5, heights[i] * 100)}%` }}>
                  <span className="nb-value">{formatMeasure(values[i], view.measure)}</span>
                  {Array.from({ length: pieces }, (_, k) => (
                    <span key={k} className="nb-piece"></span>
                  ))}
                </div>
              </div>
              <div className="nb-label">{x.label}</div>
              <div className={`nb-detail${view.detail ? "" : " is-empty"}`}>
                {view.detail ? `${inrFull(x.price)} × ${indianWords(x.shares)} shares` : " "}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
