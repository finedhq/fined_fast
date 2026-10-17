// Module 7 ("Placing Your First Trade") — everything its figures draw
// (decision D27: figure numbers live in frontend code, not in card data). The
// same made-up Tiffin Theory book as Module 6, now with Arjun's own order on
// it: a ticket above the book, a limit order waiting in line, a limit-price
// slider, an end-of-day lapse, a fill bar and settlement. Fills and "shares
// ahead" are worked out from the book (orderBookMath.js), not typed in.
import { M6_CH2_BOOK } from "./module6Figures";

const BOOK = M6_CH2_BOOK.book;
const NOTE = "Made-up book with round numbers. Real prices move in smaller steps.";

// Chapter 1 · "An Order Is an Instruction" (steps 1.1 – 1.3).
export const M7_CH1_BOOK = {
  company: "Tiffin Theory",
  book: BOOK,
  depth: 4,
  note: NOTE,
  steps: [
    { ticket: { label: "Buy 100 Tiffin Theory", status: "Sent from Arjun's phone" } },
    { ticket: { label: "Buy 100 Tiffin Theory", rule: "?" } },
    { ticket: { label: "Buy 100 Tiffin Theory", status: "Not traded yet" }, pulse: "best_ask" },
  ],
};

// Chapter 2 · "Two Ways to Ask" (steps 2.1 – 2.4). The reader's limit runs
// ₹95–₹105: ₹101 or more fills now at ₹101; lower waits behind what is queued
// at that price (1,200 at ₹99 … nobody at ₹100 or ₹95).
export const M7_CH2_BOOK = {
  company: "Tiffin Theory",
  book: BOOK,
  depth: 4,
  note: NOTE,
  steps: [
    { ticket: { label: "Market · buy 100" }, trade: { side: "buy", qty: 100 } },
    { ticket: { label: "Limit ₹99 · buy 100" }, order: { side: "buy", qty: 100, limit: 99 } },
    { control: { kind: "limit", side: "buy", qty: 100, label: "Arjun's limit price", min: 95, max: 105, step: 1, start: 99 } },
    {
      compare: [
        { tag: "Speed", label: "Market · buy 100", status: "Fills now, at whatever the best price is" },
        { tag: "Price control", label: "Limit ₹99 · buy 100", status: "Never pays more than ₹99, may never fill" },
      ],
    },
  ],
};

// Chapter 3 · "What Happens Next" (steps 3.1 – 3.3).
export const M7_CH3_BOOK = {
  company: "Tiffin Theory",
  book: BOOK,
  depth: 4,
  note: NOTE,
  steps: [
    {
      ticket: { label: "Limit ₹99 · buy 100" },
      order: { side: "buy", qty: 100, limit: 99 },
      eod: { label: "End of the trading day · unfilled orders lapse", lapsed: "Lapsed at the end of the day" },
      pulse: "eod",
    },
    { ticket: { label: "Limit · buy 100", status: "Part filled" }, fill: { done: 60, of: 100 } },
    {
      ticket: { label: "Buy 100", status: "Filled" },
      settle: {
        when: "Next working day",
        rows: [
          ["Seller", "Arjun's demat account · 100 shares"],
          ["Arjun's bank", "Seller · the money"],
        ],
        back: "Selling: the same road backwards",
      },
    },
  ],
};
