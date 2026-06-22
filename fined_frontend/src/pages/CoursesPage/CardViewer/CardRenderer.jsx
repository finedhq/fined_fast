import CinematicCard from "../CardTypes/CinematicCard/CinematicCard";
import ScenarioCard from "../CardTypes/ScenarioCard/ScenarioCard";
import ConceptCard from "../CardTypes/ConceptCard/ConceptCard";
import InteractiveCard from "../CardTypes/InteractiveCard/InteractiveCard";

// As new card types are built, add one import above and one case below.
// Every case receives the same (card, onContinue) props.
function CardRenderer({ card, onContinue }) {
  switch (card?.card_template) {
    case "cinematic":
      return <CinematicCard card={card} onContinue={onContinue} />;
    case "scenario":
      return <ScenarioCard card={card} onContinue={onContinue} />;
    case "concept":
      return <ConceptCard card={card} onContinue={onContinue} />;
    case "interactive":
      return <InteractiveCard card={card} onContinue={onContinue} />;

    default:
      return (
        <div style={{ padding: 40, textAlign: "center", color: "#8a8aa3" }}>
          Unknown card type: {card?.card_template || "none"}
        </div>
      );
  }
}

export default CardRenderer;