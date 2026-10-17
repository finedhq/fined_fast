// Module 8 ("Reading the Market") — everything its figures draw (decision
// D27: figure numbers live in frontend code, not in card data). Every number
// is made up: the three-company index, the five yearly levels, Tiffin
// Theory's dividend, split, bonus and year of prices. The Nifty 50 / Sensex
// company counts (50, 30) are real and sourced in Admin → Content sources.

// Chapter 1 · "The Market's Report Card" (steps 1.1 – 1.4). A different set
// of bars at each step. The index arithmetic: weights 50 / 30 / 20 %, so a 10%
// move is 5, 3 or 2 points on an index at 100. Step 1.3 (simplified, owner
// 17 Oct 2026) shows only the big one rising (+5) and the small one falling
// (−2): the index ends 3 higher. e_mid stays for reference, unshown.
export const M8_CH1_BARS = {
  layout: "shown",
  series: [
    { id: "big", label: "Big company", percent: 50 },
    { id: "mid", label: "Medium company", percent: 30 },
    { id: "small", label: "Small company", percent: 20 },
    { id: "nifty", label: "Nifty 50 (NSE)", count: 50 },
    { id: "sensex", label: "Sensex (BSE)", count: 30 },
    { id: "e_big", label: "Big company +10%", points: 5 },
    { id: "e_mid", label: "Medium +10%", points: 3 },
    { id: "e_small", label: "Small company −10%", points: 2 },
    { id: "y1", label: "Year 1", level: 100 },
    { id: "y2", label: "Year 2", level: 120 },
    { id: "y3", label: "Year 3", level: 140 },
    { id: "y4", label: "Year 4", level: 110 },
    { id: "y5", label: "Year 5", level: 90 },
  ],
  views: [
    { measure: "percent", axis: "Share of the basket (%)", scale: "linear", show: ["big", "mid", "small"], note: "One made-up basket of three companies." },
    { measure: "count", axis: "Companies in the basket", scale: "linear", show: ["nifty", "sensex"] },
    {
      measure: "points",
      axis: "How far each one moves an index of 100",
      scale: "linear",
      show: ["e_big", "e_small"],
      notes: { e_big: "pushes it up", e_small: "pulls it down" },
      note: "Up 5, down 2: the index ends 3 points higher.",
      pulse: "e_big",
      revealOnGuess: true,
    },
    {
      measure: "level",
      axis: "A made-up index at each year's end",
      scale: "linear",
      show: ["y1", "y2", "y3", "y4", "y5"],
      tone: 0,
      notes: { y2: "rising", y3: "rising", y4: "falling", y5: "falling" },
    },
  ],
};

// Chapter 2 · "When Companies Share the Profit" (steps 2.1 – 2.4). Arjun's 10
// of Tiffin Theory's 1,000 shares at ₹100: ₹2 a share = ₹20; a split into n
// gives 10n shares at ₹100 ÷ n, still ₹1,000; a 1-for-2 bonus = 1,500 shares,
// Arjun's 10 → 15.
export const M8_CH2_GRID = {
  actions: true,
  company: "Tiffin Theory",
  owner: "Arjun",
  total: 1000,
  cols: 50, // 20 rows now, 30 after the bonus: short enough to leave room for the slider
  holding: 10,
  price: 100,
  steps: [
    { action: "dividend", perShare: 2, caption: "Part of the profit, paid out per share." },
    { action: "kept", caption: "Or the company keeps the profit to grow. It decides." },
    { action: "split", control: { label: "Split each share into", min: 1, max: 10, step: 1, start: 1 } },
    { action: "bonus", ratio: [1, 2], label: "Unchanged: same pie, more slices", caption: "A made-up 1-for-2 bonus." },
  ],
};

// Chapter 3 · "Two Ways People Decide" (steps 3.1 – 3.3). A made-up year.
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const M8_CH3_CHART = {
  series: [{ id: "price", label: "Tiffin Theory's price", values: [80, 84, 90, 88, 95, 100, 97, 105, 110, 104, 108, 100] }],
  x: MONTHS,
  format: "inr",
  volume: { label: "Shares traded", values: [30, 25, 40, 35, 45, 60, 38, 70, 90, 55, 50, 42] },
  markers: [{ id: "high", label: "52-week high ₹110", at: 8, value: 110 }],
  note: "Made-up prices.",
  steps: [
    { show: ["price"] },
    {
      show: ["price", "high", "volume"],
      choose: {
        start: "line",
        options: [
          { id: "line", label: "Price line", text: "The price over time.", focus: ["price"] },
          { id: "high", label: "52-week high", text: "The highest price in the last year.", focus: ["high"] },
          { id: "volume", label: "Volume", text: "How many shares changed hands each day.", focus: ["volume"] },
        ],
      },
    },
    { show: ["price"], future: { from: 9, label: "What happens next is unknown." } },
  ],
};
