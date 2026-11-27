// WinterArc Day 14 "Alternative Investments": the three chapter figures. Gold
// costs per route are made up and say so. Real: SEBI's 8 Nov 2025 caution
// that platform "digital gold" is outside its regulation; no new Sovereign
// Gold Bond issue since February 2024; PPF 7.1% for Oct–Dec 2026, 15 years,
// up to ₹1.5 lakh a year; EPF 8.25% for 2025-26; NPS regulated by PFRDA and
// market-linked; REITs regulated by SEBI. No product or provider is named.

// Chapter 1 · "Four ways to buy gold" (GoldCounter.jsx)
export const WA14_CH1_GOLD = {
  amount: 10000,
  routes: [
    { id: "jewel", label: "Jewellery", icon: "💍", held: 8600, why: "making charges and taxes", shield: "own", shieldText: "You hold it: purity, storage and theft are on you." },
    { id: "coin", label: "Coin or bar", icon: "🪙", held: 9600, why: "premium and taxes, plus a locker to think about", shield: "own", shieldText: "You hold it: purity, storage and theft are on you." },
    { id: "etf", label: "Gold ETF", icon: "📈", held: 9950, why: "small brokerage, then a yearly fund cost", shield: "sebi", shieldText: "SEBI-regulated mutual fund product." },
    { id: "digital", label: "Digital gold on an app", icon: "📱", held: 9700, why: "the platform's buy-sell gap", shield: "open", shieldText: "Not regulated by SEBI (its caution, Nov 2025)." },
  ],
  notes: [
    "Four counters, ₹10,000 on each. Which gives you the most gold value?",
    "Each counter weighs out its gold value after made-up costs.",
    "Same metal, different safety nets.",
    "Silver, and Sovereign Gold Bonds.",
  ],
  texts: {
    pick: "Tap the counter you think wins.",
    picked: "You picked {route}. It held {held} of gold value.",
    foot: "All costs here are made up to show the pattern. Real ones vary by seller.",
    silver: "Silver can be held the same ways, including silver ETFs, and its price tends to swing more than gold's.",
    sgb: "No new issues since Feb 2024",
    sgb_note: "Sovereign Gold Bonds are a government gold bond. Existing ones still trade.",
  },
  // made-up wobble lines, silver swinging wider than gold
  wobble: { gold: [100, 102, 101, 104, 103, 106, 105, 107], silver: [100, 106, 98, 109, 101, 112, 99, 110] },
};

// Chapter 2 · "The locked boxes" (LockTimeline.jsx)
export const WA14_CH2_LOCKS = {
  boxes: [
    { id: "ppf", label: "PPF", who: "Anyone can open one", rate: "Government sets the rate each quarter: 7.1% for October to December 2026", extra: "Up to ₹1.5 lakh a year · 15-year term", dial: "Set every quarter by the government, can change" },
    { id: "epf", label: "EPF", who: "For salaried employees", rate: "Rate declared each year: 8.25% for 2025-26", extra: "A share of salary goes in; the employer contributes too", dial: "Declared each year" },
    { id: "nps", label: "NPS", who: "A pension account regulated by PFRDA (Day 7)", rate: "Invested partly in markets, so returns aren't fixed", extra: "Built for retirement", dial: "Depends on markets" },
  ],
  cards: [
    { id: "t_save", label: "Savings account", zone: "today" },
    { id: "t_etf", label: "Gold ETF", zone: "trading" },
    { id: "t_ppf", label: "PPF", zone: "y15" },
    { id: "t_epf", label: "EPF", zone: "work" },
    { id: "t_nps", label: "NPS", zone: "retire" },
  ],
  zones: [
    { id: "today", label: "Today" },
    { id: "trading", label: "Any trading day" },
    { id: "y15", label: "15 years", note: "some limited withdrawals earlier" },
    { id: "work", label: "Retirement or leaving work", note: "under EPF rules" },
    { id: "retire", label: "Retirement age", note: "mostly then, under PFRDA rules" },
  ],
  notes: ["Three boxes, three rule-setters. Tap a box to open it.", "Place each box where it fully opens.", "Who sets the return?"],
  texts: {
    placed: "{n} of 5 placed right. Day 27 covers these three in detail.",
    foot: "Withdrawal rules are simplified here.",
  },
};

// Chapter 3 · "Card battle" (CardBattle.jsx)
export const WA14_CH3_BATTLE = {
  hand: [
    { id: "etf", label: "Gold ETF", icon: "📈", job: "Own gold, no locker, sell on any trading day" },
    { id: "coin", label: "Gold coin", icon: "🪙", job: "Gold you hold yourself; storage is on you" },
    { id: "ppf", label: "PPF", icon: "🔒", job: "Government-set rate, 15 years, up to ₹1.5 lakh a year" },
    { id: "epf", label: "EPF", icon: "💼", job: "Through a salaried job; the employer adds too" },
    { id: "nps", label: "NPS", icon: "🧓", job: "Market-linked pension, PFRDA-regulated" },
    { id: "home", label: "Real estate", icon: "🏠", job: "Can earn rent; needs a big amount; slow to sell" },
  ],
  jar: { id: "jar", label: "Emergency jar", icon: "🫙", job: "Ready cash for surprises (Day 6)" },
  challenges: [
    { id: "c1", text: "Own gold, no locker, sell on any trading day", win: "etf", lose: "Storage, a lock-in or slow selling gets in the way." },
    { id: "c2", text: "Government-set rate, 15-year term, up to ₹1.5 lakh a year", win: "ppf", lose: "That card's rate isn't set by the government each quarter." },
    { id: "c3", text: "Comes with a salaried job; the employer adds money too", win: "epf", lose: "No employer contribution on that card." },
    { id: "c4", text: "Market-linked, built for retirement, PFRDA-regulated", win: "nps", lose: "That card isn't a PFRDA pension account." },
    { id: "c5", text: "Can earn rent; needs a big amount; slow to sell", win: "home", lose: "That card doesn't pay rent." },
  ],
  final: { text: "Need ₹20,000 next week", lose: { etf: "Might be down that week", coin: "Too slow to sell at a fair price", ppf: "Locked", epf: "Locked", nps: "Locked", home: "Months to sell" } },
  property: [
    { label: "Amount needed", home: 95, reit: 25 },
    { label: "How fast you can sell", home: 15, reit: 75 },
    { label: "Income", home: 60, reit: 55, note: "rent" },
    { label: "Costs to buy and keep", home: 80, reit: 25, note: "stamp duty, upkeep" },
  ],
  notes: ["The biggest card in the deck.", "Five challenges. Tap a card from your hand.", "Final round.", "Your deck."],
  texts: {
    win: "Round won.",
    final: "None of today's assets is built for next week. That's the emergency fund's job.",
    jar_in: "A seventh card slides in…",
    score: "Card battle: {n} of 6.",
    foot: "This describes what each option is. It isn't a recommendation to buy any of them.",
    property_foot: "Bars are a rough, made-up picture, not measurements.",
  },
};
