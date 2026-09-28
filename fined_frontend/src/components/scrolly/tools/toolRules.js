// Plain rules for the hands-on tools (no React), so the page's star count and
// "still open" list can use them and they can be unit-tested.
import { fmtPct } from "../figures/blocksMath";

// ── Shared ─────────────────────────────────────────────────────────────
/** A setter that saves a control's value and remembers that it was moved. */
export const controlSetter = (onState) => (name, value) =>
  onState((prev) => {
    const touched = prev.touchedControls || [];
    return { ...prev, [name]: value, touchedControls: touched.includes(name) ? touched : [...touched, name] };
  });

// ── Leak Lab ────────────────────────────────────────────────────────────
// Saved tool state: { years, inflation, where, amount, moreOpen, touchedControls[] }.
// Amount follows the hero's savings chip until the reader moves the Amount
// slider themselves; a skipped chip leaves the default (₹1,00,000).

export function leakLabValues(config, state = {}, heroAmount) {
  const c = config?.controls || {};
  const touched = state.touchedControls || [];
  const seeded = heroAmount || c.amount?.default;
  return {
    amount: touched.includes("amount") && state.amount != null ? state.amount : seeded,
    years: state.years ?? c.years?.default,
    inflation: state.inflation ?? c.inflation?.default,
    where: state.where ?? c.where?.default,
    moreOpen: !!state.moreOpen,
    touchedControls: touched,
  };
}

/** Finished once the reader has moved enough different controls. */
export function leakLabDone(cardData, state) {
  const need = cardData?.config?.min_controls_to_complete ?? 2;
  return (state?.touchedControls?.length || 0) >= need;
}

/** The aside line shows only when every value in `aside_when` matches. */
export function leakLabAsideShown(config, values) {
  const when = config?.aside_when;
  if (!config?.aside_text || !when || !Object.keys(when).length) return false;
  return Object.entries(when).every(([k, v]) => values[k] === v);
}

// ── Your Slice (slice_calculator) ──────────────────────────────────────
// Saved tool state: { amount, company, change, touchedControls[] }.
export function sliceValues(config, state = {}) {
  const c = config?.controls || {};
  return {
    amount: state.amount ?? c.amount?.default,
    company: state.company ?? c.company?.default,
    change: state.change ?? c.business_change?.default ?? 0,
    touchedControls: state.touchedControls || [],
  };
}

/**
 * What the money buys: whole shares only (you can't buy part of a share), the
 * leftover cash, the slice as a fraction of the company, and what the slice is
 * worth if the business does `change`% better or worse. Before costs and tax.
 */
export function sliceResult(config, values) {
  const options = config?.controls?.company?.options || [];
  const company = options.find((o) => o.id === values.company) || options[0];
  if (!company) return null;
  const shares = Math.floor(values.amount / company.price);
  const valueNow = shares * company.price;
  const valueAfter = valueNow * (1 + values.change / 100);
  let verdict;
  if (shares === 0) verdict = { cls: "holding", label: `Not enough for one whole share of ${company.label} — your money stays as cash.` };
  else if (values.change > 0) verdict = { cls: "growing", label: "Your slice grew with the business." };
  else if (values.change < 0) verdict = { cls: "losing", label: "Your slice shrank with the business." };
  else verdict = { cls: "holding", label: "Your slice held, like the business." };
  return {
    company,
    shares,
    leftover: values.amount - valueNow,
    ownership: shares / company.total_shares,
    valueNow,
    valueAfter,
    gain: valueAfter - valueNow,
    verdict,
  };
}

/** Finished once the reader has moved enough different controls. */
export function sliceDone(cardData, state) {
  const need = cardData?.config?.min_controls_to_complete ?? 2;
  return (state?.touchedControls?.length || 0) >= need;
}

/**
 * The aside appears once the reader has moved a control, while the amount is
 * under `aside_when.amount_below` and buys at least one share. Its number is
 * the one the tool just worked out — never a fixed figure.
 */
export function sliceAside(config, values, result) {
  const below = config?.aside_when?.amount_below;
  if (!config?.aside_text || below == null || !result || result.shares === 0) return "";
  if (!values.touchedControls.length || values.amount >= below) return "";
  return config.aside_text.replace("{ownership_pct}", fmtPct(result.ownership));
}

// ── Registry of completion rules by model_kind ─────────────────────────
export const TOOL_DONE = {
  leak_lab: leakLabDone,
  slice_calculator: sliceDone,
};

// What each tool saves to the learner's account (savedAnswers.js).
export const TOOL_SAVED_KEYS = {
  leak_lab: ["years", "inflation", "where", "amount", "touchedControls"],
  slice_calculator: ["amount", "company", "change", "touchedControls"],
};

export function toolDone(cardData, state) {
  const rule = TOOL_DONE[cardData?.model_kind];
  return rule ? rule(cardData, state) : false;
}
