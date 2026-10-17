// Plain maths and wording for the order book (Module 6 on). No React, so
// every number a learner sees can be unit-tested (module6.test.js).
//
// A book is { lastPrice, asks: [[price, qty]], bids: [[price, qty]] }, each
// side listed best first (asks cheapest first, bids highest first). An order
// in a hurry "walks" the other side: it uses up the best waiting orders, then
// the next ones, and the last price it reached becomes the last trade.
import { inrFull, indianWords } from "./blocksMath";

/** The side an order uses up: a buy takes asks, a sell takes bids. */
export const takenSide = (side) => (side === "sell" ? "bids" : "asks");

/**
 * Walk `qty` shares through `levels` (best first). Returns the fills
 * ([[price, shares]]), the last price reached (null if nothing traded) and
 * any shares left over when the levels run out.
 */
export function walkLevels(levels, qty) {
  const fills = [];
  let left = Math.max(0, qty);
  for (const [price, available] of levels) {
    if (left <= 0) break;
    const take = Math.min(left, available);
    fills.push([price, take]);
    left -= take;
  }
  return { fills, lastPrice: fills.length ? fills[fills.length - 1][0] : null, unfilled: left };
}

/** A trade on the book: { side, qty } → its fills and the new last trade. */
export function bookTrade(book, trade) {
  const walk = walkLevels(book[takenSide(trade.side)], trade.qty);
  return { ...walk, side: trade.side, qty: trade.qty, lastPrice: walk.lastPrice ?? book.lastPrice };
}

/**
 * A limit order (Module 7): it trades with the other side only at its limit
 * or better (a buy: asks at or below the limit), then any shares left wait in
 * line at the limit, behind what is already queued at that price.
 * Returns the fills, the last price (null if nothing traded) and `rests`
 * ({price, qty, ahead} or null when it filled in full).
 */
export function limitOrder(book, { side, qty, limit }) {
  const buy = side !== "sell";
  const ok = ([price]) => (buy ? price <= limit : price >= limit);
  const reachable = book[takenSide(side)].filter(ok);
  const walk = walkLevels(reachable, qty);
  const own = book[buy ? "bids" : "asks"].find(([p]) => p === limit);
  const rests = walk.unfilled > 0 ? { price: limit, qty: walk.unfilled, ahead: own ? own[1] : 0 } : null;
  return { side, qty, limit, fills: walk.fills, lastPrice: walk.lastPrice, rests };
}

/** One line on a limit order's ticket: "Filled now at ₹101" / "Waiting at ₹99 · 1,200 shares ahead". */
export function limitOutcome(order) {
  if (!order.rests) {
    const at = order.lastPrice;
    return order.limit !== at ? `Filled now at ${inrFull(at)}, under the ${inrFull(order.limit)} limit` : `Filled now at ${inrFull(at)}`;
  }
  const ahead = order.rests.ahead ? `${sharesLabel(order.rests.ahead)} ahead` : "nobody ahead";
  return `Waiting at ${inrFull(order.rests.price)} · ${ahead}`;
}

/** Shares a trade used up at one price (0 if it didn't reach it). */
export const usedAt = (fills, price) => fills.find(([p]) => p === price)?.[1] ?? 0;

/** How far the price moved: "+₹3", "−₹2" or "no change". */
export function priceMove(from, to) {
  const d = to - from;
  if (d > 0) return `+${inrFull(d)}`;
  if (d < 0) return `−${inrFull(-d)}`;
  return "no change";
}

/** The `depth` best levels of a side, best first. */
export const topLevels = (levels, depth) => levels.slice(0, depth ?? levels.length);

/** "1,200 shares" — the order book counts in plain thousands, not lakh words. */
export const sharesLabel = (n) => `${indianWords(n)} ${n === 1 ? "share" : "shares"}`;

/** One line for screen readers: what the book shows at this step. */
export function bookSummary(config, s, trade) {
  const { book } = config;
  const parts = [];
  const sides = s.sides || [];
  if (sides.includes("asks")) {
    parts.push(`Sellers ask ${topLevels(book.asks, config.depth).map(([p, q]) => `${inrFull(p)} for ${sharesLabel(q)}`).join(", ")}.`);
  }
  if (sides.includes("bids")) {
    parts.push(`Buyers bid ${topLevels(book.bids, config.depth).map(([p, q]) => `${inrFull(p)} for ${sharesLabel(q)}`).join(", ")}.`);
  }
  if (s.gap) parts.push(`Gap between ${inrFull(book.bids[0][0])} and ${inrFull(book.asks[0][0])}.`);
  if (trade && trade.fills.length) {
    const who = trade.side === "sell" ? "sell" : "buy";
    parts.push(`A ${who} of ${sharesLabel(trade.qty)} uses up ${trade.fills.map(([p, q]) => `${sharesLabel(q)} at ${inrFull(p)}`).join(", ")}.`);
  }
  const last = trade ? trade.lastPrice : book.lastPrice;
  parts.unshift(`${config.company}. Last trade ${inrFull(last)}${trade ? ` (${priceMove(book.lastPrice, last)})` : ""}.`);
  return parts.join(" ");
}
