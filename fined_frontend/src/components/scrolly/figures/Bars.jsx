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
// Module 8 on: config `layout: "shown"` gives only the shown bars a column
// (each step can be a different set of bars); per view `notes {id: text}` (a
// line under that bar), `tone` (one colour for every bar, e.g. a time series)
// and `pulse` (a bar id that pulses once the step's tap-to-guess is answered);
// `revealOnGuess` keeps the bars pale with "?" (and the note hidden) until
// the step's guess is answered, so the picture doesn't give the answer away.
// Measures `count`, `level` (plain numbers) and `points` join the others.
// Module 11 on: config `control {id, base, label, min, max, step, start}`
// lets the reader set a fall (%) that sizes bar `id` at base × (1 − fall);
// a view with `control: true` shows the slider. The value isn't saved and
// nothing is marked right; later steps keep the reader's bar.
import { useState } from "react";
import { afterFall, barHeights, formatMeasure, indianWords, inrFull, measureValue, shownBars, splitSeries } from "./blocksMath";
import SliderControl from "./SliderControl";

const PLACEHOLDER_HEIGHT = 0.45;

export default function Bars({ step, steps, state = {}, config }) {
  const s = Math.min(step ?? 0, config.views.length - 1);
  const view = config.views[s];
  const guessKey = steps?.[s]?.step_id;
  const guessed = !!(guessKey && state.guesses?.[guessKey] !== undefined);
  const hideValues = view.values === false || (view.revealOnGuess && !guessed);
  const note = view.revealOnGuess && !guessed ? "" : view.note;
  const ctl = config.control;
  const [fall, setFall] = useState(ctl?.start ?? 0);
  const series = config.series.map((x) => {
    if (ctl && x.id === ctl.id) return { ...x, [view.measure]: afterFall(ctl.base, fall) };
    return view.split?.id === x.id ? splitSeries(x, view.split.factor) : x;
  });
  const values = series.map((x) => measureValue(x, view.measure));
  const shown = new Set(shownBars(series, view).map((x) => x.id));
  const heights = barHeights(values.map((v, i) => (shown.has(series[i].id) ? v : 0)), view.scale);
  const visible = series.map((x, i) => ({ x, i })).filter(({ x }) => shown.has(x.id));
  const compact = config.layout === "shown";
  const columns = compact ? visible : series.map((x, i) => ({ x, i }));
  const pulseId = view.pulse && guessed ? view.pulse : null;
  const summary = hideValues
    ? `${view.axis}: ${visible.map(({ x }) => x.label).join(", ")}.`
    : `${view.axis}: ${visible.map(({ x, i }) => `${x.label} ${formatMeasure(values[i], view.measure)}`).join(", ")}.`;

  return (
    <div className={`nb-figure${view.control ? " has-control" : ""}`}>
      <div className="nb-head">
        <div className="nb-axis">{view.axis}</div>
        <div className={`nb-note${note ? "" : " is-empty"}`}>{note || " "}</div>
      </div>
      <div className="nb-plot" role="img" aria-label={summary} style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
        {columns.map(({ x, i }, col) => {
          const pieces = view.split?.id === x.id ? view.split.factor : 0;
          const isShown = shown.has(x.id);
          const h = !isShown ? 0 : hideValues ? PLACEHOLDER_HEIGHT : heights[i];
          return (
            <div className={`nb-col${isShown ? "" : " nb-col--hidden"}${pulseId === x.id ? " nb-col--pulse" : ""}`} key={x.id} aria-hidden={isShown ? undefined : true}>
              <div className="nb-track">
                <div
                  className={`nb-bar nb-bar--${view.tone ?? (compact ? col % 4 : i)}${pieces ? " nb-bar--split" : ""}${hideValues ? " nb-bar--unknown" : ""}`}
                  style={{ height: `${Math.max(1.5, h * 100)}%` }}
                >
                  <span className="nb-value">{hideValues ? "?" : formatMeasure(values[i], view.measure)}</span>
                  {Array.from({ length: pieces }, (_, k) => (
                    <span key={k} className="nb-piece"></span>
                  ))}
                </div>
              </div>
              <div className="nb-label">{x.label}</div>
              <div className={`nb-detail${view.detail || view.notes?.[x.id] ? "" : " is-empty"}`}>
                {view.detail ? `${inrFull(x.price)} × ${indianWords(x.shares)} shares` : view.notes?.[x.id] || " "}
              </div>
            </div>
          );
        })}
      </div>
      {view.control && ctl && (
        <SliderControl
          label={ctl.label}
          valueText={`${fall}% · left: ${inrFull(afterFall(ctl.base, fall))}`}
          value={fall}
          min={ctl.min}
          max={ctl.max}
          step={ctl.step}
          onChange={setFall}
          lessLabel={`A smaller fall, by ${ctl.step} points`}
          moreLabel={`A bigger fall, by ${ctl.step} points`}
        />
      )}
    </div>
  );
}
