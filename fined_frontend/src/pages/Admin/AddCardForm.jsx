import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCard } from "../../services/api";
import CinematicFields, { EMPTY_CINEMATIC_DATA } from "./CardFields/CinematicFields";
import ScenarioFields, { EMPTY_SCENARIO_DATA } from "./CardFields/ScenarioFields";
import RiskSpectrumFields, { EMPTY_RISK_SPECTRUM_DATA } from "./CardFields/RiskSpectrumFields";
import SliderCalculatorFields, { EMPTY_SLIDER_CALCULATOR_DATA } from "./CardFields/SliderCalculatorFields";
import PillSelectorFields, { EMPTY_PILL_SELECTOR_DATA } from "./CardFields/PillSelectorFields";
import QuizFields, { EMPTY_QUIZ_DATA } from "./CardFields/QuizFields";
import ConceptFields, { EMPTY_CONCEPT_DATA } from "./CardFields/ConceptFields";
import InteractiveFields, { EMPTY_INTERACTIVE_DATA } from "./CardFields/InteractiveFields";

// As new card types are built:
// 1. import their Fields component + EMPTY_<TYPE>_DATA below
// 2. add one entry to CARD_TYPE_OPTIONS
// 3. add one case in the renderFields() switch
const CARD_TYPE_OPTIONS = [
  { value: "cinematic", label: "Cinematic Opener" },
  { value: "scenario", label: "Story / Scenario" },
  { value: "risk_spectrum", label: "Risk / Spectrum" },
  { value: "slider_calculator", label: "Slider Calculator" },
  { value: "pill_selector", label: "Pill Selector" },
  { value: "quiz", label: "Quiz" },
  { value: "concept", label: "Concept Explainer" },
  { value: "interactive", label: "Interactive Explorer" },
  // { value: "quiz", label: "Quiz" },
];

function getEmptyDataFor(cardType) {
  switch (cardType) {
    case "cinematic":
      return EMPTY_CINEMATIC_DATA;
    case "scenario":
      return EMPTY_SCENARIO_DATA;
    case "risk_spectrum":
      return EMPTY_RISK_SPECTRUM_DATA;
    case "slider_calculator":
      return EMPTY_SLIDER_CALCULATOR_DATA;
    case "pill_selector":
      return EMPTY_PILL_SELECTOR_DATA;
    case "quiz":
      return EMPTY_QUIZ_DATA;
    case "concept":
      return EMPTY_CONCEPT_DATA;
    case "interactive":
      return EMPTY_INTERACTIVE_DATA;
    default:
      return {};
  }
}

function AddCardForm() {
  const navigate = useNavigate();

  const [moduleId, setModuleId] = useState("");
  const [orderIndex, setOrderIndex] = useState(1);
  const [title, setTitle] = useState("");
  const [cardType, setCardType] = useState("cinematic");
  const [cardData, setCardData] = useState(EMPTY_CINEMATIC_DATA);

  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCardTypeChange = (newType) => {
    setCardType(newType);
    setCardData(getEmptyDataFor(newType)); // reset fields when switching type
  };

  const renderFields = () => {
    switch (cardType) {
      case "cinematic":
        return <CinematicFields data={cardData} onChange={setCardData} />;
      case "scenario":
        return <ScenarioFields data={cardData} onChange={setCardData} />;
      case "risk_spectrum":
        return <RiskSpectrumFields data={cardData} onChange={setCardData} />;
      case "slider_calculator":
        return <SliderCalculatorFields data={cardData} onChange={setCardData} />;
      case "pill_selector":
        return <PillSelectorFields data={cardData} onChange={setCardData} />;
      case "quiz":
        return <QuizFields data={cardData} onChange={setCardData} />;
      case "concept":
        return <ConceptFields data={cardData} onChange={setCardData} />;
      case "interactive":
        return <InteractiveFields data={cardData} onChange={setCardData} />;
      default:
        return <p>No fields defined yet for this card type.</p>;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const payload = {
      module_id: moduleId,
      order_index: Number(orderIndex),
      card_type: cardType,
      title,
      card_data: { ...cardData, card_type: cardType },
    };

    try {
      await addCard(payload);
      setStatus("Card added successfully.");
      setTitle("");
      setCardData(getEmptyDataFor(cardType));
    } catch (err) {
      setStatus(err.message || "Failed to add card.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-form-page">
      <section className="admin-form-card">
        <div className="form-heading">
          <h1>Add Card</h1>
          <button onClick={() => navigate("/admin")}>Back to Dashboard</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Card type
            <select value={cardType} onChange={(e) => handleCardTypeChange(e.target.value)}>
              {CARD_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Module ID
            <input
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              placeholder="UUID of the module this card belongs to"
              required
            />
          </label>

          <label>
            Order in module
            <input
              type="number"
              min={1}
              value={orderIndex}
              onChange={(e) => setOrderIndex(e.target.value)}
              required
            />
          </label>

          <label>
            Admin label
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Module 5 — Opener"
              required
            />
          </label>

          {/* Fields specific to the selected card type render here */}
          {renderFields()}

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Add Card"}
          </button>
        </form>

        {status && <p className="form-status">{status}</p>}
      </section>
    </main>
  );
}

export default AddCardForm;