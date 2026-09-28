// Module 2 ("What Even Is a Stock?") — the numbers and captions its three
// chapter figures draw. The components (OwnershipGrid, Bars, LiquidationQueue)
// are written once and read settings like these, so a later module reuses them
// by adding its own settings here, not new components. (Owner, 2026-09-27:
// figure numbers live in frontend code, not in the card data.)
//
// Everything below is made up — Cloudspoon Foods, Ironleaf Steel and
// Glazeworth Ceramics are fictional companies with round numbers.

const CLOUDSPOON = "Cloudspoon Foods";

// Chapter 1 · "One Square Out of a Thousand" (steps: 1.1 – 1.4)
export const M2_CH1_GRID = {
  company: CLOUDSPOON,
  owner: "Arjun",
  total: 1000,
  cols: 40, // fixed 40 × 25 layout, so the shape never reflows between steps
  holdingOptions: [1, 10, 100],
  defaultHolding: 1,
  steps: [
    { mode: "highlight", holding: 1, inset: true, caption: "Arjun's one share is one of these squares." },
    { mode: "everyone", holding: 1, caption: "1 of 1,000 = 0.1%. The other 999 belong to everyone else." },
    { mode: "choose", caption: "Tap to change how many shares are yours." },
    {
      mode: "business",
      zones: ["Kitchens", "Brand", "Profits", "Debts"],
      caption: "Your squares cover all of it — good parts and bad. If it fails, you lose what you paid, not more.",
    },
  ],
};

// Chapter 3 · "So What Does the Slice Actually Get You?" (steps 3.1 – 3.3;
// 3.4 hands off to the queue below)
export const M2_CH3_GRID = {
  company: CLOUDSPOON,
  owner: "Arjun",
  total: 1000,
  cols: 40,
  holding: 10,
  steps: [
    {
      mode: "profit",
      profit: 20000,
      caption: "Profit is shared out by squares — if the company decides to pay any out at all.",
    },
    { mode: "vote", votesFor: 560, votesAgainst: 430, caption: "Every square is one vote. Arjun's 10 can't tip it either way." },
    { mode: "transfer", buyer: "another investor", caption: "Arjun sells his 10 squares. The company still has exactly 1,000." },
  ],
};

// Chapter 3, step 3.4 · who gets paid when a company shuts down. A plain-group
// simplification of the order in the Insolvency and Bankruptcy Code 2016,
// s. 53 (the Content sources page holds the link). Claims are made up. Not shown:
// suppliers ("remaining debts", s. 53(1)(f)) rank after the government, and secured
// lenders that enforce their security share the government's rank — shareholders
// stay last either way.
export const M2_CH3_QUEUE = {
  company: "Cloudspoon",
  pot: 100,
  prompt: "₹100 is left after Cloudspoon shuts down. Put these in the order the law pays them.",
  claimants: [
    { id: "costs", label: "Winding-up costs", claim: 10 },
    { id: "staff_lenders", label: "Staff and lenders", claim: 75 },
    { id: "government", label: "The government", claim: 30 },
    { id: "shareholders", label: "People who owned shares", claim: null }, // whatever is left
  ],
  // The order the cards start in (never the right one).
  startOrder: ["shareholders", "government", "costs", "staff_lenders"],
  correctOrder: ["costs", "staff_lenders", "government", "shareholders"],
  ownerId: "shareholders",
  feedback: {
    wrong: "You put shareholders {position}. The law puts them last — and by then there's usually nothing left.",
    right: "You put shareholders last — right. And by then there's usually nothing left.",
  },
};

// Chapter 2 · "The Price Tag Lies" (steps 2.1 – 2.4)
const SQUASHED = "Shown on a squashed scale so both bars stay visible";
export const M2_CH2_BARS = {
  series: [
    { id: "ironleaf", label: "Ironleaf Steel", price: 50, shares: 40000000 },
    { id: "glazeworth", label: "Glazeworth Ceramics", price: 2000, shares: 500000 },
  ],
  views: [
    { measure: "price", axis: "Price of one share", scale: "log", note: SQUASHED },
    { measure: "shares", axis: "Number of shares", scale: "log", note: SQUASHED },
    { measure: "market_cap", axis: "Price × number of shares", scale: "linear", detail: true },
    {
      measure: "market_cap",
      axis: "Same company, shares divided by 10",
      scale: "linear",
      detail: true,
      split: { id: "glazeworth", factor: 10 },
    },
  ],
};
