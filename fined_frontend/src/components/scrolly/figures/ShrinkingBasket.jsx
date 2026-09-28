// Chapter 1 figure — "shrinking_basket_predict" (port of the prototype's
// ShrinkingBasketFigure.js). A 10-item basket whose fill level is purchasing
// power. Step 2's guess slider IS the basket; step 3 reveals the real value
// against the reader's guess; step 4 adds the savings-account basket.
// Steps are by position: 0 meet · 1 guess · 2 reveal · 3 savings account.
import { useEffect } from "react";
import {
  GUESS_DEFAULT,
  GUESS_MAX,
  GUESS_MIN,
  GUESS_STEP,
  REAL_VALUE,
  SAVINGS_REAL_VALUE,
  basketItems,
  inr,
  pctOf,
} from "./figureMath";

function Basket({ caption, pct, variant, hidden, guessMark }) {
  return (
    <div className={`basket-block basket-block--${variant}`} style={hidden ? { display: "none" } : variant === "b" ? { display: "block" } : undefined}>
      <div className="basket-head">
        <div className="basket-caption">{caption}</div>
        <div className="basket-worth">
          <span className="basket-worth-label">buys</span> <strong>{inr(Math.round(pct * 1000))}</strong>
        </div>
      </div>
      <div className="basket-meter" aria-hidden="true">
        <div className="basket-meter-fill" style={{ width: `${pct}%` }}></div>
        <div className="basket-meter-guess" style={guessMark === null ? { display: "none" } : { display: "block", left: `${guessMark}%` }}>
          <span>Your guess</span>
        </div>
      </div>
      <div className="basket-grid">
        {basketItems(pct).map((item) => (
          <div
            key={item.id}
            className={`basket-item-card${item.faded ? " basket-item-card--faded" : ""}`}
            style={{ opacity: item.opacity }}
            title={`${item.label} · ${item.category}`}
          >
            <div className="basket-item-label">{item.label}</div>
            <div className="basket-item-cat">{item.category}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ShrinkingBasket({ step, state, onState }) {
  const s = step ?? 0;
  const guess = state.guess ?? GUESS_DEFAULT;
  const revealed = s >= 2;

  // The reveal line under step 3 uses the guess as it was when revealed.
  useEffect(() => {
    if (s === 2 && state.revealedGuess !== guess) onState({ revealedGuess: guess });
  }, [s, guess, state.revealedGuess, onState]);

  const clamp = (v) => Math.max(GUESS_MIN, Math.min(GUESS_MAX, v));
  const setGuess = (v) => onState({ guess: clamp(v) });
  // Steppers add to the latest value, so quick repeated taps all count.
  const nudge = (delta) => onState((current) => ({ guess: clamp((current.guess ?? GUESS_DEFAULT) + delta) }));

  const captionA = s === 0 ? "₹1,00,000 at today's prices" : s === 1 ? "10 years later — what's it worth?" : "10 years later, at 5% inflation";
  const pctA = s === 0 ? 100 : s === 1 ? pctOf(guess) : pctOf(REAL_VALUE);

  return (
    <div className="basket-figure">
      <div className="basket-row">
        <Basket variant="a" caption={captionA} pct={pctA} guessMark={revealed ? pctOf(guess) : null} />
        <Basket variant="b" caption="Savings account, same 10 years" pct={pctOf(SAVINGS_REAL_VALUE)} hidden={s !== 3} guessMark={null} />
      </div>

      <div className="basket-guess-panel" style={{ display: s === 1 ? "flex" : "none" }}>
        <div className="basket-guess-value">
          Your guess <strong>{inr(guess)}</strong>
        </div>
        <div className="basket-guess-row">
          <button type="button" className="stepper-btn" aria-label="Lower guess by ₹1,000" onClick={() => nudge(-GUESS_STEP)}>
            −
          </button>
          <input
            type="range"
            min={GUESS_MIN}
            max={GUESS_MAX}
            step={GUESS_STEP}
            value={guess}
            aria-label="Your guess in rupees"
            onChange={(e) => setGuess(Number(e.target.value))}
          />
          <button type="button" className="stepper-btn" aria-label="Raise guess by ₹1,000" onClick={() => nudge(GUESS_STEP)}>
            +
          </button>
        </div>
        <div className="basket-guess-scale">
          <span>₹40,000</span>
          <span>₹1,00,000</span>
        </div>
      </div>

      <div className="basket-marker-row" style={{ display: revealed ? "flex" : "none" }}>
        {revealed && (
          <>
            <div className="marker-chip marker-chip--guess">
              <span>Your guess</span>
              <strong>{inr(guess)}</strong>
            </div>
            <div className="marker-chip marker-chip--real">
              <span>Reality</span>
              <strong>{inr(REAL_VALUE)}</strong>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
