// Module-wide beginner glossary, ported word for word from the prototype
// (fined-scrolly/module-1-market/js/glossary.js). Any of these words gets a
// hover/tap definition wherever it appears in body copy — not only where a
// card marks it with [[...]]. A step's own glossary_terms override the
// definition for that step. See text.js for the linking rules.
//
// `match` = surface forms to look for (longest wins); `term` = tooltip heading;
// `avoid` = phrases where a match means something else and must not be linked.

export const MODULE_GLOSSARY = [
  {
    term: "Savings account",
    match: ["savings accounts", "savings account"],
    def: "A basic bank account for money you may need soon. You can take it out any time, and the bank pays you a small amount of interest for keeping it there.",
    example: "Most people's salary lands in a savings account.",
  },
  {
    term: "Interest",
    match: ["interest"],
    def: "A fee for using someone else's money. A bank pays you interest on your deposits; when you borrow, you pay interest to the lender.",
    example: "₹1,00,000 at 2.5% a year earns about ₹2,500 in the first year.",
  },
  {
    term: "Inflation",
    match: ["inflation"],
    def: "Prices slowly rising over time, so the same money buys a little less each year.",
    example: "A ₹10 cup of chai costing ₹15 a few years later.",
  },
  {
    term: "Purchasing power",
    match: ["purchasing power"],
    def: "How much real stuff your money can actually buy.",
  },
  {
    term: "Fixed deposit (FD)",
    match: ["fixed deposits", "fixed deposit"],
    def: "Money you lock with a bank for a set time, say one to five years, at an interest rate fixed on day one. It usually pays more than a savings account, but taking it out early costs a penalty.",
  },
  {
    term: "UPI",
    match: ["UPI"],
    caseSensitive: true,
    def: "Unified Payments Interface: India's system for paying instantly from your bank account with your phone, like scanning a QR code at a shop.",
  },
  {
    term: "Loan",
    match: ["loans", "loan"],
    def: "Money you borrow and promise to pay back by a set date, along with interest.",
  },
  {
    term: "Debt",
    match: ["debt"],
    def: "Borrowed money you must pay back with interest, whether the business does well or badly.",
  },
  {
    term: "Lender",
    match: ["lenders", "lender"],
    def: "Whoever gives the loan, usually a bank. The lender is owed a fixed amount back, whatever happens to the business.",
  },
  {
    term: "Profit",
    match: ["profits", "profit"],
    def: "What a business has left after paying all its costs for a period.",
  },
  {
    term: "Loss",
    match: ["losses", "loss"],
    def: "When a business spends more than it earns in a period. The gap between the two is the loss.",
  },
  {
    term: "Upside",
    match: ["upside"],
    def: "The extra you could gain if things go well.",
  },
  {
    term: "Share",
    match: ["shares", "share"],
    // "a share of the profit" means a portion, not a unit of ownership.
    avoid: ["a share of", "20% share"],
    def: "One small piece of ownership in a business.",
    example: "Own 1 of a company's 100 shares and you own 1% of it.",
  },
  {
    term: "Stock exchange",
    match: ["stock exchanges", "stock exchange"],
    def: "A marketplace where shares of listed companies are bought and sold.",
  },
  {
    term: "Listed company",
    match: ["listed companies", "listed company"],
    def: "A company whose shares are allowed to be bought and sold on a stock exchange. To stay listed, it must follow the exchange's rules and publish regular updates on its business.",
  },
  {
    term: "BSE",
    match: ["BSE"],
    caseSensitive: true,
    def: "Bombay Stock Exchange. Started in Mumbai in 1875, it is the oldest stock exchange in Asia.",
  },
  {
    term: "NSE",
    match: ["NSE"],
    caseSensitive: true,
    def: "National Stock Exchange of India. Set up in 1992 in Mumbai, it now handles most share trading in India.",
  },
  {
    term: "Ticker",
    match: ["tickers", "ticker"],
    def: "A short code that identifies a company's shares on an exchange.",
    example: "INFY is the ticker for Infosys.",
  },
];
