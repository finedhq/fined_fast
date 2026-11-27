// WinterArc Day 8 "Introduction to Investing": the three chapter figures.
// Every return, rate and company is made up and says so on screen; the one
// real number is SEBI's FY26 study (87.7% of individual equity-derivatives
// traders made a net loss, shown as 88 of 100 dots). Checked by script
// (winterarcDays815.test.js): ₹13,439 → ₹7,504 today; hold ₹23,824 (₹13,303)
// vs sell ₹14,162 (₹7,908); owners ₹15 → ₹3.75; Arjun ≈ ₹74 lakh vs
// Kabir ≈ ₹41 lakh at 60.

// Chapter 1 · "Three doors" (DoorSim.jsx)
export const WA8_CH1_DOORS = {
  start: 10000,
  saveRate: 3,
  inflation: 6,
  path: [22, -10, 28, 6, -18, 35, 10, 14, -4, 20],
  pauseAt: 5,
  guess: { min: 5000, max: 15000, step: 500, start: 10000 },
  losers: 88,
  countdown: 5,
  doors: [
    { id: "save", label: "Door 1", name: "Savings account", line: "Keeps the amount safe." },
    { id: "invest", label: "Door 2", name: "A slice of many businesses", line: "Held for ten years." },
    { id: "trade", label: "Door 3", name: "Buy and sell often", line: "Catch quick price moves." },
  ],
  headlines: ["MARKETS CRASH 18%", "\"Get out now\" trends on social media", "Your friend sold everything", "Experts: \"worst year in a while\""],
  notes: [
    "Arjun's ₹10,000, ten years. Pick a door: all three will play.",
    "Door 1 pays a made-up 3% a year. Prices rise a made-up 6%. Guess first.",
    "Door 2 follows a made-up path: some great years, some bad ones.",
    "Year 5. The lane is red. Hold, or get out?",
    "Door 3: one form of trading, what happened to real people.",
  ],
  texts: {
    pick: "Tap a door. Its lane gets a \"your door\" ribbon.",
    guess_label: "In today's money, door 1 buys:",
    guess_result: "You guessed {guess}. The account shows {rupees}, but it buys what {real} buys today. Safe isn't the same as growing.",
    no_guess: "Lock a guess to see how it compares.",
    paused: "Down 18% this year: {before} fell to {after}.",
    hold: "You sat through the drop and kept the recovery.",
    sell: "Selling felt safe. It also locked in the drop and missed the +35% year.",
    both: "Real markets don't announce the next year. This path is made up; the pattern of drops and recoveries is the point.",
    clock: "Markets don't wait. Neither does the feeling. Decide.",
    clock_done: "No timer in real life, but it can feel like one. Take your call.",
    grid: "About 88 in 100 individual futures-and-options traders made a net loss in 2025–26 (SEBI study).",
    grid_foot: "This is about one kind of trading. Day 25 covers how trades work.",
  },
};

// Chapter 2 · "Owner or lender" (OwnerLender.jsx)
export const WA8_CH2_OWNER = {
  cards: [
    { id: "fd", label: "An FD", zone: "lender", pays: "Interest" },
    { id: "gbond", label: "A government bond", zone: "lender", pays: "Interest" },
    { id: "share", label: "A share of a company", zone: "owner", pays: "Part of profits, and the price can rise or fall" },
    { id: "flat", label: "A flat you rent out", zone: "owner", pays: "Rent, and the price can change", why: "You own it, so you're an owner, and it also pays rent." },
    { id: "gold", label: "A gold coin", zone: "holder", pays: "Only the price change" },
    { id: "loan", label: "A loan to a friend", zone: "lender", pays: "Interest (if they pay you back)" },
  ],
  zones: [
    { id: "lender", label: "Lender", sub: "you lent it" },
    { id: "owner", label: "Owner", sub: "you own a piece" },
    { id: "holder", label: "Holder", sub: "you hold a thing" },
  ],
  split: { costs: 70, interest: 10, taxRate: 25, good: 100, bad: 85, step: 5 },
  notes: [
    "Where does the return come from? Sort the six.",
    "Each one pays you differently.",
    "Chai Point Co. (fictional): ₹100 of sales. Slide to a bad year.",
  ],
  texts: {
    sorted: "{n} of 6 sorted.",
    split_good: "A good year: lenders get ₹10, owners get ₹15.",
    split_bad: "Sales fell 15%. Lenders still get ₹10. Owners' slice fell from ₹15 to {owners}: down {drop}.",
    readout: "Lenders are paid before owners. That's why lending is usually steadier, and owning can grow more but can also shrink.",
  },
};

// Chapter 3 · "The time machine" (TimeMachine.jsx)
export const WA8_CH3_TIME = {
  monthly: 2000,
  rate: 10,
  end: 60,
  early: { name: "Arjun", from: 21, to: 31 },
  late: { name: "Kabir", from: 31, to: 60 },
  ages: [20, 35],
  defaultAge: 25,
  notes: [
    "Both invest ₹2,000 a month at a made-up steady 10% a year. Guess first.",
    "Both lanes grow to 60.",
    "Your start: slide the age someone starts ₹2,000 a month.",
  ],
  texts: {
    reveal: "{early} put in {earlyIn}; at 60 it's about {earlyAt}. {late} put in {lateIn}; about {lateAt}.",
    wait: "Cost of waiting one more year: about {cost}.",
    foot: "Made-up steady 10% a year. Real returns are uneven, as door 2 showed, and aren't guaranteed. This is maths, not a forecast or advice.",
  },
};
