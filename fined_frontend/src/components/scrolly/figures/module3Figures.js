// Module 3 ("Who's Actually in the Room?") — every number its figures draw
// (decision D27: figure numbers live in frontend code, not in card data).
// Sources are listed in Admin → Content sources; the trading shares change
// every month, so re-check them before each release.

// Chapter 1 — share of NSE cash-market turnover by group (NSE Market Pulse,
// July 2026 edition, data for June 2026). Individuals 32.7% (fact audit,
// 3 Oct 2026); the two institution shares are the spec's and still need
// confirming against the PDF; "everyone else" = 100 − the other three.
// One more bar per step; the numbers appear only at step 4.
const WHO_TRADES_AXIS = "Share of all cash-market trading";
export const M3_CH1_BARS = {
  series: [
    { id: "retail", label: "People like Arjun", percent: 32.7 },
    { id: "domestic", label: "Indian institutions", percent: 13.0 },
    { id: "foreign", label: "Foreign investors", percent: 13.1 },
    { id: "rest", label: "Everyone else", percent: 41.2 },
  ],
  views: [
    { measure: "percent", axis: WHO_TRADES_AXIS, scale: "linear", show: ["retail"], values: false },
    { measure: "percent", axis: WHO_TRADES_AXIS, scale: "linear", show: ["retail", "domestic"], values: false },
    { measure: "percent", axis: WHO_TRADES_AXIS, scale: "linear", show: ["retail", "domestic", "foreign"], values: false },
    {
      measure: "percent",
      axis: WHO_TRADES_AXIS,
      scale: "linear",
      note: "NSE, June 2026. \"Everyone else\" = trading firms and company accounts.",
    },
  ],
};

// Chapter 2 — the rulebook switch. Cloudspoon Foods is Module 2's made-up
// company (about ₹250 a share); the fall to ₹150 is made up too.
export const M3_CH2_RULEBOOK = {
  company: "Cloudspoon Foods",
  priceBefore: 250,
  priceAfter: 150,
  timeline: [
    { when: "Today", label: "Profits have collapsed. Only a few insiders know." },
    { when: "Results day", label: "The announcement goes out." },
    { when: "After", label: "The price adjusts to the news." },
  ],
  // Crowd grid: registered investors vs those who traded in a month.
  // 13.24 crore registered (NSE, 30 Jun 2026); ~1.37 crore traded at least
  // once in June 2026 (NSE Market Pulse, July 2026). 1.37 / 13.24 ≈ 1 in 10.
  crowd: {
    dots: 96,
    activeEvery: 10,
    caption: "13.24 crore registered · about 1.37 crore traded at least once in June 2026",
  },
};

// Chapter 3 — the vault preview. Arjun's one Cloudspoon share, as a record.
export const M3_CH3_VAULT = {
  holder: "Arjun",
  holding: "Cloudspoon Foods · 1 share",
  depositories: ["NSDL", "CDSL"],
  next: "Module 4 · your demat account",
};
