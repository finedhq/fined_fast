// Reusable figure (Module 6 on) — "order_book": a company's waiting orders at
// price levels, sellers' asks above and buyers' bids below, each a bar sized
// by quantity, with the last trade in the middle. Everything comes from
// `config` (see module6Figures.js, module7Figures.js):
//   company, book {lastPrice, asks, bids}, depth (levels a side), note
//   steps   one entry per step (so the step count is the config's), each
//           {sides?, lit?, gap?, pulse?, trade?: {side, qty},
//            order?: {side, qty, limit}, control?, ticket?, compare?, eod?,
//            fill?, settle?}
// A trade uses up the best levels first (orderBookMath.js) and the middle label
// shows the last price it reached. `order` is a limit order (Module 7): it
// fills at its limit or better, else waits in line at its price behind the
// shares already there ("1,200 shares ahead"). A step's `control` lets the
// reader set either the order size (kind "size", Module 6) or a limit price
// (kind "limit", Module 7) with a slider + − / + for phones; it isn't saved.
// Module 7's extras: `ticket` {label, rule?, status?} (the order slip above
// the book; `rule` is a field that keeps pulsing), `compare` [{label, tag}]
// (tickets side by side), `eod` {label} (an end-of-day line; once the step's
// guess is answered the waiting order lapses), `fill` {done, of} (a fill bar),
// `settle` {when, rows [[from, to]], back} (the book gives way to settlement).
// `pulse` (gap / ticket / best_ask / eod) pulses once the step's tap-to-guess
// is answered. `choose {options [{id, label, trade: {side, qty}, text}]}`
// (Module 6's 1.4): the reader picks who gives way; that trade prints and its
// line shows. Nothing is saved. Module 12's quiz drives the limit itself
// (`value` / `onValue`) and passes `conceal` so the book doesn't show whether
// the limit fills until the reader locks it in.
import { useState } from "react";
import { inrFull } from "./blocksMath";
import SliderControl from "./SliderControl";
import { bookSummary, bookTrade, limitOrder, limitOutcome, priceMove, sharesLabel, takenSide, topLevels, usedAt } from "./orderBookMath";

function Level({ side, price, qty, max, used, shown, lit, last, mine, pulse }) {
  const left = qty - used;
  return (
    <div
      className={`ob-row ob-row--${side}${shown ? " is-shown" : ""}${lit ? " is-lit" : ""}${used ? " is-hit" : ""}${last ? " is-last" : ""}${mine ? " is-mine" : ""}${pulse ? " is-pulse" : ""}`}
    >
      <span className="ob-price">{inrFull(price)}</span>
      <span className="ob-track">
        {qty > 0 && (
          <span className="ob-bar" style={{ width: `${(qty / max) * 100}%` }}>
            <span className="ob-used" style={{ width: `${(used / qty) * 100}%` }}></span>
          </span>
        )}
        {mine && <span className={`ob-mine${mine.lapsed ? " is-lapsed" : ""}`}>{mine.label}</span>}
      </span>
      <span className="ob-qty">{!qty ? "" : !used ? qty.toLocaleString("en-IN") : left ? `${left.toLocaleString("en-IN")} left` : "used up"}</span>
    </div>
  );
}

function Control({ control, value, onChange }) {
  const limit = control.kind === "limit";
  return (
    <SliderControl
      label={control.label}
      valueText={limit ? inrFull(value) : sharesLabel(value)}
      value={value}
      min={control.min}
      max={control.max}
      step={control.step}
      onChange={onChange}
      lessLabel={limit ? `Lower the limit by ${inrFull(control.step)}` : `${control.step} fewer shares`}
      moreLabel={limit ? `Raise the limit by ${inrFull(control.step)}` : `${control.step} more shares`}
    />
  );
}

function Ticket({ ticket, status, pulse, lapsed }) {
  return (
    <div className={`ob-ticket${pulse ? " is-pulse" : ""}${lapsed ? " is-lapsed" : ""}`}>
      <span className="ob-ticket-kicker">Arjun's order</span>
      <span className="ob-ticket-label">{ticket.label}</span>
      {ticket.rule && <span className="ob-ticket-rule">Price rule: {ticket.rule}</span>}
      {status && <span className="ob-ticket-status">{status}</span>}
    </div>
  );
}

function Settle({ settle }) {
  return (
    <div className="ob-settle">
      <div className="ob-settle-when">{settle.when}</div>
      {settle.rows.map(([from, to]) => (
        <div key={from} className="ob-settle-row">
          <span className="ob-settle-box">{from}</span>
          <span className="ob-settle-arrow" aria-hidden="true">→</span>
          <span className="ob-settle-box is-lit">{to}</span>
        </div>
      ))}
      {settle.back && <div className="ob-settle-back">{settle.back}</div>}
    </div>
  );
}

export default function OrderBook({ step, steps, state = {}, config, value: heldValue, onValue, conceal = false }) {
  const at = Math.min(Math.max(step ?? 0, 0), config.steps.length - 1);
  const s = config.steps[at];
  const { book } = config;
  const control = s.control;
  const [ownValue, setOwnValue] = useState(control?.start ?? 0);
  const value = heldValue ?? ownValue;
  const setValue = onValue || setOwnValue;
  const [way, setWay] = useState(null);
  const picked = s.choose?.options.find((o) => o.id === way) || null;

  const guessId = steps?.[at]?.step_id;
  const guessed = !!(guessId && state.guesses?.[guessId] !== undefined);
  const pulse = guessed ? s.pulse : null;

  // What happens on the book: a scripted trade, a limit order, or the reader's control.
  let trade = null;
  let order = null;
  if (control?.kind === "limit") order = conceal ? null : limitOrder(book, { side: control.side, qty: control.qty, limit: value });
  else if (control) trade = value > 0 ? bookTrade(book, { side: control.side, qty: value }) : null;
  else if (s.order) order = limitOrder(book, s.order);
  else if (s.trade) trade = bookTrade(book, s.trade);
  else if (picked) trade = bookTrade(book, picked.trade);
  if (order && order.fills.length) trade = { ...order, lastPrice: order.lastPrice };

  const fills = trade?.fills || [];
  const last = trade ? trade.lastPrice : book.lastPrice;
  const hitSide = trade ? takenSide(trade.side) : null;
  const lapsed = !!(s.eod && guessed);

  const sides = new Set(s.sides ?? ["bids", "asks"]);
  const asks = topLevels(book.asks, config.depth);
  let bids = topLevels(book.bids, config.depth);
  const rests = order?.rests;
  if (rests && !bids.some(([p]) => p === rests.price)) bids = [...bids, [rests.price, 0]].sort((a, b) => b[0] - a[0]);
  const max = Math.max(...[...asks, ...bids].map(([, q]) => q));
  const mineLabel = rests && `Arjun ${rests.qty.toLocaleString("en-IN")}${lapsed ? " · lapsed" : rests.ahead ? ` · ${rests.ahead.toLocaleString("en-IN")} ahead` : ""}`;

  const level = (side, [price, qty]) => (
    <Level
      key={`${side}-${price}`}
      side={side === "asks" ? "ask" : "bid"}
      price={price}
      qty={qty}
      max={max}
      used={hitSide === side ? usedAt(fills, price) : 0}
      shown={sides.has(side)}
      lit={s.lit === side}
      last={trade && hitSide === side && price === last}
      mine={side === "bids" && rests && price === rests.price ? { label: mineLabel, lapsed } : null}
      pulse={pulse === "best_ask" && side === "asks" && price === book.asks[0][0]}
    />
  );

  let status = s.ticket?.status;
  if (order && !status) status = limitOutcome(order);
  if (lapsed) status = s.eod.lapsed || "Lapsed at the end of the day";
  if (!order && trade && s.ticket && !status) status = `Filled at ${inrFull(trade.lastPrice)}`;
  const ticket = s.ticket || (control?.kind === "limit" ? { label: `Limit ${inrFull(value)} · buy ${control.qty}` } : null);

  const extra = [ticket && `Arjun's order: ${ticket.label}${status ? `, ${status}` : ""}.`, s.fill && `${s.fill.done} of ${s.fill.of} filled.`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`ob-figure${control ? " has-control" : ""}`}>
      {(ticket || s.compare) && (
        <div className="ob-tickets">
          {ticket && <Ticket ticket={ticket} status={status} pulse={pulse === "ticket"} lapsed={lapsed} />}
          {(s.compare || []).map((t) => (
            <div key={t.tag} className="ob-ticket ob-ticket--compare">
              <span className="ob-ticket-kicker">{t.tag}</span>
              <span className="ob-ticket-label">{t.label}</span>
              {t.status && <span className="ob-ticket-status">{t.status}</span>}
            </div>
          ))}
        </div>
      )}
      {s.fill && (
        <div className="ob-fill" role="img" aria-label={`${s.fill.done} of ${s.fill.of} shares filled`}>
          <div className="ob-fill-track">
            <span className="ob-fill-done" style={{ width: `${(s.fill.done / s.fill.of) * 100}%` }}></span>
          </div>
          <div className="ob-fill-text">
            <strong>{s.fill.done} of {s.fill.of}</strong> filled · {s.fill.of - s.fill.done} still waiting
          </div>
        </div>
      )}
      {s.settle ? (
        <Settle settle={s.settle} />
      ) : (
        <div className="ob-book" role="img" aria-label={`${bookSummary(config, { ...s, sides: [...sides] }, trade)}${extra ? ` ${extra}` : ""}`}>
          <div className={`ob-side-label${sides.has("asks") ? " is-shown" : ""}`} aria-hidden="true">
            Sellers · asks
          </div>
          {[...asks].reverse().map((l) => level("asks", l))}
          <div className={`ob-mid${s.gap ? " has-gap" : ""}${pulse === "gap" ? " is-pulse" : ""}`} aria-hidden="true">
            <span className="ob-last-kicker">Last trade</span>
            <strong key={last} className="ob-last">
              {inrFull(last)}
            </strong>
            {trade || (control && !conceal) ? (
              <span className={`ob-move${last > book.lastPrice ? " is-up" : last < book.lastPrice ? " is-down" : ""}`}>
                {priceMove(book.lastPrice, last)}
              </span>
            ) : null}
            <span className="ob-gap">
              Gap {inrFull(book.bids[0][0])} – {inrFull(book.asks[0][0])}
            </span>
          </div>
          {bids.map((l) => level("bids", l))}
          <div className={`ob-side-label${sides.has("bids") ? " is-shown" : ""}`} aria-hidden="true">
            Buyers · bids
          </div>
          {s.eod && (
            <div className={`ob-eod${pulse === "eod" ? " is-pulse" : ""}${lapsed ? " is-lapsed" : ""}`} aria-hidden="true">
              {s.eod.label}
            </div>
          )}
        </div>
      )}
      {control && <Control control={control} value={value} onChange={setValue} />}
      {s.choose && (
        <>
          <div className="ob-choose" role="group" aria-label="Who gives way">
            {s.choose.options.map((o) => (
              <button key={o.id} type="button" className={`og-hold-btn${way === o.id ? " active" : ""}`} aria-pressed={way === o.id} onClick={() => setWay(o.id)}>
                {o.label}
              </button>
            ))}
          </div>
          <p className="lc-meaning" aria-live="polite">
            {picked ? picked.text : s.choose.prompt}
          </p>
        </>
      )}
      <p className="ob-note">{config.note}</p>
    </div>
  );
}
