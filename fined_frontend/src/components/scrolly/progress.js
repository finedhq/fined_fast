// Stars and "what's left" for the module page, from two sources:
//   - the learner's saved progress in the bundle (card.status / userAnswer), and
//   - what they did on the page this session (page state: checks, tools).
// A part the server already has as completed is counted by the server's
// record only, so nothing is counted twice.
import { getCardFinstars } from "../../utils/finstars";
import { toolDone } from "./tools/toolRules";

/** True when `optionId` is a correct option of this quiz card. */
export function isCorrectOption(cardData, optionId) {
  return (cardData?.options || []).some((o) => o.id === optionId && o.is_correct);
}

// Stars for a part finished on the page (not yet saved). Quick checks pay only
// when the answer is right — the site's rule (owner, 2026-09-26).
function pageStars(card, page) {
  const cd = card.card_data || {};
  if (card.card_template === "quiz") {
    const picked = page.checks?.[card.slug];
    return picked != null && isCorrectOption(cd, picked) ? getCardFinstars(cd, "quiz") : 0;
  }
  if (card.card_template === "model") {
    return toolDone(cd, page.tools?.[card.slug]) ? getCardFinstars(cd, "model") : 0;
  }
  return 0; // hero / chapters: saved and scored with the server in 6e
}

// Stars from saved progress (same rule as the card player).
function savedStars(card) {
  const cd = card.card_data || {};
  if (card.card_template === "quiz") return isCorrectOption(cd, card.userAnswer) ? getCardFinstars(cd, "quiz") : 0;
  return getCardFinstars(cd, card.card_template);
}

export function earnedStars(cards, page = {}) {
  return cards.reduce((sum, c) => {
    if (c.card_template === "completion") return sum;
    return sum + (c.status === "completed" ? savedStars(c) : pageStars(c, page));
  }, 0);
}

export function maxStars(cards) {
  return cards.reduce((sum, c) => (c.card_template === "completion" ? sum : sum + getCardFinstars(c.card_data, c.card_template)), 0);
}

/** Has the reader done this quick check / tool (saved, or on the page)? */
export function partDone(card, page = {}) {
  if (card.status === "completed") return true;
  if (card.card_template === "quiz") return page.checks?.[card.slug] != null;
  if (card.card_template === "model") return toolDone(card.card_data, page.tools?.[card.slug]);
  return true;
}

/**
 * The quick checks and tools still open, in page order, each with a short
 * name for the completion screen's "skipped" line ("Quick check 2", "The Leak Lab").
 */
export function openParts(cards, page = {}) {
  let quizNo = 0;
  const out = [];
  cards.forEach((c) => {
    if (c.card_template === "quiz") quizNo += 1;
    if (c.card_template !== "quiz" && c.card_template !== "model") return;
    if (partDone(c, page)) return;
    const name = c.card_template === "quiz" ? `Quick check ${quizNo}` : c.card_data?.title || "The hands-on tool";
    out.push({ slug: c.slug, template: c.card_template, name });
  });
  return out;
}
