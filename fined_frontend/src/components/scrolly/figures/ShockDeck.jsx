// WinterArc Day 6 Chapter 1 — "Shock Deck": Arjun's 2027, one month at a time.
//   1.1 pick a starting buffer (₹0 · one month · three months): 12 face-down
//       month cards, a jar, an empty card-debt meter;
//   1.2–1.4 the months flip in order (Jan–Mar, Apr–Jul, Aug–Dec) with the
//       three seeded shocks; the jar pays what it can, the rest goes on the
//       card and is charged interest; 1.4 ends on the year's scorecard;
//   1.5 run it back with another start: scorecards side by side;
//   1.6 where should the jar sit? October's shock replayed from three shelves.
// Saved as state.deck = {start, tried, shelf}. Numbers from shockYear().
import { fill, inr, shockYear } from "./winterarcDays567Math";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function Scorecard({ y, start, mine, dim, onTry }) {
  return (
    <div className={`wf-score${mine ? " is-mine" : ""}${dim ? " is-dim" : ""}`}>
      <div className="wf-score-head">Start {inr(start)}</div>
      {dim ? (
        <button type="button" className="wf-act wf-act--ghost wf-act--sm" onClick={onTry}>
          Try it
        </button>
      ) : (
        <dl>
          <dt>Interest</dt>
          <dd className={y.interest ? "is-cost" : ""}>{inr(y.interest)}</dd>
          <dt>Months in debt</dt>
          <dd>{y.debtMonths}</dd>
          <dt>Card on 31 Dec</dt>
          <dd className={y.card ? "is-cost" : ""}>{inr(y.card)}</dd>
          <dt>Jar on 31 Dec</dt>
          <dd>{inr(y.jar)}</dd>
        </dl>
      )}
    </div>
  );
}

export default function ShockDeck({ step, state = {}, onState, config: c }) {
  const at = Math.min(Math.max(step ?? 0, 0), 5);
  const d = state.deck || {};
  const start = d.start ?? c.starts[0];
  const tried = d.tried || (d.start != null ? [d.start] : []);
  const save = (patch) => onState((prev) => ({ ...prev, deck: { ...(prev.deck || {}), ...patch } }));
  const pick = (s) => save({ start: s, tried: [...new Set([...(d.tried || []), s])] });
  const year = shockYear({ start, save: c.save, rate: c.rate, shocks: c.shocks });
  const flipped = [0, 3, 7, 12, 12, 12][at];
  const now = flipped ? year.months[flipped - 1] : { jar: start, card: 0, interest: 0 };
  const shockMonth = { 1: 3, 2: 7, 3: 10 }[at];
  const lineFor = (m) => {
    const row = year.months[m - 1];
    const t = c.texts.shock;
    // covered: the jar right after paying (that month's saving lands after)
    if (!row.toCard) return fill(t.covered, { left: inr(row.jar - c.save) });
    return fill(row.fromJar ? t.part : t.none, { fromJar: inr(row.fromJar), toCard: inr(row.toCard) });
  };

  if (at === 5) {
    const shelf = d.shelf;
    const o = c.shelves.find((s) => s.id === shelf);
    return (
      <div className="wf-figure wf-deck">
        <p className="wf-note">{c.notes[5]}</p>
        <div className="wf-shelves" role="group" aria-label="Where the jar sits">
          {c.shelves.map((s) => (
            <button key={s.id} type="button" className={`wf-shelf${shelf === s.id ? " is-on" : ""}`} aria-pressed={shelf === s.id} onClick={() => save({ shelf: s.id })}>
              <span className="wf-jar-mini" aria-hidden="true" />
              {s.label}
            </button>
          ))}
        </div>
        <div className="wf-deck-oct">
          <div className="wf-month is-up is-shock">
            <small>Oct</small>
            {c.shocks[10].label}
            <strong>{inr(c.shocks[10].amount)}</strong>
          </div>
          {o ? (
            <div className="wf-meters">
              <div>
                <span>Jar pays</span>
                <strong>{inr(o.pays)}</strong>
              </div>
              <div className={o.card ? "is-tray" : ""}>
                <span>On the card</span>
                <strong>{inr(o.card)}</strong>
              </div>
            </div>
          ) : (
            <p className="wf-out">{c.texts.shelf_hint}</p>
          )}
        </div>
        {o && (
          <>
            <p className={`wf-out${o.card || o.penalty ? " is-warn" : ""}`}>{o.line}</p>
            <p className="wf-foot">{c.texts.shelf_after}</p>
          </>
        )}
      </div>
    );
  }

  if (at === 4) {
    const years = Object.fromEntries(c.starts.map((s) => [s, shockYear({ start: s, save: c.save, rate: c.rate, shocks: c.shocks })]));
    const lo = c.starts[0];
    const hi = c.starts[c.starts.length - 1];
    const both = tried.includes(lo) && tried.includes(hi);
    return (
      <div className="wf-figure wf-deck">
        <p className="wf-note">{c.notes[4]}</p>
        <div className="wf-scores">
          {c.starts.map((s) => (
            <Scorecard key={s} y={years[s]} start={s} mine={s === start} dim={!tried.includes(s)} onTry={() => pick(s)} />
          ))}
        </div>
        <p className="wf-out">
          {both
            ? fill(c.texts.bracket, { lo_int: inr(years[lo].interest), hi_int: inr(years[hi].interest), lo_card: inr(years[lo].card), hi_jar: inr(years[hi].jar) })
            : c.texts.try_more}
        </p>
        <p className="wf-foot">{c.texts.honest}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure wf-deck">
      <p className="wf-note">{c.notes[at]}</p>
      {at === 0 && (
        <div className="wf-seg" role="group" aria-label="Starting buffer">
          {c.starts.map((s, k) => (
            <button key={s} type="button" className={`wf-seg-btn${d.start === s ? " is-on" : ""}`} aria-pressed={d.start === s} onClick={() => pick(s)}>
              {inr(s)}
              {c.startNotes[k] ? ` · ${c.startNotes[k]}` : ""}
            </button>
          ))}
        </div>
      )}
      <div className="wf-deck-top">
        <div className="wf-jar-big" aria-label={`Jar ${inr(now.jar)}`}>
          <span style={{ height: `${Math.min(100, (now.jar / c.jarMax) * 100)}%` }} />
          <strong>{inr(now.jar)}</strong>
          <small>Jar</small>
        </div>
        <div className="wf-months" role="list">
          {MONTH_SHORT.map((label, k) => {
            const m = k + 1;
            const row = year.months[k];
            const up = m <= flipped;
            return (
              <div key={label} role="listitem" className={`wf-month${up ? " is-up" : ""}${up && row.shock ? " is-shock" : ""}${m === shockMonth ? " is-now" : ""}`} style={{ animationDelay: `${(m - 1) * 60}ms` }}>
                <small>{label}</small>
                {!up ? (
                  <span aria-label="Not flipped yet">?</span>
                ) : row.shock ? (
                  <>
                    {row.shock.label}
                    <strong>{inr(row.shock.amount)}</strong>
                  </>
                ) : row.charged ? (
                  <em className="is-cost">{inr(row.charged)} interest</em>
                ) : (
                  <em>+{inr(c.save)} saved</em>
                )}
              </div>
            );
          })}
        </div>
        <div className={`wf-debt${now.card ? " is-on" : ""}`} aria-label={`Card debt ${inr(now.card)}`}>
          <span style={{ height: `${Math.min(100, (now.card / c.debtMax) * 100)}%` }} />
          <strong>{inr(now.card)}</strong>
          <small>Card</small>
        </div>
      </div>
      {at === 0 && <p className="wf-out">{d.start == null ? c.texts.pick : fill(c.texts.picked, { start: inr(start) })}</p>}
      {at >= 1 && at <= 2 && <p className="wf-out">{lineFor(shockMonth)}</p>}
      {at === 3 && (
        <>
          <p className="wf-out">{lineFor(10)}</p>
          <Scorecard y={year} start={start} mine />
        </>
      )}
    </div>
  );
}
