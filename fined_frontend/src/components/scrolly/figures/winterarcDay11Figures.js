// WinterArc Day 11 "Mutual Funds": the three chapter figures. The Hostel Fund,
// its returns, costs and the "typical mixes" are made up and say so; the
// roles (AMC, custodian, trustees, RTA, SEBI) and the six-level riskometer are
// real. Checked by script (winterarcDays815.test.js): NAV ₹10.00 → ₹10.80;
// ₹5,000 buys 462.96 units; ₹10,000 at NAV ₹10 or ₹100 both end at ₹11,000;
// ₹1 lakh for 20 years at 10% less 0.5 / 1.0 / 1.5% = ₹6,14,161 / ₹5,60,441 /
// ₹5,11,205.

// Chapter 1 · "Run a fund" (UnitShop.jsx)
export const WA11_CH1_FUND = {
  friends: 100,
  each: 10000,
  nav0: 10,
  rise: 8,
  joiner: { name: "Arjun", amount: 5000 },
  compare: { amount: 10000, rise: 10, funds: [{ id: "a", label: "Fund A", nav: 10 }, { id: "b", label: "Fund B", nav: 100 }] },
  notes: [
    "The Hostel Fund (made up): 100 friends, ₹10,000 each.",
    "The holdings rise a made-up 8%.",
    "Arjun joins late with ₹5,000.",
    "Arjun has ₹10,000. Both funds hold similar companies and both rise 10%.",
  ],
  texts: {
    pool: "₹10 lakh, 1,00,000 units, NAV ₹10.00. Each friend holds 1,000 units.",
    rise: "Every friend's 1,000 units are now worth ₹10,800.",
    invest: "Invest ₹5,000",
    joined: "His money bought new units at today's NAV, so the existing friends' units weren't diluted. That's why a fund can keep taking new money.",
    guess_first: "Tap your guess first.",
    same: "Same ₹11,000. What matters is the % change, not the NAV level.",
    foot: "Costs are ignored in this chapter. Chapter 2 adds them.",
  },
};

// Chapter 2 · "Who holds your money" (FundVault.jsx)
export const WA11_CH2_VAULT = {
  cards: [
    { id: "r_amc", label: "AMC (the fund house)", zone: "pick" },
    { id: "r_cust", label: "Custodian", zone: "hold" },
    { id: "r_trust", label: "Trustees", zone: "watch" },
    { id: "r_rta", label: "Registrar (RTA)", zone: "record" },
    { id: "r_sebi", label: "SEBI", zone: "rules" },
  ],
  zones: [
    { id: "pick", label: "Picks the investments" },
    { id: "hold", label: "Holds the fund's securities safely" },
    { id: "watch", label: "Watches that the AMC acts for investors" },
    { id: "record", label: "Keeps the record of who owns which units" },
    { id: "rules", label: "Makes and enforces the rules (Day 7)" },
  ],
  start: 100000,
  gross: 10,
  years: 20,
  costs: [0.5, 1, 1.5],
  notes: ["Five roles, five jobs. Each right match locks a ring around the investors' money.", "The AMC tries to reach into the vault.", "₹1,00,000 for 20 years at a made-up 10% a year before costs."],
  texts: {
    placed: "{n} of 5 roles placed.",
    blocked: "The fund's assets are held separately from the AMC's own money.",
    blocked_note: "That separation doesn't stop market falls. A fund's value can still go down.",
    cost: "At {cost} a year: about {end} after 20 years.",
    gap: "0.5% vs 1.5%: a gap of about {gap}, from a cost that sounded small.",
    leak: "Leaked to costs over 20 years: about {leak}.",
  },
};

// Chapter 3 · "The menu" (FundMenu.jsx). Mixes and dial levels are made-up
// typical examples; every fund shows its own.
export const WA11_CH3_MENU = {
  cards: [
    { id: "j_weeks", label: "Park money for a few weeks", zone: "liquid" },
    { id: "j_steady", label: "Steadier returns over 1 to 3 years", zone: "debt" },
    { id: "j_growth", label: "Growth over 7+ years, with big swings", zone: "equity" },
    { id: "j_mix", label: "A mix of both in one fund", zone: "hybrid" },
  ],
  zones: [
    { id: "liquid", label: "Liquid fund", mix: [["Very short-term lending", 100]], level: 1 },
    { id: "debt", label: "Debt fund", mix: [["Bonds", 100]], level: 2 },
    { id: "hybrid", label: "Hybrid fund", mix: [["Shares", 65], ["Bonds", 35]], level: 4 },
    { id: "equity", label: "Equity fund", mix: [["Shares", 95], ["Cash", 5]], level: 5 },
  ],
  notes: ["Match each job to the type designed for it.", "Tap a type to swing Day 9's riskometer.", "Two ways in, and a fund that copies an index."],
  texts: {
    matched: "{n} of 4 matched. Mixes are made-up typical examples.",
    dial: "The riskometer is on every fund's fact sheet. It describes the fund, not whether it suits you.",
    taps: "Tomorrow: a lump sum or every month, and funds that copy an index.",
    foot: "This page explains fund types. It isn't a recommendation to invest in any.",
  },
};
