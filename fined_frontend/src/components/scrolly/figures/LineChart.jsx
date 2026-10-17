// Reusable figure (Module 8 on) — "line_chart": one price line drawn from
// data, with an optional volume strip, labelled markers, a hidden future and
// reader controls. Everything comes from `config` (see module8Figures.js,
// module10Figures.js):
//   series   [{id, label, values}] (the first is the line), x [labels]
//   xYears   true for a long monthly series: ticks on Januaries, by year
//   volume   {label, values} (optional strip under the line)
//   markers  [{id, label, at, value, row?}] (a dot + label at x index `at`;
//            `row` 0–2 staggers labels that would collide)
//   format   "inr" (₹ on the axis) or "plain"; note (line under the chart)
//   steps    one entry per step (so the step count is the config's), each
//            {show [ids: series / "volume" / marker ids], range? [from, to]
//             (x indices shown), scale? "linear" | "log", scaleNote?, badge?,
//             future? {from, label} (everything from that index fades behind
//             a "?"), baseline? {value, label} (a dashed reference line),
//             pulse? (a marker id that pulses once the step's tap-to-guess is
//             answered), choose? {options [{id, label, text, focus [ids]}],
//             start}, horizon? (Module 10's time-horizon slider:
//             {start, label, min, max, step, value, amount, footnote}) }
// `choose` shows all its buttons at once; the chosen one brightens its part of
// the chart and shows its one-line meaning. `horizon` reveals the line up to
// the chosen number of years after `start` and shows what `amount` put in at
// `start` was worth then. Neither is saved.
// Pixel geometry comes from the measured width (as TradeMap), so labels keep
// their size on phones. Maths in chartMath.js.
import { useLayoutEffect, useRef, useState } from "react";
import { chartGeometry, chartSummary, horizonValue, roughRupees } from "./chartMath";
import SliderControl from "./SliderControl";

const H = 200; // line plot height, px
const VOL_H = 44; // volume strip height, px
const ROW_H = 14; // px per staggered marker-label row

function useWidth(ref) {
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export default function LineChart({ step, steps, state = {}, config }) {
  const at = Math.min(Math.max(step ?? 0, 0), config.steps.length - 1);
  const s = config.steps[at];
  const ref = useRef(null);
  const w = useWidth(ref);
  const [picked, setPicked] = useState(s.choose?.start ?? null);
  const [years, setYears] = useState(s.horizon?.value ?? 1);
  const choice = s.choose ? s.choose.options.find((o) => o.id === (picked ?? s.choose.start)) : null;
  const focus = new Set(choice?.focus || []);
  const dim = (id) => (choice && !focus.has(id) ? " is-dim" : "");
  const guessId = steps?.[at]?.step_id;
  const pulseId = s.pulse && guessId && state.guesses?.[guessId] !== undefined ? s.pulse : null;

  const line = config.series[0];
  const hz = s.horizon;
  const hzEnd = hz ? hz.start + 12 * years : null;
  const view = hz ? { ...s, futureFrom: hzEnd + 1 } : s;
  const show = new Set(s.show);
  const markers = config.markers.filter((m) => show.has(m.id));
  if (hz) markers.push({ id: "hz", label: `After ${years} ${years === 1 ? "year" : "years"}`, at: hzEnd, value: line.values[hzEnd] });
  const rows = markers.length ? Math.max(...markers.map((m) => m.row || 0)) + 1 : 0;
  const pad = { l: 48, r: 16, t: 14 + rows * ROW_H, b: 22 };
  const plotH = H + rows * ROW_H; // label rows add height; the plot itself keeps its size
  const hasVol = config.volume && show.has("volume");
  const g = w ? chartGeometry(config, { ...view, show: [...show, ...(hz ? ["hz"] : [])] }, { w, h: plotH, pad }) : null;
  const worth = hz ? horizonValue(line.values, hz.start, years, hz.amount) : null;
  const summary = `${chartSummary(config, view)}${hz ? ` After ${years} ${years === 1 ? "year" : "years"}: worth about ${roughRupees(worth)}.` : ""}`;

  return (
    <div className="lc-figure">
      <div className="lc-top">
        {s.badge && <span className="lc-badge">{s.badge}</span>}
        {s.scaleNote && <span className="lc-scale-note">{s.scaleNote}</span>}
      </div>
      <div className="lc-stage" ref={ref} role="img" aria-label={summary}>
        {g && (
          <svg width={w} height={plotH + (hasVol ? VOL_H : 0)} aria-hidden="true">
            {g.yTicks.map((t) => (
              <g key={t.v}>
                <line className="lc-grid" x1={pad.l} x2={w - pad.r} y1={t.y} y2={t.y} />
                <text className="lc-ylabel" x={pad.l - 6} y={t.y + 4} textAnchor="end">
                  {t.label}
                </text>
              </g>
            ))}
            {g.xTicks.map((t) => (
              <text key={t.i} className="lc-xlabel" x={t.x} y={plotH - 4} textAnchor="middle">
                {t.label}
              </text>
            ))}
            {g.baseline && (
              <g className="lc-baseline">
                <line x1={pad.l} x2={w - pad.r} y1={g.baseline.y} y2={g.baseline.y} />
                <text x={pad.l + 4} y={g.baseline.y - 5} textAnchor="start">
                  {g.baseline.label}
                </text>
              </g>
            )}
            <path className={`lc-line${dim(line.id)}`} d={g.path} />
            {markers
              .filter((m) => g.inRange(m.at))
              .map((m) => {
                const p = g.point(m.at, m.value);
                const ly = 10 + (m.row || 0) * ROW_H;
                const anchor = p.x > w * 0.72 ? "end" : p.x < w * 0.28 ? "start" : "middle";
                return (
                  <g key={m.id} className={`lc-marker${dim(m.id)}${pulseId === m.id ? " is-pulse" : ""}${m.id === "hz" ? " lc-marker--hz" : ""}`}>
                    <line className="lc-marker-stem" x1={p.x} x2={p.x} y1={p.y} y2={ly + 3} />
                    <circle cx={p.x} cy={p.y} r="5" />
                    <text x={p.x} y={ly} textAnchor={anchor}>
                      {m.label}
                    </text>
                  </g>
                );
              })}
            {g.future && (
              <g className="lc-future">
                <rect x={g.future.x} y={pad.t - 6} width={Math.max(0, w - pad.r - g.future.x + 2)} height={plotH - pad.t - pad.b + 8} />
                {w - pad.r - g.future.x > 40 && (
                  <text className="lc-future-q" x={(g.future.x + w - pad.r) / 2} y={(plotH - pad.b + pad.t) / 2 + 10} textAnchor="middle">
                    ?
                  </text>
                )}
              </g>
            )}
            {hasVol &&
              g.volume.map((b) => (
                <rect key={b.i} className={`lc-vol${dim("volume")}`} x={b.x} y={plotH + VOL_H - b.h} width={b.w} height={b.h} rx="1.5" />
              ))}
            {hasVol && (
              <text className="lc-vol-label" x={pad.l} y={plotH + 10}>
                {config.volume.label}
              </text>
            )}
          </svg>
        )}
      </div>
      {s.future?.label && <p className="lc-future-label">{s.future.label}</p>}
      {s.choose && (
        <>
          <div className="lc-choose" role="group" aria-label="Parts of the chart">
            {s.choose.options.map((o) => (
              <button key={o.id} type="button" className={`og-hold-btn${choice?.id === o.id ? " active" : ""}`} aria-pressed={choice?.id === o.id} onClick={() => setPicked(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          <p className="lc-meaning" aria-live="polite">
            {choice?.text}
          </p>
        </>
      )}
      {hz && (
        <>
          <SliderControl
            label={hz.label}
            valueText={`${years} ${years === 1 ? "year" : "years"}`}
            value={years}
            min={hz.min}
            max={hz.max}
            step={hz.step}
            onChange={setYears}
            lessLabel="One year less"
            moreLabel="One year more"
          />
          <div className="og-chips" aria-live="polite">
            <div className="marker-chip marker-chip--real">
              <span>₹1 lakh from the end of 2007, after {years} {years === 1 ? "year" : "years"}</span>
              <strong>Worth about {roughRupees(worth)}</strong>
            </div>
          </div>
          {hz.footnote && <p className="ob-note">{hz.footnote}</p>}
        </>
      )}
      {config.note && <p className="ob-note">{config.note}</p>}
    </div>
  );
}
