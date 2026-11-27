// Plain maths for the WinterArc Day 2–4 chapter figures (no React), so every
// number a reader sees can be unit-tested. All rates are made up.

export const inr = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

/** "₹9.01 lakh" for big amounts, full rupees below ₹1 lakh. */
export function inrShort(v) {
  if (Math.abs(v) < 1e5) return inr(v);
  const lakh = v / 1e5;
  return `₹${lakh >= 100 ? Math.round(lakh) : lakh.toFixed(2).replace(/\.?0+$/, "")} lakh`;
}

// ── Day 3 · prices and buying power ─────────────────────────────────
/** The thali's price each year at `pct` a year, rounded to rupees. */
export const priceAfter = (start, pct, years) => start * (1 + pct / 100) ** years;

/** How many thalis an amount buys (whole thalis). */
export const thalisFor = (amount, price) => Math.floor(amount / price + 1e-9);

// ── Day 3 · simple vs compound, Asha vs Dev ────────────────────────
export const simpleAt = (amount, pct, years) => amount * (1 + (pct / 100) * years);
export const compoundAt = (amount, pct, years) => amount * (1 + pct / 100) ** years;

/** Each year's interest under compounding: years 1…n. */
export const compoundYearly = (amount, pct, years) => Array.from({ length: years }, (_, k) => compoundAt(amount, pct, k + 1) - compoundAt(amount, pct, k));

/**
 * A monthly saver's balance at each birthday from `from` to `to`: ₹monthly
 * paid at each month's end while age is in [payFrom, payTo), growing at
 * pct/12 a month. Returns [{age, value, paidIn}].
 */
export function saverPath({ monthly, payFrom, payTo, from, to, pct }) {
  const i = pct / 1200;
  let value = 0;
  let paidIn = 0;
  const out = [{ age: from, value: 0, paidIn: 0 }];
  for (let age = from; age < to; age += 1) {
    for (let m = 0; m < 12; m += 1) {
      value *= 1 + i;
      if (age >= payFrom && age < payTo) {
        value += monthly;
        paidIn += monthly;
      }
    }
    out.push({ age: age + 1, value, paidIn });
  }
  return out;
}

// ── Day 4 · a loan's EMI and its schedule ──────────────────────────
export function emiFor(principal, monthlyPct, months) {
  const r = monthlyPct / 100;
  return (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1);
}

/** Month by month: how much of each EMI is interest and how much repays the loan. */
export function emiSchedule(principal, monthlyPct, months) {
  const emi = emiFor(principal, monthlyPct, months);
  let left = principal;
  return Array.from({ length: months }, () => {
    const interest = (left * monthlyPct) / 100;
    const repaid = emi - interest;
    left -= repaid;
    return { emi, interest, repaid, left: Math.max(0, left) };
  });
}

export const totalInterest = (principal, monthlyPct, months) => emiFor(principal, monthlyPct, months) * months - principal;

// ── Day 4 · a card bill, paying only the minimum ───────────────────
/**
 * Month by month, the balance after interest and the minimum payment:
 * [{month, balance, interestSoFar}] until it's cleared (or `cap` months).
 */
export function minimumOnly({ bill, monthlyPct, minPct, minFloor, cap = 240 }) {
  let balance = bill;
  let interest = 0;
  const out = [{ month: 0, balance, interestSoFar: 0 }];
  for (let m = 1; m <= cap && balance > 0.005; m += 1) {
    const charged = (balance * monthlyPct) / 100;
    balance += charged;
    interest += charged;
    balance -= Math.min(balance, Math.max(minFloor, (balance * minPct) / 100));
    out.push({ month: m, balance, interestSoFar: interest });
  }
  return out;
}
