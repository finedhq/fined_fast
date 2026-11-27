// WinterArc Day 4 "Credit Cards and Loans": the three chapter figures. The
// loan, the 12% rate, the ₹10,000 bill, 3.5% a month and the 5% minimum (at
// least ₹200) are made up and say so on the figure. Checked by script: EMI
// ₹8,885 / ₹4,707 / ₹3,321 / ₹2,224 over 1 / 2 / 3 / 5 years (interest
// ₹6,619 / ₹12,976 / ₹19,572 / ₹33,467); minimum only: ₹8,165 owed after 1
// year, ₹5,444 after 3, ₹3,612 after 5, cleared in month 90 with ₹15,513 paid
// in interest. No repo rate anywhere: 4 Dec is the RBI policy day.

// Chapter 1 · "Borrowing has a price" (EmiCalendar.jsx).
export const WA4_CH1_EMI = {
  principal: 100000,
  monthlyRate: 1, // a made-up 12% a year
  lengths: [12, 24, 36, 60],
  start: 24,
  notes: [
    "A made-up ₹1 lakh loan at a made-up 12% a year.",
    "Each square is one month's EMI. Pick a length.",
    { before: "The same loan. Which length costs more in total?", after: "Purple repays the loan. Orange is interest." },
  ],
  texts: {
    borrow_hint: "Tap to borrow it.",
    borrowed: "Arjun has ₹1 lakh. He owes it all back, plus interest, in equal monthly EMIs.",
    calendar: "{years}: {months} EMIs of {emi}. A longer loan means a smaller EMI.",
    split: "He pays back {back}: the ₹1 lakh plus {interest} interest. In month 1, {first}% of the EMI is interest.",
    split_label: "{months} EMIs of {emi}, {interest} of it interest",
  },
};

// Chapter 2 · "How a card bill works" (CardStatement.jsx).
export const WA4_CH2_CARD = {
  bill: 10000,
  monthlyRate: 3.5,
  minPct: 5,
  minFloor: 200,
  marks: [
    { month: 12, label: "1 year" },
    { month: 36, label: "3 years" },
    { month: 60, label: "5 years" },
    { month: 90, label: "Month 90" },
  ],
  notes: [
    "Arjun's card statement (made-up bill).",
    "The same statement shows a minimum due.",
    {
      before: "Pay only the minimum (made up: 5%, at least ₹200) every month, at a made-up 3.5% a month. How long until it's cleared?",
      after: "Paying only the minimum, month by month.",
    },
    "Every statement carries a warning like this.",
  ],
  texts: {
    card_name: "Arjun's card · statement",
    due: "Due on the 15th",
    pay_hint: "Tap to pay the whole bill on time.",
    paid_stamp: "Paid · ₹0 interest",
    paid_full: "Paid in full by the due date: usually no interest on those purchases.",
    min_hint: "Tap either one to see what it does.",
    carried_stamp: "{left} carried over",
    chose_min: "No late fee. But {left} carries over and is charged interest, and new swipes lose their interest-free days.",
    warning_title: "Paying only the minimum? ",
    warning: "It stretches repayment over months or years, with interest on what's left.",
    five_years: "After 5 years of paying the minimum, {owed} is still owed, and {interest} has gone in interest.",
  },
};

// Chapter 3 · "Your credit score": how a record reaches a lender.
const ALL = ["repayments", "lender", "bureau", "score"];
const CHAIN = [
  ["repayments", "lender"],
  ["lender", "bureau"],
  ["bureau", "score"],
];
export const WA4_CH3_MAP = {
  wrapNotes: true,
  // The reader's own six-month record from Six Statements (the game before
  // Chapter 3), under "Your repayments" on the steps marked `record`.
  record: { tool: "wa-d04-game-six-statements", node: "repayments", empty: "Play Six Statements to see your record here" },
  nodes: {
    repayments: { label: "Your repayments", x: 16, y: 22 },
    lender: { label: "Lender reports", x: 84, y: 22 },
    bureau: { label: "Credit bureau", x: 84, y: 78 },
    score: { label: "Score a lender sees", x: 16, y: 78 },
  },
  tokens: {
    report: { label: "Your record", kind: "order" },
    score: { label: "Score", kind: "money" },
  },
  links: CHAIN,
  steps: [
    // 3.1: the score, on its scale
    {
      show: ALL,
      lit: ["score"],
      badges: { score: "300 to 900" },
      notes: { score: "A CIBIL score. Higher is better." },
      tag: "Your record",
      caption: "Before they lend, lenders check a score built from your record.",
    },
    // 3.2: the record travels to the bureau, every 15 days
    {
      show: ALL,
      lit: ALL,
      arrows: CHAIN,
      linkLabels: [["lender", "bureau", "every 15 days"]],
      tokens: { report: { at: "bureau", from: "lender" } },
      tag: "Every 15 days",
      record: true,
      caption: "Your record from the six statements travels to the bureaus every fortnight.",
    },
    // 3.3: what goes on the record; repayments pulse once the guess is answered
    {
      show: ALL,
      lit: ALL,
      arrows: CHAIN,
      linkLabels: [["lender", "bureau", "every 15 days"]],
      tokens: { score: { at: "score", from: "bureau" } },
      pulse: "repayments",
      tag: "What goes on it",
      record: true,
      caption: "On time or late, every repayment goes on the record.",
    },
    // 3.4: the free report
    {
      show: ALL,
      lit: ["bureau"],
      notes: { bureau: "One free full report a year, from each" },
      tag: "Free report",
      caption: "Four bureaus. Each gives you one free full report a year.",
    },
  ],
};
