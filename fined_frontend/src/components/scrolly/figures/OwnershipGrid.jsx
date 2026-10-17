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
// A config with `groups` (Module 5 on) draws owner groups instead — see
// OwnerGroupsGrid below. A config with `actions` (Module 8 on) draws what a
// company can do to its shares — see ActionsGrid below.
// Owned squares are solid, everyone else's are outlined, so the difference
// never depends on colour alone. A screen-reader line describes each state.
import { useState } from "react";
import { bonusOutcome, fmtPct, gridSummary, inrFull, inrPrice, ownerCells, ownerGridMax, packedCells, splitOutcome, spreadCells } from "./blocksMath";
import SliderControl from "./SliderControl";

function Swatch({ kind, children }) {
  return (
    <span className="og-legend-item">
      <span className={`og-swatch og-swatch--${kind}`} aria-hidden="true"></span>
      {children}
    </span>
  );
}

// Owner-groups mode (Module 5 on): the squares coloured by who owns them, and
// `ways` of selling some to the public. Each step's `way` is null (before),
// a way's id, "choose" (the reader flips between the ways, saved as
// state.way) or "chosen" (the reader's way, no buttons). A money line says who is paid for the squares sold; `listing`
// dims the grid and shows a ticker with no price on it. The last group is the
// buyer (the public): its squares are outlined, the owners' solid.
function OwnerGroupsGrid({ step, config, state, onState }) {
  const view = config.steps[Math.min(Math.max(step ?? 0, 0), config.steps.length - 1)];
  const chosen = config.ways[state.way] ? state.way : config.defaultWay;
  const wayId = view.way === "choose" || view.way === "chosen" ? chosen : view.way;
  const way = wayId ? config.ways[wayId] : null;
  const { cells, counts, total } = ownerCells(config, wayId);
  const { cols } = config;
  const rows = Math.ceil(ownerGridMax(config) / cols);
  const groupIndex = Object.fromEntries(config.groups.map((g, i) => [g.id, i]));
  const base = config.groups.reduce((n, g) => n + g.units, 0);

  const legend = config.groups.map((g) => `${g.label} ${counts[g.id].toLocaleString("en-IN")}`).join(", ");
  const money = way ? way.money.map((m) => `${m.amount} to ${m.to}`).join(", ") : "";
  const summary = `${config.company} as ${total.toLocaleString("en-IN")} squares: ${legend}.${money ? ` Money from the public: ${money}.` : ""}`;

  return (
    <div className={`og-figure og-figure--groups${view.listing ? " is-listing" : ""}`}>
      <div className="og-stage">
        <svg className="og-grid" viewBox={`0 0 ${cols} ${rows}`} role="img" aria-label={summary}>
          {cells.map((id, i) => (
            <rect
              key={i}
              className={`og-cell og-cell--g${groupIndex[id]}${i >= base ? " og-cell--new" : ""}`}
              x={(i % cols) + 0.1}
              y={Math.floor(i / cols) + 0.1}
              width="0.8"
              height="0.8"
              rx="0.14"
            />
          ))}
        </svg>
        {view.listing && (
          <div className="og-ticker" aria-hidden="true">
            <span className="og-ticker-name">{view.ticker}</span>
            <span className="og-ticker-price">₹ —</span>
          </div>
        )}
      </div>

      <div className="og-panel">
        <div className="og-legend">
          {config.groups.map((g, i) => (
            <Swatch key={g.id} kind={`g${i}`}>
              {g.label} · {counts[g.id].toLocaleString("en-IN")}
            </Swatch>
          ))}
        </div>

        {view.way === "choose" && (
          <div className="og-hold og-hold--two" role="group" aria-label="How the shares are sold">
            {Object.entries(config.ways).map(([id, w]) => (
              <button key={id} type="button" className={`og-hold-btn${id === chosen ? " active" : ""}`} aria-pressed={id === chosen} onClick={() => onState({ way: id })}>
                {w.label}
              </button>
            ))}
          </div>
        )}

        {way && !view.listing && (
          <div className="og-chips" aria-live="polite">
            {way.money.map((m) => (
              <div key={m.to} className={`marker-chip${m.zero ? " marker-chip--zero" : " marker-chip--real"}`}>
                <span>To {m.to}</span>
                <strong>{m.amount}</strong>
              </div>
            ))}
          </div>
        )}

        {view.caption && <p className="og-caption">{view.caption}</p>}
      </div>
    </div>
  );
}

// Actions mode (Module 8 on): the company's squares with the holder's packed
// first, and one company action per step:
//   dividend {perShare}  every square earns ₹perShare; the holder's add up
//   kept                 the pool dims: "kept for growth"
//   split    {control}   the reader splits each share into n pieces (slider,
//                        not saved): more shares, lower price, same value
//   bonus    {ratio, label} [get, per] free shares: the grid grows (rows are kept
//                        for the largest, so nothing reflows), same pie
function ActionsGrid({ step, config }) {
  const view = config.steps[Math.min(Math.max(step ?? 0, 0), config.steps.length - 1)];
  const { company, owner, cols, total, holding, price } = config;
  const [pieces, setPieces] = useState(view.control?.start ?? 1);
  const n = view.action === "split" ? pieces : 1;
  const bonus = view.action === "bonus" ? bonusOutcome(total, holding, view.ratio) : null;
  const shown = bonus ? bonus.total : total;
  const maxTotal = Math.max(total, ...config.steps.filter((v) => v.ratio).map((v) => bonusOutcome(total, holding, v.ratio).total));
  const rows = Math.ceil(maxTotal / cols);
  const extraMine = bonus ? bonus.holding - holding : 0;
  const isMine = (i) => i < holding || (i >= total && i < total + extraMine);
  const rest = view.action === "dividend" ? "og-cell--profit" : view.action === "kept" ? "og-cell--faint" : "og-cell--other";
  const split = splitOutcome(holding, price, n);
  const patternId = `og-split-${n}`;

  let summary = `${company} as ${shown.toLocaleString("en-IN")} squares; ${owner}'s ${(bonus ? bonus.holding : holding).toLocaleString("en-IN")} lit.`;
  if (view.action === "dividend") summary += ` ${inrFull(view.perShare)} a share: ${owner} gets ${inrFull(view.perShare * holding)}.`;
  if (view.action === "kept") summary += " The profit is kept for growth.";
  if (view.action === "split") summary += ` Each share split into ${n}: ${split.shares} shares at ${inrPrice(split.price)}, worth ${inrFull(split.value)}.`;

  return (
    <div className={`og-figure og-figure--actions og-figure--${view.action}`}>
      <div className="og-stage">
        <svg className="og-grid" viewBox={`0 0 ${cols} ${rows}`} role="img" aria-label={summary}>
          {n > 1 && (
            <defs>
              <pattern id={patternId} width="1" height="1" patternUnits="userSpaceOnUse">
                {Array.from({ length: n - 1 }, (_, k) => (
                  <line key={k} className="og-split-line" x1={0.1 + (0.8 * (k + 1)) / n} x2={0.1 + (0.8 * (k + 1)) / n} y1="0.1" y2="0.9" />
                ))}
              </pattern>
            </defs>
          )}
          {Array.from({ length: shown }, (_, i) => (
            <rect
              key={i}
              className={`og-cell ${isMine(i) ? "og-cell--mine" : rest}${i >= total ? " og-cell--new" : ""}`}
              x={(i % cols) + 0.1}
              y={Math.floor(i / cols) + 0.1}
              width="0.8"
              height="0.8"
              rx="0.14"
            />
          ))}
          {n > 1 && <rect className="og-split" x="0" y="0" width={cols} height={Math.ceil(total / cols)} fill={`url(#${patternId})`} />}
        </svg>
      </div>

      <div className="og-panel" aria-live="polite">
        {view.action === "dividend" && (
          <div className="og-chips">
            <div className="marker-chip marker-chip--real">
              <span>Dividend</span>
              <strong>{inrFull(view.perShare)} a share</strong>
            </div>
            <div className="marker-chip marker-chip--real">
              <span>{owner}'s {holding} shares</span>
              <strong>{inrFull(view.perShare * holding)}</strong>
            </div>
          </div>
        )}
        {view.action === "kept" && (
          <div className="og-chips">
            <div className="marker-chip marker-chip--zero">
              <span>This year's profit</span>
              <strong>Kept for growth</strong>
            </div>
          </div>
        )}
        {view.action === "split" && (
          <>
            <SliderControl
              label={view.control.label}
              valueText={`${n} ${n === 1 ? "piece" : "pieces"}`}
              value={n}
              min={view.control.min}
              max={view.control.max}
              step={view.control.step}
              onChange={setPieces}
              lessLabel="One piece fewer"
              moreLabel="One piece more"
            />
            <div className="og-chips og-chips--three">
              <div className="marker-chip marker-chip--real">
                <span>{owner}'s shares</span>
                <strong>{split.shares.toLocaleString("en-IN")}</strong>
              </div>
              <div className="marker-chip marker-chip--real">
                <span>Price per share</span>
                <strong>{inrPrice(split.price)}</strong>
              </div>
              <div className="marker-chip marker-chip--real">
                <span>Value of his holding</span>
                <strong>{inrFull(split.value)}</strong>
              </div>
            </div>
          </>
        )}
        {bonus && (
          <div className="og-chips">
            <div className="marker-chip marker-chip--real">
              <span>Shares in total</span>
              <strong>
                {total.toLocaleString("en-IN")} → {bonus.total.toLocaleString("en-IN")}
              </strong>
            </div>
            <div className="marker-chip marker-chip--real">
              <span>{owner}'s shares</span>
              <strong>
                {holding} → {bonus.holding}
              </strong>
            </div>
            {view.label && (
              <div className="marker-chip marker-chip--zero og-chip-wide">
                <span>The business</span>
                <strong>{view.label}</strong>
              </div>
            )}
          </div>
        )}
        {view.caption && <p className="og-caption">{view.caption}</p>}
      </div>
    </div>
  );
}

export default function OwnershipGrid(props) {
  if (props.config.groups) return <OwnerGroupsGrid {...props} />;
  if (props.config.actions) return <ActionsGrid {...props} />;
  return <HoldingGrid {...props} />;
}

function HoldingGrid({ step, config, state, onState }) {
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
