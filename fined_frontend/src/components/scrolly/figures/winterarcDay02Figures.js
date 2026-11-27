// WinterArc Day 2 "Banking Basics": the two chapter figures. Every rate and
// amount is a made-up example (Arjun) and says so on the figure, except the
// deposit insurance limit, which is a real rule (DICGC) and lives in one
// place below so a change is a one-line edit. Checked by script: ₹600, ₹1,300
// (simple; ₹1,332 if added quarterly) and about ₹860 (₹857 added quarterly).

/** DICGC deposit insurance: per depositor, per bank. Re-check before launch (30 Nov). */
export const DEPOSIT_INSURANCE_LIMIT = "₹5 lakh";

// Chapter 1 · "How a bank works": savers → bank → borrowers → interest back.
// Money tokens travel the loop step by step.
const ALL = ["savers", "bank", "borrowers", "interest"];
const CHAIN = [
  ["savers", "bank"],
  ["bank", "borrowers"],
  ["borrowers", "interest"],
  ["interest", "savers"],
];
export const WA2_CH1_MAP = {
  wrapNotes: true,
  nodes: {
    savers: { label: "Savers", x: 16, y: 22 },
    bank: { label: "Bank", x: 84, y: 22 },
    borrowers: { label: "Borrowers", x: 84, y: 78 },
    interest: { label: "Interest back", sub: "to savers", x: 16, y: 78 },
  },
  tokens: {
    deposit: { label: "₹15,000", kind: "money" },
    loan: { label: "Loan", kind: "order" },
    paid: { label: "10% back", kind: "money" },
    back: { label: "6% to you", kind: "money" },
  },
  links: CHAIN,
  steps: [
    // 1.1: only Arjun's money, sitting with him
    { show: ALL, lit: ["savers"], badges: { savers: "Arjun's ₹15,000" }, tokens: { deposit: { at: "savers" } }, tag: "Payday", caption: "Arjun's stipend lands in his savings account." },
    // 1.2: his deposit travels to the bank; a loan travels on to a borrower
    {
      show: ALL,
      lit: ["savers", "bank", "borrowers"],
      arrows: [CHAIN[0], CHAIN[1]],
      linkLabels: [
        ["savers", "bank", "deposits"],
        ["bank", "borrowers", "loans"],
      ],
      tokens: { deposit: { at: "bank", from: "savers" }, loan: { at: "borrowers", from: "bank" } },
      tag: "Not a locker",
      caption: "Most deposits are lent out. Some are kept ready for withdrawals.",
    },
    // 1.3: the full loop; interest travels back; "Interest back" pulses after the guess
    {
      show: ALL,
      lit: ALL,
      arrows: CHAIN,
      linkLabels: [
        ["borrowers", "interest", "pay 10% (made up)"],
        ["interest", "savers", "get 6% (made up)"],
      ],
      tokens: { paid: { at: "interest", from: "borrowers" }, back: { at: "savers", from: "interest" } },
      pulse: "interest",
      tag: "The gap",
      caption: "Borrowers pay more than savers get. The gap is the bank's main income.",
    },
    // 1.4: the safety net on the bank
    {
      show: ALL,
      lit: ["bank"],
      notes: { bank: `Insured up to ${DEPOSIT_INSURANCE_LIMIT} per depositor, per bank` },
      tag: "Safety net",
      caption: `If an insured bank fails, deposit insurance repays up to ${DEPOSIT_INSURANCE_LIMIT}, interest included.`,
    },
  ],
};

// Chapter 2 · "Three ways to keep money in a bank": three account cards the
// reader uses (AccountCards.jsx).
export const WA2_CH2_ACCOUNTS = {
  savings: { amount: 20000, rate: 3, interest: 600, upi: 500 },
  fd: { amount: 20000, rate: 6.5, interest: 1300 },
  rd: { monthly: 2000, months: 12, interest: 860 },
  notes: [
    "A savings account: ₹20,000 you can use any day (made-up rate).",
    "An FD: the same ₹20,000, locked for a year (made-up rate).",
    "An RD: ₹2,000 every month for a year (made-up rate).",
    "Three accounts, three jobs.",
  ],
  texts: {
    upi_hint: "Tap to pay. Watch how fast the money leaves.",
    upi_done: "Gone in a second. {left} left. Access is the point of savings, and the trade-off is low interest.",
    fd_hint: "Tap to see what happens if Arjun wants it back early.",
    fd_broke: "Breaking an FD early can cost a penalty, which differs by bank. The higher rate is the reward for leaving it alone.",
    rd_hint: "Tap once for each month. An RD only works if the money goes in every month.",
    rd_done: "Twelve months, ₹24,000 put in, about ₹860 in interest. Saving turned into a habit.",
    compare_before: "Savings: any day. FD: a lump sum, locked. RD: a little every month.",
    compare_after: "A lump sum with a known date: that's the FD's job.",
  },
};
