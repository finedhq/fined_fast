// Signature figures (hybrid model, layer 3): one component per visual,
// chosen by a narrative card's `figure.kind`.
//
// To add a figure: build its component in this folder, add one entry below,
// and add the same kind to FigureKind + FIGURE_STEP_COUNTS in
// fined_backend/app/models/card_data.py. The admin's figure dropdown and step
// counts read from this list. If a second module needs the same *kind* of
// visual, turn it into a data-driven figure instead of copying it.
//
// `steps`: the figure reacts to the step's position, so it is built for a
// fixed number of steps. `component` is loaded only when a chapter uses it.
// `stepNotes(state)` (optional): live lines the figure adds under a step,
// by step position — e.g. the basket's "You guessed ₹…" after the reveal.
//
// A figure component receives { step, direction, steps, state, onState,
// config }: the active step's position (undefined before the reader reaches
// it), the card's steps, this chapter's saved state (incl. tap-guess answers
// in state.guesses), a callback to save more, and the entry's `config`.
//
// Reusable figures (Module 2 on): OwnershipGrid, Bars and LiquidationQueue
// draw whatever their `config` says, and Handoff switches from one to another
// part-way through a chapter. A new chapter using them = a new entry here with
// its own config (numbers in e.g. module2Figures.js) — no new component.
// TradeMap (Module 4 on) and OrderBook (Module 6 on) take their step count
// from their config: `steps` below is the length of the config's step list.
import { lazy } from "react";
import { revealNote } from "./figureMath";
import { M2_CH1_GRID, M2_CH2_BARS, M2_CH3_GRID, M2_CH3_QUEUE } from "./module2Figures";
import { M3_CH1_BARS, M3_CH2_RULEBOOK, M3_CH3_VAULT } from "./module3Figures";
import { M4_CH1_MAP, M4_CH2_MAP, M4_CH3_MAP, M4_CH3_ORDER } from "./module4Figures";
import { M5_CH1_MAP, M5_CH2_MAP, M5_CH3_GRID } from "./module5Figures";
import { M6_CH1_BOOK, M6_CH2_BOOK, M6_CH3_BARS } from "./module6Figures";
import { M7_CH1_BOOK, M7_CH2_BOOK, M7_CH3_BOOK } from "./module7Figures";
import { M8_CH1_BARS, M8_CH2_GRID, M8_CH3_CHART } from "./module8Figures";
import { M9_CH1_MAP, M9_CH1_ORDER, M9_CH2_MAP, M9_CH3_MAP } from "./module9Figures";
import { M10_CH1_CHART, M10_CH2_CHART, M10_CH3_MAP } from "./module10Figures";
import { M11_CH1_BARS, M11_CH2_BARS, M11_CH3_MAP } from "./module11Figures";
import { WA1_CH1_STACK, WA1_CH2_CHART, WA1_CH3_STACK } from "./winterarcDay01Figures";
import { WA2_CH1_MAP, WA2_CH2_ACCOUNTS } from "./winterarcDay02Figures";
import { WA3_CH1_THALI, WA3_CH2_GROWTH } from "./winterarcDay03Figures";
import { WA4_CH1_EMI, WA4_CH2_CARD, WA4_CH3_MAP } from "./winterarcDay04Figures";
import { WA5_CH1_POOL, WA5_CH2_CLAIM, WA5_CH3_SHIELD } from "./winterarcDay05Figures";
import { WA6_CH1_DECK, WA6_CH2_FUND, WA6_CH3_GOALS } from "./winterarcDay06Figures";
import { WA7_CH1_CITY, WA7_CH2_ROUTES, WA7_CH3_DESK } from "./winterarcDay07Figures";
import { WA8_CH1_DOORS, WA8_CH2_OWNER, WA8_CH3_TIME } from "./winterarcDay08Figures";
import { WA9_CH1_CLOUD, WA9_CH2_RISKS, WA9_CH3_BASKETS } from "./winterarcDay09Figures";
import { WA10_CH1_SLICE, WA10_CH2_IPO, WA10_CH3_INDEX } from "./winterarcDay10Figures";
import { WA11_CH1_FUND, WA11_CH2_VAULT, WA11_CH3_MENU } from "./winterarcDay11Figures";
import { WA12_CH1_SIP, WA12_CH2_MANAGERS, WA12_CH3_INDEX_FUND } from "./winterarcDay12Figures";
import { WA13_CH1_BOND, WA13_CH2_SEESAW, WA13_CH3_LENDERS } from "./winterarcDay13Figures";
import { WA14_CH1_GOLD, WA14_CH2_LOCKS, WA14_CH3_BATTLE } from "./winterarcDay14Figures";
import { WA15_CH1_TABLE, WA15_CH2_PLANS, WA15_CH3_RIDE } from "./winterarcDay15Figures";

export const FIGURES = {
  shrinking_basket_predict: {
    label: "Shrinking basket (guess slider) — Module 1 §1",
    steps: 4,
    component: lazy(() => import("./ShrinkingBasket")),
    stepNotes: (state) => ({ 2: state.revealedGuess != null ? revealNote(state.revealedGuess) : "" }),
  },
  two_ledgers_payoff_drag: {
    label: "Two ledgers (payoff drag) — Module 1 §2",
    steps: 4,
    component: lazy(() => import("./TwoLedgers")),
  },
  two_rooms_money_flow: {
    label: "Two rooms (money flow) — Module 1 §3",
    steps: 4,
    component: lazy(() => import("./TwoRooms")),
  },
  ownership_grid_one_share: {
    label: "Ownership grid: one share of 1,000 — Module 2 §1",
    steps: 4,
    component: lazy(() => import("./OwnershipGrid")),
    config: M2_CH1_GRID,
  },
  bars_price_vs_size: {
    label: "Bars: share price vs company size — Module 2 §2",
    steps: 4,
    component: lazy(() => import("./Bars")),
    config: M2_CH2_BARS,
  },
  ownership_grid_rights_queue: {
    label: "Ownership grid → who gets paid first — Module 2 §3",
    steps: 4,
    component: lazy(() => import("./Handoff")),
    config: {
      at: 3,
      before: { figure: "ownership_grid", config: M2_CH3_GRID },
      after: { figure: "liquidation_queue", config: M2_CH3_QUEUE },
    },
  },
  bars_who_trades: {
    label: "Bars: who trades on the market — Module 3 §1",
    steps: 4,
    component: lazy(() => import("./Bars")),
    config: M3_CH1_BARS,
  },
  rulebook_switch: {
    label: "Rulebook switch (OFF / ON) — Module 3 §2",
    steps: 3,
    component: lazy(() => import("./RulebookSwitch")),
    config: M3_CH2_RULEBOOK,
  },
  vault_preview: {
    label: "Vault preview (where shares live) — Module 3 §3",
    steps: 4,
    component: lazy(() => import("./VaultPreview")),
    config: M3_CH3_VAULT,
  },
  trade_map_accounts: {
    label: "Trade map: three accounts — Module 4 §1",
    steps: M4_CH1_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M4_CH1_MAP,
  },
  trade_map_brokers: {
    label: "Trade map: same exchange, different doors — Module 4 §2",
    steps: M4_CH2_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M4_CH2_MAP,
  },
  trade_map_settlement: {
    label: "Trade map → put it in order (3.3) → map — Module 4 §3",
    steps: M4_CH3_MAP.steps.length,
    component: lazy(() => import("./Handoff")),
    config: {
      at: 2,
      until: 3,
      before: { figure: "trade_map", config: M4_CH3_MAP },
      after: { figure: "liquidation_queue", config: M4_CH3_ORDER },
    },
  },
  trade_map_going_public: {
    label: "Trade map: from a few backers to the public — Module 5 §1",
    steps: M5_CH1_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M5_CH1_MAP,
  },
  trade_map_ipo_steps: {
    label: "Trade map: offer document to allotment — Module 5 §2",
    steps: M5_CH2_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M5_CH2_MAP,
  },
  ownership_grid_two_ways: {
    label: "Ownership grid: new shares vs owners selling — Module 5 §3",
    steps: M5_CH3_GRID.steps.length,
    component: lazy(() => import("./OwnershipGrid")),
    config: M5_CH3_GRID,
  },
  order_book_two_prices: {
    label: "Order book: bids, asks and the gap — Module 6 §1",
    steps: M6_CH1_BOOK.steps.length,
    component: lazy(() => import("./OrderBook")),
    config: M6_CH1_BOOK,
  },
  order_book_moves: {
    label: "Order book: an order walks the price (drag) — Module 6 §2",
    steps: M6_CH2_BOOK.steps.length,
    component: lazy(() => import("./OrderBook")),
    config: M6_CH2_BOOK,
  },
  bars_hoped_vs_actual: {
    label: "Bars: hoped for vs actual profit growth — Module 6 §3",
    steps: M6_CH3_BARS.views.length,
    component: lazy(() => import("./Bars")),
    config: M6_CH3_BARS,
  },
  order_book_your_order: {
    label: "Order book: Arjun's order ticket — Module 7 §1",
    steps: M7_CH1_BOOK.steps.length,
    component: lazy(() => import("./OrderBook")),
    config: M7_CH1_BOOK,
  },
  order_book_two_ways: {
    label: "Order book: market vs limit (limit-price drag) — Module 7 §2",
    steps: M7_CH2_BOOK.steps.length,
    component: lazy(() => import("./OrderBook")),
    config: M7_CH2_BOOK,
  },
  order_book_what_next: {
    label: "Order book: waits, lapses, part-fills, settles — Module 7 §3",
    steps: M7_CH3_BOOK.steps.length,
    component: lazy(() => import("./OrderBook")),
    config: M7_CH3_BOOK,
  },
  bars_market_scoreboard: {
    label: "Bars: the index as a scoreboard — Module 8 §1",
    steps: M8_CH1_BARS.views.length,
    component: lazy(() => import("./Bars")),
    config: M8_CH1_BARS,
  },
  ownership_grid_profit_shared: {
    label: "Ownership grid: dividend, split (drag), bonus — Module 8 §2",
    steps: M8_CH2_GRID.steps.length,
    component: lazy(() => import("./OwnershipGrid")),
    config: M8_CH2_GRID,
  },
  line_chart_tiffin_year: {
    label: "Line chart: a made-up year, tap its parts — Module 8 §3",
    steps: M8_CH3_CHART.steps.length,
    component: lazy(() => import("./LineChart")),
    config: M8_CH3_CHART,
  },
  trade_map_rbi_ripple: {
    label: "Trade map → put the ripple in order (1.3) → map — Module 9 §1",
    steps: M9_CH1_MAP.steps.length,
    component: lazy(() => import("./Handoff")),
    config: { at: 2, until: 3, before: { figure: "trade_map", config: M9_CH1_MAP }, after: { figure: "liquidation_queue", config: M9_CH1_ORDER } },
  },
  trade_map_budget: {
    label: "Trade map: a Budget change lands unevenly — Module 9 §2",
    steps: M9_CH2_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M9_CH2_MAP,
  },
  trade_map_world: {
    label: "Trade map: US rates and oil reach India — Module 9 §3",
    steps: M9_CH3_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M9_CH3_MAP,
  },
  line_chart_nifty_ride: {
    label: "Line chart: Nifty 50 since 1995, the average and the ride — Module 10 §1",
    steps: M10_CH1_CHART.steps.length,
    component: lazy(() => import("./LineChart")),
    config: M10_CH1_CHART,
  },
  line_chart_end_of_2007: {
    label: "Line chart: from the end of 2007 (time-horizon drag) — Module 10 §2",
    steps: M10_CH2_CHART.steps.length,
    component: lazy(() => import("./LineChart")),
    config: M10_CH2_CHART,
  },
  trade_map_money_homes: {
    label: "Trade map: six places money can live — Module 10 §3",
    steps: M10_CH3_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M10_CH3_MAP,
  },
  bars_two_questions: {
    label: "Bars: how big a fall? (drag) and how long can it wait — Module 11 §1",
    steps: M11_CH1_BARS.views.length,
    component: lazy(() => import("./Bars")),
    config: M11_CH1_BARS,
  },
  bars_fair_yardstick: {
    label: "Bars: compare like with like — Module 11 §2",
    steps: M11_CH2_BARS.views.length,
    component: lazy(() => import("./Bars")),
    config: M11_CH2_BARS,
  },
  trade_map_course_parts: {
    label: "Trade map: the course in four parts — Module 11 §3",
    steps: M11_CH3_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: M11_CH3_MAP,
  },
  // WinterArc Day 1 (StackBars: stacked pieces, the reader's own sort)
  stack_bars_arjun_month: {
    label: "Stacked bars: money in, money out, left over — WinterArc Day 1 §1",
    steps: WA1_CH1_STACK.views.length,
    component: lazy(() => import("./StackBars")),
    config: WA1_CH1_STACK,
  },
  line_chart_save_first: {
    label: "Line chart: save what's left vs save first (choose an amount) — WinterArc Day 1 §2",
    steps: WA1_CH2_CHART.steps.length,
    component: lazy(() => import("./LineChart")),
    config: WA1_CH2_CHART,
  },
  stack_bars_needs_wants: {
    label: "Stacked bars: sort needs and wants, then 50/30/20 — WinterArc Day 1 §3",
    steps: WA1_CH3_STACK.views.length,
    component: lazy(() => import("./StackBars")),
    config: WA1_CH3_STACK,
  },
  // WinterArc Days 2–4: one picture per idea, something to tap at each step
  trade_map_wa2_bank: {
    label: "Trade map: money travels savers → bank → borrowers → interest back — WinterArc Day 2 §1",
    steps: WA2_CH1_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: WA2_CH1_MAP,
  },
  accounts_wa2: {
    label: "Account cards: pay by UPI, break an FD, fill an RD — WinterArc Day 2 §2",
    steps: 4,
    component: lazy(() => import("./AccountCards")),
    config: WA2_CH2_ACCOUNTS,
  },
  thali_wa3: {
    label: "Thali and ₹100 note: price tags, a guess, 100 thalis, the RBI dial — WinterArc Day 3 §1",
    steps: 4,
    component: lazy(() => import("./ThaliPlate")),
    config: WA3_CH1_THALI,
  },
  growth_lanes_wa3: {
    label: "Coin piles: simple vs compound year by year, Asha vs Dev race — WinterArc Day 3 §2",
    steps: 4,
    component: lazy(() => import("./GrowthLanes")),
    config: WA3_CH2_GROWTH,
  },
  emi_calendar_wa4: {
    label: "EMI calendar: borrow, pick a length, see the interest in each EMI — WinterArc Day 4 §1",
    steps: 3,
    component: lazy(() => import("./EmiCalendar")),
    config: WA4_CH1_EMI,
  },
  card_statement_wa4: {
    label: "Card statement: pay it, the minimum, a 90-month fast-forward — WinterArc Day 4 §2",
    steps: 4,
    component: lazy(() => import("./CardStatement")),
    config: WA4_CH2_CARD,
  },
  trade_map_wa4_credit_record: {
    label: "Trade map: your record travels to a lender's score — WinterArc Day 4 §3",
    steps: WA4_CH3_MAP.steps.length,
    component: lazy(() => import("./TradeMap")),
    config: WA4_CH3_MAP,
  },
  // WinterArc Days 5–7: a game in every chapter (spec of 26 Nov)
  pool_wa5: {
    label: "The Pool: guess the share, join or go solo, play 5 years — WinterArc Day 5 §1",
    steps: 5,
    component: lazy(() => import("./PoolSim")),
    config: WA5_CH1_POOL,
  },
  claim_wa5: {
    label: "Claim Machine: a bill cut clause by clause, sandbox, waiting period — WinterArc Day 5 §2",
    steps: 7,
    component: lazy(() => import("./ClaimMachine")),
    config: WA5_CH2_CLAIM,
  },
  shield_wa5: {
    label: "Shield Loadout: sort risks, 2×2 reveal, your shield, rights passport — WinterArc Day 5 §3",
    steps: 5,
    component: lazy(() => import("./ShieldLoadout")),
    config: WA5_CH3_SHIELD,
  },
  shock_deck_wa6: {
    label: "Shock Deck: a year of surprises with the buffer you chose — WinterArc Day 6 §1",
    steps: 6,
    component: lazy(() => import("./ShockDeck")),
    config: WA6_CH1_DECK,
  },
  fund_sizer_wa6: {
    label: "Fund sizer: your jar, months and monthly saving, notches — WinterArc Day 6 §2",
    steps: 3,
    component: lazy(() => import("./FundSizer")),
    config: WA6_CH2_FUND,
  },
  goal_forge_wa6: {
    label: "Goal Forge: wishes into plans that fit your spare money — WinterArc Day 6 §3",
    steps: 5,
    component: lazy(() => import("./GoalForge")),
    config: WA6_CH3_GOALS,
  },
  city_wa7: {
    label: "Money City: sort players onto referees, AMFI, the whistle — WinterArc Day 7 §1",
    steps: 5,
    component: lazy(() => import("./CityMap")),
    config: WA7_CH1_CITY,
  },
  routes_wa7: {
    label: "Follow Arjun's day: three money routes, three referees — WinterArc Day 7 §2",
    steps: 4,
    component: lazy(() => import("./RouteDay")),
    config: WA7_CH2_ROUTES,
  },
  complaints_wa7: {
    label: "Complaint Router: route tickets up the escalation ladders — WinterArc Day 7 §3",
    steps: 6,
    component: lazy(() => import("./ComplaintDesk")),
    config: WA7_CH3_DESK,
  },
  // WinterArc Days 8–15: a game in every chapter (specs of 26 Nov)
  door_sim_wa8: {
    label: "Three doors: save, invest or trade ₹10,000 for ten years — WinterArc Day 8 §1",
    steps: 5,
    component: lazy(() => import("./DoorSim")),
    config: WA8_CH1_DOORS,
  },
  owner_lender_wa8: {
    label: "Owner or lender: sort the returns, follow the money, who's paid first — WinterArc Day 8 §2",
    steps: 3,
    component: lazy(() => import("./OwnerLender")),
    config: WA8_CH2_OWNER,
  },
  time_machine_wa8: {
    label: "Time machine: starting at 21 vs 31, the cost of waiting — WinterArc Day 8 §3",
    steps: 3,
    component: lazy(() => import("./TimeMachine")),
    config: WA8_CH3_TIME,
  },
  spread_cloud_wa9: {
    label: "The spread: 100 possible years, roll a year, add time — WinterArc Day 9 §1",
    steps: 4,
    component: lazy(() => import("./SpreadCloud")),
    config: WA9_CH1_CLOUD,
  },
  name_risk_wa9: {
    label: "Name that risk: six situations, six shields, the riskometer — WinterArc Day 9 §2",
    steps: 3,
    component: lazy(() => import("./NameRisk")),
    config: WA9_CH2_RISKS,
  },
  baskets_wa9: {
    label: "Eggs and baskets: build a basket, news hits, range by size, the trap — WinterArc Day 9 §3",
    steps: 4,
    component: lazy(() => import("./Baskets")),
    config: WA9_CH3_BASKETS,
  },
  share_slicer_wa10: {
    label: "Slice the company: shares, raising money, market cap — WinterArc Day 10 §1",
    steps: 4,
    component: lazy(() => import("./ShareSlicer")),
    config: WA10_CH1_SLICE,
  },
  ipo_drum_wa10: {
    label: "The IPO lottery: two lanes, apply, the drum, listing day — WinterArc Day 10 §2",
    steps: 4,
    component: lazy(() => import("./IpoDrum")),
    config: WA10_CH2_IPO,
  },
  index_builder_wa10: {
    label: "The FinEd Five: weights, move the market, free float — WinterArc Day 10 §3",
    steps: 4,
    component: lazy(() => import("./IndexBuilder")),
    config: WA10_CH3_INDEX,
  },
  unit_shop_wa11: {
    label: "Run a fund: pool, NAV, a late joiner, ₹10 vs ₹100 NAV — WinterArc Day 11 §1",
    steps: 4,
    component: lazy(() => import("./UnitShop")),
    config: WA11_CH1_FUND,
  },
  fund_vault_wa11: {
    label: "Who holds your money: five roles, the vault, the leaking bucket — WinterArc Day 11 §2",
    steps: 3,
    component: lazy(() => import("./FundVault")),
    config: WA11_CH2_VAULT,
  },
  fund_menu_wa11: {
    label: "The menu: jobs to fund types, the riskometer, two taps — WinterArc Day 11 §3",
    steps: 3,
    component: lazy(() => import("./FundMenu")),
    config: WA11_CH3_MENU,
  },
  sip_sim_wa12: {
    label: "The monthly habit: unit buckets, keep or pause, SIP vs lump sum — WinterArc Day 12 §1",
    steps: 4,
    component: lazy(() => import("./SipSim")),
    config: WA12_CH1_SIP,
  },
  manager_pick_wa12: {
    label: "Pick the star: back a manager, the reshuffle, SPIVA — WinterArc Day 12 §2",
    steps: 4,
    component: lazy(() => import("./ManagerPick")),
    config: WA12_CH2_MANAGERS,
  },
  index_fund_wa12: {
    label: "Copy the index: same weights, an index change, the gap — WinterArc Day 12 §3",
    steps: 3,
    component: lazy(() => import("./IndexFund")),
    config: WA12_CH3_INDEX_FUND,
  },
  bond_card_wa13: {
    label: "Be the lender: buy a bond, collect, risk and ratings — WinterArc Day 13 §1",
    steps: 4,
    component: lazy(() => import("./BondCard")),
    config: WA13_CH1_BOND,
  },
  bond_seesaw_wa13: {
    label: "The seesaw: sell your bond, longer swings more, rates fall — WinterArc Day 13 §2",
    steps: 4,
    component: lazy(() => import("./BondSeesaw")),
    config: WA13_CH2_SEESAW,
  },
  three_lenders_wa13: {
    label: "Rate-rise day: FD, bond, debt fund, compare, your read — WinterArc Day 13 §3",
    steps: 3,
    component: lazy(() => import("./ThreeLenders")),
    config: WA13_CH3_LENDERS,
  },
  gold_counter_wa14: {
    label: "Four ways to buy gold: guess, weigh, shields, silver and SGBs — WinterArc Day 14 §1",
    steps: 4,
    component: lazy(() => import("./GoldCounter")),
    config: WA14_CH1_GOLD,
  },
  lock_timeline_wa14: {
    label: "The locked boxes: open them, place them, who sets the return — WinterArc Day 14 §2",
    steps: 3,
    component: lazy(() => import("./LockTimeline")),
    config: WA14_CH2_LOCKS,
  },
  card_battle_wa14: {
    label: "Card battle: property, five challenges, the final round, your deck — WinterArc Day 14 §3",
    steps: 4,
    component: lazy(() => import("./CardBattle")),
    config: WA14_CH3_BATTLE,
  },
  fund_table_wa15: {
    label: "The wrong race: crown a fund, categories, benchmarks, five years — WinterArc Day 15 §1",
    steps: 4,
    component: lazy(() => import("./FundTable")),
    config: WA15_CH1_TABLE,
  },
  direct_regular_wa15: {
    label: "Same fund, two prices: twins, guess the gap, the commission — WinterArc Day 15 §2",
    steps: 3,
    component: lazy(() => import("./DirectRegular")),
    config: WA15_CH2_PLANS,
  },
  steady_ride_wa15: {
    label: "Steady or rollercoaster: two rides, the year-2 cut, stars, your checklist — WinterArc Day 15 §3",
    steps: 4,
    component: lazy(() => import("./SteadyRide")),
    config: WA15_CH3_RIDE,
  },
};
