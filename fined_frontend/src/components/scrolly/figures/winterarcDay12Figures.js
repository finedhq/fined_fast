// WinterArc Day 12 "SIPs and Index Funds": the three chapter figures. Every
// NAV path, manager, return and cost is made up and says so; the SPIVA India
// result (over 10 years to June 2026, more than 70% of Indian active funds
// trailed their benchmark in every category; in 2025 most mid- and small-cap
// active funds beat theirs) is S&P Dow Jones Indices'. Checked by script
// (winterarcDays815.test.js): SIP 129.74 units, average ₹92.49, ₹14,271 vs
// lump sum ₹13,200; pause 79.34 units, ₹8,728; rising year SIP 95.90 units,
// ₹14,865 vs ₹18,600; exactly 3 of 10 managers beat the index next year.

// Chapter 1 · "The monthly habit" (SipSim.jsx)
export const WA12_CH1_SIP = {
  amount: 1000,
  months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  navs: [100, 90, 80, 70, 80, 90, 100, 110, 100, 95, 105, 110],
  decideAt: 2, // month 3 (0-based), NAV ₹80 and falling
  pause: [2, 3, 4, 5], // months 3 to 6
  rising: [100, 105, 110, 115, 120, 125, 130, 135, 140, 145, 150, 155],
  mood: [
    { at: 0, label: "Calm", face: "🙂", fear: 30 },
    { at: 1, label: "Worried", face: "😟", fear: 60 },
    { at: 2, label: "Fear", face: "😱", fear: 85 },
  ],
  headlines: ["Markets slide for a third month", "Friends are stopping their SIPs"],
  notes: [
    "Arjun's SIP: ₹1,000 on the 5th of every month in a made-up fund.",
    "Month 3. NAV ₹80 and falling.",
    "What if Arjun had put all ₹12,000 in on day one?",
    "A made-up year where prices only rise.",
  ],
  texts: {
    buckets: "Low months fill taller buckets: 14.3 units at ₹70, 9.1 at ₹110.",
    keep: "Keep the SIP",
    pause: "Pause for four months",
    kept: "You kept buying when units were cheapest.",
    paused: "Pausing felt safe. It skipped the four cheapest months.",
    guess_first: "Tap your guess first.",
    lump: "This falling-then-rising year, the SIP came out ahead.",
    play: "Play a rising year",
    rising: "Neither always wins. A SIP suits money that arrives monthly, like a stipend, and takes the 'when do I buy?' decision away. Lump sum does better when prices mostly rise after you invest, but nobody knows that in advance.",
    foot: "Made-up NAVs. Real years can be worse or better than either.",
  },
};

// Chapter 2 · "Pick the star" (ManagerPick.jsx)
export const WA12_CH2_MANAGERS = {
  costs: { active: 1.5, index: 0.2 },
  indexLast: 12,
  indexNext: 10,
  managers: [
    { id: "m1", name: "Asha", last: 28, next: 6 },
    { id: "m2", name: "Bharat", last: 19, next: 8 },
    { id: "m3", name: "Chitra", last: 15, next: 13 },
    { id: "m4", name: "Dev", last: 13, next: 9 },
    { id: "m5", name: "Esha", last: 11, next: 9 },
    { id: "m6", name: "Farhan", last: 10, next: 12 },
    { id: "m7", name: "Gita", last: 9, next: 7 },
    { id: "m8", name: "Harsh", last: 7, next: 14 },
    { id: "m9", name: "Isha", last: 4, next: 5 },
    { id: "m10", name: "Jai", last: -2, next: 9 },
  ],
  notes: [
    "Two ways to run a fund. Costs are made up.",
    "Ten made-up fund managers and last year's results. Tap the one you'd back.",
    "Next year plays out. The index makes +10%.",
    "S&P Dow Jones Indices' SPIVA India scorecard.",
  ],
  texts: {
    pick_first: "Pick a manager at 2.2 first.",
    play: "Play next year",
    star: "Last year's star trailed the index this year.",
    beat: "Your pick beat it this year. Would you have known in advance?",
    other: "Your pick made {r} against the index's +10%.",
    beat_count: "Only {n} of 10 beat the index this year, and they're mostly different names.",
    long: "10 years to June 2026: more than 7 in 10 active funds trailed their benchmark, in every category.",
    short: "2025, mid and small cap: most active funds beat their benchmark.",
    source: "Source: S&P Dow Jones Indices, SPIVA India.",
    foot: "Past results, not a forecast. This isn't a recommendation of active or index funds.",
  },
};

// Chapter 3 · "Copy the index" (IndexFund.jsx). Day 10's FinEd Five weights.
export const WA12_CH3_INDEX_FUND = {
  amount: 1000,
  companies: [
    { id: "bank", name: "Big Bank", w: 40 },
    { id: "pixel", name: "Pixel Pay", w: 25 },
    { id: "chai", name: "Chai Point", w: 15 },
    { id: "sun", name: "Sun Roof", w: 12 },
    { id: "kisan", name: "Kisan Seeds", w: 8 },
  ],
  swap: { out: "kisan", in: { id: "green", name: "Green Cart", w: 8 } },
  indexReturn: 12,
  fundReturn: 11.8,
  notes: ["The FinEd Five Index Fund (made up): Arjun's ₹1,000, split like the index.", "Kisan Seeds leaves the index. Green Cart joins.", "One made-up year."],
  texts: {
    split: "Same weights as the index. No one picks.",
    apply: "Apply the index change",
    applied: "The fund sold its Kisan Seeds slice and bought Green Cart in the new weight. No manager decision.",
    stamp: "Follows the index",
    gap: "The 0.2% gap is mostly costs: the tracking difference. When comparing index funds on the same index, a smaller gap is what you're looking for.",
  },
};
