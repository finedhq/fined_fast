// Chapter 2 figure — "two_ledgers_payoff_drag" (port of the prototype's
// TwoLedgersFigure.js). Kitchens that need ₹50 lakh, then the two deals as
// ledger cards, then a drag-to-stress-test payoff chart: the lender is flat
// at ₹6L, the part-owners get max(0, 20% of profit).
// Steps are by position: 0 meet Meera · 1 borrow · 2 sell a slice · 3 run her year.
import { LENDER_FIXED, PRESETS, PROFIT_MAX, PROFIT_MIN, PROFIT_STEP, fmtL, payoffGeometry, payoffVerdict } from "./figureMath";

const Lender = () => <span className="who-lender">lender</span>;
const Owners = () => <span className="who-owner">part-owners</span>;

function Verdict({ profit }) {
  const v = payoffVerdict(profit);
  let body;
  if (v.kind === "loss") {
    body = (
      <>
        <strong>A loss.</strong> The <Lender /> still gets its {v.lender}. The <Owners /> get {v.owner}.
      </>
    );
  } else if (v.kind === "small") {
    body = (
      <>
        <strong>A small profit.</strong> The <Owners /> get {v.owner}, still less than the <Lender />'s fixed {v.lender}.
      </>
    );
  } else if (v.kind === "cross") {
    body = (
      <>
        <strong>Where the lines cross.</strong> Both get {fmtL(LENDER_FIXED)}. Any more profit, and the <Owners /> pull ahead.
      </>
    );
  } else {
    body = (
      <>
        <strong>A big year.</strong> The <Owners /> get {v.owner}, more than the <Lender />'s fixed {v.lender}.
      </>
    );
  }
  return (
    <div className={`payoff-verdict payoff-verdict--${v.tone}`} aria-live="polite">
      {body}
    </div>
  );
}

function PayoffChart({ profit }) {
  const g = payoffGeometry(profit);
  return (
    <svg viewBox={`0 0 ${g.w} ${g.h}`} className="payoff-svg" role="img" aria-label="What the lender and the part-owners receive as Meera's profit changes">
      <rect x={g.pad} y={g.pad} width={g.zeroX - g.pad} height={g.h - g.pad * 2} className="payoff-loss-zone" />
      <text x={g.pad + 6} y={g.pad + 12} className="payoff-zone-label">
        Loss
      </text>
      <text x={g.zeroX + 6} y={g.pad + 12} className="payoff-zone-label">
        Profit
      </text>
      <text x={g.w - g.pad} y={g.h - 8} textAnchor="end" className="payoff-axis-label">
        Meera's profit for the year →
      </text>
      <line x1={g.pad} y1={g.y0} x2={g.w - g.pad} y2={g.y0} className="payoff-axis" />
      <line x1={g.zeroX} y1={g.pad} x2={g.zeroX} y2={g.h - g.pad} className="payoff-axis payoff-axis--zero" />
      <path d={g.ownerPath} className="payoff-line payoff-line--owner" fill="none" />
      <path d={g.lenderPath} className="payoff-line payoff-line--lender" fill="none" />
      <line x1={g.cursorX} y1={g.pad} x2={g.cursorX} y2={g.h - g.pad} className="payoff-cursor" />
      <circle cx={g.cursorX} cy={g.lenderY} r="5" className="payoff-dot payoff-dot--lender" />
      <circle cx={g.cursorX} cy={g.ownerY} r="5" className="payoff-dot payoff-dot--owner" />
      <text x={g.w - g.pad} y={g.lenderY - 6} textAnchor="end" className="payoff-label payoff-label--lender">
        Lender
      </text>
      <text x={g.w - g.pad} y={g.ownerLabelY - 6} textAnchor="end" className="payoff-label payoff-label--owner">
        Part-owners
      </text>
    </svg>
  );
}

export default function TwoLedgers({ step, state, onState }) {
  const s = step ?? 0;
  const profit = state.profit ?? PRESETS.okay;
  const setProfit = (v) => onState({ profit: v });

  return (
    <div className="ledgers-figure">
      <div className="kitchens-row" style={{ display: s === 0 ? "flex" : "none" }}>
        <div className="kitchens-group">
          <div className="kitchens-label">
            <strong>4</strong> kitchens running
          </div>
          <div className="kitchens-grid kitchens-grid--lit">
            {Array.from({ length: 4 }, (_, i) => (
              <span key={i} className="kitchen-unit kitchen-unit--lit" title={`Kitchen ${i + 1} · running`}>
                {i + 1}
              </span>
            ))}
          </div>
        </div>
        <div className="kitchens-group">
          <div className="kitchens-label">
            <strong>10</strong> more needed to keep up
          </div>
          <div className="kitchens-grid kitchens-grid--planned">
            {Array.from({ length: 10 }, (_, i) => (
              <span key={i} className="kitchen-unit kitchen-unit--planned" title={`Kitchen ${i + 5} · needs funding`}>
                {i + 5}
              </span>
            ))}
          </div>
        </div>
        <div className="gap-bar">
          <span className="gap-bar-label">Cost of 10 new kitchens</span>
          <strong>₹50,00,000</strong>
          <span className="gap-bar-note">Cash in hand: not enough</span>
        </div>
      </div>

      <div className="ledgers-row" style={{ display: s === 1 || s === 2 ? "flex" : "none" }}>
        <div className={`ledger-card ledger-card--lender${s >= 1 ? " open" : ""}`}>
          <div className="ledger-kicker">Option A · Borrow</div>
          <div className="ledger-title">Lender</div>
          <div className="ledger-value">₹6,00,000 / year, fixed</div>
          <div className="ledger-foot">Paid in good years and bad</div>
        </div>
        <div className={`ledger-card ledger-card--owner${s >= 2 ? " open" : ""}`}>
          <div className="ledger-kicker">Option B · Sell a slice</div>
          <div className="ledger-title">Part-owner</div>
          <div className="ledger-value">20% of profit</div>
          <div className="ledger-foot">Rises and falls with the business</div>
        </div>
      </div>

      <div className="payoff-panel" style={{ display: s === 3 ? "flex" : "none" }}>
        <p className="payoff-howto">
          Drag the slider or tap a year. Watch the two dots and ask:{" "}
          <strong>
            who gets more this year, the <span className="who-lender">lender</span> or the <span className="who-owner">part-owners</span>?
          </strong>
        </p>
        <PayoffChart profit={profit} />
        <div className="payoff-controls">
          <div className="payoff-profit">
            Meera's profit this year <strong>{fmtL(profit)}</strong>
          </div>
          <input
            type="range"
            min={PROFIT_MIN}
            max={PROFIT_MAX}
            step={PROFIT_STEP}
            value={profit}
            aria-label="Meera's profit for the year"
            onChange={(e) => setProfit(Number(e.target.value))}
          />
          <div className="payoff-presets">
            <button type="button" className="preset-btn" onClick={() => setProfit(PRESETS.bad)}>
              Bad year
            </button>
            <button type="button" className="preset-btn" onClick={() => setProfit(PRESETS.okay)}>
              Okay year
            </button>
            <button type="button" className="preset-btn" onClick={() => setProfit(PRESETS.good)}>
              Good year
            </button>
          </div>
        </div>
        <Verdict profit={profit} />
      </div>
    </div>
  );
}
