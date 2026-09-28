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
import { lazy } from "react";
import { revealNote } from "./figureMath";
import { M2_CH1_GRID, M2_CH2_BARS, M2_CH3_GRID, M2_CH3_QUEUE } from "./module2Figures";

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
};
