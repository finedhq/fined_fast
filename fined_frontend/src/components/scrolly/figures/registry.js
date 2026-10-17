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
};
