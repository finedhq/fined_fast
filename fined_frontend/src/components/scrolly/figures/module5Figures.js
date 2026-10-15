// Module 5 ("From Idea to Ticker") — everything its figures draw (decision
// D27: figure numbers live in frontend code, not in card data). No real-world
// figures: Tiffin Theory, Meera and Arjun are made up. The arithmetic: 250
// squares × ₹0.8 crore = ₹200 crore; 16 crore applied ÷ 2 crore offered = 8×.
//
// Chapters 1 and 2 reuse Module 4's trade map with a company added (one
// shared box layout, x/y in % of the figure). Chapter 3 is Module 2's
// ownership grid in its owner-groups mode.

// Top row: who's selling. Middle: where it meets. Bottom: who's buying.
const NODES = {
  few: { label: "A few private investors", x: 14, y: 14 },
  tiffin: { label: "Tiffin Theory", x: 50, y: 14 },
  sebi: { label: "SEBI", x: 86, y: 14 },
  bank: { label: "Arjun's bank", x: 14, y: 50 },
  exchange: { label: "Stock exchange", x: 50, y: 50 },
  arjun: { label: "Arjun", x: 14, y: 86 },
  public: { label: "The public", x: 50, y: 86 },
};

const TOKENS = {
  rupees: { label: "₹200 crore", kind: "money" },
  shares: { label: "Shares", kind: "shares" },
  doc: { label: "Offer document", kind: "order" },
  applied: { label: "₹", kind: "money" },
};

// Chapter 1 · "Why Would a Company Go Public?" (steps 1.1 – 1.4)
const CH1_ALL = ["few", "tiffin", "exchange", "public"];
export const M5_CH1_MAP = {
  nodes: NODES,
  tokens: TOKENS,
  links: [
    ["few", "tiffin"],
    ["tiffin", "exchange"],
    ["exchange", "public"],
    ["few", "exchange"],
  ],
  steps: [
    {
      show: ["few", "tiffin"],
      lit: ["few", "tiffin"],
      badges: { tiffin: "Needs ₹200 crore" },
      caption: "Tiffin Theory and a few private backers. Their money doesn't stretch to ₹200 crore.",
    },
    {
      show: CH1_ALL,
      lit: ["tiffin", "exchange", "public"],
      arrows: [["tiffin", "exchange"], ["exchange", "public"]],
      caption: "Through the stock exchange, Tiffin Theory can sell shares to the public.",
    },
    {
      show: CH1_ALL,
      lit: ["few", "tiffin", "exchange", "public"],
      arrows: [["public", "exchange"], ["exchange", "tiffin"], ["few", "exchange"]],
      back: [["exchange", "public"]], // the backers' shares, beside the money
      tokens: { rupees: { at: "tiffin", from: "public" }, shares: { at: "public", from: "few" } },
      caption: "Money comes in for growth, and early backers can sell their shares to the public.",
    },
    {
      show: CH1_ALL,
      lit: ["tiffin"],
      badges: { tiffin: ["Results published", "SEBI rules"] },
      caption: "Once listed, Tiffin Theory publishes its results and follows SEBI's rules. Everyone can see.",
    },
  ],
};

// Chapter 2 · "How an IPO Works" (steps 2.1 – 2.4). No exchange yet: listing
// is Chapter 3.
export const M5_CH2_MAP = {
  nodes: NODES,
  tokens: TOKENS,
  links: [
    ["tiffin", "sebi"],
    ["tiffin", "public"],
    ["arjun", "public"],
    ["arjun", "bank"],
  ],
  steps: [
    {
      show: ["tiffin", "sebi"],
      lit: ["tiffin", "sebi"],
      arrows: [["tiffin", "sebi"]],
      tokens: { doc: { at: "sebi", from: "tiffin" } },
      caption: "The offer document goes to SEBI, which checks the required information is there.",
    },
    {
      show: ["tiffin", "sebi", "public"],
      lit: ["tiffin", "public"],
      arrows: [["tiffin", "public"]],
      linkLabels: [["tiffin", "public", "₹95–₹100 a share"]],
      caption: "A price band, not one price. The final price is set inside it.",
    },
    {
      show: ["tiffin", "sebi", "public", "arjun", "bank"],
      lit: ["arjun", "bank", "public"],
      arrows: [["arjun", "public"], ["arjun", "bank"]],
      tokens: { applied: { at: "bank", from: "arjun" } },
      badges: { bank: "Money blocked" },
      caption: "Arjun applies. His money stays in his bank, blocked, until the shares are handed out.",
    },
    {
      show: ["tiffin", "sebi", "public", "arjun", "bank"],
      lit: ["tiffin", "public"],
      notes: { tiffin: "On offer: 2 crore shares", public: "Applied for: 16 crore" },
      pulse: "public",
      caption: "Eight times as many shares asked for as there are to give.",
    },
  ],
};

// Chapter 3 · "Listing Day and the Twist" (steps 3.1 – 3.4). Listing day
// keeps whichever way the reader left the grid on ("chosen"), without the toggle. The company as
// 1,000 squares in owner groups. Two ways to sell 250 squares to the public
// at the same price (about ₹0.8 crore each): way one adds 250 new squares
// (the grid grows to 1,250), way two moves 250 of the owners' squares to the
// public (150 from Meera's team, 100 from the backers — 60 : 40, as they own).
// The public's share differs (20% vs 25%); the module deliberately doesn't
// say so (that would be dilution), so the legend shows counts only.
export const M5_CH3_GRID = {
  company: "Tiffin Theory",
  cols: 40, // 40 wide; rows are kept for 1,250 so the grid grows downward without reflowing
  groups: [
    { id: "meera", label: "Meera and team", units: 600 },
    { id: "early", label: "Early backers", units: 400 },
    { id: "public", label: "The public", units: 0 },
  ],
  ways: {
    new_shares: {
      label: "New shares",
      newUnits: 250,
      sold: {},
      money: [{ to: "Tiffin Theory", amount: "₹200 crore" }],
      note: "250 new squares. The pie grows to 1,250.",
    },
    existing_sell: {
      label: "Existing owners sell",
      newUnits: 0,
      sold: { meera: 150, early: 100 },
      money: [
        { to: "The sellers", amount: "₹200 crore" },
        { to: "Tiffin Theory", amount: "₹0", zero: true },
      ],
      note: "Still 1,000 squares. 250 of the owners' squares change hands.",
    },
  },
  defaultWay: "existing_sell",
  steps: [
    { way: null, caption: "Before the IPO: 600 squares for Meera's team, 400 for early backers, none for the public." },
    { way: "new_shares", caption: "Way one: 250 new squares go to the public. The money goes to Tiffin Theory." },
    { way: "choose", caption: "Flip between the two ways and watch where the ₹200 crore goes." },
    { way: "chosen", listing: true, ticker: "TIFFIN", caption: "Listing day: the shares start trading, and the price is up to buyers and sellers." },
  ],
};
