// "Six Statements" — a `model` card with model_kind "card_months" (WinterArc
// Day 4). Arjun's ₹10,000 card bill, one statement at a time. Some months a
// swipe tempts him first (a sale, a birthday dinner); one month the stipend
// comes late, so only the minimum or a late payment is possible. Each month
// the reader pays in full, part, the minimum, or after the due date, and
// watches the balance, the interest charged and a six-box record (✓ on time,
// ✗ late). The lesson the ending spells out from their own months: the
// minimum costs money; paying late costs money and goes on the record. Never
// scored. The record is saved with the choices, so Chapter 3's map can show
// it. Rules in winterarcGames.js (cardRun). Same look as The Month Happens.
import SafeText from "../SafeText";
import { cardEnding, cardMinimum, cardOptions, cardPayment, cardRecord, cardRun, fill, rupees } from "./winterarcGames";
import { ToolHead } from "./toolKit";

export default function CardMonths({ card, state = {}, onState }) {
  const d = card.card_data || {};
  const config = d.config || { months: [] };
  const t = config.texts || {};
  const labels = config.labels || {};
  const run = cardRun(config, state);
  const record = cardRecord(run);
  const nx = run.next;
  const month = nx?.month;
  const monthNo = month ? config.months.indexOf(month) + 1 : config.months.length;

  const save = (monthId, patch) =>
    onState((prev) => {
      const months = { ...(prev.months || {}), [monthId]: { ...((prev.months || {})[monthId] || {}), ...patch } };
      const next = { ...prev, months };
      return { ...next, record: cardRecord(cardRun(config, next)) };
    });
  const reset = () => onState((prev) => ({ ...prev, months: {}, record: [] }));

  const due = run.due;
  const min = month ? cardMinimum(config, due) : 0;
  const optionText = (id) => {
    const paid = cardPayment(config, due, id);
    const left = due - paid;
    const v = { paid: rupees(paid), left: rupees(left), fee: rupees(config.late_fee), interest: rupees((left * config.monthly_rate) / 100) };
    return { label: fill(labels[id], v), hint: fill(t[`hint_${id}`], v) };
  };

  return (
    <div className="tool-card month-happens card-months">
      <ToolHead data={d} />

      <div className="cm-top" aria-live="polite">
        <div className="cm-stat">
          <span>{t.balance_label || "Card balance"}</span>
          <strong>{rupees(run.done ? run.balance : due)}</strong>
        </div>
        <div className="cm-stat">
          <span>{t.interest_label || "Interest so far"}</span>
          <strong className={run.interest > 0 ? "is-cost" : undefined}>{rupees(run.interest)}</strong>
        </div>
        <div className="cm-stat">
          <span>{t.fees_label || "Late fees"}</span>
          <strong className={run.fees > 0 ? "is-cost" : undefined}>{rupees(run.fees)}</strong>
        </div>
        <div className="cm-record">
          <span className="cm-record-label">{t.record_label || "Your record"}</span>
          <ol aria-label={`${t.record_label || "Your record"}: ${record.length ? record.map((r) => (r === "late" ? "late" : "on time")).join(", ") : "nothing yet"}`}>
            {config.months.map((m, k) => (
              <li key={m.id} className={`cm-box${record[k] ? ` is-${record[k]}` : ""}`} aria-hidden="true">
                {record[k] === "late" ? "✗" : record[k] === "ok" ? "✓" : k + 1}
              </li>
            ))}
          </ol>
        </div>
      </div>

      {run.log.length > 0 && (
        <ol className="mh-log cm-log">
          {run.log.map((l) => (
            <li key={l.month.id}>
              <span className="mh-log-when">{l.month.label}</span>
              <span className="mh-log-what">
                {fill(labels[`log_${l.pay}`] || "Paid {paid}", { paid: rupees(l.paid) })}
                {l.fee ? ` · fee ${rupees(l.fee)}` : ""}
              </span>
              <span className="mh-log-take">{l.interest ? `+${rupees(l.interest)} interest` : "no interest"}</span>
            </li>
          ))}
        </ol>
      )}

      {month && nx.ask === "spend" && (
        <div className="mh-event" key={`${month.id}-spend`}>
          <div className="mh-msg" role="status">
            <div className="mh-msg-head">
              <span className="mh-msg-from">{month.spend.sender}</span>
              <span className="mh-msg-when">{month.label}</span>
            </div>
            <p className="mh-msg-text">{month.spend.text}</p>
          </div>
          <div className="mh-choices" role="group" aria-label={month.spend.text}>
            <button type="button" className="mh-choice" onClick={() => save(month.id, { spend: "yes" })}>
              <span>{month.spend.yes}</span>
              <small>+{rupees(month.spend.amount)} on the card</small>
            </button>
            <button type="button" className="mh-choice" onClick={() => save(month.id, { spend: "no" })}>
              <span>{month.spend.no}</span>
              <small>₹0</small>
            </button>
          </div>
          <p className="mh-progress">
            {monthNo} of {config.months.length}
          </p>
        </div>
      )}

      {month && nx.ask === "pay" && (
        <div className="mh-event" key={`${month.id}-pay`}>
          <div className="cm-statement" role="status">
            <div className="cm-statement-head">
              <span>{fill(t.statement_title || "{month} statement", { month: month.label })}</span>
              <span>{t.due_date || "Due on the 15th"}</span>
            </div>
            <div className="cm-statement-rows">
              <span>
                {t.total_due || "Total due"} <strong>{rupees(due)}</strong>
              </span>
              <span>
                {t.min_due || "Minimum due"} <strong>{rupees(min)}</strong>
              </span>
            </div>
            {nx.everyday > 0 && config.everyday?.label && <p className="cm-everyday">{fill(config.everyday.label, { amount: rupees(nx.everyday) })}</p>}
            {month.notice && <p className="cm-notice">{month.notice}</p>}
          </div>
          <div className="mh-choices" role="group" aria-label={t.pay_prompt || "How much do you pay?"}>
            {cardOptions(config, month, due).map((id) => {
              const o = optionText(id);
              return (
                <button key={id} type="button" className={`mh-choice cm-pay cm-pay--${id}`} onClick={() => save(month.id, { pay: id })}>
                  <span>{o.label}</span>
                  {o.hint && <small>{o.hint}</small>}
                </button>
              );
            })}
          </div>
          <p className="mh-progress">
            {monthNo} of {config.months.length}
          </p>
        </div>
      )}

      {run.done && (
        <div className="mh-ending" aria-live="polite">
          {cardEnding(config, run).map((line, i) => (
            <p key={i} className={i === 0 ? "mh-ending-lead" : undefined}>
              {line}
            </p>
          ))}
          {config.closing && (
            <p className="mh-closing">
              <SafeText text={config.closing} />
            </p>
          )}
          <button type="button" className="mh-again" onClick={reset}>
            {t.again || "Play the six months again"}
          </button>
        </div>
      )}

      {config.neutrality_note && <p className="control-note">{config.neutrality_note}</p>}
    </div>
  );
}
