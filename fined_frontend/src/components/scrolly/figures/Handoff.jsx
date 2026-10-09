// A chapter whose picture changes part-way: one figure for the first steps,
// then a different one from step `at` (0-based) on — e.g. Module 2 Chapter 3,
// the ownership grid for 3.1–3.3, then the liquidation queue for 3.4.
// Settings: { at, until?, before: {figure, config}, after: {figure, config} },
// where `figure` names one of the reusable figures below. With `until`, the
// chapter goes back to `before` from that step on (Module 4 Chapter 3: the
// map, the queue at 3.3 only, then the map again); `before` keeps the
// chapter's real step numbers. Both share the chapter's saved state, so each
// keeps its own keys (e.g. the queue's queueOrder).
import OwnershipGrid from "./OwnershipGrid";
import LiquidationQueue from "./LiquidationQueue";
import Bars from "./Bars";
import TradeMap from "./TradeMap";

const PARTS = { ownership_grid: OwnershipGrid, liquidation_queue: LiquidationQueue, bars: Bars, trade_map: TradeMap };

export default function Handoff({ config, step, ...props }) {
  const isAfter = step !== undefined && step >= config.at && (config.until === undefined || step < config.until);
  const part = isAfter ? config.after : config.before;
  const Figure = PARTS[part.figure];
  const local = isAfter ? step - config.at : step;
  return (
    <div className="nc-handoff" key={part.figure}>
      <Figure {...props} step={local} config={part.config} />
    </div>
  );
}
