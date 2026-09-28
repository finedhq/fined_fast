// Pieces every hands-on tool shares, so each tool looks the same at the top
// (the Leak Lab's markup, unchanged). The "controls moved" setter is in toolRules.js.
import SafeText from "../SafeText";
import { getCardFinstars } from "../../../utils/finstars";

/** Eyebrow, title, one-line concept and the "+N FinStars" reward box. */
export function ToolHead({ data }) {
  return (
    <div className="tool-head">
      <div>
        <div className="tool-eyebrow">Hands-on tool</div>
        <h2 className="tool-title">{data.title}</h2>
        <p className="tool-target">
          <SafeText text={data.concept} />
        </p>
      </div>
      <div className="tool-reward">
        <strong>+{getCardFinstars(data, "model")} FinStars</strong>
        <span>{data.reward_rule}</span>
      </div>
    </div>
  );
}
