// Card types that belong to the v2 module page. A module whose cards include
// any of these is drawn as ONE long page, exactly like the prototype, instead
// of the one-card-per-screen player used by the older course.
export const SCROLLY_TEMPLATES = ["hero", "narrative", "model"];

export function isScrollyModule(cards = []) {
  return cards.some((c) => SCROLLY_TEMPLATES.includes(c.card_template));
}
