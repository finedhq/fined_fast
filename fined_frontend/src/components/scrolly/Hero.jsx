// The prototype's hero (module1-app.js renderHero + setupHero), drawn from the
// module's `hero` card: badge, headline, subhead, read time + info chips,
// "Earn up to N FinStars", the warm-up poll and savings chips, "Scroll to begin".
import SafeText from "./SafeText";
import { scrollToElement } from "./scroll";

function PollGroup({ num, prompt, options, picked, ack, onPick }) {
  const answered = picked !== undefined && picked !== null;
  return (
    <div className={`hero-poll${answered ? " is-answered" : ""}`}>
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

export default function Hero({ card, maxStars, answers, onAnswer, firstSectionSelector, rootRef }) {
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
            Earn up to <strong>{maxStars} FinStars</strong> along the way
          </div>
        </div>

        <div className="hero-warmup">
          <div className="warmup-label">{d.warmup_label}</div>
          {d.poll && (
            <PollGroup
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
              num="02"
              prompt={chip.prompt}
              options={chip.options}
              picked={answers.savings}
              ack={savingsAck}
              onPick={(o) => onAnswer({ savings: o.id, amount: o.value ?? null })}
            />
          )}
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
