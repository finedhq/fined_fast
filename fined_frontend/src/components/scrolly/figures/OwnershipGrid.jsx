// Reusable figure — a company drawn as a grid of equal squares (one square =
// one share), driven entirely by its settings (see module2Figures.js). Each
// step picks a `mode`:
//   highlight  one holder's squares lit, the rest faint (+ optional magnified inset)
//   everyone   the rest fill in as "everyone else"
//   choose     the reader taps a holding size (saved as state.holding)
//   business   the holding spread over the whole business, split into zones
//   profit     the grid as a profit pool, shared out by squares
//   vote       the grid as a voting board
//   transfer   the holder's squares pass to a buyer; the total never changes
// Owned squares are solid, everyone else's are outlined, so the difference
// never depends on colour alone. A screen-reader line describes each state.
import { fmtPct, gridSummary, inrFull, packedCells, spreadCells } from "./blocksMath";

function Swatch({ kind, children }) {
  return (
    <span className="og-legend-item">
      <span className={`og-swatch og-swatch--${kind}`} aria-hidden="true"></span>
      {children}
    </span>
  );
}

export default function OwnershipGrid({ step, config, state, onState }) {
  const s = Math.min(step ?? 0, config.steps.length - 1);
  const view = config.steps[s];
  const { total, cols, owner, company } = config;
  const rows = Math.ceil(total / cols);
  const chosen = state.holding ?? config.defaultHolding ?? config.holding ?? 1;
  const holding = view.holding ?? config.holding ?? chosen;

  const spread = view.mode === "business";
  const mine = new Set(spread ? spreadCells(holding, total) : packedCells(holding));

  const cellClass = (i) => {
    if (mine.has(i)) return view.mode === "transfer" ? "og-cell og-cell--sold" : "og-cell og-cell--mine";
    switch (view.mode) {
      case "highlight":
        return "og-cell og-cell--faint";
      case "profit":
        return "og-cell og-cell--profit";
      case "vote":
        return i < holding + view.votesFor ? "og-cell og-cell--for" : "og-cell og-cell--against";
      default:
        return "og-cell og-cell--other";
    }
  };

  const zones = spread ? view.zones || [] : [];
  const zoneRows = Math.ceil(rows / 2);
  const zoneBoxes = zones.slice(0, 4).map((label, z) => {
    const x = (z % 2) * (cols / 2);
    const y = Math.floor(z / 2) * zoneRows;
    return { label, x, y, w: cols / 2, h: z < 2 ? zoneRows : rows - zoneRows };
  });

  // Steps where the reader picks (or carries on with) their own holding say "yours".
  const yours = view.mode === "choose" || view.mode === "business";
  const owned = view.mode === "transfer" ? 0 : holding;
  const summary =
    view.mode === "transfer"
      ? `${holding} squares have passed from ${owner} to ${view.buyer}. The company still has ${total.toLocaleString("en-IN")} squares.`
      : gridSummary(owned, total, yours ? "yours" : `${owner}'s`);

  return (
    <div className={`og-figure og-figure--${view.mode}`}>
      <div className="og-stage">
        <svg className="og-grid" viewBox={`0 0 ${cols} ${rows}`} role="img" aria-label={summary}>
          {Array.from({ length: total }, (_, i) => (
            <rect key={i} className={cellClass(i)} x={(i % cols) + 0.1} y={Math.floor(i / cols) + 0.1} width="0.8" height="0.8" rx="0.14" />
          ))}
          {zoneBoxes.map((z) => (
            <g key={z.label} className="og-zone">
              <rect x={z.x + 0.05} y={z.y + 0.05} width={z.w - 0.1} height={z.h - 0.1} rx="0.6" />
              <text x={z.x + z.w / 2} y={z.y + z.h / 2} dominantBaseline="middle" textAnchor="middle">
                {z.label}
              </text>
            </g>
          ))}
          {view.inset && <rect className="og-ring" x="-0.15" y="-0.15" width="1.3" height="1.3" rx="0.3" />}
        </svg>
        {view.inset && (
          <div className="og-inset" aria-hidden="true">
            <span className="og-inset-square"></span>
            <span className="og-inset-text">
              <strong>1 square = 1 share</strong>
              <span>out of {total.toLocaleString("en-IN")}</span>
            </span>
          </div>
        )}
      </div>

      <div className="og-panel">
        <div className="og-legend">
          {view.mode === "transfer" ? (
            <>
              <Swatch kind="sold">Sold to {view.buyer} · {holding}</Swatch>
              <Swatch kind="other">Everyone else · {(total - holding).toLocaleString("en-IN")}</Swatch>
            </>
          ) : view.mode === "vote" ? (
            <>
              <Swatch kind="mine">{owner} · {holding}</Swatch>
              <Swatch kind="for">For · {view.votesFor}</Swatch>
              <Swatch kind="against">Against · {view.votesAgainst}</Swatch>
            </>
          ) : view.mode === "profit" ? (
            <>
              <Swatch kind="mine">{owner}'s squares · {holding}</Swatch>
              <Swatch kind="profit">Everyone else's claim</Swatch>
            </>
          ) : (
            <>
              <Swatch kind="mine">
                {yours ? "Yours" : owner} · {holding.toLocaleString("en-IN")}
              </Swatch>
              {view.mode !== "highlight" && <Swatch kind="other">Everyone else · {(total - holding).toLocaleString("en-IN")}</Swatch>}
            </>
          )}
        </div>

        {view.mode === "choose" && (
          <>
            <div className="og-hold" role="group" aria-label="How many shares">
              {config.holdingOptions.map((n) => (
                <button key={n} type="button" className={`og-hold-btn${n === chosen ? " active" : ""}`} aria-pressed={n === chosen} onClick={() => onState({ holding: n })}>
                  {n} {n === 1 ? "share" : "shares"}
                </button>
              ))}
            </div>
            <div className="og-live" aria-live="polite">
              You'd own <strong>{fmtPct(holding / total)}</strong> of {company}.
            </div>
          </>
        )}

        {view.mode === "profit" && (
          <div className="og-chips">
            <div className="marker-chip">
              <span>Profit this year</span>
              <strong>{inrFull(view.profit)}</strong>
            </div>
            <div className="marker-chip marker-chip--real">
              <span>{owner}'s {fmtPct(holding / total)} share</span>
              <strong>{inrFull((view.profit * holding) / total)}</strong>
            </div>
          </div>
        )}

        {view.caption && <p className="og-caption">{view.caption}</p>}
      </div>
    </div>
  );
}
