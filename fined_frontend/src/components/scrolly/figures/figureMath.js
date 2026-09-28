// Numbers and wording for the Module 1 figures, ported unchanged from the
// prototype (fined-scrolly/module-1-market/js/figures/*.js, util/icons.js).
// Kept separate from the components so they can be unit-tested.

// ── Shrinking basket (Chapter 1) ──────────────────────────────────────────
export const REAL_VALUE = 61391; // ₹1,00,000 at 5% inflation, 10 years
export const SAVINGS_REAL_VALUE = 78586; // after 2.5% interest, deflated by 5% inflation, 10 years
export const GUESS_MIN = 40000;
export const GUESS_MAX = 100000;
export const GUESS_STEP = 1000;
export const GUESS_DEFAULT = 70000;

// Ten everyday items; the basket's fill level is purchasing power.
export const BASKET_SPEC = [
  { id: "chai", label: "Chai", category: "Daily Routine" },
  { id: "auto", label: "Auto ride", category: "Commute" },
  { id: "thali", label: "Mess thali", category: "Food & Meals" },
  { id: "data", label: "Data pack", category: "Connectivity" },
  { id: "movie", label: "Movie ticket", category: "Leisure" },
  { id: "chai_2", label: "Chai", category: "Daily Routine" },
  { id: "auto_2", label: "Auto ride", category: "Commute" },
  { id: "thali_2", label: "Mess thali", category: "Food & Meals" },
  { id: "data_2", label: "Data pack", category: "Connectivity" },
  { id: "movie_2", label: "Movie ticket", category: "Leisure" },
];

export const inr = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export function pctOf(amount) {
  return Math.max(0, Math.min(100, (amount / 100000) * 100));
}

/** Each item's opacity at a fill level (items beyond the level fade out). */
export function basketItems(pct) {
  const activeCount = pct / 10; // out of 10 items
  return BASKET_SPEC.map((item, i) => {
    const threshold = i + 1;
    const faded = threshold > activeCount;
    const opacity = faded ? Math.max(0.18, 1 - Math.min(1, threshold - activeCount)) : 1;
    return { ...item, faded, opacity: opacity.toFixed(2) };
  });
}

/** The line under step 1.3 once the reveal has happened. */
export function revealNote(guess, real = REAL_VALUE) {
  let text = `You guessed ${inr(guess)}.`;
  if (guess > 70000) text += " Most people guess higher — the leak is quiet.";
  else if (Math.abs(guess - real) <= 2000) text += " That's about right — most people guess much higher.";
  return text;
}

// ── Two ledgers / payoff drag (Chapter 2) ─────────────────────────────────
export const LENDER_FIXED = 600000; // ₹6L a year interest
export const OWNER_PCT = 0.2;
export const PROFIT_MIN = -4000000; // −₹40L
export const PROFIT_MAX = 10000000; // +₹1Cr
export const PROFIT_STEP = 100000;
export const PRESETS = { bad: -3000000, okay: 2000000, good: 8000000 };

export function fmtL(rupees) {
  if (rupees === 0) return "₹0";
  const lakh = rupees / 100000;
  const sign = lakh < 0 ? "−" : "";
  return `${sign}₹${Math.abs(lakh).toFixed(lakh % 1 === 0 ? 0 : 1)}L`;
}

export const ownerShare = (profit) => Math.max(0, profit * OWNER_PCT);

/** Everything the payoff chart draws for a given profit (360×200 viewBox). */
export function payoffGeometry(profit) {
  const w = 360;
  const h = 200;
  const pad = 28;
  const x = (p) => pad + ((p - PROFIT_MIN) / (PROFIT_MAX - PROFIT_MIN)) * (w - pad * 2);
  const maxY = Math.max(LENDER_FIXED, OWNER_PCT * PROFIT_MAX) * 1.1;
  const minY = Math.min(0, OWNER_PCT * PROFIT_MIN);
  const y = (v) => h - pad - ((v - minY) / (maxY - minY)) * (h - pad * 2);
  return {
    w,
    h,
    pad,
    zeroX: x(0),
    cursorX: x(profit),
    y0: y(0),
    lenderY: y(LENDER_FIXED),
    ownerY: y(ownerShare(profit)),
    ownerLabelY: y(PROFIT_MAX * OWNER_PCT),
    lenderPath: `M${x(PROFIT_MIN)},${y(LENDER_FIXED)} L${x(PROFIT_MAX)},${y(LENDER_FIXED)}`,
    ownerPath: `M${x(PROFIT_MIN)},${y(Math.max(0, PROFIT_MIN * OWNER_PCT))} L${x(0)},${y(0)} L${x(PROFIT_MAX)},${y(PROFIT_MAX * OWNER_PCT)}`,
  };
}

/** "Who gets more this year?" — tone + the sentence's parts. */
export function payoffVerdict(profit) {
  const ownerVal = ownerShare(profit);
  if (profit <= 0) return { tone: "lender", kind: "loss", owner: fmtL(0), lender: fmtL(LENDER_FIXED) };
  if (ownerVal < LENDER_FIXED) return { tone: "lender", kind: "small", owner: fmtL(ownerVal), lender: fmtL(LENDER_FIXED) };
  if (Math.round(ownerVal) === LENDER_FIXED) return { tone: "even", kind: "cross", owner: fmtL(ownerVal), lender: fmtL(LENDER_FIXED) };
  return { tone: "owner", kind: "big", owner: fmtL(ownerVal), lender: fmtL(LENDER_FIXED) };
}

// ── Two rooms (Chapter 3) ─────────────────────────────────────────────────
export function rand(seed) {
  const x = Math.sin(seed * 999.7) * 10000;
  return x - Math.floor(x);
}

export const CROWD_COUNT = 14;

/** The secondary room's fixed crowd of buyer/seller dots. */
export function crowdDots() {
  return Array.from({ length: CROWD_COUNT }, (_, i) => ({
    left: 8 + rand(i) * 84,
    top: 10 + rand(i + 50) * 70,
    kind: i % 2 === 0 ? "buyer" : "seller",
  }));
}
