// "Your Slice" — a `model` card with model_kind "slice_calculator". The
// reader sets an amount, picks a (made-up) company and turns an "if the
// business does…" dial; the tool shows how many whole shares that buys, the
// leftover cash, what fraction of the company it is, and what the slice is
// worth after the business moves. Same layout and controls as the Leak Lab
// (sliders + option buttons in, numbers + one verdict line out). Finished
// (and paid) once `min_controls_to_complete` different controls have moved.
import { useId } from "react";
import SafeText from "../SafeText";
import { fmtChange, fmtGain, fmtPct, inrFull } from "../figures/blocksMath";
import { controlSetter, sliceAside, sliceResult, sliceValues } from "./toolRules";
import { ToolHead } from "./toolKit";

export default function SliceCalculator({ card, state, onState }) {
  const id = useId();
  const d = card.card_data || {};
  const config = d.config || {};
  const c = config.controls || {};
  const companies = c.company?.options || [];
  const v = sliceValues(config, state);
  const r = sliceResult(config, v);
  const set = controlSetter(onState);
  if (!r) return null;
  const aside = sliceAside(config, v, r);

  return (
    <div className="tool-card slice-calc">
      <ToolHead data={d} />

      <div className="leak-lab-grid">
        <div className="leak-lab-controls">
          <div className="control-group">
            <label htmlFor={`${id}-amount`}>
              {c.amount?.label || "Your money"} <span className="control-live">{inrFull(v.amount)}</span>
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
            <div className="control-label">{c.company?.label || "Company"}</div>
            <div className="where-options sc-companies" role="group" aria-label={c.company?.label || "Company"}>
              {companies.map((o) => {
                const active = o.id === v.company;
                return (
                  <button key={o.id} type="button" className={`where-btn${active ? " active" : ""}`} aria-pressed={active} onClick={() => set("company", o.id)}>
                    <span className="where-name">{o.label}</span>
                    <span className="where-rate">{inrFull(o.price)} a share</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="control-group">
            <label htmlFor={`${id}-change`}>
              {c.business_change?.label || "If the business does…"} <span className="control-live">{fmtChange(v.change)}</span>
            </label>
            <input
              type="range"
              id={`${id}-change`}
              min={c.business_change?.min}
              max={c.business_change?.max}
              step={c.business_change?.step}
              value={v.change}
              aria-valuetext={`${fmtChange(v.change)} — a what-if, not a prediction`}
              onChange={(e) => set("change", Number(e.target.value))}
            />
            <div className="sc-dial-ends" aria-hidden="true">
              <span>Worse</span>
              <span>Better</span>
            </div>
            {config.neutrality_note && (
              <div className="control-note">
                <SafeText text={config.neutrality_note} />
              </div>
            )}
          </div>
        </div>

        <div className="leak-lab-output" aria-live="polite">
          <div className="leak-output-numbers">
            <div className="leak-stat">
              <span>Whole shares your money buys</span>
              <strong>{r.shares.toLocaleString("en-IN")}</strong>
            </div>
            <div className="leak-stat">
              <span>Left over as cash</span>
              <strong>{inrFull(r.leftover)}</strong>
            </div>
          </div>
          <div className="sc-ownership">
            <span>Your share of {r.company.label}</span>
            <strong>{fmtPct(r.ownership)}</strong>
            <em>
              {r.shares.toLocaleString("en-IN")} of {r.company.total_shares.toLocaleString("en-IN")} shares
            </em>
          </div>
          <div className="leak-output-numbers">
            <div className="leak-stat">
              <span>Your slice today</span>
              <strong>{inrFull(r.valueNow)}</strong>
            </div>
            <div className="leak-stat leak-stat--real">
              <span>If the business does {fmtChange(v.change)}</span>
              <strong>
                {inrFull(r.valueAfter)} <small className={`sc-gain sc-gain--${r.verdict.cls}`}>{fmtGain(r.gain)}</small>
              </strong>
            </div>
          </div>
          <div className={`leak-verdict leak-verdict--${r.verdict.cls}`}>{r.verdict.label}</div>
          <div className="leak-aside" style={{ display: aside ? "block" : "none" }}>
            {aside}
          </div>
          {config.footnote && <div className="control-note sc-footnote">{config.footnote}</div>}
        </div>
      </div>
    </div>
  );
}
