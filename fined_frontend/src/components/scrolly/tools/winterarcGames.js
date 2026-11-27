// Plain rules (no React) for the WinterArc Day 2–4 games, so every number a
// reader sees can be unit-tested (winterarcGames.test.js). All rates and
// amounts come from the card's config and are made up.
//   run_the_bank  (Day 2)  Run the Bank: lend, keep some ready, earn the gap
//   compound_race (Day 3)  Race to ₹10 lakh: start age vs monthly amount
//   card_months   (Day 4)  Six Statements: the minimum trap, month by month

export const rupees = (v) => `${v < 0 ? "−" : ""}₹${Math.round(Math.abs(v)).toLocaleString("en-IN")}`;

/** Fills {name} placeholders. */
export const fill = (text, values) => String(text || "").replace(/\{(\w+)\}/g, (m, k) => (values[k] !== undefined ? values[k] : m));

const joinNames = (names) => (names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`);

// ── Run the Bank ────────────────────────────────────────────────────────
// Saved state: { lend (percent), choices: {eventId: "yes" | "no" | "paid"} }.
// One month: savers are owed saver_rate/12 on all deposits; borrowers pay
// loan_rate/12 on what is lent at the month's end; any withdrawal the vault
// can't cover is borrowed in a hurry at emergency_rate/12.

export function bankRun(config, state = {}) {
  const deposits = config.deposits;
  const lend = state.lend;
  const choices = state.choices || {};
  if (lend == null) return { started: false, vault: deposits, lent: 0, log: [], next: null, done: false };
  let vault = Math.round((deposits * (100 - lend)) / 100);
  let lent = deposits - vault;
  let borrowed = 0;
  const waited = [];
  const log = [];
  let next = null;
  for (const ev of config.events) {
    const choice = choices[ev.id];
    if (!choice) {
      next = ev;
      break;
    }
    if (ev.kind === "withdraw") {
      const fromVault = Math.min(vault, ev.amount);
      const short = ev.amount - fromVault;
      vault -= fromVault;
      if (short > 0) {
        borrowed += short;
        waited.push(ev.who || ev.sender);
      }
      log.push({ event: ev, fromVault, short });
    } else {
      const yes = choice === "yes" && vault >= ev.amount;
      if (yes) {
        vault -= ev.amount;
        lent += ev.amount;
      }
      log.push({ event: ev, lent: yes });
    }
  }
  const earned = (lent * config.loan_rate) / 1200;
  const paid = (deposits * config.saver_rate) / 1200;
  const cost = (borrowed * config.emergency_rate) / 1200;
  return { started: true, vault, lent, borrowed, waited, log, next, done: next === null, earned, paid, cost, profit: earned - paid - cost };
}

/** A loan the vault can't cover can't be made: the reason, or "". */
export function bankLoanBlocked(run, ev, text) {
  return run.vault < ev.amount ? fill(text || "Only {vault} in the vault", { vault: rupees(run.vault) }) : "";
}

/** The month-end lines, written from this reader's choices. */
export function bankEnding(config, run) {
  const t = config.endings || {};
  const v = {
    profit: rupees(Math.max(0, run.profit)),
    loss: rupees(Math.max(0, -run.profit)),
    earned: rupees(run.earned),
    paid: rupees(run.paid),
    cost: rupees(run.cost),
    short: rupees(run.borrowed),
    who: joinNames(run.waited),
  };
  const costPart = run.cost > 0 ? fill(t.cost_part, v) : "";
  const lines = [fill(run.profit > 0 ? t.profit : t.loss, { ...v, cost_part: costPart })];
  if (run.lent === 0) lines.push(t.vault);
  lines.push(run.waited.length ? fill(t.waited, v) : t.paid_all);
  return lines.filter(Boolean);
}

export const bankDone = (cardData, state) => bankRun(cardData?.config || { events: [] }, state).done;

// ── Race to ₹10 lakh ───────────────────────────────────────────────────
// Saved state: { start, amount, length, tries: [{start, amount, length}], today }.
// ₹amount paid in at the end of every month from `start`, for 10 years or
// until end_age, growing at rate/12 a month until end_age.

export function raceResult(config, pick) {
  const i = config.rate / 1200;
  const total = (config.end_age - pick.start) * 12;
  const len = (config.lengths || []).find((l) => l.id === pick.length);
  const paying = len?.years ? Math.min(total, len.years * 12) : total;
  let value = 0;
  for (let m = 0; m < total; m += 1) {
    value *= 1 + i;
    if (m < paying) value += pick.amount;
  }
  const putIn = pick.amount * paying;
  return { total: value, putIn, growth: value - putIn, reached: value >= config.goal, years: paying / 12 };
}

/** The money a total is worth in today's prices (made-up inflation, from now_age). */
export const raceToday = (config, total) => total / (1 + config.inflation / 100) ** (config.end_age - config.now_age);

/** The reader's best try that reached the goal: the least of their own money. */
export function raceBest(config, tries = []) {
  const made = tries.map((t) => ({ ...t, ...raceResult(config, t) })).filter((r) => r.reached);
  return made.length ? made.reduce((a, b) => (b.putIn < a.putIn ? b : a)) : null;
}

/** The least own money that reaches the goal over every chip combination. */
export function raceMin(config) {
  let least = null;
  for (const start of config.starts)
    for (const amount of config.amounts)
      for (const l of config.lengths) {
        const r = raceResult(config, { start, amount, length: l.id });
        if (r.reached && (least === null || r.putIn < least)) least = r.putIn;
      }
  return least;
}

export function raceDone(cardData, state) {
  const config = cardData?.config;
  const tries = state?.tries || [];
  if (!config) return false;
  return tries.length >= (config.min_tries ?? 2) || !!raceBest(config, tries);
}

// ── Six Statements ─────────────────────────────────────────────────────
// Saved state: { months: {monthId: {spend: "yes" | "no", pay: "full" | "part" |
// "min" | "late" | "none"}}, record: ["ok" | "late", …] } (record is saved
// too, so Chapter 3's map can show the reader's own record).
// Each month: an optional swipe joins the bill, then the reader pays. What
// isn't paid carries over and is charged monthly_rate; paying after the due
// date also costs late_fee and goes on the record as late.

export function cardMinimum(config, balance) {
  return Math.min(balance, Math.max(config.min_floor, Math.round((balance * config.min_pct) / 100)));
}

/** The ways to pay a bill this month (ids), given the month's limits. */
export function cardOptions(config, month, balance) {
  if (balance <= 0) return ["none"];
  const min = cardMinimum(config, balance);
  const all = ["full", ...(balance > config.part_amount && config.part_amount > min ? ["part"] : []), ...(min < balance ? ["min"] : []), "late"];
  return month.only ? all.filter((id) => month.only.includes(id)) : all;
}

export function cardPayment(config, balance, payId) {
  if (payId === "full") return balance;
  if (payId === "part") return Math.min(config.part_amount, balance);
  if (payId === "none") return 0;
  return cardMinimum(config, balance); // "min", and "late" (the minimum, after the due date)
}

export function cardRun(config, state = {}) {
  const months = state.months || {};
  let balance = config.start_balance;
  let interest = 0;
  let fees = 0;
  let next = null;
  let nextBalance = balance;
  const log = [];
  for (const [k, m] of config.months.entries()) {
    const pick = months[m.id] || {};
    // everyday swipes (groceries, travel) join every bill after the first
    const everyday = k > 0 ? config.everyday?.amount || 0 : 0;
    if (m.spend && !pick.spend) {
      next = { month: m, ask: "spend", everyday };
      nextBalance = balance + everyday;
      break;
    }
    const due = balance + everyday + (m.spend && pick.spend === "yes" ? m.spend.amount : 0);
    if (!pick.pay || !cardOptions(config, m, due).includes(pick.pay)) {
      next = { month: m, ask: "pay", everyday };
      nextBalance = due;
      break;
    }
    const paid = cardPayment(config, due, pick.pay);
    const fee = pick.pay === "late" ? config.late_fee : 0;
    const charged = Math.round(((due - paid) * config.monthly_rate) / 100);
    interest += charged;
    fees += fee;
    balance = due - paid + charged + fee;
    log.push({ month: m, due, paid, pay: pick.pay, interest: charged, fee, balance, late: pick.pay === "late" });
  }
  return { log, next, due: nextBalance, balance, interest, fees, done: next === null };
}

/** One entry per finished month: "ok" (on time) or "late". */
export const cardRecord = (run) => run.log.map((l) => (l.late ? "late" : "ok"));

export function cardEnding(config, run) {
  const t = config.endings || {};
  const lates = run.log.filter((l) => l.late).length;
  const anyCarried = run.log.some((l) => l.paid < l.due);
  const v = {
    interest: rupees(run.interest),
    fees: rupees(run.fees),
    owed: rupees(run.balance),
    n: lates,
    payments: lates === 1 ? "payment" : "payments",
  };
  const lines = [];
  lines.push(run.interest + run.fees > 0 ? fill(t.lead_cost, { ...v, fees_part: run.fees > 0 ? fill(t.fees_part, v) : "" }) : t.lead_free);
  lines.push(run.balance > 0 ? fill(t.owed, v) : t.clear);
  lines.push(lates ? fill(t.record_late, v) : anyCarried ? t.record_min : t.record_full);
  return lines.filter(Boolean);
}

export const cardDone = (cardData, state) => cardRun(cardData?.config || { months: [] }, state).done;
