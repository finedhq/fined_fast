// Arithmetic for the Leak Lab — a straight port of the prototype's
// fined-scrolly/module-1-market/js/util/finance.js. Matches the content
// spec's citation #16: real value = amount × (1 + r)^n ÷ (1 + i)^n, where the
// nominal rate is haircut by the flat tax-on-interest slab first.
//
// Checked in finance.test.js against the spec's worked examples:
//   savings 2.5%, 0% tax, 5% inflation, 10y, ₹1L  → nominal ₹1,28,008 / real ₹78,586
//   FD 6.25%,     0% tax, 5% inflation, 10y, ₹1L  → real ₹1,12,563
//   FD 6.25%,    20% tax, 5% inflation, 10y, ₹1L  → real exactly ₹1,00,000

export function effectiveRate(nominalRatePct, taxPct) {
  return (nominalRatePct / 100) * (1 - taxPct / 100);
}

export function nominalValue(amount, years, nominalRatePct, taxPct) {
  const r = effectiveRate(nominalRatePct, taxPct);
  return amount * Math.pow(1 + r, years);
}

export function realValue(amount, years, nominalRatePct, taxPct, inflationPct) {
  const nominal = nominalValue(amount, years, nominalRatePct, taxPct);
  return nominal / Math.pow(1 + inflationPct / 100, years);
}

export function verdictFor(real, amount) {
  const ratio = real / amount;
  if (ratio > 1.02) return { label: "Growing in real terms", cls: "growing" };
  if (ratio >= 0.98) return { label: "About holding its value", cls: "holding" };
  return { label: "Losing real value", cls: "losing" };
}

export function fmtRupee(n) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A model card's `as_of` ("2026-09") as "Sep 2026"; "" if it isn't a year-month. */
export function asOfLabel(asOf) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(asOf ?? "").trim());
  if (!m) return "";
  const month = Number(m[2]);
  return month >= 1 && month <= 12 ? `${MONTHS[month - 1]} ${m[1]}` : "";
}
