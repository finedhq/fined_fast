// Module 6 ("Why Do Prices Actually Move?") — everything its figures draw
// (decision D27: figure numbers live in frontend code, not in card data). No
// real-world figures: Tiffin Theory's book and its profit numbers are made up.
//
// Chapters 1 and 2 are the order book (new in Module 6, built so Module 7 can
// place the reader's own order into the same book). Each step is
//   { sides: ["bids", "asks"], lit?: side, gap?, pulse?: "gap",
//     trade?: {side, qty}, control?: {...}, choose?: {...} }
// The trades' fills are worked out from the book (orderBookMath.js), not typed in.
// Chapter 3 is the reusable bars figure with new data.

// The book behind both chapters. Last trade ₹100; sellers' asks above, buyers'
// bids below, each listed best first.
const TIFFIN_BOOK = {
  lastPrice: 100,
  asks: [
    [101, 1000],
    [102, 1500],
    [103, 2000],
    [104, 2500],
  ],
  bids: [
    [99, 1200],
    [98, 1800],
    [97, 2200],
    [96, 2500],
  ],
};

const NOTE = "Made-up book with round numbers. Real prices move in smaller steps.";

// Chapter 1 · "Two Prices at Once" (steps 1.1 – 1.4). Three levels a side.
export const M6_CH1_BOOK = {
  company: "Tiffin Theory",
  book: TIFFIN_BOOK,
  depth: 3,
  note: NOTE,
  steps: [
    { sides: [] },
    { sides: ["bids"], lit: "bids" },
    { sides: ["bids", "asks"], lit: "asks", gap: true },
    {
      sides: ["bids", "asks"],
      gap: true,
      choose: {
        prompt: "Tap who gives way.",
        options: [
          { id: "buyer", label: "A buyer pays ₹101", trade: { side: "buy", qty: 100 }, text: "A buyer accepts the cheapest seller's ₹101. They trade, and Arjun's screen now shows ₹101." },
          { id: "seller", label: "A seller takes ₹99", trade: { side: "sell", qty: 100 }, text: "A seller accepts the best buyer's ₹99. They trade, and Arjun's screen now shows ₹99." },
        ],
      },
    },
  ],
};

// Chapter 2 · "What Moves It" (steps 2.1 – 2.4). Every level, because the
// reader's drag reaches ₹104. Each step starts from the same book.
export const M6_CH2_BOOK = {
  company: "Tiffin Theory",
  book: TIFFIN_BOOK,
  depth: 4,
  note: NOTE,
  steps: [
    { sides: ["bids", "asks"], trade: { side: "buy", qty: 500 } },
    { sides: ["bids", "asks"], trade: { side: "buy", qty: 3000 } },
    {
      sides: ["bids", "asks"],
      control: { side: "buy", label: "Shares buyers want right now", min: 0, max: 6000, step: 500, start: 0 },
    },
    { sides: ["bids", "asks"], trade: { side: "sell", qty: 3000 } },
  ],
};

// Chapter 3 · "Why Good News Can Sink a Price" (steps 3.1 – 3.4). The actual
// result sits in the middle; "Hoped for" appears on its left at 3.2 and gives
// way to "Feared" on its right at 3.4.
const AXIS = "Profit growth (%)";
export const M6_CH3_BARS = {
  series: [
    { id: "hoped", label: "Hoped for", percent: 20 },
    { id: "actual", label: "Actual profit growth", percent: 10 },
    { id: "feared", label: "Feared", percent: 5 },
  ],
  views: [
    { measure: "percent", axis: AXIS, scale: "linear", show: ["actual"], note: "Made-up numbers." },
    { measure: "percent", axis: AXIS, scale: "linear", show: ["hoped", "actual"], note: "Made-up numbers." },
    { measure: "percent", axis: AXIS, scale: "linear", show: ["hoped", "actual"], note: "Made-up numbers." },
    { measure: "percent", axis: AXIS, scale: "linear", show: ["actual", "feared"], note: "Made-up numbers." },
  ],
};
