// Plain maths for the WinterArc Day 5–7 figures (no React), so every number a
// reader sees can be unit-tested against the spec's tables
// (winterarcDays567.test.js). All amounts and rates are made up unless a
// config says otherwise.

export const inr = (v) => `${v < 0 ? "−" : ""}₹${Math.round(Math.abs(v)).toLocaleString("en-IN")}`;
export const fill = (t, v) => String(t || "").replace(/\{(\w+)\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));

// ── Day 5 · the pool ────────────────────────────────────────────────
export const poolShare = (sick, bill, size) => (sick * bill) / size;
export const expectedLoss = (sick, size, bill, years) => (sick / size) * bill * years;

// ── Day 5 · the claim machine ───────────────────────────────────────
/**
 * What the insurer pays and what the patient pays, stamp by stamp.
 * lines: [{id, amount, kind: "room" | "nonpayable" | "other"}];
 * policy: {sumInsured, roomLimit, roomRate, days, copay}; rules: which rules
 * are on ({room, copay}); ageMonths/waitMonths: the waiting period.
 */
export function claimRun(lines, policy, rules = { room: true, copay: true }, ageMonths = Infinity, waitMonths = 0) {
  const total = lines.reduce((s, l) => s + l.amount, 0);
  const roomCut = rules.room ? Math.max(0, policy.roomRate - policy.roomLimit) * policy.days : 0;
  const nonPayable = lines.filter((l) => l.kind === "nonpayable").reduce((s, l) => s + l.amount, 0);
  const admissible = total - roomCut - nonPayable;
  const copayCut = rules.copay ? (admissible * policy.copay) / 100 : 0;
  const beforeCap = admissible - copayCut;
  const waiting = ageMonths < waitMonths;
  const insurer = waiting ? 0 : Math.min(beforeCap, policy.sumInsured);
  return { total, roomCut, nonPayable, admissible, copayCut, insurer, patient: total - insurer, capped: !waiting && beforeCap > policy.sumInsured, waiting };
}

// ── Day 6 · the shock deck ──────────────────────────────────────────
/**
 * A year, month by month: (1) a shock is paid from the jar, the rest goes on
 * the card; (2) a card balance above ₹0 is charged `rate`% (rounded to the
 * rupee); (3) the monthly saving pays the card first, then refills the jar.
 * Returns the state after each month plus the year's totals.
 */
export function shockYear({ start, save, rate, shocks }) {
  let jar = start;
  let card = 0;
  let interest = 0;
  let debtMonths = 0;
  const months = [];
  for (let m = 1; m <= 12; m += 1) {
    const shock = shocks[m];
    let fromJar = 0;
    let toCard = 0;
    if (shock) {
      fromJar = Math.min(jar, shock.amount);
      jar -= fromJar;
      toCard = shock.amount - fromJar;
      card += toCard;
    }
    let charged = 0;
    if (card > 0) {
      charged = Math.round((card * rate) / 100);
      card += charged;
      interest += charged;
      debtMonths += 1;
    }
    const toDebt = Math.min(save, card);
    card -= toDebt;
    jar += save - toDebt;
    months.push({ month: m, shock: shock || null, fromJar, toCard, charged, jar, card, interest });
  }
  return { months, interest, debtMonths, card, jar };
}

// ── Day 6 · the reader's month (hero inputs; Arjun's numbers if skipped) ──
export function heroMonth(hero, c) {
  const a = hero?.answers || {};
  const income = a.income ?? c.defaultIncome;
  const must = Math.min(income, a.must ?? c.defaultMust);
  return { income, must, surplus: Math.max(0, income - must) };
}

// ── Day 6 · fund sizer ──────────────────────────────────────────────
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
/** The month a plan is ready, counting `n` months from January 2027 (n = 1 → January 2027). */
export function monthLabel(n, startYear = 2027) {
  const k = Math.max(1, n) - 1;
  return `${MONTHS[k % 12]} ${startYear + Math.floor(k / 12)}`;
}
export const monthsToBuild = (target, saving) => Math.ceil(target / Math.max(1, saving));

/** Notches on the jar: ₹5,000, one month of must-pay, the target (two notches if one month ≤ ₹5,000). */
export function notches(first, must, target, saving) {
  const list = must > first ? [first, must, target] : [first, target];
  return [...new Set(list)].filter((v) => v <= target).map((v) => ({ amount: v, months: monthsToBuild(v, saving) }));
}

// ── Day 6 · goal forge ──────────────────────────────────────────────
/** Monthly saving for a goal: amount ÷ months (Jan 2027 → target month, inclusive), up to the next ₹100. */
export const goalMonthly = (amount, months) => Math.ceil(amount / Math.max(1, months) / 100) * 100;

export function goalPlan(goals, spare) {
  const rows = goals.map((g) => ({ ...g, monthly: goalMonthly(g.amount, g.months) }));
  const need = rows.reduce((s, g) => s + g.monthly, 0);
  return { rows, need, spare, fits: need <= spare, over: Math.max(0, need - spare), left: Math.max(0, spare - need) };
}

export const goalLane = (months) => (months < 12 ? "short" : months <= 60 ? "medium" : "long");

// ── Day 7 · complaints ──────────────────────────────────────────────
/**
 * Checks a routed ticket. Returns {ok, bounce, line}: `bounce` is the stamp
 * ("Not yet" or "Not registered with us") when the ticket comes back.
 */
export function routeTicket(ticket, rung1, rung2) {
  if (!rung1 || !rung2) return { ok: false, bounce: null, line: "" };
  if (ticket.unregistered) {
    const reg = [rung1, rung2].find((c) => ticket.regulators.includes(c));
    if (reg) return { ok: false, bounce: "Not registered with us", line: ticket.feedback.unregistered };
  } else if (ticket.regulators.includes(rung1)) {
    return { ok: false, bounce: "Not yet", line: ticket.feedback.skipped };
  }
  const ok = ticket.rung1.includes(rung1) && ticket.rung2.includes(rung2);
  return { ok, bounce: ok ? null : "Try again", line: ok ? ticket.feedback.right : ticket.feedback.wrong?.[rung2] || ticket.feedback.other };
}
