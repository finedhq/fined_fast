// A quick check, drawn from a `quiz` card — a port of the prototype's
// _renderCheckpoint (engine.js): badge + reward, question, A–D options, and an
// explanation that opens once answered. One try; the answer stays answered
// (the right option turns green, a wrong pick amber). It can be skipped, as in
// the prototype. The saved answer is the option's id (the course quiz bonus
// compares ids).
//
// Module 12 adds `format` (quizFormats.js), each answered once and scored all
// or nothing, and `badge_label` ("Question 7 of 20") in place of "Quick check":
//   multi       tap options on and off, then Submit
//   order       put the items in order (the put-in-order screen), then Check
//   sort        tap an item, then its place (the Money Sorter screen), then Check
//   order_book  set Arjun's limit on the order book, then "Lock it in"; the
//               book shows what happens only once it's locked
import { Suspense, lazy, useState } from "react";
import SafeText from "./SafeText";
import { getCardFinstars } from "../../utils/finstars";
import { encodeLimit, encodeMulti, encodeOrder, encodeSort, isRightAnswer, quizBook, quizFormat, sortPlacements } from "./quizFormats";

const OrderBook = lazy(() => import("./figures/OrderBook"));
const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th"];
const letter = (i) => String.fromCharCode(65 + i);

function ChoiceAnswer({ d, picked, onPick }) {
  const answered = picked != null;
  return (
    <div className="checkpoint-options-grid">
      {(d.options || []).map((o, i) => {
        const mark = !answered ? "" : o.is_correct ? " correct" : o.id === picked ? " wrong" : "";
        return (
          <button key={o.id ?? i} type="button" className={`checkpoint-option-btn${mark}`} disabled={answered} onClick={() => onPick(o.id)}>
            <span className="option-badge-letter">{letter(i)}</span>
            <span>{o.text}</span>
          </button>
        );
      })}
    </div>
  );
}

function MultiAnswer({ d, picked, onPick }) {
  const answered = picked != null;
  const [on, setOn] = useState(() => new Set());
  const chosen = answered ? new Set(picked.split(",")) : on;
  const toggle = (id) =>
    setOn((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <>
      <div className="checkpoint-options-grid" role="group" aria-label={d.instruction || "Select all that apply"}>
        {(d.options || []).map((o, i) => {
          const sel = chosen.has(o.id);
          const mark = !answered ? (sel ? " selected" : "") : o.is_correct ? (sel ? " correct" : " missed") : sel ? " wrong" : "";
          return (
            <button key={o.id} type="button" className={`checkpoint-option-btn quiz-toggle${mark}`} aria-pressed={sel} disabled={answered} onClick={() => toggle(o.id)}>
              <span className="option-badge-letter" aria-hidden="true">{sel ? "✓" : letter(i)}</span>
              <span>{o.text}</span>
              {answered && o.is_correct && !sel && <span className="quiz-missed-tag">missed</span>}
            </button>
          );
        })}
      </div>
      {!answered && (
        <button type="button" className="quiz-submit" disabled={!on.size} onClick={() => onPick(encodeMulti(on))}>
          {d.submit_label || "Submit"}
        </button>
      )}
    </>
  );
}

function OrderAnswer({ d, picked, onPick }) {
  const items = d.items || [];
  const n = items.length;
  const label = (id) => items.find((x) => x.id === id)?.label;
  const [slots, setSlots] = useState(() => Array(n).fill(null));

  if (picked != null) {
    const order = picked.split(",");
    return (
      <div className="quiz-result">
        <ol className="quiz-result-list">
          {order.map((id, i) => {
            const ok = d.correct_order[i] === id;
            return (
              <li key={id} className={`quiz-result-row${ok ? " is-right" : " is-wrong"}`}>
                <span className="quiz-result-num">{ORDINALS[i]}</span>
                <span className="quiz-result-text">{label(id)}</span>
                <span className="quiz-result-mark" aria-label={ok ? "right place" : "wrong place"}>{ok ? "✓" : "✗"}</span>
              </li>
            );
          })}
        </ol>
        {!isRightAnswer(d, picked) && (
          <p className="quiz-result-key">
            <strong>The right order:</strong> {d.correct_order.map((id, i) => `${i + 1}. ${label(id)}`).join(" · ")}
          </p>
        )}
      </div>
    );
  }

  const place = (id, at) =>
    setSlots((cur) => {
      const next = cur.map((x) => (x === id ? null : x));
      const target = at ?? next.indexOf(null);
      if (target < 0) return cur;
      next[target] = id;
      return next;
    });
  const takeBack = (at) => setSlots((cur) => cur.map((x, i) => (i === at ? null : x)));
  const onDragStart = (id) => (e) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (at) => (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (items.some((x) => x.id === id)) place(id, at);
  };
  const pool = items.map((x) => x.id).filter((id) => !slots.includes(id));
  const full = slots.every(Boolean);

  return (
    <div className="lq-figure quiz-order">
      <div className="lq-board">
        <div className="lq-pool" aria-label="Waiting to be placed">
          <span className="lq-col-label">Tap in order</span>
          {pool.map((id) => (
            <button key={id} type="button" className="lq-card" draggable onDragStart={onDragStart(id)} onClick={() => place(id)}>
              {label(id)}
            </button>
          ))}
          {!pool.length && <span className="lq-pool-empty">All placed. Tap one to take it back.</span>}
        </div>
        <ol className="lq-slots" aria-label="Your order">
          {slots.map((id, i) => (
            <li key={i} className={`lq-slot${id ? " filled" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={onDrop(i)}>
              <span className="lq-slot-num">{ORDINALS[i]}</span>
              {id ? (
                <button type="button" className="lq-card lq-card--placed" draggable onDragStart={onDragStart(id)} onClick={() => takeBack(i)} aria-label={`${label(id)}, ${ORDINALS[i]}. Tap to take back.`}>
                  {label(id)}
                </button>
              ) : (
                <span className="lq-slot-empty">Empty</span>
              )}
            </li>
          ))}
        </ol>
      </div>
      <button type="button" className="quiz-submit" disabled={!full} onClick={() => onPick(encodeOrder(slots))}>
        {d.submit_label || "Check my order"}
      </button>
    </div>
  );
}

function SortAnswer({ d, picked, onPick }) {
  const items = d.items || [];
  const zones = d.zones || [];
  const answered = picked != null;
  const [placements, setPlacements] = useState({});
  const [held, setHeld] = useState(null);
  const shown = answered ? sortPlacements(picked) : placements;
  const zoneLabel = (id) => zones.find((z) => z.id === id)?.label || "";
  const itemLabel = (id) => items.find((x) => x.id === id)?.label || "";
  const place = (itemId, zoneId) => {
    if (!itemId || answered) return;
    setPlacements((p) => ({ ...p, [itemId]: zoneId }));
    setHeld(null);
  };
  const full = items.every((x) => shown[x.id]);

  return (
    <div className="money-sorter quiz-sort">
      {!answered && <p className="sorter-howto">{held ? `Now tap where "${itemLabel(held)}" belongs.` : "Tap one, then tap where it belongs."}</p>}
      <div className="sorter-cards" role="group" aria-label="Items">
        {items.map((x) => {
          const zone = shown[x.id];
          const ok = answered && zone === x.zone;
          return (
            <button
              key={x.id}
              type="button"
              className={`sorter-card${held === x.id ? " selected" : ""}${zone ? " placed" : ""}${answered ? (ok ? " is-right" : " is-wrong") : ""}`}
              aria-pressed={held === x.id}
              disabled={answered}
              draggable={!answered}
              onDragStart={(e) => e.dataTransfer.setData("text/plain", x.id)}
              onClick={() => setHeld(held === x.id ? null : x.id)}
            >
              <span className="sorter-card-label">{x.label}</span>
              {zone && (
                <span className="sorter-card-placed">
                  → {zoneLabel(zone)}
                  {answered && (ok ? " ✓" : ` ✗ (${zoneLabel(x.zone)})`)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {!answered && (
        <div className="sorter-zones">
          {zones.map((z) => (
            <div
              key={z.id}
              role="button"
              tabIndex={0}
              className={`sorter-zone${held ? " is-ready" : ""}`}
              aria-label={`Place in ${z.label}`}
              onClick={() => place(held, z.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  place(held, z.id);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                place(e.dataTransfer.getData("text/plain"), z.id);
              }}
            >
              <div className="sorter-zone-label">{z.label}</div>
            </div>
          ))}
        </div>
      )}
      {!answered && (
        <button type="button" className="quiz-submit" disabled={!full} onClick={() => onPick(encodeSort(d, placements))}>
          {d.submit_label || "Check my answer"}
        </button>
      )}
    </div>
  );
}

function BookAnswer({ d, picked, onPick }) {
  const c = d.control || {};
  const t = d.book?.order_ticket || { side: "buy", qty: 100 };
  const [limit, setLimit] = useState(c.default ?? c.min);
  const answered = picked != null;
  const book = quizBook(d);
  const ticket = (v) => `Limit ₹${v} · ${t.side} ${t.qty}`;
  const config = {
    company: d.book?.company_label,
    book,
    depth: 4,
    note: "Made-up book with round numbers.",
    steps: [
      answered
        ? { ticket: { label: ticket(picked) }, order: { side: t.side, qty: t.qty, limit: Number(picked) } }
        : { ticket: { label: ticket(limit) }, control: { kind: "limit", side: t.side, qty: t.qty, label: c.label, min: c.min, max: c.max, step: c.step, start: c.default } },
    ],
  };
  return (
    <div className="quiz-book">
      <Suspense fallback={<div className="quiz-book-loading">Loading the order book…</div>}>
        <OrderBook step={0} steps={[]} config={config} value={answered ? undefined : limit} onValue={setLimit} conceal={!answered} />
      </Suspense>
      {!answered && (
        <button type="button" className="quiz-submit" onClick={() => onPick(encodeLimit(limit))}>
          {c.submit_label || "Lock it in"} at ₹{limit}
        </button>
      )}
    </div>
  );
}

const ANSWERS = { choice: ChoiceAnswer, multi: MultiAnswer, order: OrderAnswer, sort: SortAnswer, order_book: BookAnswer };

export default function Checkpoint({ card, picked, onPick }) {
  const d = card.card_data || {};
  const format = quizFormat(d);
  const Answer = ANSWERS[format] || ChoiceAnswer;
  const answered = picked !== undefined && picked !== null;
  const isCorrect = answered && isRightAnswer(d, picked);

  return (
    <section className={`checkpoint-section checkpoint--${format}`} id={`checkpoint-${card.slug}`} data-part={card.slug}>
      <div className="checkpoint-container">
        <div className="checkpoint-badge">
          <span>{d.badge_label || "Quick check"}</span>
          <span className="checkpoint-reward">+{getCardFinstars(d, "quiz")} FinStars</span>
        </div>
        <h2 className="checkpoint-question">{d.question}</h2>
        {d.instruction && <p className="checkpoint-instruction">{d.instruction}</p>}
        <Answer d={d} picked={answered ? picked : null} onPick={onPick} />
        <div className={`checkpoint-explanation-box${answered ? ` visible ${isCorrect ? "is-correct" : "is-wrong"}` : ""}`}>
          <div className="exp-header">{answered ? (isCorrect ? "Correct" : "Not quite — here's why") : ""}</div>
          <div className="exp-body">
            <SafeText text={d.explanation} />
          </div>
        </div>
      </div>
    </section>
  );
}
