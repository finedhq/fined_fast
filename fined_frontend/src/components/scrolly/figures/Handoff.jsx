// A chapter whose picture changes part-way: one figure for the first steps,
// then a different one from step `at` (0-based) on — e.g. Module 2 Chapter 3,
// the ownership grid for 3.1–3.3, then the liquidation queue for 3.4.
// Settings: { at, before: {figure, config}, after: {figure, config} }, where
// `figure` names one of the reusable figures below. Both share the chapter's
// saved state, so each keeps its own keys (e.g. the queue's queueOrder).
import OwnershipGrid from "./OwnershipGrid";
import LiquidationQueue from "./LiquidationQueue";
import Bars from "./Bars";

const PARTS = { ownership_grid: OwnershipGrid, liquidation_queue: LiquidationQueue, bars: Bars };

export default function Handoff({ config, step, ...props }) {
  const part = step !== undefined && step >= config.at ? config.after : config.before;
  const Figure = PARTS[part.figure];
  const local = part === config.after ? step - config.at : step;
  return (
    <div className="nc-handoff" key={part.figure}>
      <Figure {...props} step={local} config={part.config} />
    </div>
  );
}
