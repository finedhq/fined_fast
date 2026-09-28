// FinStar defaults per card type, used when a card has no allotted_finstars.
// Must match DEFAULT_FINSTARS in fined_backend/app/routes/courses.py.
export const DEFAULT_FINSTARS = {
  cinematic: 0,
  concept: 2,
  chart: 2,
  scenario: 3,
  risk_spectrum: 2,
  slider_calculator: 2,
  pill_selector: 3,
  interactive: 2,
  quiz: 10,
  completion: 0,
  narrative: 0,
  hero: 0,
  model: 10,
};

export function getCardFinstars(cardData, cardTemplate) {
  const val = cardData?.allotted_finstars;
  if (val === null || val === undefined) return DEFAULT_FINSTARS[cardTemplate] ?? 2;
  return val;
}
