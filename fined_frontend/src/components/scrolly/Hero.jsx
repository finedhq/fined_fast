// The prototype's hero (module1-app.js renderHero + setupHero), drawn from the
// module's `hero` card: badge, headline, subhead, read time + info chips,
// "Earn up to N FinStars", the warm-up poll and savings chips, "Scroll to begin".
import SafeText from "./SafeText";
import { scrollToElement } from "./scroll";

// `kind` ("poll" or "savings") only names the group for styling.
function PollGroup({ kind, num, prompt, options, picked, ack, onPick }) {
  const answered = picked !== undefined && picked !== null;
  return (
    <div className={`hero-poll hero-poll--${kind}${answered ? " is-answered" : ""}`}>
      <div className="hero-poll-prompt">
        <span className="poll-num">{num}</span>
        {prompt}
      </div>
      <div className="poll-chip-row">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            className={`poll-chip${picked === o.id ? " selected" : ""}`}
            disabled={answered}
            onClick={() => onPick(o)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="poll-ack" aria-live="polite">
        {answered ? ack : ""}
      </div>
    </div>
  );
}

// WinterArc Day 6 on: "your month" — money in and must-pay costs, as two
// steppers with preset chips (`month` in the hero card). Kept in this tab's
// page state only (never in the saved answers), so the note under it is true.
function MonthInputs({ m, num, answers, onAnswer }) {
  const inr = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;
  const income = answers.income ?? m.income.default;
  const must = Math.min(income, answers.must ?? Math.round((income * m.must.default_pct) / 100));
  const set = (patch) => {
    const nextIncome = patch.income ?? income;
    const nextMust = Math.min(nextIncome, patch.must ?? (patch.pct != null ? Math.round((nextIncome * patch.pct) / 100) : must));
    onAnswer({ income: nextIncome, must: nextMust });
  };
  const row = (label, value, onLess, onMore, chips) => (
    <div className="hero-month-row">
      <div className="hero-month-label">{label}</div>
      <div className="hero-month-ctrl">
        <button type="button" className="stepper-btn" aria-label={`${label}: less`} onClick={onLess}>
          −
        </button>
        <strong>{inr(value)}</strong>
        <button type="button" className="stepper-btn" aria-label={`${label}: more`} onClick={onMore}>
          +
        </button>
      </div>
      <div className="poll-chip-row">{chips}</div>
    </div>
  );
  return (
    <div className="hero-poll hero-poll--month is-answered">
      <div className="hero-poll-prompt">
        <span className="poll-num">{num}</span>
        {m.prompt}
      </div>
      {row(
        m.income.label,
        income,
        () => set({ income: Math.max(m.income.step, income - m.income.step) }),
        () => set({ income: income + m.income.step }),
        m.income.options.map((v) => (
          <button key={v} type="button" className={`poll-chip${income === v ? " selected" : ""}`} onClick={() => set({ income: v })}>
            {inr(v)}
          </button>
        )),
      )}
      {row(
        m.must.label,
        must,
        () => set({ must: Math.max(0, must - m.must.step) }),
        () => set({ must: Math.min(income, must + m.must.step) }),
        m.must.presets.map((p) => (
          <button key={p} type="button" className={`poll-chip${must === Math.round((income * p) / 100) ? " selected" : ""}`} onClick={() => set({ pct: p })}>
            {p}%
          </button>
        )),
      )}
      {m.note && <p className="warmup-note">{m.note}</p>}
    </div>
  );
}

export default function Hero({ card, maxStars, answers, onAnswer, firstSectionSelector, rootRef, unit = "FinStars" }) {
  const d = card.card_data || {};
  const meta = [d.read_time ? `${String(d.read_time).replace(/^~/, "")} read` : null, ...(d.meta_chips || [])].filter(Boolean);
  const chip = d.chip;
  const savingsAck = answers.savings === undefined ? "" : answers.savings === "skip" || answers.amount == null ? chip?.skip_ack : chip?.ack;

  return (
    <section className="nc-hero" id="hero" data-part={card.slug}>
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="hero-badge">{d.badge}</div>
          <h1 className="hero-headline">{d.headline}</h1>
          <p className="hero-subhead">
            <SafeText text={d.subhead} />
          </p>
          <ul className="hero-meta">
            {meta.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
          <div className="hero-reward">
            Earn up to <strong>{maxStars} {unit}</strong> along the way
          </div>
          {/* Owner's request (2026-10-03): phones and tablets only, hidden on desktop by CSS */}
          <p className="hero-device-tip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
              <rect x="3" y="4" width="18" height="12" rx="2" />
              <path strokeLinecap="round" d="M8 20h8M12 16v4" />
            </svg>
            <span>
              <strong>Best on a laptop or desktop:</strong> the charts and tools are easier to use on a bigger screen.
            </span>
          </p>
        </div>

        <div className="hero-warmup">
          <div className="warmup-label">{d.warmup_label}</div>
          {d.poll && (
            <PollGroup
              kind="poll"
              num="01"
              prompt={d.poll.prompt}
              options={d.poll.options}
              picked={answers.poll}
              ack={d.poll.ack}
              onPick={(o) => onAnswer({ poll: o.id })}
            />
          )}
          {chip && (
            <PollGroup
              kind="savings"
              num="02"
              prompt={chip.prompt}
              options={chip.options}
              picked={answers.savings}
              ack={savingsAck}
              onPick={(o) => onAnswer({ savings: o.id, amount: o.value ?? null })}
            />
          )}
          {d.month && <MonthInputs m={d.month} num={chip ? "03" : "02"} answers={answers} onAnswer={onAnswer} />}
          {d.note && <p className="warmup-note">{d.note}</p>}
        </div>
      </div>
      <a
        href="#chapter-1"
        className="scroll-indicator"
        onClick={(e) => {
          e.preventDefault();
          scrollToElement(rootRef.current?.querySelector(firstSectionSelector));
        }}
      >
        <span>{d.scroll_cta}</span>
        <span className="scroll-line" aria-hidden="true"></span>
      </a>
    </section>
  );
}
