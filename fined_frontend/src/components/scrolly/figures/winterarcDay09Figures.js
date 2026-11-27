// WinterArc Day 9 "Risk and Return": the three chapter figures. The return
// model and every company are made up and say so; the riskometer's six
// levels are SEBI's (Oct 2020 circular). Checked by script
// (winterarcDays815.test.js): shares years below 0% = 27 / 9 / 3 of 100 at
// 1 / 5 / 10 years, bonds 8 / 0 / 0; baskets −22.3 (three EV makers), +16.2
// (one from five industries), +1.3 (all ten), +6.3 (the 3.4 swap), and the
// range bar by basket size.

// Chapter 1 · "The spread" (SpreadCloud.jsx). Average yearly return over N
// years uses sd ÷ √N. `below` fixes how many of the 100 stored dots are < 0.
export const WA9_CH1_CLOUD = {
  columns: [
    { id: "deposit", label: "Deposit", mean: 6.5, sd: 0, below: [0, 0, 0] },
    { id: "bond", label: "Bond-like", mean: 7, sd: 5, below: [8, 0, 0] },
    { id: "shares", label: "Shares-like", mean: 11, sd: 18, below: [27, 9, 3] },
  ],
  horizons: [1, 5, 10],
  defaultHorizon: 5,
  axis: [-30, 50],
  glow: 40,
  rolls: 5,
  notes: [
    "A made-up model. Each dot is one possible year.",
    "How often does the shares basket lose money in a year?",
    "Hold longer: each dot is now the average yearly return over that many years.",
    "Last year's 40% is one dot.",
  ],
  texts: {
    roll: "Roll a year from the shares cloud",
    rolled: "Your {n} rolled years: {list}.",
    reveal: "{n} of 100 years below zero.",
    h1: "Wide spread. If you might need the money within a year, a big swing can land at the wrong moment.",
    h5: "Narrower. Loss years in this model: {n} in 100.",
    h10: "Narrower, but still not zero. Longer holding reduced the spread in this model; it didn't remove risk.",
    glow: "One great year tells you the cloud is wide, not where next year's dot lands.",
    foot: "A made-up model to show a pattern. Real markets can do worse than any model.",
  },
};

// Chapter 2 · "Name that risk" (NameRisk.jsx)
export const WA9_CH2_RISKS = {
  cards: [
    { id: "c_market", label: "The whole market fell 20% in a month.", zone: "market" },
    { id: "c_inflation", label: "Her FD's 6% didn't keep up with 7% price rises.", zone: "inflation" },
    { id: "c_credit", label: "The company that borrowed her money couldn't pay it back.", zone: "credit" },
    { id: "c_liquidity", label: "She needed cash in a week, but her flat takes months to sell.", zone: "liquidity" },
    { id: "c_conc", label: "All her money was in one company, and it collapsed.", zone: "concentration" },
    { id: "c_rate", label: "Rates went up and her old bond's price fell.", zone: "rate" },
  ],
  zones: [
    { id: "market", label: "Market risk", shield: "Time and a long horizon" },
    { id: "inflation", label: "Inflation risk", shield: "Something that can outgrow prices" },
    { id: "credit", label: "Credit risk", shield: "Check who you're lending to" },
    { id: "liquidity", label: "Liquidity risk", shield: "Keep an emergency fund (Day 6)" },
    { id: "concentration", label: "Concentration risk", shield: "Spread across many" },
    { id: "rate", label: "Interest-rate risk", shield: "Match the bond's length to your timeline (Day 13)" },
  ],
  answerLevel: 5,
  notes: ["Six ways money can go wrong. Match each situation to its risk.", "Each risk has its own shield.", "Where would a fund holding mostly company shares sit?"],
  texts: {
    matched: "{n} of 6 matched.",
    dial_pick: "Tap a level for a fund that holds mostly company shares.",
    dial_after: "You picked {pick}. Most share-based funds sit at High or Very High.",
    dial_foot: "The riskometer tells you how risky the fund's holdings are, not whether it suits you.",
  },
};

// Chapter 3 · "Eggs and baskets" (Baskets.jsx). One made-up year (% change).
export const WA9_CH3_BASKETS = {
  companies: [
    { id: "chai", name: "Chai Point Co.", industry: "Food", r: 22 },
    { id: "volt", name: "Volt Scooters", industry: "EV", r: -25 },
    { id: "spark", name: "Spark EV Parts", industry: "EV", r: -20 },
    { id: "shuttle", name: "Shuttle Bikes", industry: "EV", r: -22 },
    { id: "pixel", name: "Pixel Pay", industry: "Payments", r: 28 },
    { id: "green", name: "Green Cart", industry: "Retail", r: 14 },
    { id: "byte", name: "Byte Tutor", industry: "Edtech", r: -60 },
    { id: "sun", name: "Sun Roof Solar", industry: "Energy", r: 40 },
    { id: "kisan", name: "Kisan Seeds", industry: "Farming", r: 16 },
    { id: "steel", name: "Steel Bridge Infra", industry: "Infra", r: 20 },
  ],
  presets: [
    { id: "one", label: "All-in on one", ids: ["byte"] },
    { id: "ev", label: "Three EV makers", ids: ["volt", "spark", "shuttle"] },
    { id: "five", label: "One from five industries", ids: ["chai", "volt", "pixel", "sun", "kisan"] },
    { id: "all", label: "All ten", ids: ["chai", "volt", "spark", "shuttle", "pixel", "green", "byte", "sun", "kisan", "steel"] },
  ],
  news: [
    { text: "Byte Tutor in accounting scandal", ids: ["byte"] },
    { text: "EV subsidy cut hits scooter makers", ids: ["volt", "spark", "shuttle"] },
    { text: "Solar demand surges", ids: ["sun"] },
  ],
  swap: ["volt", "pixel", "kisan"],
  evIds: ["volt", "spark", "shuttle"],
  notes: [
    "Ten fictional companies across eight industries. Pick any, or a preset. Money splits equally.",
    "One made-up year. News hits.",
    "Every basket size, best to worst.",
    "Three companies, one risk.",
  ],
  texts: {
    count: "{n} companies, {m} industries",
    empty: "Pick at least one company to run the year.",
    result: "Your basket: {r} this year.",
    range: "Spreading out didn't give the best result; one lucky pick beat it. It removed the worst results. That's the trade.",
    swap_btn: "Swap two EV makers for other industries",
    swapped: "Three EV makers: {ev}. Volt, Pixel Pay and Kisan Seeds: {mix}. Real diversification is spreading across things that don't fall for the same reason.",
  },
};
