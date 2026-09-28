// Helpers for CardEditor (import parsing, slug preview).
import { cardTypeInfo } from "./CardFields/registry";

// Same rule the backend uses when no slug is given (courses.py slug_from_title).
export function slugFromTitle(title) {
  return (title || "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}_\s-]/gu, "")
    .replace(/[\s_-]+/g, "-");
}

// Accepts a whole card ({card_type, title, slug, order_index, card_data})
// or just a card_data object that names its card_type.
export function parseImportedCard(text, fallbackType) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Paste one card as a JSON object { … }.");
  }
  const cardData = parsed.card_data && typeof parsed.card_data === "object" ? parsed.card_data : parsed;
  const cardType = parsed.card_type || cardData.card_type || fallbackType;
  if (!cardTypeInfo(cardType)) throw new Error(`Unknown card type "${cardType}".`);
  return {
    cardType,
    cardData: { ...cardData, card_type: cardType },
    title: parsed.card_data ? parsed.title : undefined,
    slug: parsed.card_data ? parsed.slug : undefined,
    orderIndex: parsed.card_data ? parsed.order_index : undefined,
  };
}
