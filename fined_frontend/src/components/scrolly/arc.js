// The WinterArc "Arc card" (Days 5–7 on): the completion card shows a small
// collectible card with the reader's own results from the day's games, read
// from this tab's page state. The completion card's `arc: {kind, label}`
// picks the day; chapter slugs here must match the day's cards (checked in
// winterarcDays567.test.js). Nothing here is scored or saved.
import { WA5_CH2_CLAIM, WA5_CH3_SHIELD } from "./figures/winterarcDay05Figures";
import { WA6_CH1_DECK, WA6_CH2_FUND, WA6_CH3_GOALS } from "./figures/winterarcDay06Figures";
import { WA7_CH1_CITY, WA7_CH3_DESK } from "./figures/winterarcDay07Figures";
import { claimRun, goalPlan, heroMonth, inr, monthLabel, monthsToBuild, shockYear } from "./figures/winterarcDays567Math";

export const ARC_CHAPTERS = {
  wa5: { pool: "wa-d05-ch1-pool", claim: "wa-d05-ch2-claim-machine", shield: "wa-d05-ch3-shield-loadout" },
  wa6: { deck: "wa-d06-ch1-shock-deck", fund: "wa-d06-ch2-size-yours", goals: "wa-d06-ch3-goal-forge" },
  wa7: { city: "wa-d07-ch1-money-city", desk: "wa-d07-ch3-complaint-router" },
};

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
};

/** {label, stats: [{label, value}]} for a completion card with `arc`, else null. */
export function arcCard(card, page) {
  const arc = card?.card_data?.arc;
  const fn = arc && STATS[arc.kind];
  return fn ? { label: arc.label, stats: fn(page.steps || {}, page.hero || {}) } : null;
}
