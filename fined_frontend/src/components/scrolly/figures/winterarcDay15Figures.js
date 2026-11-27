// WinterArc Day 15 "Choosing Mutual Funds": the three chapter figures. Every
// fund, return, benchmark, cost and star rating is made up and says so; no
// fund, AMC or rating agency is named. Checked by script
// (winterarcDays815.test.js): ₹5,000 a month for 180 months at 11.4% vs 10.4%
// = ₹23.83 lakh vs ₹21.69 lakh, gap ₹2.14 lakh, ₹9 lakh in; X after 2 years
// ₹1,305, reordered ₹972, Y ₹1,232; X ≈ 12.4% and Y ≈ 12.0% a year.

// Chapter 1 · "The wrong race" (FundTable.jsx)
export const WA15_CH1_TABLE = {
  funds: [
    { id: "a", label: "Fund A", r: 14, cat: "Large cap", bench: 13 },
    { id: "b", label: "Fund B", r: 30, cat: "Small cap", bench: 38 },
    { id: "c", label: "Fund C", r: 12, cat: "Large cap", bench: 13 },
  ],
  best: "a",
  excess: [1, -2, 3, -1, 2], // Fund A vs its benchmark, five made-up years
  notes: [
    "Case file: three funds, one year (all made up). Tap a crown onto the best.",
    "Category tags drop in.",
    "Each lane gets its finish line: its benchmark.",
    "Fund A against its benchmark, five made-up years.",
  ],
  texts: {
    crown_first: "Tap the fund you'd crown.",
    labels: "SEBI groups funds into categories by what they hold, so funds in one category can be compared with each other.",
    stamp: "Wrong race",
    b: "Fund B had the biggest number but the worst result against its own benchmark.",
    a: "Right. A beat its benchmark.",
    c: "C trailed its benchmark.",
    moved: "The crown moves to Fund A: +1 point against its benchmark.",
    long: "A's lead shrank and flipped in two of the five years. Compare over 5 years or more, and against the benchmark, not just against other funds' headline numbers.",
  },
};

// Chapter 2 · "Same fund, two prices" (DirectRegular.jsx)
export const WA15_CH2_PLANS = {
  monthly: 5000,
  months: 180,
  gross: 12,
  direct: 0.6,
  regular: 1.6,
  guess: { min: 10000, max: 500000, step: 10000, start: 50000 },
  notes: ["Twins: same fund, same holdings, two plans (costs made up).", "₹5,000 a month for 15 years, at a made-up 12% a year before costs.", "Where the extra 1% goes."],
  texts: {
    twins: "The regular plan's extra cost pays the distributor who sold it.",
    guessed: "You guessed {guess}. The 1% a year added up to about {gap}.",
    invested: "₹9 lakh went in either way.",
    fair: "The commission pays someone to help you, which some people value. The point is to know you're paying it and decide whether it's worth it to you. Distributors must have an ARN (Day 7).",
  },
};

// Chapter 3 · "Steady or rollercoaster" (SteadyRide.jsx)
export const WA15_CH3_RIDE = {
  start: 1000,
  x: [45, -10, 8, 25, 2],
  y: [12, 10, 14, 11, 13],
  xReorder: [-10, 8, 45, 25, 2],
  cut: 2,
  stars: { before: 5, after: 3 },
  checklist: [
    { id: "goal", label: "Does the category fit my goal and time?" },
    { id: "bench", label: "How has it done against its benchmark over 5+ years?" },
    { id: "cost", label: "What's the expense ratio, and is it direct or regular?" },
    { id: "bumpy", label: "How bumpy was the ride?" },
    { id: "risk", label: "What's the riskometer level?" },
    { id: "last", label: "Last year's return" },
  ],
  firstId: "goal",
  lastId: "last",
  notes: ["Two made-up funds over five years.", "You need the money at the end of year 2.", "A star rating, before and after one bad year (made up).", "Tap the cards in the order you'd check them."],
  texts: {
    same: "Both made about 12% a year: X about 12.4%, Y about 12.0%.",
    pick: "Pick X or Y for a goal due after year 2.",
    replay: "Replay X's years in a different order",
    cut: "X happened to be ahead at year 2. With the same years in a different order, it wasn't. A steadier path makes the timing matter less.",
    stars: "Ratings mostly summarise past returns and risk. They can change, and they don't know your goal.",
    built: "Checklist built.",
    good: "A sound order: goal first, last year's return last. Any order of the middle four works.",
    tweak: "Worth a tweak: the suggested order starts with the goal and ends with last year's return.",
    foot: "This is a way to read funds, not a recommendation of any fund.",
  },
};
