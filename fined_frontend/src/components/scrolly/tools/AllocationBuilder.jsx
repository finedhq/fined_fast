// "Try a Mix" — a `model` card with model_kind "allocation_builder" (Module
// 11). Same layout as the Leak Lab and Your Slice: two sliders in (how much
// of ₹1 lakh sits in shares, and the biggest fall the reader could sit
// through), and out: what one year of three kinds would leave (a year like
// 2008, a typical year, a year like 2009 — real index price returns; the
// steady part is made up) plus one line comparing the bad year with the
// chosen fall. Single year, no rebalancing; no mix is recommended. Finished
// (and paid) once `min_controls_to_complete` different controls have moved.
import { useId } from "react";
import SafeText from "../SafeText";
import { inrFull } from "../figures/blocksMath";
import { controlSetter, mixResult, mixValues } from "./toolRules";
import { ToolHead } from "./toolKit";

const pctChange = (n) => {
  const r = Math.round(n * 10) / 10;
  return r > 0 ? `+${r}%` : r < 0 ? `−${Math.abs(r)}%` : "0%";
};

export default function AllocationBuilder({ card, state = {}, onState }) {
  const id = useId();
  const d = card.card_data || {};
  const config = d.config || {};
  const c = config.controls || {};
  const v = mixValues(config, state);
  const r = mixResult(config, v);
  const set = controlSetter(onState);
  const footnote = (config.footnote || "").replace("{steady_return_pct}", String(config.model?.steady_return_pct ?? ""));

  return (
    <div className="tool-card mix-builder">
      <ToolHead data={d} />

      <div className="leak-lab-grid">
        <div className="leak-lab-controls">
          <div className="control-group">
            <label htmlFor={`${id}-shares`}>
              {c.shares?.label} <span className="control-live">{v.shares}%</span>
            </label>
            <input
              type="range"
              id={`${id}-shares`}
              min={c.shares?.min}
              max={c.shares?.max}
              step={c.shares?.step}
              value={v.shares}
              aria-valuetext={`${v.shares}% in shares, ${100 - v.shares}% steady`}
              onChange={(e) => set("shares", Number(e.target.value))}
            />
            <div className="sc-dial-ends" aria-hidden="true">
              <span>All steady</span>
              <span>All shares</span>
            </div>
          </div>

          <div className="control-group">
            <label htmlFor={`${id}-limit`}>
              {c.limit?.label} <span className="control-live">{v.limit}%</span>
            </label>
            <input
              type="range"
              id={`${id}-limit`}
              min={c.limit?.min}
              max={c.limit?.max}
              step={c.limit?.step}
              value={v.limit}
              onChange={(e) => set("limit", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="leak-lab-output" aria-live="polite">
          <div className="mix-years">
            {r.years.map((y) => (
              <div key={y.id} className={`leak-stat mix-year mix-year--${y.id}`}>
                <span>{y.label}</span>
                <strong>{inrFull(y.value)}</strong>
                <small className={`sc-gain sc-gain--${y.change > 0 ? "growing" : y.change < 0 ? "losing" : "holding"}`}>{pctChange(y.change)}</small>
              </div>
            ))}
          </div>
          <div className={`leak-verdict leak-verdict--${r.within ? "holding" : "losing"}`}>{r.verdict}</div>
          {footnote && (
            <div className="control-note sc-footnote">
              <SafeText text={footnote} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
