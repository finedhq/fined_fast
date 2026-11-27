// Shared helpers for the WinterArc Day 8–15 figures (kept out of WaKit.jsx so
// that file exports only components).

/** clamp a figure's step to 0…last; before the first step it is 0. */
export const stepAt = (step, last) => Math.min(Math.max(step ?? 0, 0), last);

/** A chapter-state saver under one key: save({…}) merges into state[key]. */
export const saver = (onState, key) => (patch) => onState((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
