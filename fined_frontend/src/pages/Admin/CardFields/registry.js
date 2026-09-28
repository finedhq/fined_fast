// Every card type the admin can author: its label, its Fields component and
// its blank starting data. To add a card type: build <Type>Fields.jsx with an
// EMPTY_<TYPE>_DATA export, then add one entry here (and the backend schema).
import CinematicFields, { EMPTY_CINEMATIC_DATA } from "./CinematicFields";
import ScenarioFields, { EMPTY_SCENARIO_DATA } from "./ScenarioFields";
import RiskSpectrumFields, { EMPTY_RISK_SPECTRUM_DATA } from "./RiskSpectrumFields";
import SliderCalculatorFields, { EMPTY_SLIDER_CALCULATOR_DATA } from "./SliderCalculatorFields";
import PillSelectorFields, { EMPTY_PILL_SELECTOR_DATA } from "./PillSelectorFields";
import QuizFields, { EMPTY_QUIZ_DATA } from "./QuizFields";
import ChartFields, { EMPTY_CHART_DATA } from "./ChartFields";
import ConceptFields, { EMPTY_CONCEPT_DATA } from "./ConceptFields";
import InteractiveFields, { EMPTY_INTERACTIVE_DATA } from "./InteractiveFields";
import NarrativeFields, { EMPTY_NARRATIVE_DATA } from "./NarrativeFields";
import ModelFields, { EMPTY_MODEL_DATA } from "./ModelFields";
import HeroFields, { EMPTY_HERO_DATA } from "./HeroFields";
import CompletionFields, { EMPTY_COMPLETION_DATA } from "./CompletionFields";

export const CARD_TYPES = [
  { value: "cinematic", label: "Cinematic Opener", Fields: CinematicFields, empty: EMPTY_CINEMATIC_DATA },
  { value: "hero", label: "Module Page Top / Hero (new)", Fields: HeroFields, empty: EMPTY_HERO_DATA },
  { value: "narrative", label: "Scrolling Story (new)", Fields: NarrativeFields, empty: EMPTY_NARRATIVE_DATA },
  { value: "model", label: "Hands-on Tool (new)", Fields: ModelFields, empty: EMPTY_MODEL_DATA },
  { value: "quiz", label: "Quiz", Fields: QuizFields, empty: EMPTY_QUIZ_DATA },
  { value: "completion", label: "Module Completion", Fields: CompletionFields, empty: EMPTY_COMPLETION_DATA },
  { value: "scenario", label: "Story / Scenario", Fields: ScenarioFields, empty: EMPTY_SCENARIO_DATA },
  { value: "risk_spectrum", label: "Risk / Spectrum", Fields: RiskSpectrumFields, empty: EMPTY_RISK_SPECTRUM_DATA },
  { value: "slider_calculator", label: "Slider Calculator", Fields: SliderCalculatorFields, empty: EMPTY_SLIDER_CALCULATOR_DATA },
  { value: "pill_selector", label: "Pill Selector", Fields: PillSelectorFields, empty: EMPTY_PILL_SELECTOR_DATA },
  { value: "chart", label: "Chart / Graph", Fields: ChartFields, empty: EMPTY_CHART_DATA },
  { value: "concept", label: "Concept Explainer", Fields: ConceptFields, empty: EMPTY_CONCEPT_DATA },
  { value: "interactive", label: "Interactive Explorer", Fields: InteractiveFields, empty: EMPTY_INTERACTIVE_DATA },
];

// The new scrollytelling types (one list, shared with the learner page).
// Modules containing them are drawn as one long page, like the prototype.
export { SCROLLY_TEMPLATES as NEW_CARD_TYPES } from "../../../components/scrolly/templates";

export function cardTypeInfo(value) {
  return CARD_TYPES.find((t) => t.value === value);
}

// Deep copy so editing one card never mutates the shared blank template.
export function emptyDataFor(value) {
  const info = cardTypeInfo(value);
  return info ? JSON.parse(JSON.stringify(info.empty)) : {};
}
