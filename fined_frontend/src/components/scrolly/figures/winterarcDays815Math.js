// Plain maths for the WinterArc Day 8–15 figures (no React), so every number a
// reader sees can be unit-tested against the specs' tables
// (winterarcDays815.test.js). All rates, returns and companies are made up
// unless a config says otherwise; real rules carry sources in the specs.

export { inr, fill } from "./winterarcDays567Math";

/** "₹74 lakh" / "₹1.28 crore" for big amounts, full rupees below ₹1 lakh. */
export function inrBig(v) {
  const a = Math.abs(v);
  const sign = v < 0 ? "−" : "";
  if (a >= 1e7) return `${sign}₹${(a / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} crore`;
  if (a >= 1e5) return `${sign}₹${(a / 1e5).toFixed(a >= 1e6 ? 0 : 1).replace(/\.0$/, "")} lakh`;
  return `${sign}₹${Math.round(a).toLocaleString("en-IN")}`;
}

export const pct = (v, dp = 1) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(dp).replace(/\.0+$/, "")}%`;

// ── Day 8 · three doors ─────────────────────────────────────────────
/** Year-end values from `start` along a path of yearly % returns. */
export function pathValues(start, returns) {
  const out = [];
  let v = start;
  for (const r of returns) {
    v *= 1 + r / 100;
    out.push(v);
  }
  return out;
}

/** Savings at a fixed rate, year-end values for `years` years. */
export const savingsValues = (start, rate, years) => Array.from({ length: years }, (_, k) => start * (1 + rate / 100) ** (k + 1));

/** In today's money: divide by (1 + inflation)^year. */
export const real = (v, inflation, year) => v / (1 + inflation / 100) ** year;

/** The sell branch: hold the path to `sellAt` years, then savings for the rest. */
export function sellBranch(start, returns, sellAt, rate) {
  const held = pathValues(start, returns.slice(0, sellAt));
  const atSell = held[sellAt - 1];
  const after = savingsValues(atSell, rate, returns.length - sellAt);
  return [...held, ...after];
}

// ── Day 8 · owners and lenders ──────────────────────────────────────
/** ₹ of sales → costs, interest, tax (made-up % of profit, never < 0), owners. */
export function profitSplit({ sales, costs, interest, taxRate }) {
  const beforeTax = sales - costs - interest;
  const tax = Math.max(0, (beforeTax * taxRate) / 100);
  return { costs, interest, tax, owners: beforeTax - tax, beforeTax };
}

// ── Day 8 · the time machine; Day 15 · SIP cost drag ────────────────
/**
 * ₹monthly paid at the START of each month for `payMonths`, then left to
 * grow until `totalMonths`; annual rate compounded monthly.
 */
export function monthlyPot({ monthly, rate, payMonths, totalMonths }) {
  const i = rate / 1200;
  let v = 0;
  for (let m = 0; m < totalMonths; m += 1) {
    if (m < payMonths) v += monthly;
    v *= 1 + i;
  }
  return v;
}

/** Start at `age`, invest every month until `end`. */
export const startAt = (age, { monthly, rate, end }) => monthlyPot({ monthly, rate, payMonths: (end - age) * 12, totalMonths: (end - age) * 12 });

// ── Day 9 · the spread cloud ────────────────────────────────────────
// A small seeded generator, so the stored dots are the same on every phone.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 100 dots with an exact number below zero: evenly spaced normal quantiles
 * (so the cloud looks like the model), shifted by the smallest amount that
 * puts exactly `below` dots under 0%, then shuffled by `seed` for the layout.
 */
export function cloudDots({ mean, sd, below, n = 100, seed = 1 }) {
  const q = (p) => {
    // Acklam's inverse normal, good to ~1e-9 (plenty for dots on a phone)
    const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
    const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
    const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
    const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
    const pl = 0.02425;
    if (p < pl) {
      const r = Math.sqrt(-2 * Math.log(p));
      return (((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1);
    }
    if (p > 1 - pl) {
      const r = Math.sqrt(-2 * Math.log(1 - p));
      return -(((((c[0] * r + c[1]) * r + c[2]) * r + c[3]) * r + c[4]) * r + c[5]) / ((((d[0] * r + d[1]) * r + d[2]) * r + d[3]) * r + 1);
    }
    const r = (p - 0.5) * (p - 0.5);
    return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * (p - 0.5)) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  };
  const raw = Array.from({ length: n }, (_, k) => mean + sd * q((k + 0.5) / n)).sort((x, y) => x - y);
  // shift so dot[below-1] < 0 <= dot[below]
  let shift = 0;
  if (below > 0 && below < n) {
    const lo = raw[below - 1];
    const hi = raw[below];
    if (!(lo < 0 && hi >= 0)) shift = -(lo + hi) / 2;
  } else if (below === 0 && raw[0] < 0) shift = -raw[0] + 0.05;
  const dots = raw.map((v) => Math.round((v + shift) * 100) / 100);
  const rand = mulberry32(seed);
  for (let k = dots.length - 1; k > 0; k -= 1) {
    const j = Math.floor(rand() * (k + 1));
    [dots[k], dots[j]] = [dots[j], dots[k]];
  }
  return dots;
}

/** `k` of `n` positions (0…n−1), picked by `seed`, as a Set: the same on every phone. */
export function seededSet(n, k, seed) {
  const idx = Array.from({ length: n }, (_, i) => i);
  const rand = mulberry32(seed);
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return new Set(idx.slice(0, k));
}

export const countBelow = (dots, at = 0) => dots.filter((v) => v < at).length;

// ── Day 9 · eggs and baskets ────────────────────────────────────────
export const basketReturn = (results) => (results.length ? results.reduce((s, r) => s + r, 0) / results.length : 0);

/** Min and max equal-weight result over every basket of each size 1…n. */
/** {n companies, m industries, r result %} for the picked ids. */
export function basketSummary(ids, companies) {
  const picked = companies.filter((k) => ids.includes(k.id));
  return { n: picked.length, m: new Set(picked.map((k) => k.industry)).size, r: basketReturn(picked.map((k) => k.r)) };
}

export function rangeBySize(results) {
  const n = results.length;
  const sorted = [...results].sort((a, b) => a - b);
  return Array.from({ length: n }, (_, k) => {
    const size = k + 1;
    const lo = basketReturn(sorted.slice(0, size));
    const hi = basketReturn(sorted.slice(n - size));
    return { size, lo, hi };
  });
}

// ── Day 10 · slices and the index ───────────────────────────────────
export const pricePerShare = (value, shares) => value / shares;

export function raise({ shares, price, newShares }) {
  const raised = newShares * price;
  const total = shares + newShares;
  return { raised, total, stake: shares / total, value: total * price, yours: shares * price };
}

/** Index level from caps (₹ crore) and moves (% by id); index = total ÷ divisor. */
export function indexLevel(caps, moves = {}, divisor = 10) {
  const parts = Object.entries(caps).map(([id, cap]) => {
    const after = cap * (1 + (moves[id] || 0) / 100);
    return { id, cap, after, points: (after - cap) / divisor };
  });
  const total = parts.reduce((s, p) => s + p.after, 0);
  return { level: total / divisor, parts };
}

export function weights(caps) {
  const total = Object.values(caps).reduce((s, v) => s + v, 0);
  return Object.fromEntries(Object.entries(caps).map(([id, v]) => [id, (v / total) * 100]));
}

// ── Day 11 · run a fund ─────────────────────────────────────────────
export const nav = (assets, units) => assets / units;
export const unitsFor = (amount, navValue) => Math.round((amount / navValue) * 100) / 100;

/** ₹start growing at (gross − cost)% a year for `years`. */
export const afterCost = (start, gross, cost, years) => start * (1 + (gross - cost) / 100) ** years;

// ── Day 12 · SIP sim ────────────────────────────────────────────────
/** A fixed amount each month at that month's NAV; `skip` = month indexes (0-based) not paid. */
export function sipRun(navs, amount, skip = []) {
  let units = 0;
  let paid = 0;
  const months = navs.map((n, k) => {
    const buy = skip.includes(k) ? 0 : amount / n;
    units += buy;
    paid += skip.includes(k) ? 0 : amount;
    return { nav: n, units: buy, total: units, paid };
  });
  const last = navs[navs.length - 1];
  return { months, units, paid, value: units * last, avgCost: paid / units };
}

export const lumpRun = (navs, amount) => {
  const units = amount / navs[0];
  return { units, paid: amount, value: units * navs[navs.length - 1] };
};

// ── Day 13 · bonds ──────────────────────────────────────────────────
/** Annual-coupon bond price at a new yield (both in %). */
export function bondPrice({ face, coupon, years, yieldPct }) {
  const y = yieldPct / 100;
  let p = 0;
  for (let t = 1; t <= years; t += 1) p += (face * coupon) / 100 / (1 + y) ** t;
  return p + face / (1 + y) ** years;
}
