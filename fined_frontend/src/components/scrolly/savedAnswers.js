// Saving and restoring the module page's parts through the existing progress
// endpoint (updateCardBySlug). Plain rules, no React, so they can be tested.
//
// What each part saves as `userAnswer` (the endpoint stores text, and the
// course quiz bonus reads every answer as text, so structured answers are
// short JSON strings):
//   hero        {"poll":"raise_money","savings":"50k"}   when the reader reaches the chapters
//   narrative   the chapter's figure state as JSON        when its last step is reached
//   model       the tool's settings as JSON               when it is finished (e.g. 2 controls moved)
//   quiz        the chosen option id, as plain text       when answered
//   completion  nothing                                   when the completion screen is reached
import { getCardFinstars } from "../../utils/finstars";
import { isCorrectOption } from "./progress";
import { TOOL_SAVED_KEYS, toolDone } from "./tools/toolRules";

// The settings a tool saves (Leak Lab when the kind is missing, as before).
const toolKeys = (card) => TOOL_SAVED_KEYS[card.card_data?.model_kind] || TOOL_SAVED_KEYS.leak_lab;

const pick = (obj, keys) => {
  const out = {};
  keys.forEach((k) => {
    if (obj?.[k] !== undefined && obj?.[k] !== null) out[k] = obj[k];
  });
  return out;
};
const jsonOrNull = (obj) => (obj && Object.keys(obj).length ? JSON.stringify(obj) : null);

function parseJson(raw) {
  if (typeof raw !== "string" || !raw.trim().startsWith("{")) return undefined;
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : undefined;
  } catch {
    return undefined;
  }
}

/** The `userAnswer` text a part saves, from the page state (null = nothing to keep). */
export function encodeAnswer(card, page) {
  const slug = card.slug;
  switch (card.card_template) {
    case "hero":
      return jsonOrNull(pick(page.hero, ["poll", "savings"]));
    case "narrative":
      return jsonOrNull(page.steps?.[slug]);
    case "model":
      return jsonOrNull(pick(page.tools?.[slug], toolKeys(card)));
    case "quiz":
      return page.checks?.[slug] ?? null;
    default:
      return null;
  }
}

/** A saved `userAnswer` back as page state for that part (undefined if unusable). */
export function decodeAnswer(card, raw) {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const d = card.card_data || {};
  switch (card.card_template) {
    case "hero": {
      const v = parseJson(raw);
      if (!v) return undefined;
      const hero = pick(v, ["poll", "savings"]);
      if (hero.savings !== undefined) {
        // The amount comes from the chip's own value, not from the saved text.
        const opt = (d.chip?.options || []).find((o) => o.id === hero.savings);
        hero.amount = opt?.value ?? null;
      }
      return hero;
    }
    case "narrative":
      return parseJson(raw);
    case "model": {
      const v = parseJson(raw);
      return v ? pick(v, toolKeys(card)) : undefined;
    }
    case "quiz":
      return typeof raw === "string" && (d.options || []).some((o) => o.id === raw) ? raw : undefined;
    default:
      return undefined;
  }
}

/** Page state rebuilt from the learner's saved answers in the bundle (decision 7f). */
export function pageFromSaved(cards) {
  const page = { hero: {}, steps: {}, checks: {}, tools: {} };
  cards.forEach((c) => {
    const v = decodeAnswer(c, c.userAnswer);
    if (v === undefined) return;
    if (c.card_template === "hero") page.hero = v;
    else if (c.card_template === "narrative") page.steps[c.slug] = v;
    else if (c.card_template === "model") page.tools[c.slug] = v;
    else if (c.card_template === "quiz") page.checks[c.slug] = v;
  });
  return page;
}

/**
 * Saved answers + this tab's session state. Answers that are locked once given
 * (the warm-up, quick checks) come from the account when it has them; live
 * figure and tool state from this session wins, since it's newer.
 */
export function mergePages(saved, session) {
  return {
    hero: { ...(session.hero || {}), ...saved.hero },
    steps: { ...saved.steps, ...(session.steps || {}) },
    checks: { ...(session.checks || {}), ...saved.checks },
    tools: { ...saved.tools, ...(session.tools || {}) },
  };
}

/** Is this part finished, given the page state and the parts the reader has reached? */
export function isFinished(card, page, reached) {
  switch (card.card_template) {
    case "quiz":
      return page.checks?.[card.slug] != null;
    case "model":
      return toolDone(card.card_data, page.tools?.[card.slug]);
    case "hero":
    case "narrative":
    case "completion":
      return !!reached[card.slug];
    default:
      return false;
  }
}

/** Stars the browser reports (the server decides for hero/narrative/model). */
export function reportedStars(card, answer) {
  const d = card.card_data || {};
  if (card.card_template === "quiz") return isCorrectOption(d, answer) ? getCardFinstars(d, "quiz") : 0;
  return getCardFinstars(d, card.card_template);
}

/**
 * The saves the page should make now: every finished part not yet saved, and
 * saved parts whose answer has changed since (`resave`, never pays again).
 */
export function pendingSaves(cards, page, reached) {
  const out = [];
  cards.forEach((c) => {
    if (!isFinished(c, page, reached)) return;
    const answer = encodeAnswer(c, page);
    const done = c.status === "completed";
    if (done && (c.card_template === "quiz" || c.card_template === "completion" || answer === (c.userAnswer ?? null))) return;
    out.push({ card: c, answer, finStars: reportedStars(c, answer), resave: done });
  });
  return out;
}
