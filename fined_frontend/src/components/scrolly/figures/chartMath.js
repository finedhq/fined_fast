// Plain maths for the line chart (Module 8 on). No React, so every number a
// learner sees can be unit-tested (module8.test.js, module10.test.js).

/** A tidy step for about `count` ticks across `span`: 1, 2, 2.5 or 5 × 10^k. */
export function niceStep(span, count = 4) {
  if (!(span > 0)) return 1;
  const raw = span / count;
  const p = 10 ** Math.floor(Math.log10(raw));
  const m = [1, 2, 2.5, 5, 10].find((k) => k * p >= raw);
  return m * p;
}

/** Axis ticks inside [lo, hi]: linear at a tidy step; log at 1 / 2 / 5 × 10^k. */
export function axisTicks(lo, hi, scale = "linear") {
  if (scale === "log") {
    const out = [];
    for (let k = Math.floor(Math.log10(lo)); k <= Math.ceil(Math.log10(hi)); k += 1) {
      for (const m of [1, 2, 5]) {
        const v = m * 10 ** k;
        if (v >= lo && v <= hi) out.push(v);
      }
    }
    return out;
  }
  const step = niceStep(hi - lo);
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}

export const formatValue = (v, format) => (format === "inr" ? `₹${Math.round(v).toLocaleString("en-IN")}` : Math.round(v).toLocaleString("en-IN"));

/** The x indices a step shows: its `range` [from, to], else all of them. */
export function stepRange(config, s) {
  const n = config.series[0].values.length;
  const [from, to] = s.range || [0, n - 1];
  return [Math.max(0, from), Math.min(n - 1, to)];
}

/**
 * Everything the chart draws for one step, in pixels: the line's path, a
 * point() helper, y ticks (with labels), x labels (at most ~6), the volume
 * bars and where the hidden future starts.
 */
export function chartGeometry(config, s, { w, h, pad }) {
  const [from, to] = stepRange(config, s);
  const values = config.series[0].values;
  const shown = values.slice(from, to + 1);
  const log = s.scale === "log";
  const f = log ? (v) => Math.log10(v) : (v) => v;
  // More lines (WinterArc Day 1 on): series after the first are drawn only
  // when the step's `show` lists them, and count toward the y range.
  const extras = config.series.slice(1).filter((x) => (s.show || []).includes(x.id));
  const all = [...shown, ...extras.flatMap((x) => x.values.slice(from, to + 1))];
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  for (const m of config.markers || []) {
    if (m.at >= from && m.at <= to && (s.show || []).includes(m.id)) {
      lo = Math.min(lo, m.value);
      hi = Math.max(hi, m.value);
    }
  }
  if (log) {
    lo /= 1.1;
    hi *= 1.1;
  } else {
    const padV = (hi - lo || hi || 1) * 0.12;
    lo = config.fromZero ? 0 : Math.max(0, lo - padV);
    hi += padV;
  }
  const plotW = w - pad.l - pad.r;
  const plotH = h - pad.t - pad.b;
  const span = Math.max(1, to - from);
  const x = (i) => pad.l + ((i - from) / span) * plotW;
  const y = (v) => pad.t + (1 - (f(v) - f(lo)) / (f(hi) - f(lo))) * plotH;
  const point = (i, v) => ({ x: x(i), y: y(v) });
  const pathOf = (vals) => vals.map((v, k) => `${k ? "L" : "M"}${x(from + k).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const path = pathOf(shown);
  const lines = [config.series[0], ...extras].map((ser, n) => {
    const vals = ser.values.slice(from, to + 1);
    const last = vals[vals.length - 1];
    return { id: ser.id, n, path: n ? pathOf(vals) : path, end: { x: x(to), y: y(last), value: last, label: formatValue(last, config.format) } };
  });

  const yTicks = axisTicks(lo, hi, s.scale).map((v) => ({ v, y: y(v), label: formatValue(v, config.format) }));
  const xTicks = [];
  if (config.xYears) {
    // Long monthly series (Module 10): ticks on Januaries, labelled by year, at most ~6.
    const jans = [];
    for (let i = from; i <= to; i += 1) if (config.x[i].startsWith("Jan")) jans.push(i);
    const every = Math.max(1, Math.ceil(jans.length / 6));
    jans.filter((_, k) => k % every === 0).forEach((i) => xTicks.push({ i, x: x(i), label: config.x[i].slice(4) }));
  } else {
    const every = Math.max(1, Math.ceil((to - from + 1) / 6));
    for (let i = from; i <= to; i += every) xTicks.push({ i, x: x(i), label: config.x[i] });
  }

  let volume = [];
  if (config.volume) {
    const vols = config.volume.values.slice(from, to + 1);
    const vmax = Math.max(...vols) || 1;
    const bw = Math.max(2, (plotW / (to - from + 1)) * 0.6);
    volume = vols.map((v, k) => ({ i: from + k, x: x(from + k) - bw / 2, w: bw, h: Math.max(1, (v / vmax) * 30) }));
  }
  const futureFrom = s.futureFrom ?? s.future?.from;
  const future = futureFrom != null && futureFrom <= to ? { x: x(Math.max(from, futureFrom)) } : null;
  const baseline = s.baseline ? { y: y(s.baseline.value), label: s.baseline.label } : null;
  return { path, lines, point, inRange: (i) => i >= from && i <= to, yTicks, xTicks, volume, future, baseline };
}

/**
 * End-of-line value labels that don't overlap: sorted top to bottom, each at
 * least `gap` px below the one above. Returns {id: y}.
 */
export function spreadLabels(ends, gap = 14) {
  const sorted = [...ends].sort((a, b) => a.y - b.y);
  const out = {};
  let prev = -Infinity;
  for (const e of sorted) {
    const y = Math.max(e.y, prev + gap);
    out[e.id] = y;
    prev = y;
  }
  return out;
}

/**
 * Module 10's time horizon: what `amount` put in at x index `start` was worth
 * `years` later (monthly data, so 12 points a year). Prices only.
 */
export function horizonValue(values, start, years, amount) {
  return (amount * values[start + 12 * years]) / values[start];
}

/** "₹48,206" → "about ₹48,000": the horizon line rounds to the nearest thousand. */
export const roughRupees = (n) => `₹${(Math.round(n / 1000) * 1000).toLocaleString("en-IN")}`;

/** One line for screen readers. */
export function chartSummary(config, s) {
  const [from, to] = stepRange(config, s);
  const line = config.series[0];
  const end = s.future ? Math.max(from, s.future.from - 1) : to;
  const v = (i) => formatValue(line.values[i], config.format);
  const parts = [`${line.label}: ${v(from)} in ${config.x[from]}, ${v(end)} in ${config.x[end]}.`];
  for (const x of config.series.slice(1)) {
    if ((s.show || []).includes(x.id)) parts.push(`${x.label}: ${formatValue(x.values[from], config.format)} in ${config.x[from]}, ${formatValue(x.values[to], config.format)} in ${config.x[to]}.`);
  }
  for (const m of config.markers || []) if ((s.show || []).includes(m.id) && m.at >= from && m.at <= to) parts.push(`${m.label}: ${formatValue(m.value, config.format)} in ${config.x[m.at]}.`);
  if (config.volume && (s.show || []).includes("volume")) parts.push(`${config.volume.label} shown underneath.`);
  if (s.future) parts.push(`After ${config.x[end]}: hidden. ${s.future.label || ""}`.trim());
  if (s.scale === "log") parts.push("Squashed (log) scale.");
  return parts.join(" ");
}
