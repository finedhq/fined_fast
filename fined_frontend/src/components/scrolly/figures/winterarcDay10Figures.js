// WinterArc Day 10 "Stock Market Basics": the three chapter figures. Every
// company, share count, IPO number and index weight is made up and says so;
// the Nifty 50 (50 NSE companies) and Sensex (30 BSE companies) are
// free-float market-cap weighted. Checked by script (winterarcDays815.test.js):
// ₹10 crore ÷ 1 lakh / 10 lakh / 1 crore shares = ₹1,000 / ₹100 / ₹10; +2 lakh
// new shares at ₹100 = ₹2 crore, founder 83.3%; A ₹1,000 crore vs B ₹4,000
// crore; index 996 after Kisan +20% and Big Bank −5%; 1,050 puzzle.

// Chapter 1 · "Slice the company" (ShareSlicer.jsx)
export const WA10_CH1_SLICE = {
  value: 10e7, // ₹10 crore
  options: [1e5, 1e6, 1e7],
  raise: { shares: 1e6, price: 100, newShares: 2e5 },
  compare: [
    { id: "a", label: "Company A", price: 2000, shares: 50e5 },
    { id: "b", label: "Company B", price: 200, shares: 20e7 },
  ],
  ticker: "CHAIPT",
  exchanges: ["NSE", "BSE"],
  notes: [
    "Chai Point Co. is fictional. An investor values it at ₹10 crore.",
    "You sell 2 lakh new shares at ₹100.",
    "Which company is bigger?",
    "Listed shares trade on an exchange, through a broker, and sit in a demat account.",
  ],
  texts: {
    slice: "More slices, smaller price, same company.",
    raise: "You own less of a bigger company. The new money belongs to the company.",
    guess_first: "Tap your guess first.",
    compare: "Market cap = price × number of shares. The cheaper share belonged to the bigger company.",
    ticker: "Same company, now with a ticker. Day 25 shows how a trade works.",
  },
};

// Chapter 2 · "The IPO lottery" (IpoDrum.jsx)
export const WA10_CH2_IPO = {
  company: "Volt Scooters",
  lots: 10000,
  applicants: 150000,
  times: 15,
  meter: [1, 5, 10, 15],
  balls: 15,
  winner: 9, // by seed; the reader's ball (0) never wins
  ipoPrice: 100,
  // made up: opens 4% above the IPO price, then wobbles ±3% with no trend
  listing: [104, 105.6, 103.1, 106.2, 102.4, 104.9, 101.8, 105.3, 103.4, 104.6, 102.9, 104.2],
  notes: [
    "Volt Scooters is fictional. Flip the lane to see whose pocket your rupees land in.",
    "This IPO's retail part has 10,000 lots. 1,50,000 people apply.",
    "Heavily oversubscribed: one minimum lot for as many applicants as possible, by computerised lottery.",
    "A made-up listing day. No direction implied.",
  ],
  texts: {
    lane_ipo: "IPO day: your rupees go to Volt Scooters itself, to build the business.",
    lane_after: "After listing: your rupees go to another investor who is selling. The company gets nothing from that trade.",
    apply: "Apply",
    applied: "Subscribed 15 times over. 1,50,000 applicants for 10,000 lots.",
    spin: "Spin the drum",
    skip: "Skip to the result",
    lost5: "Five lots, still one ticket. Your money was blocked and then released.",
    lost1: "About a 1-in-15 chance, and not this time.",
    both: "In this IPO, about 14 in 15 applicants got nothing.",
    pick_first: "Apply at 2.2 first to get your ball.",
    listing: "Listing price isn't the IPO price. It can open higher or lower.",
  },
};

// Chapter 3 · "What the index measures" (IndexBuilder.jsx). Free-float caps
// in ₹ crore; index = total ÷ 10, so it starts at 1,000.
export const WA10_CH3_INDEX = {
  companies: [
    { id: "bank", name: "Big Bank", cap: 4000, full: 8000 },
    { id: "pixel", name: "Pixel Pay", cap: 2500 },
    { id: "chai", name: "Chai Point", cap: 1500 },
    { id: "sun", name: "Sun Roof", cap: 1200 },
    { id: "kisan", name: "Kisan Seeds", cap: 800 },
  ],
  rows: [["bank", "pixel"], ["chai", "sun", "kisan"]],
  divisor: 10,
  guessMoves: { kisan: 20, bank: -5 },
  range: [-20, 20],
  snap: 5,
  target: 1050,
  notes: [
    "The FinEd Five: a made-up index of five fictional companies. Bigger companies get bigger weights.",
    "Kisan jumps 20%. Big Bank slips 5%.",
    "Tap − or + on any company (−20% to +20%). Can you get the index to exactly 1,050?",
    "Big Bank's promoter holds half its shares.",
  ],
  texts: {
    start: "The FinEd Five starts at 1,000.",
    guess_first: "Tap your guess first.",
    after: "Kisan adds 16 points; Big Bank takes away 20. Weight beat the size of the move.",
    hit: "1,050 exactly. You moved the market.",
    full: "Full market cap: Big Bank counts all 8,000 crore and weighs 57%.",
    free: "Free float: only shares available for public trading count, so Big Bank weighs 40%.",
    real: "Nifty 50: 50 companies, NSE · Sensex: 30 companies, BSE. Both use free float.",
    foot: "The Nifty 50 and Sensex don't show the whole market. India has thousands of listed companies.",
  },
};
