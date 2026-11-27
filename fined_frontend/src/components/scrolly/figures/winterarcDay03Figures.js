// WinterArc Day 3 "Inflation and Compounding": the two chapter figures.
// Every price and rate is made up and says so on the figure, except the RBI's
// inflation target (4%, band 2% to 6%, renewed to 31 Mar 2031). Checked by
// script: ₹100 × 1.05^10 = ₹162.89; ₹10,000 at 8%: simple ₹18,000 / ₹26,000 /
// ₹34,000, compound ₹21,589 / ₹46,610 / ₹1,00,627 after 10 / 20 / 30 years;
// ₹1,000 a month at 8% added monthly (paid at each month's end): Asha
// (age 20–29, then left) ₹9,01,339 at 50, Dev (age 30–49) ₹5,89,020.

// Chapter 1 · "Why ₹100 buys less" (ThaliPlate.jsx).
export const WA3_CH1_THALI = {
  price: 100,
  rate: 5,
  years: 10,
  savings: 10000,
  saverRate: 3,
  guess: { min: 100, max: 250, step: 10, start: 120 },
  band: { low: 2, high: 6, target: 4, max: 10 },
  notes: [
    "Arjun's ₹100 note and one canteen thali (made-up prices).",
    "The same thali, ten years on, at a made-up 5% a year.",
    "Arjun's ₹10,000 savings, counted in ₹100 thalis.",
    "The RBI's real target for inflation: 4%, inside a band of 2% to 6%.",
  ],
  texts: {
    last: "Last year, ₹100 paid for the whole plate. Now tap This year.",
    this: "Same note, {short} short. That missing slice is inflation.",
    under: "You guessed {guess}. It's about {answer}: {gap} more than you thought. Each year's rise lands on top of the last.",
    over: "You guessed {guess}. It's about {answer}: {gap} less than you thought.",
    exact: "Spot on: about {answer}. Each year's rise lands on top of the last.",
    today: "Today, ₹10,000 buys 100 thalis. Answer the question to fast-forward a year.",
    today_after_guess: "Today, ₹10,000 buys 100 thalis. Now tap After a year.",
    after: "₹10,300 now, but the thali costs ₹105: {count} thalis. {lost} fewer, even though the number went up.",
    below: "Below the band: prices are barely rising.",
    inside: "Inside the band the RBI aims for.",
    target: "Right on the RBI's target: 4%.",
    above: "Above the band: the RBI would want to bring this down.",
  },
};

// Chapter 2 · "Interest that earns interest" (GrowthLanes.jsx).
export const WA3_CH2_GROWTH = {
  amount: 10000,
  rate: 8,
  maxYears: 30,
  race: {
    from: 20,
    to: 50,
    asha: { monthly: 1000, payFrom: 20, payTo: 30 },
    dev: { monthly: 1000, payFrom: 30, payTo: 50 },
  },
  notes: [
    "₹10,000 at a made-up 8% simple interest. Add a year at a time.",
    "Now the same ₹10,000, compounding. Watch the size of each new coin.",
    "Jump ahead: 10, 20 and 30 years.",
    { before: "Asha and Dev, ₹1,000 a month each (shaded: the years they pay in). Who has more at 50?", after: "From 20 to 50, at a made-up 8% a year, added monthly." },
  ],
  texts: {
    start: "Tap +1 year.",
    simple_year: "+{add} this year, the same as every year. {total} so far.",
    compound_year: "This year's coin: simple {simple}, compound {compound}. Interest is earning interest.",
    gap: "After {years} years, compounding is ahead by {gap}.",
    paid_in: "Pays in {paid}, age {from} to {to}",
  },
  footnote: "Made-up 8% a year, added monthly. Real returns go up and down. This is not a prediction.",
};
