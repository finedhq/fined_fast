// Pieces every hands-on tool shares, so each tool looks the same at the top
// (the Leak Lab's markup, unchanged). The "controls moved" setter is in toolRules.js.
import SafeText from "../SafeText";
import { getCardFinstars } from "../../../utils/finstars";

/** Eyebrow, title, one-line concept and the "+N FinStars" reward box. */
// A tool worth 0 FinStars (a WinterArc day: tools earn nothing) shows no
// reward box; `card_label` (optional) replaces "Hands-on tool".
export function ToolHead({ data }) {
  const stars = getCardFinstars(data, "model");
  return (
    <div className="tool-head">
      <div>
        <div className="tool-eyebrow">{data.card_label || "Hands-on tool"}</div>
        <h2 className="tool-title">{data.title}</h2>
        <p className="tool-target">
          <SafeText text={data.concept} />
        </p>
      </div>
      {stars > 0 && (
        <div className="tool-reward">
          <strong>+{stars} FinStars</strong>
          <span>{data.reward_rule}</span>
        </div>
      )}
    </div>
  );
}
