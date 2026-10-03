// Plain maths and wording for the reusable (config-driven) figures and the
// "Your Slice" tool (ownership grid, bars, liquidation queue). No React, so
// every number a learner sees can be unit-tested (blocksMath.test.js).

// ── Numbers, Indian style ──────────────────────────────────────────────────
export const inrFull = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const trim = (s) => (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s);

/** 4,00,00,000 → "4 crore", 5,00,000 → "5 lakh", 1,20,000 → "1.2 lakh", 900 → "900". */
export function indianWords(n) {
  const abs = Math.abs(n);
  if (abs >= 1e7) return `${trim((n / 1e7).toFixed(2))} crore`;
  if (abs >= 1e5) return `${trim((n / 1e5).toFixed(2))} lakh`;
  return Math.round(n).toLocaleString("en-IN");
}

/** ₹2,00,00,00,000 → "₹200 crore"; small amounts stay in full (₹2,000). */
export const inrWords = (n) => (Math.abs(n) >= 1e5 ? `₹${indianWords(n)}` : inrFull(n));

/**
 * A share of something as a percentage, shown honestly: small numbers keep
 * two significant figures instead of rounding to zero.
 * 0.1 → "10%", 0.01 → "1%", 0.001 → "0.1%", 0.0000025 → "0.00025%".
 */
export function fmtPct(fraction) {
  const p = fraction * 100;
  if (!Number.isFinite(p) || p <= 0) return "0%";
  if (p >= 1) return `${trim(p.toFixed(2))}%`;
  const digits = Math.max(2, 1 - Math.floor(Math.log10(p)));
  return `${trim(p.toFixed(digits))}%`;
}

// ── Ownership grid ─────────────────────────────────────────────────────────
/** Cells owned when the holding sits together, from the top-left corner. */
export function packedCells(holding) {
  return Array.from({ length: Math.max(0, holding) }, (_, i) => i);
}

/**
 * Cells owned when the holding is spread over the whole grid: the grid is cut
 * into `holding` equal runs and one cell is picked in each, at a fixed but
 * irregular spot — evenly spread, without forming stripes.
 */
export function spreadCells(holding, total) {
  if (holding <= 0) return [];
  const run = total / holding;
  return Array.from({ length: holding }, (_, i) => Math.floor(i * run + jitter(i + 1) * run));
}

// A fixed "random" number in [0, 1) for a seed, so the picture never changes.
function jitter(seed) {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
}

/** Screen-reader line for a grid state. */
export function gridSummary(owned, total, whose = "Arjun's") {
  return `${owned.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} squares are ${whose} — ${fmtPct(owned / total)} of the company.`;
}

// ── Bars ───────────────────────────────────────────────────────────────────
/** The value a bar shows for a measure; market cap = price × shares unless given. */
export function measureValue(series, measure) {
  if (measure === "market_cap") return series.market_cap ?? series.price * series.shares;
  return series[measure];
}

/**
 * Bar heights (0–1) for a set of values. Linear: value ÷ largest. Log: the
 * same on a log₁₀ scale from 1, so a 40× gap still leaves both bars visible.
 */
export function barHeights(values, scale = "linear") {
  const f = scale === "log" ? (v) => Math.log10(Math.max(1, v)) : (v) => Math.max(0, v);
  const max = Math.max(...values.map(f));
  return values.map((v) => (max > 0 ? f(v) / max : 0));
}

/**
 * The bars a view draws: `show` (series ids) limits it, otherwise all of them.
 * Each entry is the series' position in the config, so colours stay put.
 */
export function shownBars(series, view) {
  return series.map((x, i) => ({ ...x, slot: i })).filter((x) => !view.show || view.show.includes(x.id));
}

/** A series as it looks after its shares are divided `factor` ways: same size. */
export function splitSeries(series, factor) {
  return { ...series, price: series.price / factor, shares: series.shares * factor };
}

export function formatMeasure(value, measure) {
  if (measure === "percent") return `${Math.round(value)}%`;
  if (measure === "shares") return `${indianWords(value)} shares`;
  if (measure === "price") return `${inrFull(value)} a share`;
  return inrWords(value);
}

// ── Liquidation queue ──────────────────────────────────────────────────────
/**
 * Pays `pot` out down the queue in `order`: each claimant takes its claim (or
 * everything left, if its claim is null) until the money runs out.
 */
export function payOut(claimants, order, pot) {
  let left = pot;
  return order.map((id) => {
    const c = claimants.find((x) => x.id === id);
    const want = c.claim == null ? left : c.claim;
    const paid = Math.max(0, Math.min(want, left));
    left -= paid;
    return { ...c, paid, leftAfter: left };
  });
}

const POSITION_WORDS = ["first", "second", "third", "fourth", "fifth", "sixth"];

/** "first", "second", … and "last" for the final place. */
export function positionWord(index, count) {
  return index === count - 1 ? "last" : POSITION_WORDS[index] || `number ${index + 1}`;
}

/** The feedback line for the reader's order (their guess vs the law's). */
export function queueFeedback(config, order) {
  if (!order || order.length !== config.claimants.length) return "";
  const at = order.indexOf(config.ownerId);
  if (at === order.length - 1) return config.feedback.right;
  return config.feedback.wrong.replace("{position}", positionWord(at, order.length));
}

/** How many of the reader's places match the law's order. */
export function placesRight(order, correct) {
  return order.filter((id, i) => correct[i] === id).length;
}

/** "+10%", "−20%", "0%" for the what-if dial. */
export const fmtChange = (n) => (n > 0 ? `+${n}%` : n < 0 ? `−${Math.abs(n)}%` : "0%");

/** "+₹500", "−₹2,500", "₹0". */
export const fmtGain = (n) => (Math.round(n) > 0 ? `+${inrFull(n)}` : Math.round(n) < 0 ? `−${inrFull(Math.abs(n))}` : "₹0");

// ── Rulebook switch (Module 3) ─────────────────────────────────────────────
const INSIDERS = 3;

// What the stage shows at each moment of a play-through.
// phase 0 = before anything happens; OFF: 1 insiders sell early, 2 everyone else sells late; ON: 1 everyone together.
export function rulebookScene(rule, phase, { priceBefore, priceAfter }) {
  const before = inrFull(priceBefore);
  const after = inrFull(priceAfter);
  if (rule === "off") {
    if (phase === 0) return { tag: before, feedback: "", dot: (i) => (i < INSIDERS ? "insider" : "") };
    if (phase === 1) return { tag: `insiders sell at ${before}`, feedback: "", dot: (i) => (i < INSIDERS ? "insider sold-early" : "") };
    return {
      tag: after,
      feedback: `News breaks. Everyone left sells at ${after} — after the insiders already got out at ${before}.`,
      dot: (i) => (i < INSIDERS ? "insider sold-early" : "sold-late"),
    };
  }
  if (phase === 0) return { tag: before, feedback: "", dot: () => "" };
  return {
    tag: `${after} — published to everyone at once`,
    feedback: "With the rulebook on, the fall still happened. What changed is who got to act on it first.",
    dot: () => "sold-together",
  };
}
