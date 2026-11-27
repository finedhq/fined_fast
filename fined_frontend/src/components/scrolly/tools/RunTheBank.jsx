// "Run the Bank" — a `model` card with model_kind "run_the_bank" (WinterArc
// Day 2). The reader runs a small bank for a month: they choose how much of
// the deposits to lend, then messages arrive (withdrawals, a loan request).
// A withdrawal the vault can't cover is borrowed in a hurry, at a cost. The
// month ends with lines written from their choices: keep it all and the bank
// loses money; lend it all and savers wait. Never scored. Same look as The
// Month Happens (mh-* styles). Rules in winterarcGames.js (bankRun).
import SafeText from "../SafeText";
import { bankEnding, bankLoanBlocked, bankRun, rupees } from "./winterarcGames";
import { ToolHead } from "./toolKit";

export default function RunTheBank({ card, state = {}, onState }) {
  const d = card.card_data || {};
  const config = d.config || { events: [] };
  const t = config.texts || {};
  const run = bankRun(config, state);
  const ev = run.next;
  const setLend = (pct) => onState((prev) => ({ ...prev, lend: pct, choices: {} }));
  const choose = (id, choice) => onState((prev) => ({ ...prev, choices: { ...(prev.choices || {}), [id]: choice } }));
  const reset = () => onState((prev) => ({ ...prev, lend: null, choices: {} }));
  const pots = [
    { id: "vault", label: t.vault || "In the vault", value: run.vault, of: config.deposits },
    { id: "lent", label: t.lent || "Lent out", value: run.lent, of: config.deposits },
    { id: "hurry", label: t.borrowed || "Borrowed in a hurry", value: run.borrowed || 0, of: config.deposits },
  ];

  return (
    <div className="tool-card month-happens run-bank">
      <ToolHead data={d} />

      {!run.started ? (
        <div className="rb-start">
          <p className="rb-prompt">{t.lend_prompt}</p>
          <div className="mh-choices" role="group" aria-label={t.lend_prompt}>
            {config.lend_options.map((pct) => (
              <button key={pct} type="button" className="mh-choice" onClick={() => setLend(pct)}>
                <span>{pct === 0 ? t.lend_none || "Lend nothing: keep it all in the vault" : `Lend ${pct}%`}</span>
                <small>
                  {rupees((config.deposits * pct) / 100)} lent · {rupees((config.deposits * (100 - pct)) / 100)} kept
                </small>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="mh-pots rb-pots" aria-live="polite">
            <div className="mh-date">
              {ev ? ev.when : config.end_label} · {t.lend_label || "Lending"} {state.lend}%
            </div>
            {pots.map((p) => (
              <div key={p.id} className={`mh-pot rb-pot--${p.id}${p.id === "hurry" && !p.value ? " is-zero" : ""}`}>
                <div className="mh-pot-head">
                  <span>{p.label}</span>
                  <strong>{rupees(p.value)}</strong>
                </div>
                <div className="mh-pot-track" aria-hidden="true">
                  <div className="mh-pot-fill" style={{ width: `${Math.min(100, (p.value / p.of) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>

          {run.log.length > 0 && (
            <ol className="mh-log">
              {run.log.map((l) => (
                <li key={l.event.id}>
                  <span className="mh-log-when">{l.event.when}</span>
                  <span className="mh-log-what">
                    {l.event.kind === "withdraw"
                      ? l.short
                        ? `${l.event.who} waited: ${rupees(l.short)} borrowed in a hurry`
                        : `Paid ${l.event.who} from the vault`
                      : l.lent
                        ? `Lent to the ${l.event.who}`
                        : `Said no to the ${l.event.who}`}
                  </span>
                  <span className="mh-log-take">{l.event.kind === "withdraw" ? `−${rupees(l.event.amount)}` : l.lent ? `−${rupees(l.event.amount)}` : "₹0"}</span>
                </li>
              ))}
            </ol>
          )}

          {ev && (
            <div className="mh-event" key={ev.id}>
              <div className="mh-msg" role="status">
                <div className="mh-msg-head">
                  <span className="mh-msg-from">{ev.sender}</span>
                  <span className="mh-msg-when">{ev.when}</span>
                </div>
                <p className="mh-msg-text">{ev.text}</p>
              </div>
              {ev.kind === "withdraw" ? (
                <div className="mh-choices">
                  <button type="button" className="mh-choice" onClick={() => choose(ev.id, "paid")}>
                    <span>
                      Pay {ev.who} {rupees(ev.amount)}
                    </span>
                    <small className={run.vault < ev.amount ? "rb-short" : undefined}>
                      {run.vault >= ev.amount ? t.from_vault || "from the vault" : fill2(t.short_text, run.vault, ev.amount)}
                    </small>
                  </button>
                </div>
              ) : (
                <div className="mh-choices" role="group" aria-label={ev.text}>
                  {[
                    { id: "yes", label: ev.yes, blocked: bankLoanBlocked(run, ev, t.loan_blocked) },
                    { id: "no", label: ev.no, blocked: "" },
                  ].map((c) => (
                    <button key={c.id} type="button" className="mh-choice" disabled={!!c.blocked} onClick={() => choose(ev.id, c.id)}>
                      <span>{c.label}</span>
                      <small>{c.blocked || (c.id === "yes" ? `−${rupees(ev.amount)} from the vault` : "₹0")}</small>
                    </button>
                  ))}
                </div>
              )}
              <p className="mh-progress">
                {run.log.length + 1} of {config.events.length}
              </p>
            </div>
          )}

          {run.done && (
            <div className="mh-ending" aria-live="polite">
              <div className="rb-sums">
                <span>
                  Borrowers paid you <strong>{rupees(run.earned)}</strong>
                </span>
                <span>
                  Savers got <strong>{rupees(run.paid)}</strong>
                </span>
                {run.cost > 0 && (
                  <span>
                    Hurry cost <strong>{rupees(run.cost)}</strong>
                  </span>
                )}
                <span className={run.profit > 0 ? "rb-plus" : "rb-minus"}>
                  {run.profit > 0 ? "Profit" : "Loss"} <strong>{rupees(Math.abs(run.profit))}</strong>
                </span>
              </div>
              {bankEnding(config, run).map((line, i) => (
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
                {t.again || "Run the month again"}
              </button>
            </div>
          )}
        </>
      )}

      {config.neutrality_note && <p className="control-note">{config.neutrality_note}</p>}
    </div>
  );
}

// "₹X short: you'll borrow it in a hurry" from the template.
function fill2(text, vault, amount) {
  return String(text || "{short} short: borrow it in a hurry").replace("{short}", rupees(amount - vault));
}
