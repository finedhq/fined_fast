// WinterArc Day 6 "Emergency Funds and Financial Goals": the three chapter
// figures. All amounts are made up. The card rate matches Day 4 (a made-up
// 3.5% a month; owner's call, 26 Nov), so the Shock Deck scorecard is:
// ₹0 start → ₹5,579 interest, 10 months in debt, ₹26,579 owed on 31 Dec;
// ₹12,000 → ₹1,904, 6 months, ₹10,904; ₹36,000 → ₹0, jar ₹15,000 left.
// Checked by script (winterarcDays567.test.js), with the spec's 3% table too.

const INCOME = 20000; // Arjun's month if the reader skips "your month"
const MUST = 12000;

// Chapter 1 · "Shock Deck" (ShockDeck.jsx).
export const WA6_CH1_DECK = {
  rate: 3.5,
  save: 2000,
  shocks: {
    3: { label: "Phone screen", amount: 12000 },
    7: { label: "Laptop repair", amount: 18000 },
    10: { label: "Trip home, family emergency", amount: 15000 },
  },
  starts: [0, 12000, 36000],
  startNotes: ["", "1 month", "3 months"],
  jarMax: 40000,
  debtMax: 30000,
  shelves: [
    { id: "savings", label: "Savings account", pays: 15000, card: 0, line: "Paid the same day, at full value." },
    { id: "fd", label: "1-year FD", pays: 14700, card: 300, penalty: true, line: "Broken early: a made-up ₹300 penalty, so ₹300 goes on the card." },
    { id: "invest", label: "An investment whose price goes up and down", pays: 12750, card: 2250, line: "Its price was down a made-up 15% that month: the jar was worth ₹12,750, and ₹2,250 went on the card." },
  ],
  notes: [
    "Arjun's 2027: twelve months, face down (made up). He saves ₹2,000 a month; anything the jar can't cover goes on his card at a made-up 3.5% a month.",
    "January to March.",
    "April to July. Savings pay off the card first.",
    "August to December, and the year's scorecard.",
    "Run it back: same year, different start.",
    "Where should the jar sit? October's ₹15,000, from three shelves.",
  ],
  texts: {
    pick: "Pick a starting buffer, then scroll to flip the months.",
    picked: "Arjun starts 2027 with {start} in the jar. Scroll to flip the months.",
    shock: {
      covered: "The jar covers it. {left} left.",
      part: "Only {fromJar} in the jar. {toCard} goes on the card.",
      none: "The jar is empty: his savings are going to the card. All {toCard} goes on the card.",
    },
    bracket: "Same surprises. {lo_int} interest vs {hi_int}, and {lo_card} still owed vs {hi_jar} still saved.",
    try_more: "Tap Try it on the others to compare. Same surprises, same ₹2,000 a month.",
    honest: "₹36,000 is a lot. At ₹2,000 a month it takes 18 months to build. Chapter 2 is about getting there.",
    shelf_hint: "Tap a shelf to replay October from it.",
    shelf_after: "Emergency money needs to be reachable fast and not shrink when you need it. Many people keep it in a savings account, or split it between savings and a deposit they can break. The choice is yours.",
  },
};

// Chapter 2 · "Size yours" (FundSizer.jsx).
export const WA6_CH2_FUND = {
  defaultIncome: INCOME,
  defaultMust: MUST,
  minSave: 500,
  defaultSave: 2000,
  firstNotch: 5000,
  marchShock: 12000,
  notes: ["Your jar, sized on {must} of must-pay costs a month.", "Save a fixed amount each month. When is it ready?", "Three notches on the way up."],
  texts: {
    target: "{months} months of must-pay costs: a target of {target}. A common guideline is 3 to 6 months. It's a starting point, not a rule.",
    ready: "At {saving} a month: {months} months, ready by {when}.",
    maxed: "That leaves ₹0 for anything else. Most people can't keep that up. Try a number you could hit every month.",
    notch: "The first {first} already helps: March's {shock} screen puts {onCard} on the card, not {shock}.",
  },
};

// Chapter 3 · "Goal Forge" (GoalForge.jsx). months = Jan 2027 → target month, inclusive.
export const WA6_CH3_GOALS = {
  defaultIncome: INCOME,
  defaultMust: MUST,
  defaultSave: 2000,
  fundChapter: "wa-d06-ch2-size-yours",
  presets: [
    { id: "phone", label: "New phone", amount: 30000, months: 6 },
    { id: "trip", label: "Trip with friends", amount: 12000, months: 4 },
    { id: "laptop", label: "Laptop", amount: 60000, months: 12 },
    { id: "course", label: "Course fee", amount: 25000, months: 8 },
    { id: "gift", label: "Gift for parents", amount: 5000, months: 3 },
    { id: "move", label: "Deposit to move out", amount: 40000, months: 24 },
  ],
  defaults: ["phone", "trip", "laptop"],
  notes: [
    "What do you want money for? Pick up to three.",
    "Forged: an amount, a month, and a number per month. Saving starts January 2027.",
    "Does it fit your month?",
    "Fix it: later, smaller, or drop one.",
    "The jar goes first in line.",
  ],
  texts: {
    pick: "Pick up to three, or scroll on with Arjun's: phone, trip, laptop.",
    forged: "Divide the amount by the months you have: that's the monthly number.",
    fits: "It fits, with {left} to spare. Nice.",
    over: "Goals need {need} a month. Spare money is {spare} ({income} − {must} − {jar} for the jar): {over} over.",
    still_over: "Still {over} over. Try another fix.",
    moved: "{goal} moved to {when}: {now} a month instead of {was}.",
    shrunk: "{goal} cut to {amount}: {now} a month instead of {was}.",
    dropped: "{goal} dropped: {freed} a month freed.",
    lanes: "Goals are planned. Emergencies aren't. The jar sits at the front so it protects every other goal from being raided.",
  },
};
