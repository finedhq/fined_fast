// Module 4 ("Opening the Door") — everything its figures draw (decision D27:
// figure numbers live in frontend code, not in card data). No real-world
// figures: Arjun and Cloudspoon Foods are made up; ₹2,500 = 10 shares at
// Module 2's ₹250.
//
// One map (trade_map) is built up over all three chapters, so every chapter
// uses the same box positions (x, y in % of the figure). A chapter's settings
// list its own lines and one entry per step; the step count is the length of
// that list. A `null` step is one where the chapter shows another figure
// (Chapter 3's put-in-order at 3.3).

// Middle row: the money road (bank → trading → broker → exchange).
// Bottom row: the shares road back (clearing → demat → depository).
const NODES = {
  arjun: { label: "Arjun", x: 12, y: 14 },
  trading: { label: "Trading account", x: 37, y: 14 },
  broker: { label: "Broker", x: 62, y: 14 },
  exchange: { label: "Stock exchange", x: 87, y: 14 },
  bank: { label: "Bank account", x: 12, y: 50 },
  clearing: { label: "Clearing corporation", x: 62, y: 50 },
  seller: { label: "A seller", x: 87, y: 50 },
  depository: { label: "Depository", x: 12, y: 86 },
  demat: { label: "Demat account", x: 37, y: 86 },
};

const TOKENS = {
  rupees: { label: "₹2,500", kind: "money" },
  shares: { label: "10 shares", kind: "shares" },
  order: { label: "Buy order", kind: "order" },
};

// Chapter 1 · "Three Accounts, One You" (steps 1.1 – 1.4). No broker or
// clearing corporation yet: the order goes straight to the exchange.
export const M4_CH1_MAP = {
  nodes: NODES,
  tokens: TOKENS,
  links: [
    ["arjun", "bank"],
    ["bank", "trading"],
    ["trading", "exchange"],
    ["exchange", "demat"],
    ["demat", "depository"],
  ],
  steps: [
    {
      show: ["arjun", "exchange"],
      lit: ["arjun", "exchange"],
      caption: "Arjun on one side, the stock exchange on the other. Nothing joins them yet.",
    },
    {
      show: ["arjun", "exchange", "bank"],
      lit: ["bank"],
      tokens: { rupees: { at: "bank", from: "arjun" } },
      caption: "Account one: the bank holds the ₹2,500.",
    },
    {
      show: ["arjun", "exchange", "bank", "trading"],
      lit: ["trading"],
      arrows: [["bank", "trading"], ["trading", "exchange"]],
      tokens: { rupees: { at: "bank" } },
      caption: "Account two: the trading account sends the order, and pulls the payment from the bank.",
    },
    {
      show: ["arjun", "exchange", "bank", "trading", "demat", "depository"],
      lit: ["demat", "depository"],
      arrows: [["exchange", "demat"]],
      tokens: { rupees: { at: "bank" }, shares: { at: "demat", from: "exchange" } },
      caption: "Account three: the demat account holds the shares, in Arjun's name, with a depository.",
    },
  ],
};

// Chapter 2 · "Choosing Your Gateway" (steps 2.1 – 2.4). The broker steps in
// between the trading account and the exchange; 2.2 swaps it for two doors.
const DOORS = {
  full: { label: "Full-service", sub: "people, research, calls", x: 62, y: 8 },
  discount: { label: "Discount", sub: "app-first", x: 62, y: 36 },
};
const CH2_MAP = ["arjun", "bank", "trading", "exchange", "demat", "depository"];
export const M4_CH2_MAP = {
  nodes: { ...NODES, ...DOORS },
  tokens: TOKENS,
  links: [
    ["arjun", "bank"],
    ["bank", "trading"],
    ["trading", "broker"],
    ["broker", "exchange"],
    ["trading", "full"],
    ["trading", "discount"],
    ["full", "exchange"],
    ["discount", "exchange"],
    ["exchange", "demat"],
    ["demat", "depository"],
  ],
  steps: [
    {
      show: [...CH2_MAP, "broker"],
      lit: ["trading", "broker", "exchange"],
      arrows: [["trading", "broker"], ["broker", "exchange"]],
      caption: "The broker stands between Arjun's trading account and the exchange.",
    },
    {
      show: [...CH2_MAP, "full", "discount"],
      lit: ["full", "discount", "exchange"],
      arrows: [["full", "exchange"], ["discount", "exchange"]],
      caption: "Two common kinds of broker. Both open onto the same exchange.",
    },
    {
      show: [...CH2_MAP, "broker"],
      lit: ["broker", "exchange", "demat", "depository"],
      badges: { broker: "SEBI-registered" },
      tokens: { shares: { at: "demat" } },
      caption: "Whichever broker: the same exchange, and the shares in Arjun's own demat account.",
    },
    {
      show: [...CH2_MAP, "broker"],
      lit: ["broker"],
      badges: { broker: "Check first" },
      pulse: "broker",
      caption: "Before paying any broker, check that it's registered with SEBI.",
    },
  ],
};

// Chapter 3 · "Who Makes Sure It Actually Happens" (steps 3.1 – 3.4).
// Step 3.3 is the put-in-order below (see the registry's handoff).
const CH3_MAP = ["arjun", "bank", "trading", "broker", "exchange", "seller", "demat", "depository"];
export const M4_CH3_MAP = {
  nodes: NODES,
  tokens: TOKENS,
  links: [
    ["arjun", "trading"],
    ["arjun", "bank"],
    ["trading", "broker"],
    ["broker", "exchange"],
    ["exchange", "seller"],
    ["exchange", "clearing"],
    ["broker", "clearing"],
    ["clearing", "seller"],
    ["bank", "clearing"],
    ["clearing", "demat"],
    ["demat", "depository"],
  ],
  steps: [
    {
      show: CH3_MAP,
      lit: ["arjun", "trading", "broker", "exchange", "seller"],
      arrows: [["arjun", "trading"], ["trading", "broker"], ["broker", "exchange"], ["seller", "exchange"]],
      tokens: { order: { at: "exchange", from: "arjun" } },
      tag: "Day 0",
      caption: "Arjun's order travels through his broker to the exchange and meets a seller.",
    },
    {
      show: [...CH3_MAP, "clearing"],
      lit: ["broker", "exchange", "clearing", "seller"],
      arrows: [["exchange", "clearing"]],
      tag: "Day 0",
      caption: "A clearing corporation steps in between buyer and seller and guarantees the trade.",
    },
    null,
    {
      show: [...CH3_MAP, "clearing"],
      lit: ["bank", "clearing", "seller", "demat", "depository"],
      arrows: [["bank", "clearing"], ["clearing", "demat"]],
      back: [["demat", "clearing"]],
      tokens: { rupees: { at: "seller", from: "bank" }, shares: { at: "demat", from: "clearing" } },
      tag: "Next working day",
      caption: "The next working day the money goes to the seller and the shares land in Arjun's demat account. Selling runs the same road backwards.",
    },
  ],
};

// Step 3.3 · put-in-order with a timeline play-out (the queue from Module 2).
export const M4_CH3_ORDER = {
  prompt: "Put them in order, then play it out.",
  claimants: [
    { id: "match", label: "The order meets a seller on the exchange" },
    { id: "guarantee", label: "A clearing corporation steps in between buyer and seller" },
    { id: "swap", label: "Money and shares change hands" },
    { id: "demat", label: "The shares appear in Arjun's demat account" },
  ],
  startOrder: ["swap", "demat", "guarantee", "match"],
  correctOrder: ["match", "guarantee", "swap", "demat"],
  labels: { items: "Steps", slots: "Happens in this order", slot: "Happens" },
  playOut: {
    kind: "timeline",
    button: "Play it out",
    title: "What actually happens after Arjun taps Buy:",
    days: [
      { label: "Day 0", items: ["match", "guarantee"] },
      { label: "Next working day", items: ["swap", "demat"] },
    ],
  },
  feedbackId: "guarantee",
  feedback: {
    wrong: "You put the guarantee {position}. It steps in right after the match, before anything moves.",
    right: "You put the guarantee second — right. It steps in right after the match, before anything moves.",
  },
};
