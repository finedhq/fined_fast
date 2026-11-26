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
  // Referral contests (DECIDED: Nov one 2026-11-11, Dec one 2026-11-15). Each
  // counts friends brought in during its own window; the top referrer wins.
  referralContests: [
    { key: "nov", name: "Pre-launch referral contest", prize: "₹500", closes: "30 Nov 2026, 11:59 pm IST", endsAt: "2026-11-30T23:59:59+05:30", friendDays: "Days 1, 2 and 3 by 3 Dec", results: "4 Dec 2026" },
    { key: "dec", name: "December referral contest", prize: "₹500", opens: "1 Dec 2026", closes: "30 Dec 2026, 11:59 pm IST", endsAt: "2026-12-30T23:59:59+05:30", friendDays: "any 3 days by 30 Dec", results: "31 Dec 2026" },
  ],
  referralContestPrize: "₹500",
  // The referral prize's name, and the fewest friends needed to win it
  referralAwardName: "Avalanche Award",
  referralAwardMin: 3,
  certificateMinDays: 21,
  // TENTATIVE: paid checkout needs entity status + gateway approval. Price stays
  // hidden (show.certificatePrice) until that is confirmed.
  certificatePrice: "₹199",

  // Prize pool and its split (DECIDED 2026-11-15). The parts add up to the pool.
  prizePool: "₹25,000",
  prizeNote: "Final top 3, a winner every day, and two referral contests.",
  finalPrizes: [
    { place: "1st", amount: "₹3,000" },
    { place: "2nd", amount: "₹2,000" },
    { place: "3rd", amount: "₹1,000" },
  ],
  dailyPrizeTotal: "₹3,000",
  dailyPrizeEach: "₹100", // shown on the rules page only; the landing says "a winner every day"

  // Presenting sponsor (owner 2026-11-27): "WinterArc, presented by Aguafuel".
  // Logos live in public/sponsors/ (black text for light pages, white for dark).
  // `vouchersHow` says who gets the vouchers; it shows on the rules page only
  // once it is filled in. Turn it all off with show.sponsor.
  sponsor: {
    name: "Aguafuel",
    // The logo links here (new tab, rel="sponsored", UTM-tagged; clicks send GTM sponsor_click)
    url: "https://www.aguafuel.com/",
    logo: "/sponsors/aguafuel-logo-black.png",
    logoOnDark: "/sponsors/aguafuel-logo-white.png",
    vouchers: 50,
    voucherReward: "2 free bottles of protein water",
    vouchersHow: "",
  },

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
    certificatePrice: true,
    sponsor: true,
  },
};

// Cross-selling the course and articles (owner 2026-11-21). Links are site
// paths; change them here and every placement follows. `src` tags each click
// for GTM (winterarc_cross_sell event, and course_start carries it too).
export const CROSS_SELL = {
  bonusPoints: 3, // +3 once a day for an article or module; matches CONTENT_BONUS in winterarc_rules.py
  course: { title: "Basics of Stock Market", href: "/courses/basics-of-stock-market" },
  // "Go deeper" after a day is finished. Only the days listed here get one.
  goDeeper: {
    2: { title: "What Happens to Your Money When a Bank Fails?", href: "/articles/what-happens-to-your-money-when-a-bank-fails" },
    3: { title: "What You Have at 25 That You Won't Have at 35", href: "/articles/what-you-have-at-25-that-you-wont-have-at-35" },
    4: { title: "Should You Always Prepay Your Loan?", href: "/articles/should-you-always-prepay-your-loan" },
    7: { title: "Why Is the RBI Building a Digital Rupee When UPI Already Works?", href: "/articles/rbi-digital-rupee-vs-upi" },
    8: { title: "Basics of Stock Market (course)", href: "/courses/basics-of-stock-market" },
    10: { title: "What Do the Points in Nifty and Sensex Actually Mean?", href: "/articles/what-do-the-points-in-nifty-and-sensex-actually-mean" },
    12: { title: "How Does a Company Actually Get Into the Nifty 50?", href: "/articles/how-nifty-50-selects-companies" },
    16: { title: "How to Research a Company Before You Invest in Its Stock", href: "/articles/how-to-research-a-company-before-investing" },
    17: { title: "How to Read a Company's Profit & Loss Statement", href: "/articles/how-to-read-a-profit-and-loss-statement" },
    18: { title: "Why Is P/E Ratio Such an Important Metric for Investors?", href: "/articles/why-is-p-e-ratio-such-an-important-metric-for-investors" },
    25: { title: "Basics of Stock Market (course)", href: "/courses/basics-of-stock-market" },
    28: { title: "TDS on Salary Explained: Why It's Not an Extra Tax", href: "/articles/why-your-payslip-tds-is-not-extra-tax" },
  },
  // Day 30 finish screen
  finale: {
    title: "You finished WinterArc. You definitely have a finance spark.",
    text: "Keep it going with these:",
    links: [
      { title: "Basics of Stock Market", note: "The full course, with a certificate at the end", href: "/courses/basics-of-stock-market" },
      { title: "All FinEd articles", note: "Short reads on money in the news", href: "/articles" },
    ],
  },
  // Share card milestones (streak lengths; 30 = finished WinterArc)
  shareMilestones: [7, 14, 21, 30],
};

/** Before Day 1 opens. */
export const isBeforeStart = () => Date.now() < Date.parse(WINTERARC.startsAt);
/** After the end of Day 30. */
export const isChallengeOver = () => Date.now() >= Date.parse(WINTERARC.startsAt) + WINTERARC.totalDays * 86400000;

// The referral contest running right now, if any (checked when the page loads)
export const CURRENT_REFERRAL_CONTEST = WINTERARC.show.referralContest
  ? WINTERARC.referralContests.find((c) => Date.now() < Date.parse(c.endsAt)) || null
  : null;
export const REFERRAL_CONTEST_OPEN = !!CURRENT_REFERRAL_CONTEST;

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
