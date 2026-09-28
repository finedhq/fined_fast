// The Leak Lab — a port of the prototype's tools/LeakLab.js, drawn from a
// `model` card (model_kind "leak_lab"). Two visible controls (Years, Where the
// money sits); Amount and Inflation behind "More options". Amount starts from
// the hero's savings chip unless the reader moves it. Finished (and paid) once
// `min_controls_to_complete` different controls have been moved.
//
// Only addition to the prototype: a "Rates as of <month>" line under the
// choices, from the card's `as_of` (owner-approved, 2026-09-26).
import { useId } from "react";
import SafeText from "../SafeText";
import { asOfLabel, fmtRupee, nominalValue, realValue, verdictFor } from "../finance";
import { controlSetter, leakLabAsideShown, leakLabValues } from "./toolRules";
import { ToolHead } from "./toolKit";

// The prototype's BASKET_SPEC (util/icons.js): ten everyday items, labels only.
const BASKET = ["Chai", "Auto ride", "Mess thali", "Data pack", "Movie ticket", "Chai", "Auto ride", "Mess thali", "Data pack", "Movie ticket"];

export default function LeakLab({ card, state, onState, heroAmount }) {
  const id = useId();
  const d = card.card_data || {};
  const config = d.config || {};
  const c = config.controls || {};
  const whereOptions = c.where?.options || [];
  const v = leakLabValues(config, state, heroAmount);

  const set = controlSetter(onState);
  const toggleMore = () => onState((prev) => ({ ...prev, moreOpen: !prev.moreOpen }));

  const rate = whereOptions.find((o) => o.id === v.where)?.rate ?? 0;
  const nominal = nominalValue(v.amount, v.years, rate, 0);
  const real = realValue(v.amount, v.years, rate, 0, v.inflation);
  const verdict = verdictFor(real, v.amount);
  const activeCount = Math.max(0, Math.min(100, (real / v.amount) * 100)) / 10;
  const asOf = asOfLabel(d.as_of);
  const moreId = `${id}-more`;

  return (
    <div className="tool-card leak-lab">
      <ToolHead data={d} />

      <div className="leak-lab-grid">
        <div className="leak-lab-controls">
          <div className="control-group">
            <label htmlFor={`${id}-years`}>
              Years <span className="control-live">{v.years}</span>
            </label>
            <input
              type="range"
              id={`${id}-years`}
              min={c.years?.min}
              max={c.years?.max}
              step={c.years?.step}
              value={v.years}
              onChange={(e) => set("years", Number(e.target.value))}
            />
          </div>

          <div className="control-group">
            <div className="control-label">Where the money sits</div>
            <div className="where-options" role="group" aria-label="Where the money sits">
              {whereOptions.map((o) => {
                const active = o.id === v.where;
                return (
                  <button
                    key={o.id}
                    type="button"
                    className={`where-btn${active ? " active" : ""}`}
                    aria-pressed={active}
                    onClick={() => set("where", o.id)}
                  >
                    <span className="where-name">
                      <SafeText text={o.label} inButton />
                    </span>
                    <span className="where-rate">{o.rate}% a year</span>
                  </button>
                );
              })}
            </div>
            <div className="control-note">
              <SafeText text={config.neutrality_note} />
            </div>
            {asOf && <div className="control-note nc-rates-as-of">Rates as of {asOf}</div>}
          </div>

          <button type="button" className="more-assumptions-toggle" aria-expanded={v.moreOpen} aria-controls={moreId} onClick={toggleMore}>
            {v.moreOpen ? "Fewer options" : "More options"}
          </button>
          <div className="more-assumptions" id={moreId} style={{ display: v.moreOpen ? "block" : "none" }}>
            <div className="control-group">
              <label htmlFor={`${id}-amount`}>
                Amount <span className="control-live">{fmtRupee(v.amount)}</span>
              </label>
              <input
                type="range"
                id={`${id}-amount`}
                min={c.amount?.min}
                max={c.amount?.max}
                step={c.amount?.step}
                value={v.amount}
                onChange={(e) => set("amount", Number(e.target.value))}
              />
            </div>
            <div className="control-group">
              <label htmlFor={`${id}-inflation`}>
                Inflation assumption <span className="control-live">{v.inflation}%</span>
              </label>
              <input
                type="range"
                id={`${id}-inflation`}
                min={c.inflation?.min}
                max={c.inflation?.max}
                step={c.inflation?.step}
                value={v.inflation}
                onChange={(e) => set("inflation", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <div className="leak-lab-output" aria-live="polite">
          <div className="leak-output-numbers">
            <div className="leak-stat">
              <span>Balance after these years</span>
              <strong>{fmtRupee(nominal)}</strong>
            </div>
            <div className="leak-stat leak-stat--real">
              <span>What it actually buys (today's ₹)</span>
              <strong>{fmtRupee(real)}</strong>
            </div>
          </div>
          <div className={`leak-verdict leak-verdict--${verdict.cls}`}>{verdict.label}</div>
          <div className="leak-basket-label">Today's basket, after the leak</div>
          <div className="leak-basket-grid">
            {BASKET.map((label, i) => {
              const threshold = i + 1;
              const faded = threshold > activeCount;
              const opacity = faded ? Math.max(0.15, 1 - Math.min(1, threshold - activeCount)) : 1;
              return (
                <div key={i} className={`basket-item-mini ${faded ? "basket-item-mini--faded" : ""}`} style={{ opacity: opacity.toFixed(2) }} title={label}>
                  <span className="basket-mini-label">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="leak-aside" style={{ display: leakLabAsideShown(config, v) ? "block" : "none" }}>
            {config.aside_text}
          </div>
        </div>
      </div>
    </div>
  );
}
