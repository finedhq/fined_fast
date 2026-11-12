// WinterArc settings shown on the landing page. Values marked PLACEHOLDER are
// still being decided; change them here and the page follows. Set a section's
// flag to false to hide it (e.g. if the 27 Nov legal check removes a feature).

export const WINTERARC = {
  name: "WinterArc",
  tagline: "30 Days of Money",
  // Day 1 starts at midnight IST on this date (used for the countdown)
  startsAt: "2026-12-01T00:00:00+05:30",
  startDate: "1 Dec",
  endDate: "30 Dec",
  totalDays: 30,
  minAge: 18,

  // PLACEHOLDER values (still being simulated)
  pointsPerQuestion: 10,
  questionsPerDay: 3,
  finalePoints: 60,
  streakBonuses: [
    { days: 7, points: 10 },
    { days: 14, points: 20 },
    { days: 21, points: 30 },
    { days: 30, points: 40 },
  ],
  startingResets: 2,
  // Rules page values (TENTATIVE, from the brief)
  retryPointsNote: "Each retry of a question earns fewer points than the try before. The exact scale is set before launch.",
  lateFullHours: 36,
  latePercentAfter: 50,
  streakGrace: "12:00 noon IST the next day",
  lateResetPercent: 50,
  resetsExpire: "the end of 30 Dec",
  winnerResponseHours: 48,
  finalRulesDate: "27 Nov 2026",
  residency: "India",
  referralPoints: 10,
  referralCap: 20,
  // Pre-launch referral contest (DECIDED 2026-11-11)
  referralContestPrize: "₹500",
  referralContestCloses: "30 Nov 2026, 11:59 pm IST",
  certificateMinDays: 21,
  // TENTATIVE: paid checkout needs entity status + gateway approval. Price stays
  // hidden (show.certificatePrice) until that is confirmed.
  certificatePrice: "₹149",

  // Prize pool shown on the page. Breakdown is not final, so only the pool shows.
  prizePool: "₹10,000",
  prizeNote: "Shared between weekly winners and the final top scorers. Full prize table published before 1 Dec.",

  // Leaderboard weeks (DECIDED). Days are December dates; Sundays close each week.
  weeks: [
    { label: "Week 1", from: 1, to: 6 },
    { label: "Week 2", from: 7, to: 13 },
    { label: "Week 3", from: 14, to: 20 },
    { label: "Week 4", from: 21, to: 27 },
    { label: "Final stretch", from: 28, to: 30 },
  ],

  // Learning themes (TENTATIVE). These are content blocks, separate from the
  // leaderboard weeks above, so they are never called "Week N" on the page.
  themes: [
    { key: "pf", name: "Personal Finance", from: 1, to: 7 },
    { key: "inv", name: "Investing", from: 8, to: 14 },
    { key: "deep", name: "Understanding Investments", from: 15, to: 21 },
    { key: "plan", name: "Markets and Planning", from: 22, to: 30 },
  ],

  // Day-by-day topics (TENTATIVE). Day 30 is the finale quiz (DECIDED).
  // `short` is the one-word label shown inside the opened door.
  topics: [
    { day: 1, short: "Budgeting", title: "Introduction to Personal Finance", learn: "Money management, income, expenses, savings and budgeting." },
    { day: 2, short: "Banks", title: "Banking Basics", learn: "Savings accounts, FDs, RDs and how banks work." },
    { day: 3, short: "Inflation", title: "Inflation and Compounding", learn: "Inflation, purchasing power, interest and the power of compounding." },
    { day: 4, short: "Credit", title: "Credit Cards and Loans", learn: "Credit cards, credit scores, CIBIL, EMIs and debt." },
    { day: 5, short: "Insurance", title: "Insurance Basics", learn: "Health insurance, life insurance and why insurance matters." },
    { day: 6, short: "Goals", title: "Emergency Funds and Financial Goals", learn: "Saving for emergencies and planning short- and long-term goals." },
    { day: 7, short: "RBI & SEBI", title: "Indian Financial Ecosystem", learn: "RBI, SEBI, AMFI, NSE, BSE and their roles." },
    { day: 8, short: "Investing", title: "Introduction to Investing", learn: "Saving vs investing vs trading, and why people invest." },
    { day: 9, short: "Risk", title: "Risk and Return", learn: "Investment risks, returns, liquidity and a first look at diversification." },
    { day: 10, short: "Stocks", title: "Stock Market Basics", learn: "Stocks, shares, stock exchanges, Nifty, Sensex and IPOs." },
    { day: 11, short: "Mutual funds", title: "Mutual Funds", learn: "What mutual funds are and how they work." },
    { day: 12, short: "SIPs", title: "SIPs and Index Funds", learn: "SIP vs lump sum, active vs passive investing and index funds." },
    { day: 13, short: "Bonds", title: "Fixed Income Investments", learn: "FDs, bonds, government securities and debt funds." },
    { day: 14, short: "Gold", title: "Alternative Investments", learn: "Gold, silver, ETFs, REITs and real estate." },
    { day: 15, short: "Fund picks", title: "Choosing Mutual Funds", learn: "Fund categories, expense ratios, benchmarks and past performance." },
    { day: 16, short: "Fundamentals", title: "Introduction to Fundamental Analysis", learn: "Understanding a company's business, revenue, profit and debt." },
    { day: 17, short: "Statements", title: "Understanding Financial Statements", learn: "A first look at balance sheets, income statements and cash flows." },
    { day: 18, short: "Valuation", title: "Understanding Stock Valuation", learn: "Market cap, P/E ratio, EPS and what makes a stock expensive or cheap." },
    { day: 19, short: "Returns", title: "Investment Returns", learn: "Absolute returns, CAGR, XIRR and comparing investments." },
    { day: 20, short: "Behaviour", title: "Behavioural Finance", learn: "FOMO, panic selling, herd mentality and common mistakes." },
    { day: 21, short: "Scams", title: "Investment Scams and Investor Protection", learn: "Ponzi schemes, misleading returns, frauds and staying safe." },
    { day: 22, short: "Technicals", title: "Introduction to Technical Analysis", learn: "What technical analysis is and how it differs from fundamental analysis." },
    { day: 23, short: "Charts", title: "Understanding Stock Charts", learn: "Candlesticks, OHLC, bullish and bearish moves, and trends." },
    { day: 24, short: "Indicators", title: "Basic Technical Analysis Concepts", learn: "Support, resistance, volume, chart patterns, and a brief look at RSI, MACD and moving averages." },
    { day: 25, short: "Trading", title: "How Stock Market Trading Works", learn: "Demat accounts, brokers, market orders, limit orders and settlement." },
    { day: 26, short: "Portfolio", title: "Portfolio Management", learn: "Asset allocation, diversification and rebalancing." },
    { day: 27, short: "Retirement", title: "Retirement and Long-Term Planning", learn: "PPF, EPF, NPS, retirement planning and long-term wealth creation." },
    { day: 28, short: "Tax", title: "Taxation for Investors in India", learn: "Income tax basics, capital gains, STCG, LTCG and tax implications." },
    { day: 29, short: "Money plan", title: "Your First Money Plan", learn: "Pocket money, internships, first salary, goals, risk tolerance and a sample asset mix." },
    { day: 30, short: "Finale", title: "Finale Quiz", learn: "One final quiz across all 30 days." },
  ],

  // On/off switches for features the legal check may change
  show: {
    prizes: true,
    referralContest: true,
    streakBonuses: true,
    resets: true,
    referrals: true,
    certificate: true,
    certificatePrice: false,
  },
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Facts about challenge day n (1 to 30): its date, weekday and leaderboard week. */
export function dayInfo(n) {
  const date = new Date(Date.UTC(2026, 11, n));
  const weekday = WEEKDAYS[date.getUTCDay()];
  const week = WINTERARC.weeks.find((w) => n >= w.from && n <= w.to);
  return {
    n,
    label: `${n} Dec`,
    weekday,
    week: week?.label,
    cutoff: n === week?.to,
    finale: n === WINTERARC.totalDays,
  };
}
