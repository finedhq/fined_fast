import CinematicCard from "../CardTypes/CinematicCard/CinematicCard";
import ScenarioCard from "../CardTypes/ScenarioCard/ScenarioCard";
import RiskSpectrumCard from "../CardTypes/RiskSpectrumCard/RiskSpectrumCard";
import SIPCalculatorCard from "../CardTypes/SIPCalculatorCard/SIPCalculatorCard";
import PillSelectorCard from "../CardTypes/PillSelectorCard/PillSelectorCard";
import QuizCard from "../CardTypes/QuizCard/QuizCard";
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
    case "risk_spectrum":
      return <RiskSpectrumCard card={card} onContinue={onContinue} />;
    case "sip_calculator":
      return <SIPCalculatorCard card={card} onContinue={onContinue} />;
    case "pill_selector":
      return <PillSelectorCard card={card} onContinue={onContinue} />;
    case "quiz":
      return <QuizCard card={card} onContinue={onContinue} />;
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