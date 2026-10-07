// Reusable figure — a bar comparison drawn from settings (plan P3b.1, the
// "declarative bars"). Settings: `series` (each with the numbers a view can
// measure) and one `view` per step: { measure, axis, scale: "linear" | "log",
// note?, detail?, split?, show?, values? }. Value labels are on unless
// `values: false`, which draws the shown bars at one even height with "?"
// (the comparison hasn't started yet). `show` (series ids) draws only those
// bars; the others keep their empty slot, so bars appear one by one without
// the rest moving. A log view says so in its note; `split: {id, factor}`
// redraws that bar as `factor` equal pieces of the same total (same company,
// its shares divided up).
import { barHeights, formatMeasure, indianWords, inrFull, measureValue, shownBars, splitSeries } from "./blocksMath";

const PLACEHOLDER_HEIGHT = 0.45;

export default function Bars({ step, config }) {
  const s = Math.min(step ?? 0, config.views.length - 1);
  const view = config.views[s];
  const hideValues = view.values === false;
  const series = config.series.map((x) => (view.split?.id === x.id ? splitSeries(x, view.split.factor) : x));
  const values = series.map((x) => measureValue(x, view.measure));
  const shown = new Set(shownBars(series, view).map((x) => x.id));
  const heights = barHeights(values.map((v, i) => (shown.has(series[i].id) ? v : 0)), view.scale);
  const visible = series.map((x, i) => ({ x, i })).filter(({ x }) => shown.has(x.id));
  const summary = hideValues
    ? `${view.axis}: ${visible.map(({ x }) => x.label).join(", ")}.`
    : `${view.axis}: ${visible.map(({ x, i }) => `${x.label} ${formatMeasure(values[i], view.measure)}`).join(", ")}.`;

  return (
    <div className="nb-figure">
      <div className="nb-head">
        <div className="nb-axis">{view.axis}</div>
        <div className={`nb-note${view.note ? "" : " is-empty"}`}>{view.note || " "}</div>
      </div>
      <div className="nb-plot" role="img" aria-label={summary} style={{ gridTemplateColumns: `repeat(${series.length}, 1fr)` }}>
        {series.map((x, i) => {
          const pieces = view.split?.id === x.id ? view.split.factor : 0;
          const isShown = shown.has(x.id);
          const h = !isShown ? 0 : hideValues ? PLACEHOLDER_HEIGHT : heights[i];
          return (
            <div className={`nb-col${isShown ? "" : " nb-col--hidden"}`} key={x.id} aria-hidden={isShown ? undefined : true}>
              <div className="nb-track">
                <div
                  className={`nb-bar nb-bar--${i}${pieces ? " nb-bar--split" : ""}${hideValues ? " nb-bar--unknown" : ""}`}
                  style={{ height: `${Math.max(1.5, h * 100)}%` }}
                >
                  <span className="nb-value">{hideValues ? "?" : formatMeasure(values[i], view.measure)}</span>
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
