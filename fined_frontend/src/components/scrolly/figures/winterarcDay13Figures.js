// WinterArc Day 13 "Fixed Income Investments": the three chapter figures.
// Every bond, rate, rating and price is made up and says so; RBI Retail
// Direct, deposit insurance (₹5 lakh per depositor per bank) and the debt
// fund tax rule (gains on units bought from 1 April 2023 taxed at your slab)
// are real. Checked by script (winterarcDays815.test.js): a ₹10,000 7% bond
// at 8% is worth ₹9,907 / ₹9,601 / ₹9,329 (1 / 5 / 10 years) and at 6%
// ₹10,094 / ₹10,421 / ₹10,736.

// Chapter 1 · "Be the lender" (BondCard.jsx)
export const WA13_CH1_BOND = {
  face: 10000,
  coupon: 7,
  years: 5,
  corp: { name: "Volt Scooters", coupon: 11, rating: "A" },
  dial: { gov: 1, corp: 3 }, // risk dial positions 0–5, made up
  ladder: [
    { id: "AAA", rate: 7.5 },
    { id: "AA", rate: 8.5 },
    { id: "A", rate: 11 },
    { id: "BBB", rate: 12.5 },
    { id: "Below", rate: 14 },
  ],
  notes: [
    "A made-up government bond.",
    "Five years of interest, then your money back.",
    "Two borrowers, both for 5 years.",
    "A made-up ladder of ratings and the interest each might offer.",
  ],
  texts: {
    buy: "Buy",
    bought: "Arjun lent the government ₹10,000.",
    collect: "₹700 a year × 5 = ₹3,500 in interest, then the ₹10,000 comes back.",
    guess_first: "Tap your guess first.",
    risk: "The extra 4% pays lenders for the chance Volt can't repay.",
    ladder: "Lower on the ladder, higher the interest offered. A rating is an opinion and can change; it isn't a guarantee.",
  },
};

// Chapter 2 · "The seesaw" (BondSeesaw.jsx)
export const WA13_CH2_SEESAW = {
  face: 10000,
  coupon: 7,
  newRate: 8,
  lowRate: 6,
  years: 5,
  maturities: [1, 5, 10],
  price: { min: 9000, max: 10500, step: 50, accept: 9600 },
  buyers: ["🧑", "👩", "🧔", "👵", "🧑‍🎓"],
  notes: [
    "Right after Arjun buys his 7% bond, rates rise. New bonds pay 8%.",
    "Set your price, then offer it to five buyers.",
    "Same rise to 8%. What if the bond were shorter or longer?",
    "Now flip the lever: rates fall to 6%.",
  ],
  texts: {
    offer: "Offer to buyers",
    refuse: "Why would I take 7%?",
    sold: "Sold at {ask}. Buyers pay about ₹9,601: the price at which a 7% bond earns them the same 8% as a new one. You asked {ask}.",
    refused: "No takers at {ask}. Buyers can get 8% from a new bond, so they'll only pay about ₹9,601 or less.",
    longer: "The longer you're locked into the old rate, the more its price moves.",
    fall: "Rates fell, so the old 7% bond is worth more.",
    hold: "If Arjun simply holds to maturity, he still gets ₹700 a year and ₹10,000 back (assuming the borrower pays). Price swings matter if he sells early.",
  },
};

// Chapter 3 · "Rate-rise day" (ThreeLenders.jsx)
export const WA13_CH3_LENDERS = {
  tiles: [
    { id: "fd", label: "5-year FD", answer: "same", reveal: "Shown value doesn't change; your rate is locked (breaking early can cost a penalty)." },
    { id: "bond", label: "5-year government bond", answer: "moves", reveal: "Market price falls if you sell now." },
    { id: "fund", label: "Debt fund", answer: "moves", reveal: "NAV dips, because the bonds it holds fell in price." },
  ],
  rows: [
    { label: "Who you lend to", cells: ["A bank", "The government or a company", "Many borrowers, via a fund"] },
    { label: "Can the value move before the end?", cells: ["No, though breaking early can cost", "Yes", "Yes, daily"] },
    { label: "Protection", cells: ["Bank deposits insured up to ₹5 lakh per depositor per bank (Day 2)", "Depends on the borrower; government bonds carry the lowest credit risk", "Spread across many bonds, no insurance"] },
    { label: "Tax", cells: ["Interest taxed at your slab", "Interest taxed at your slab", "Gains on units bought from 1 April 2023 taxed at your slab, however long you hold"] },
  ],
  cols: ["FD", "Bond", "Debt fund"],
  features: [
    { id: "exact", label: "Know exactly what I'll get", cols: [0, 1], text: "FDs and held-to-maturity bonds are built for that." },
    { id: "sell", label: "Could sell any day", cols: [1, 2], text: "Debt funds and listed bonds can be sold, but at the day's price." },
    { id: "spread", label: "Spread across many borrowers", cols: [2], text: "Debt funds spread across many borrowers." },
  ],
  notes: ["The RBI raises rates. Arjun has ₹10,000 in each. For each, does the value change today?", "Three ways to lend, side by side.", "What matters most to you?"],
  texts: {
    changes: "Value changes today",
    same: "Doesn't change today",
    score: "You got {n} of 3.",
    fund_note: "Many people expect debt funds to behave like FDs. Their NAV moves with bond prices.",
    next_row: "Next row",
    foot: "Day 28 covers tax in detail. This is a description, not a recommendation.",
  },
};
