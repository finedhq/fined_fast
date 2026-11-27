// WinterArc Day 5 "Insurance Basics": the three chapter figures. Every bill,
// premium and price is made up and says so; the rules (36-month cap on
// waiting periods, 30-day free look, no GST on individual policies from 22
// Sep 2025, the complaint route) are real, with sources in the spec. Checked
// by script (winterarcDays567.test.js): ₹6,000 pool share, ₹37,500 vs
// ₹30,000 over 5 years, and the claim test table (₹1,12,500 / ₹1,25,000 /
// ₹1,21,500 / ₹1,35,000; ₹4 lakh bill capped at ₹3,00,000; ₹0 inside the
// waiting period).

// Chapter 1 · "The Pool" (PoolSim.jsx). Dots are 0-based: Arjun = dot 55 → 54.
export const WA5_CH1_POOL = {
  size: 100,
  me: 54,
  bill: 200000,
  stipend: 15000,
  sick: 3,
  price: 7500,
  buckets: [600, 6000, 20000, 60000],
  years: [
    [11, 46, 87],
    [4, 32, 70],
    [19, 63, 89],
    [7, 54, 76],
    [15, 41, 98],
  ],
  notes: [
    "Arjun's hostel: 100 students, one year (made up). He's the outlined dot.",
    "Say 3 of the 100 get the ₹2,00,000 bill this year. Pick each person's share.",
    "Join the pool, or go solo? Then play 5 made-up years.",
    "The same 5 years, two ways to pay.",
    "The last year again.",
  ],
  texts: {
    bill_vs: "one hospital stay: more than 13 months of Arjun's ₹15,000 stipend",
    guess_exact: "Spot on. ₹6,00,000 ÷ 100 = ₹6,000 each.",
    guess_low: "Close, but one zero short. ₹6,00,000 ÷ 100 = ₹6,000.",
    guess_high: "Much less than you guessed. Spread over 100 people, a ₹6 lakh problem is ₹6,000 each.",
    result_join: "5 years × ₹7,500 = ₹37,500. When year 4 hit, the pool paid the ₹2,00,000 bill.",
    result_solo: "Four good years, ₹0 spent. Then year 4: a ₹2,00,000 bill, all his.",
    honest: "He paid more than his average loss, and that's normal. He was buying a cap on his worst year, not a profit.",
    protected: "97 dots: protected, didn't need it this year. A year with no claim is the pool working, not money lost.",
  },
};

// Chapter 2 · "Claim Machine" (ClaimMachine.jsx).
export const WA5_CH2_CLAIM = {
  lines: [
    { id: "room", label: "Room, 5 days × ₹6,000", amount: 30000, kind: "room" },
    { id: "surgery", label: "Surgery and doctors", amount: 80000, kind: "other" },
    { id: "meds", label: "Medicines", amount: 25000, kind: "other" },
    { id: "cons", label: "Gloves, masks, other consumables", amount: 15000, kind: "nonpayable" },
  ],
  policy: { sumInsured: 300000, roomLimit: 4000, roomRate: 6000, days: 5, copay: 10, waitMonths: 24 },
  // premium by rule setting: c/n = co-pay on/off, r/n = room limit on/off
  premiums: { cr: 6000, nr: 7200, cn: 6900, nn: 8100 },
  bigLine: "surgery",
  bigAmount: 330000,
  guess: { start: 75000, step: 5000 },
  ages: [2, 6, 12, 18, 24, 36],
  notes: [
    "Arjun's bill (made up). The policy card stays on screen all chapter.",
    "What will the insurer pay? Set your guess, then lock it.",
    "Stamp 1: the room-rent limit.",
    "Stamp 2: items the policy doesn't pay.",
    "Stamp 3: the co-pay.",
    "Rebuild the policy: each rule has a price (made-up premiums).",
    "Same bill, but the policy is new and the surgery is planned. Set its age.",
  ],
  texts: {
    receipt_title: "City Hospital · final bill (made up)",
    guess_close: "You read the fine print like a pro: ₹1,12,500.",
    guess_full: "Most people guess the full bill. Three rules cut ₹37,500.",
    guess_other: "You guessed {guess}. The insurer paid ₹1,12,500, a gap of {gap}.",
    copay_line: "The insurer pays ₹1,12,500. Arjun pays ₹37,500.",
    no_guess: "Lock a guess at 2.2 to see how close you were.",
    sandbox_start: "As sold: premium ₹6,000, Arjun pays ₹37,500. Remove a rule, or switch the bill.",
    sandbox_line: "{more} more a year would have saved Arjun {saved} on this bill.",
    capped: "At this size, the sum insured is the rule that bites: the insurer stops at ₹3,00,000.",
    waiting_stamp: "Waiting period",
    waiting: "Inside his policy's made-up 2-year waiting period: the insurer pays ₹0 for this planned surgery. Rules cap waiting periods at 36 months.",
    covered: "Past the 2-year waiting period: the insurer pays {paid} again.",
  },
};

// Chapter 3 · "Shield Loadout" (ShieldLoadout.jsx). x / y place each card on
// the reveal grid (% from left: less → more likely; % from top: bigger → smaller).
export const WA5_CH3_SHIELD = {
  zones: [
    { id: "insure", label: "Insure" },
    { id: "save", label: "Save for it" },
    { id: "live", label: "Live with it" },
  ],
  cards: [
    { id: "hospital", label: "Hospital stay, ₹2,00,000", short: "Hospital stay", zones: ["insure"], x: 4, y: 6, miss: "Hospital stay: rare, and big enough to wreck a year's money. That's what insurance is for." },
    { id: "screen", label: "Cracked phone screen, ₹8,000", short: "Phone screen", zones: ["save"], x: 54, y: 48, miss: "Phone screen: fairly likely, and ₹8,000 can be saved for. That's Day 6." },
    { id: "vehicle", label: "His scooter injures someone", short: "Scooter injures someone", zones: ["insure"], x: 4, y: 24, miss: "Injuring someone with a vehicle can cost far more than he has. Cover for it is required by law in India." },
    { id: "earbuds", label: "Lost earbuds, ₹2,500", short: "Earbuds", zones: ["save"], x: 56, y: 66, miss: "Earbuds: small and common. Policies exist, but the premium and paperwork often cost more than the loss." },
    { id: "income", label: "His family loses his income", short: "Family loses his income", zones: ["insure"], x: 50, y: 6, miss: "Family loses his income: only matters if someone depends on him. Hold that thought." },
    { id: "cold", label: "Doctor visit for a cold, ₹800", short: "Cold, ₹800", zones: ["live", "save"], x: 60, y: 84, miss: "A cold: small and common. Pay it from monthly money." },
  ],
  defaultSituation: "student_none",
  situations: {
    student_family: "Many students are covered on a family health policy. Find out what it covers and until what age.",
    student_none: "Start by finding out whether you're already on a family or college policy.",
    earner_solo: "A job's group health cover usually lasts only while you work there.",
    earner_family: "Health cover protects against bills. Life cover is meant to replace your income for people who depend on it.",
  },
  plans: [
    { id: "cover", label: "Cover-only plan", cover: "₹1,00,00,000" },
    { id: "mixed", label: "Mixed plan", cover: "₹1,50,000", extra: "plus a savings value" },
  ],
  rights: [
    { id: "freelook", label: "30-day free look", line: "You can return a new life or health policy within 30 days of getting the document." },
    { id: "gst", label: "No GST on individual policies", line: "Since 22 September 2025, individual life and health premiums carry no GST. Group policies still do." },
    { id: "complain", label: "A complaint route", line: "Complain to the insurer first, then IRDAI's Bima Bharosa or the Insurance Ombudsman. Day 7 shows how." },
  ],
  notes: [
    "Six things that could happen to Arjun. Sort each one.",
    "Where each one really sits: how big × how likely.",
    "What each cover is for, in your situation (from your pick at the top).",
    "Same ₹10,000 a year, two kinds of life plan (made up).",
    "Three rights the rules give you. Stamp each one.",
  ],
  texts: {
    sorted: "Sorted. Scroll on to see where each one really sits.",
    not_sorted: "You haven't sorted the cards in 3.1. Here's where each one sits.",
    score: "You sorted {n} of {of} the textbook way.",
    health: "pays big hospital bills, within its rules (Chapter 2).",
    vehicle: "cover for injuring someone else is required by law if you ride.",
    life_on: "replaces your income for the people who depend on it.",
    life_off: "for when someone depends on your income.",
    not_advice: "This explains what each cover does. It isn't a recommendation to buy anything.",
    plans_before: "Answer below to see the cover each one buys.",
    plans_after: "Neither is wrong. Before choosing, compare the cover amount and the return after charges separately.",
    plans_note: "Made-up numbers for a 25-year-old. Real ones vary widely.",
    passport_done: "Passport complete: three rights that come with the policies you buy.",
  },
};
