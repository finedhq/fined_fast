// Hands-on tools (hybrid model, layer 3): one component per tool, chosen by a
// `model` card's `model_kind`. To add a tool: build its component in this
// folder, add its completion rule to toolRules.js (TOOL_DONE) and one entry
// below, and add the same kind to ModelKind in
// fined_backend/app/models/card_data.py (and the admin's ModelFields list).
//
// A tool component receives { card, state, onState, heroAmount }: the card,
// its saved state on the page, a callback to save more (an object, or a
// function of the latest state), and the hero's savings-chip amount.
import LeakLab from "./LeakLab";
import SliceCalculator from "./SliceCalculator";

export const TOOLS = {
  leak_lab: {
    label: "Leak Lab — money losing value over time",
    component: LeakLab,
  },
  slice_calculator: {
    label: "Your Slice — what your money buys of a company",
    component: SliceCalculator,
  },
};
