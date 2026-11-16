// Plain maths for the stacked bars (WinterArc Day 1 on). No React, so every
// number a reader sees can be unit-tested (stackMath.test.js).

export const inr = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;

/** The pieces in one bar for a view, in stacking order (bottom first). */
export function barPieces(config, view, barId, sort) {
  if (view.sort && config.sort) {
    // The reader's own sort: each placed chip stacks into its zone's bar,
    // after the bar's fixed pieces (e.g. Savings = what's left over).
    const fixed = (config.sort.fixed?.[barId] || []).map((id) => ({ id, ...config.segments[id] }));
    const zone = config.sort.zones.find((z) => z.bar === barId);
    const placed = zone ? config.sort.chips.filter((id) => sort?.[id] === zone.id).map((id) => ({ id, ...config.segments[id] })) : [];
    return [...fixed, ...placed];
  }
  const fill = view.fill?.[barId];
  if (fill == null) return [];
  if (typeof fill === "number") return [{ id: `${barId}-total`, label: "", value: fill, tone: view.tones?.[barId] }];
  return fill.map((id) => ({ id, ...config.segments[id] }));
}

export const barTotal = (pieces) => pieces.reduce((s, p) => s + (p.value || 0), 0);

/** Height of `value` as a share (0–1) of the chart's full-height value. */
export const heightOf = (value, max) => (max > 0 ? Math.max(0, Math.min(1, value / max)) : 0);

/** The reader's sort as totals by zone, e.g. { need: 11500, want: 5000 }. */
export function sortTotals(config, sort) {
  const out = Object.fromEntries((config.sort?.zones || []).map((z) => [z.id, 0]));
  for (const id of config.sort?.chips || []) {
    const z = sort?.[id];
    if (z && z in out) out[z] += config.segments[id]?.value || 0;
  }
  return out;
}

export const sortComplete = (config, sort) => (config.sort?.chips || []).every((id) => sort?.[id]);

/** Chips the reader put somewhere other than the story's own sort. */
export const sortDifferences = (config, sort) => (config.sort?.chips || []).filter((id) => sort?.[id] && sort[id] !== config.sort.answer[id]);

/** Whole-number percent of `part` in `whole`. */
export const pctOf = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** "Your sort: Needs ₹11,000 (61%). Arjun's: ₹11,500 (64%)." from the config's template. */
export function compareLine(config, sort) {
  const s = config.sort;
  if (!s?.compare) return "";
  const mine = sortTotals(config, sort)[s.compare.zone] || 0;
  const theirs = config.sort.chips.filter((id) => s.answer[id] === s.compare.zone).reduce((t, id) => t + config.segments[id].value, 0);
  const template = sortComplete(config, sort) ? s.compare.mine : s.compare.theirs_only;
  return template
    .replace("{mine}", inr(mine))
    .replace("{mine_pct}", `${pctOf(mine, s.compare.of)}%`)
    .replace("{theirs}", inr(theirs))
    .replace("{theirs_pct}", `${pctOf(theirs, s.compare.of)}%`);
}
