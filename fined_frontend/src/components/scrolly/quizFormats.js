// What a quiz card's answer is, for every quiz `format` (Module 12 on). Each
// format saves ONE answer string, and it is right only if it equals the
// card's answer key exactly — all or nothing. Mirrors quiz_answer_key() in
// fined_backend/app/models/card_data.py, which scores the same strings.
//   choice      the option id                        "c"
//   multi       the chosen option ids, sorted         "a,c,e"
//   order       the item ids in the reader's order    "costs,staff,govt,owners"
//   sort        item=zone for each item, items order  "bank=z_money;trading=z_order"
//   order_book  the locked-in limit price             "101"

export const quizFormat = (cd) => cd?.format || "choice";

const num = (v) => String(Number.isInteger(Number(v)) ? Number(v) : v);

/** The answer string this card counts as right (null if it has none). */
export function quizAnswerKey(cd) {
  const d = cd || {};
  switch (quizFormat(d)) {
    case "choice":
      return (d.options || []).find((o) => o.is_correct)?.id ?? null;
    case "multi":
      return encodeMulti((d.options || []).filter((o) => o.is_correct).map((o) => o.id)) || null;
    case "order":
      return (d.correct_order || []).join(",") || null;
    case "sort":
      return encodeSort(d, Object.fromEntries((d.items || []).map((i) => [i.id, i.zone]))) || null;
    case "order_book":
      return d.correct == null ? null : num(d.correct);
    default:
      return null;
  }
}

/** True when `answer` is this card's right answer. */
export function isRightAnswer(cd, answer) {
  const key = quizAnswerKey(cd);
  return key != null && typeof answer === "string" && answer.trim() === key;
}

export const encodeMulti = (ids) => [...ids].sort().join(",");
export const encodeOrder = (ids) => ids.join(",");
export function encodeSort(cd, placements) {
  return (cd?.items || []).map((i) => `${i.id}=${placements[i.id] ?? ""}`).join(";");
}
export const encodeLimit = (v) => num(v);

/** A saved answer read back for the screen (undefined if it doesn't fit this card). */
export function decodeQuiz(cd, raw) {
  if (typeof raw !== "string" || !raw) return undefined;
  const d = cd || {};
  const optionIds = new Set((d.options || []).map((o) => o.id));
  const itemIds = (d.items || []).map((i) => i.id);
  switch (quizFormat(d)) {
    case "choice":
      return optionIds.has(raw) ? raw : undefined;
    case "multi": {
      const ids = raw.split(",");
      return ids.length && ids.every((id) => optionIds.has(id)) ? raw : undefined;
    }
    case "order": {
      const ids = raw.split(",");
      return ids.length === itemIds.length && [...ids].sort().join() === [...itemIds].sort().join() ? raw : undefined;
    }
    case "sort": {
      const zones = new Set((d.zones || []).map((z) => z.id));
      const pairs = raw.split(";").map((p) => p.split("="));
      return pairs.length === itemIds.length && pairs.every(([i, z], k) => i === itemIds[k] && zones.has(z)) ? raw : undefined;
    }
    case "order_book":
      return Number.isFinite(Number(raw)) ? raw : undefined;
    default:
      return undefined;
  }
}

/** Sort answer string -> { itemId: zoneId }. */
export function sortPlacements(raw) {
  if (!raw) return {};
  return Object.fromEntries(raw.split(";").map((p) => p.split("=")));
}

/** The limits of an order_book quiz's book, as orderBookMath expects. */
export function quizBook(cd) {
  const levels = cd?.book?.levels || [];
  const asks = levels.filter((l) => l.ask_qty).map((l) => [l.price, l.ask_qty]).sort((a, b) => a[0] - b[0]);
  const bids = levels.filter((l) => l.bid_qty).map((l) => [l.price, l.bid_qty]).sort((a, b) => b[0] - a[0]);
  return { lastPrice: cd?.book?.last_price, asks, bids };
}
