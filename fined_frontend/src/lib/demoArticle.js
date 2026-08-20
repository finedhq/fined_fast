// Flagship educational demo article for FinEd Personal Lens
export const ETF_DEMO_ARTICLE = {
  id: "etf-101-guide",
  slug: "understanding-etfs-exchange-traded-funds",
  title: "The No-Nonsense Guide to Exchange Traded Funds (ETFs)",
  tag: "Investing",
  author: "FinEd Editorial Team",
  created_at: "2026-02-15T10:00:00Z",
  image_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
  editor_summary: "A plain English breakdown of ETFs: how they bundle assets, trade in real time on stock exchanges, offer low expense ratios, and compare with traditional mutual funds and direct stock picking.",
  metadata: {
    difficulty: "Beginner to Intermediate",
    readingTime: "6 min read",
    targetAudience: "Everyday retail investors, young professionals, and learners",
    keyConcepts: ["Diversification", "Expense Ratio", "Index Tracking", "Intraday Liquidity"],
    importantSections: [
      "What Is an ETF in Plain English?",
      "The Fruit Basket Analogy: ETFs vs Stocks",
      "ETFs vs Mutual Funds: The 4 Big Differences",
      "Understanding Expense Ratios & Hidden Costs",
      "How to Actually Buy Your First ETF"
    ]
  },
  content: `Exchange Traded Funds (ETFs) have quickly become one of the most popular ways for everyday people to invest in the financial markets without needing to pick individual winning stocks.

## What Is an ETF in Plain English?
Imagine walking into a grocery store. If you want to make a fruit salad, you could walk through every aisle, inspect each apple, banana, mango, and orange, weigh them, and buy them separately. If one orange turns out to be rotten, a big chunk of your money went to waste.

Alternatively, the grocery store sells a pre-packaged, fresh fruit salad bowl that contains a curated mix of all the best fruits. When you buy this single bowl, you instantly own a slice of everything.

An Exchange Traded Fund (ETF) is that pre-packaged bowl for the stock market. Instead of researching and buying 50 separate company shares, you buy one single share of an ETF, and your money is automatically spread across all 50 companies.

## How ETFs Trade on an Exchange
The term "Exchange Traded" simply means the fund is bought and sold on a stock exchange (like the NSE, BSE, NYSE, or Nasdaq), exactly like a normal stock share of Apple, Reliance, or Microsoft.

Unlike traditional mutual funds where the price is calculated only once at the end of the trading day (known as the Net Asset Value or NAV), an ETF's price changes constantly in real-time during market hours. If you want to buy or sell at 11:30 AM, you get the exact price at 11:30 AM in a split second.

## ETFs vs Mutual Funds: The 4 Big Differences
Many people confuse ETFs with Mutual Funds because both offer instant diversification across a basket of assets. However, their underlying mechanics are distinct:

1. **Trading Flexibility**: Mutual funds settle after the market closes. ETFs trade live every second the market is open.
2. **Management Style**: Most ETFs are "passive" — they simply track an existing index (like the Nifty 50 or S&P 500) using a computer algorithm. Traditional mutual funds are often "active", where a fund manager attempts to beat the market.
3. **Fees and Expense Ratios**: Because passive ETFs don't require high-salaried research teams, their annual management fees (Total Expense Ratio or TER) are often 5x to 10x lower than active mutual funds (e.g., 0.05% vs 1.50%).
4. **Minimum Investment**: Mutual funds often require a fixed minimum SIP (e.g. $10 or ₹500). ETFs can be purchased for the cost of a single unit on your brokerage app.

## Understanding Expense Ratios & Hidden Costs
When investing, fees are the silent drag on your wealth compounding. If a fund charges 1.5% every year and your investments grow at 10%, you are giving away 15% of your annual gains to the fund house.

Because ETFs track established indexes mechanically, their expense ratios are among the lowest in the entire financial industry. When choosing an ETF, look for:
- A Total Expense Ratio (TER) below 0.20%.
- High daily trading volume to ensure you can buy and sell instantly without wide bid-ask spreads.
- Low tracking error (how closely the ETF mimics the index it follows).

## Taxation and Real-World Nuances
Just like regular stocks, ETFs are subject to capital gains tax when you sell your units at a profit:
- **Short-Term Capital Gains (STCG)**: Applies if you sell units held for less than the statutory period (typically 12 months for equity ETFs).
- **Long-Term Capital Gains (LTCG)**: Applies if you hold your units beyond 12 months, often benefiting from lower tax brackets or exemptions.
- **Dividends**: Dividends paid by companies in the ETF basket are either reinvested automatically into the fund or deposited directly into your bank account depending on whether you choose a Growth or Dividend plan.

## How to Actually Buy Your First ETF
Getting started with ETFs takes less than 5 minutes if you have an active brokerage or demat account:
1. **Choose an Index**: For most beginners, a broad market index (such as a Top 50 or S&P 500 index ETF) provides the safest baseline.
2. **Search the Ticker**: Type the ETF ticker in your trading app (e.g. NIFTYBEES, VOO, SPY).
3. **Place a Market or Limit Order**: Enter the number of units you want to purchase and click Buy.
4. **Hold for the Long Term**: The true power of index ETFs comes from holding through market cycles and letting compound interest work over 5, 10, or 20 years.`
};

export const DEMO_QUESTIONS = [
  {
    id: "familiarity",
    question: "How familiar are you with ETFs (Exchange Traded Funds)?",
    display_order: 1,
    options: [
      { id: "never", label: "Never heard of them", tag: "New to ETFs" },
      { id: "basic", label: "Heard the name, concept is fuzzy", tag: "Curious beginner" },
      { id: "some_exp", label: "Understand basics, want deeper insights", tag: "Intermediate" },
      { id: "active", label: "Active investor looking for nuances", tag: "Experienced" }
    ]
  },
  {
    id: "motivation",
    question: "What is your main goal for reading this article?",
    display_order: 2,
    options: [
      { id: "beginner_guide", label: "Just exploring how investing works", tag: "Curious mind" },
      { id: "compare_mf", label: "Comparing ETFs vs Mutual Funds", tag: "Comparison seeker" },
      { id: "build_portfolio", label: "Ready to build a diversified portfolio", tag: "Action oriented" },
      { id: "cost_efficiency", label: "Understanding fees & expense ratios", tag: "Cost conscious" }
    ]
  },
  {
    id: "habits",
    question: "What is your current investing status?",
    display_order: 3,
    options: [
      { id: "none", label: "Haven't started investing yet", tag: "Starting fresh" },
      { id: "sip_mf", label: "Investing via SIPs in Mutual Funds", tag: "SIP investor" },
      { id: "direct_stocks", label: "Buying individual company stocks", tag: "Direct equities" },
      { id: "crypto_alt", label: "FDs, Gold, or other assets", tag: "Alternative assets" }
    ]
  },
  {
    id: "confusion",
    question: "What is the single biggest question or confusion you have?",
    display_order: 4,
    options: [
      { id: "how_it_works", label: "How does an ETF actually work?", tag: "Core mechanics" },
      { id: "risk_safety", label: "Is it safe and what are the risks?", tag: "Risk focus" },
      { id: "tax_liquidity", label: "Taxes, charges, and withdrawing money", tag: "Tax & liquidity" },
      { id: "which_to_buy", label: "How to evaluate or pick an ETF", tag: "Selection strategy" }
    ]
  }
];
