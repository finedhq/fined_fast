// The WinterArc "Arc card" (Days 5–7 on): the completion card shows a small
// collectible card with the reader's own results from the day's games, read
// from this tab's page state. The completion card's `arc: {kind, label}`
// picks the day; chapter slugs here must match the day's cards (checked in
// winterarcDays567.test.js). Nothing here is scored or saved.
import { WA5_CH2_CLAIM, WA5_CH3_SHIELD } from "./figures/winterarcDay05Figures";
import { WA6_CH1_DECK, WA6_CH2_FUND, WA6_CH3_GOALS } from "./figures/winterarcDay06Figures";
import { WA7_CH1_CITY, WA7_CH3_DESK } from "./figures/winterarcDay07Figures";
import { claimRun, goalPlan, heroMonth, inr, monthLabel, monthsToBuild, shockYear } from "./figures/winterarcDays567Math";
import { WA8_CH1_DOORS } from "./figures/winterarcDay08Figures";
import { WA9_CH2_RISKS, WA9_CH3_BASKETS } from "./figures/winterarcDay09Figures";
import { WA10_CH2_IPO } from "./figures/winterarcDay10Figures";
import { WA11_CH2_VAULT } from "./figures/winterarcDay11Figures";
import { WA12_CH2_MANAGERS } from "./figures/winterarcDay12Figures";
import { WA13_CH3_LENDERS } from "./figures/winterarcDay13Figures";
import { WA14_CH1_GOLD, WA14_CH2_LOCKS, WA14_CH3_BATTLE } from "./figures/winterarcDay14Figures";
import { WA15_CH1_TABLE, WA15_CH2_PLANS } from "./figures/winterarcDay15Figures";
import { basketSummary, inrBig, monthlyPot, pct, real, savingsValues } from "./figures/winterarcDays815Math";

export const ARC_CHAPTERS = {
  wa5: { pool: "wa-d05-ch1-pool", claim: "wa-d05-ch2-claim-machine", shield: "wa-d05-ch3-shield-loadout" },
  wa6: { deck: "wa-d06-ch1-shock-deck", fund: "wa-d06-ch2-size-yours", goals: "wa-d06-ch3-goal-forge" },
  wa7: { city: "wa-d07-ch1-money-city", desk: "wa-d07-ch3-complaint-router" },
  wa8: { doors: "wa-d08-ch1-three-doors", time: "wa-d08-ch3-time-machine" },
  wa9: { risks: "wa-d09-ch2-name-risk", baskets: "wa-d09-ch3-baskets" },
  wa10: { ipo: "wa-d10-ch2-ipo", index: "wa-d10-ch3-index" },
  wa11: { fund: "wa-d11-ch1-run-fund", vault: "wa-d11-ch2-who-holds" },
  wa12: { sip: "wa-d12-ch1-sip", mgr: "wa-d12-ch2-pick-star" },
  wa13: { seesaw: "wa-d13-ch2-seesaw", lenders: "wa-d13-ch3-rate-rise" },
  wa14: { gold: "wa-d14-ch1-gold", locks: "wa-d14-ch2-locked", battle: "wa-d14-ch3-card-battle" },
  wa15: { table: "wa-d15-ch1-wrong-race", plans: "wa-d15-ch2-direct-regular", ride: "wa-d15-ch3-consistency" },
};

// a tap-guess answer from a chapter's saved state, by step id
const guessed = (steps, slug, stepId) => steps[slug]?.guesses?.[stepId];
const HORIZON = { 1: "Within 1 year", 5: "1 to 5 years", 10: "More than 5 years" };

const STATS = {
  wa5(steps) {
    const ch = ARC_CHAPTERS.wa5;
    const pool = steps[ch.pool]?.pool || {};
    const claim = steps[ch.claim]?.claim || {};
    const shield = steps[ch.shield]?.shield || {};
    const paid = claimRun(WA5_CH2_CLAIM.lines, WA5_CH2_CLAIM.policy).insurer;
    const sorted = shield.done ? WA5_CH3_SHIELD.cards.filter((c) => c.zones.includes(shield.placed?.[c.id])).length : null;
    return [
      { label: "Pool", value: pool.choice === "join" ? "Joined" : pool.choice === "solo" ? "Went solo" : "Not played" },
      { label: "Claim guess", value: claim.locked ? (claim.guess === paid ? "Spot on" : `Off by ${inr(Math.abs(paid - claim.guess))}`) : "No guess" },
      { label: "Risks sorted", value: sorted == null ? "Not sorted" : `${sorted} of ${WA5_CH3_SHIELD.cards.length}` },
    ];
  },
  wa6(steps, hero) {
    const ch = ARC_CHAPTERS.wa6;
    const deck = steps[ch.deck]?.deck || {};
    const fund = steps[ch.fund]?.fund || {};
    const goals = steps[ch.goals]?.goals || {};
    const tried = deck.tried || (deck.start != null ? [deck.start] : []);
    const best = tried.map((s) => ({ s, i: shockYear({ start: s, save: WA6_CH1_DECK.save, rate: WA6_CH1_DECK.rate, shocks: WA6_CH1_DECK.shocks }).interest })).sort((a, b) => a.i - b.i)[0];
    const { income, must, surplus } = heroMonth({ answers: hero }, WA6_CH2_FUND);
    const months = fund.months ?? 3;
    const saving = Math.min(surplus, fund.saving ?? WA6_CH2_FUND.defaultSave);
    const target = must * months;
    const picked = goals.picked?.length ? goals.picked : WA6_CH3_GOALS.defaults;
    const rows = picked
      .filter((id) => !(goals.removed || []).includes(id))
      .map((id) => ({ ...WA6_CH3_GOALS.presets.find((p) => p.id === id), ...(goals.edits?.[id] || {}) }));
    const plan = goalPlan(rows, Math.max(0, income - must - saving));
    return [
      { label: "Starting buffer", value: best ? `${inr(best.s)} · ${inr(best.i)} interest` : "Not played" },
      { label: "Jar target", value: `${inr(target)} by ${monthLabel(monthsToBuild(target, Math.max(500, saving)))}` },
      { label: "Plan", value: plan.fits ? "Fits" : "Doesn't fit yet" },
    ];
  },
  wa7(steps) {
    const ch = ARC_CHAPTERS.wa7;
    const city = steps[ch.city]?.city || {};
    const desk = steps[ch.desk]?.desk || {};
    const placed = city.done ? WA7_CH1_CITY.players.filter((p) => city.placed?.[p.id] === p.tower).length : null;
    const first = WA7_CH3_DESK.tickets.filter((t) => desk[t.id]?.first).length;
    return [
      { label: "Players placed", value: placed == null ? "Not sorted" : `${placed} of ${WA7_CH1_CITY.players.length}` },
      { label: "AMFI", value: city.amfi ? (city.amfi === "none" ? "Spotted" : "Fooled") : "Not tried" },
      { label: "Tickets right first time", value: `${first} of ${WA7_CH3_DESK.tickets.length}` },
    ];
  },
  wa8(steps) {
    const ch = ARC_CHAPTERS.wa8;
    const d = steps[ch.doors]?.doors || {};
    const c = WA8_CH1_DOORS;
    const years = c.path.length;
    const today = real(savingsValues(c.start, c.saveRate, years)[years - 1], c.inflation, years);
    const who = guessed(steps, ch.time, "s3-1");
    return [
      { label: "Door 1 guess", value: d.locked ? `Off by ${inr(Math.abs(today - d.guess))}` : "No guess" },
      { label: "In the crash you", value: d.choice === "hold" ? "Held" : d.choice === "sell" ? "Sold" : "Didn't choose" },
      { label: "Who has more at 60", value: who ? (who === "arjun" ? "Right first time" : "Fooled by the amount") : "No guess" },
    ];
  },
  wa9(steps, hero) {
    const ch = ARC_CHAPTERS.wa9;
    const r = steps[ch.risks]?.risks || {};
    const b = steps[ch.baskets]?.baskets || {};
    const sum = basketSummary(b.picked || [], WA9_CH3_BASKETS.companies);
    const matched = WA9_CH2_RISKS.cards.filter((k) => r.placed?.[k.id] === k.zone).length;
    return [
      { label: "Horizon", value: HORIZON[hero.amount] || "Skipped" },
      { label: "Basket", value: sum.n ? `${sum.n} companies, ${sum.m} industries, ${pct(sum.r)}` : "Not built" },
      { label: "Risks matched", value: r.done ? `${matched} of 6` : "Not matched" },
    ];
  },
  wa10(steps) {
    const ch = ARC_CHAPTERS.wa10;
    const ipo = steps[ch.ipo]?.ipo || {};
    const g = guessed(steps, ch.index, "s3-2");
    return [
      { label: "Your stake after raising money", value: "83.3%" },
      { label: "IPO", value: ipo.applied ? `Applied for ${ipo.lots || 1} lot${(ipo.lots || 1) > 1 ? "s" : ""}, 1 ticket of ${WA10_CH2_IPO.balls}` : "Didn't apply" },
      { label: "Index guess", value: g ? (g === "down" ? "Right" : "Wrong") : "No guess" },
    ];
  },
  wa11(steps) {
    const ch = ARC_CHAPTERS.wa11;
    const g = guessed(steps, ch.fund, "s1-4");
    const v = steps[ch.vault]?.vault || {};
    const roles = WA11_CH2_VAULT.cards.filter((k) => v.placed?.[k.id] === k.zone).length;
    return [
      { label: "NAV myth", value: g ? (g === "same" ? "Busted" : "Fooled") : "No guess" },
      { label: "Cost picked", value: `${(v.cost ?? 1).toFixed(1)}%` },
      { label: "Roles placed", value: v.done ? `${roles} of 5` : "Not sorted" },
    ];
  },
  wa12(steps) {
    const ch = ARC_CHAPTERS.wa12;
    const sip = steps[ch.sip]?.sip || {};
    const mgr = steps[ch.mgr]?.mgr || {};
    const pick = WA12_CH2_MANAGERS.managers.find((m) => m.id === mgr.pick);
    const g = guessed(steps, ch.sip, "s1-3");
    return [
      { label: "In the dip you", value: sip.choice === "keep" ? "Kept the SIP" : sip.choice === "pause" ? "Paused the SIP" : "Didn't choose" },
      { label: "Star pick next year", value: pick ? `${pct(pick.next, 0)} vs index +${WA12_CH2_MANAGERS.indexNext}%` : "No pick" },
      { label: "Lump-sum guess", value: g ? (g === "sip" ? "Right" : "Wrong") : "No guess" },
    ];
  },
  wa13(steps) {
    const ch = ARC_CHAPTERS.wa13;
    const ss = steps[ch.seesaw]?.seesaw || {};
    const l = steps[ch.lenders]?.lenders || {};
    const all = WA13_CH3_LENDERS.tiles.every((t) => l.answers?.[t.id]);
    const right = WA13_CH3_LENDERS.tiles.filter((t) => l.answers?.[t.id] === t.answer).length;
    return [
      { label: "Your selling price", value: ss.offered ? `${inr(ss.ask)} (fair ≈ ₹9,601)` : "Didn't offer" },
      { label: "Rate-rise guesses", value: all ? `${right} of 3` : "Not tried" },
    ];
  },
  wa14(steps) {
    const ch = ARC_CHAPTERS.wa14;
    const gold = steps[ch.gold]?.gold || {};
    const locks = steps[ch.locks]?.locks || {};
    const bt = steps[ch.battle]?.battle || {};
    const route = WA14_CH1_GOLD.routes.find((r) => r.id === gold.pick);
    const timeline = WA14_CH2_LOCKS.cards.filter((k) => locks.placed?.[k.id] === k.zone).length;
    const battle = WA14_CH3_BATTLE.challenges.filter((x) => bt.first?.[x.id] === x.win).length + (bt.final ? 1 : 0);
    return [
      { label: "Gold route picked", value: route ? `${route.label} (held ${inr(route.held)})` : "No pick" },
      { label: "Timeline", value: locks.done ? `${timeline} of 5` : "Not placed" },
      { label: "Card battle", value: `${battle} of 6` },
    ];
  },
  wa15(steps) {
    const ch = ARC_CHAPTERS.wa15;
    const t = steps[ch.table]?.table || {};
    const p = steps[ch.plans]?.plans || {};
    const r = steps[ch.ride]?.ride || {};
    const c = WA15_CH2_PLANS;
    const pot = (cost) => monthlyPot({ monthly: c.monthly, rate: c.gross - cost, payMonths: c.months, totalMonths: c.months });
    const gap = pot(c.direct) - pot(c.regular);
    return [
      { label: "First crown", value: t.crown ? WA15_CH1_TABLE.funds.find((f) => f.id === t.crown).label : "No crown" },
      { label: "Gap guess", value: p.locked ? `Off by ${inrBig(Math.abs(gap - p.guess))}` : "No guess" },
      { label: "Checklist", value: (r.order || []).length === 6 ? "Built" : "Not built" },
    ];
  },
};

/** {label, stats: [{label, value}]} for a completion card with `arc`, else null. */
export function arcCard(card, page) {
  const arc = card?.card_data?.arc;
  const fn = arc && STATS[arc.kind];
  return fn ? { label: arc.label, stats: fn(page.steps || {}, page.hero || {}) } : null;
}
