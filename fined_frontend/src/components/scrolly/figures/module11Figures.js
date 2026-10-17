// Module 11 ("Building Your Own Approach") — everything its figures draw
// (decision D27: figure numbers live in frontend code, not in card data).
// Every number is made up except where the tool card says otherwise.

// Chapter 1 · "Two Questions, Not a Type" (steps 1.1 – 1.4). The reader picks
// a fall (0–60%) and sees what's left of ₹1 lakh. No answer is marked right,
// nothing is saved; 1.4 keeps the reader's bar.
export const M11_CH1_BARS = {
  layout: "shown",
  control: { id: "after", base: 100000, label: "A fall of", min: 0, max: 60, step: 10, start: 30 },
  series: [
    { id: "start", label: "Arjun's ₹1 lakh", value: 100000 },
    { id: "after", label: "After the fall you pick", value: 70000 },
    { id: "w1", label: "Needed in 1 year", years: 1 },
    { id: "w15", label: "Needed in 15 years", years: 15 },
  ],
  views: [
    { measure: "value", axis: "₹", scale: "linear", show: ["start"] },
    { measure: "value", axis: "₹", scale: "linear", show: ["start", "after"], control: true, note: "There's no right answer." },
    { measure: "years", axis: "Years the money can wait", scale: "linear", show: ["w1", "w15"] },
    { measure: "value", axis: "₹", scale: "linear", show: ["after"], note: "A fall on paper, while it is happening." },
  ],
};

// Chapter 2 · "How Would You Know If You Did Well?" (steps 2.1 – 2.4).
export const M11_CH2_BARS = {
  layout: "shown",
  series: [
    { id: "arjun", label: "Arjun's shares", percent: 8 },
    { id: "idx12", label: "Share index, year A", percent: 12 },
    { id: "idx3", label: "Share index, year B", percent: 3 },
    { id: "mix", label: "Half-and-half mix", percent: 6 },
    { id: "idx15", label: "Share index", percent: 15 },
  ],
  views: [
    { measure: "percent", axis: "Return (%)", scale: "linear", show: ["arjun"] },
    { measure: "percent", axis: "Return (%)", scale: "linear", show: ["arjun", "idx12", "idx3"], note: "Two different years for the index." },
    { measure: "percent", axis: "Return (%)", scale: "linear", show: ["mix", "idx15"], pulse: "mix" },
    { measure: "percent", axis: "Return (%)", scale: "linear", show: ["arjun"], note: "One year." },
  ],
};

// Chapter 3 · "Your Move" (steps 3.1 – 3.4). The course as four parts.
const ALL = ["why", "in", "moves", "risk"];
const CHAIN = [
  ["why", "in"],
  ["in", "moves"],
  ["moves", "risk"],
];
export const M11_CH3_MAP = {
  nodes: {
    why: { label: "Why the market exists", x: 16, y: 20 },
    in: { label: "How you get in", x: 84, y: 20 },
    moves: { label: "How prices move", x: 84, y: 80 },
    risk: { label: "What risk feels like", x: 16, y: 80 },
  },
  tokens: {},
  links: CHAIN,
  steps: [
    { show: ALL, lit: ["why"], tag: "Arjun's start", caption: "Arjun began with ₹1 lakh in savings." },
    { show: ALL, lit: ALL, arrows: CHAIN, tag: "The map", caption: "The four parts of the course, joined up." },
    { show: ALL, lit: ALL, arrows: CHAIN, tag: "What's left out: the route", pulse: ALL, caption: "What's left out is the route: choosing what to buy." },
    { show: ALL, lit: ["risk"], tag: "Three lines on paper", caption: "What the money is for, when he'll need it, and the biggest fall he could sit through." },
  ],
};
