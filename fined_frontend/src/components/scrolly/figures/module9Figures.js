// Module 9 ("The Weather Around the Market") — everything its figures draw
// (decision D27: figure numbers live in frontend code, not in card data). Three
// cause-and-effect maps (the trade map again) and one put-in-order with the
// "ripple" play-out. No numbers at all: the copy deliberately names neither
// the current repo rate nor its direction, so it can't go stale.

// Chapter 1 · "The RBI's Dial" (steps 1.1 – 1.4; 1.3 hands off to the queue).
// A zigzag down the figure: RBI → banks across the top (long, so the "repo
// rate" label fits on a phone), down to loans, back across to profits, down to
// share prices.
const CH1_NODES = {
  rbi: { label: "The RBI", x: 16, y: 14 },
  banks: { label: "Banks", x: 84, y: 14 },
  loans: { label: "People and companies", x: 84, y: 50 },
  profits: { label: "Company profits", x: 16, y: 50 },
  shares: { label: "Share prices", x: 16, y: 86 },
};
const CH1_ALL = ["rbi", "banks", "loans", "profits", "shares"];
export const M9_CH1_MAP = {
  nodes: CH1_NODES,
  tokens: {},
  links: [
    ["rbi", "banks"],
    ["banks", "loans"],
    ["loans", "profits"],
    ["profits", "shares"],
  ],
  steps: [
    {
      show: ["rbi", "banks"],
      lit: ["rbi", "banks"],
      arrows: [["rbi", "banks"]],
      linkLabels: [["rbi", "banks", "repo rate"]],
      caption: "Banks borrow from the RBI at the repo rate.",
    },
    {
      show: ["rbi", "banks"],
      lit: ["rbi"],
      badges: { rbi: "Six-member committee" },
      caption: "A six-member committee at the RBI sets the repo rate.",
    },
    null, // 1.3: the put-in-order below
    {
      show: CH1_ALL,
      lit: CH1_ALL,
      arrows: [
        ["rbi", "banks"],
        ["banks", "loans"],
        ["loans", "profits"],
        ["profits", "shares"],
      ],
      tag: "A tendency, not a rule",
      caption: "A rate rise can ripple from the RBI to banks, loans, profits and share prices. A tendency, not a rule.",
    },
  ],
};

// 1.3 · put the ripple in order, then play it out card by card.
export const M9_CH1_ORDER = {
  prompt: "Put the four in the order they happen.",
  claimants: [
    { id: "rbi", label: "The RBI raises the repo rate" },
    { id: "banks", label: "Banks pay more to borrow" },
    { id: "loans", label: "Loans get dearer for people and companies" },
    { id: "shares", label: "Company profits, and so share prices, may feel it" },
  ],
  startOrder: ["shares", "loans", "rbi", "banks"],
  correctOrder: ["rbi", "banks", "loans", "shares"],
  labels: { items: "What happens", slots: "Happens in this order", slot: "Happens" },
  playOut: { kind: "ripple", button: "Play it out", title: "Say the RBI raises the rate:", words: ["First", "Then", "Then", "Finally"] },
  feedbackId: "banks",
  feedback: {
    wrong: "You put the banks {position}. They feel it right after the RBI moves, before any loan does.",
    right: "You put the banks second — right. They feel it right after the RBI moves, before any loan does.",
  },
};

// Chapter 2 · "The Budget" (steps 2.1 – 2.3). One government, three businesses;
// a cut in the tax on kitchen equipment lands heavily on Tiffin Theory.
const CH2_ALL = ["govt", "tiffin", "bank", "soft"];
export const M9_CH2_MAP = {
  nodes: {
    govt: { label: "The government", x: 50, y: 18 },
    tiffin: { label: "Tiffin Theory", x: 16, y: 80 },
    bank: { label: "A bank", x: 50, y: 80 },
    soft: { label: "A software firm", x: 84, y: 80 },
  },
  tokens: {},
  links: [
    ["govt", "tiffin"],
    ["govt", "bank"],
    ["govt", "soft"],
  ],
  steps: [
    { show: ["govt"], lit: ["govt"], badges: { govt: "Budget: taxes and spending" }, caption: "Each February the government presents the Union Budget." },
    {
      show: CH2_ALL,
      lit: CH2_ALL,
      thick: [["govt", "tiffin"]],
      thin: [
        ["govt", "bank"],
        ["govt", "soft"],
      ],
      pulse: "tiffin",
      caption: "A Budget change lands unevenly: heavily on one business, lightly on others.",
    },
    { show: CH2_ALL, lit: ["govt"], tag: "Expected vs surprise", caption: "A change investors expected may barely move prices; a surprise can move them more." },
  ],
};

// Chapter 3 · "The World Next Door" (steps 3.1 – 3.3).
const CH3_ALL = ["us", "inv", "shares", "oil", "biz"];
const CH3_ARROWS = [
  ["us", "inv"],
  ["inv", "shares"],
  ["oil", "biz"],
  ["biz", "shares"],
];
export const M9_CH3_MAP = {
  nodes: {
    // Labelled lines run the full width or height, so their pills fit on phones.
    us: { label: "US interest rates", x: 16, y: 14 },
    inv: { label: "Foreign investors", x: 84, y: 14 },
    shares: { label: "Indian shares", x: 84, y: 50 },
    oil: { label: "World oil price", x: 16, y: 86 },
    biz: { label: "Indian businesses", x: 84, y: 86 },
  },
  tokens: {},
  links: CH3_ARROWS,
  steps: [
    {
      show: ["us", "inv", "shares"],
      lit: ["us", "inv", "shares"],
      arrows: [
        ["us", "inv"],
        ["inv", "shares"],
      ],
      linkLabels: [["inv", "shares", "money may move"]],
      caption: "When US rates rise, some foreign money may move away from Indian shares.",
    },
    {
      show: CH3_ALL,
      lit: ["oil", "biz"],
      arrows: [["oil", "biz"]],
      linkLabels: [["oil", "biz", "most oil is imported"]],
      caption: "Most of India's oil is imported, so a dearer oil price reaches many businesses.",
    },
    { show: CH3_ALL, lit: CH3_ALL, arrows: CH3_ARROWS, tag: "Many things at once", pulse: "biz", caption: "Many influences act at once; the same news hits businesses differently." },
  ],
};
