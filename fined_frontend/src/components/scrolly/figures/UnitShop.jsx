// WinterArc Day 11 Chapter 1 — "Run a fund" (the Hostel Fund, made up).
//   1.1 100 coins pour into a jar: 1,00,000 units, NAV tag ₹10.00;
//   1.2 the holdings rise 8%: NAV = ₹10,80,000 ÷ 1,00,000 = ₹10.80;
//   1.3 "Invest ₹5,000": 462.96 new units at ₹10.80, the NAV tag holds still;
//   1.4 the reader guesses on the card; then A's 1,000 units and B's 100 units
//       both grow 10% to ₹11,000, two identical pots.
// Saved as state.fund = {joined}.
import { CoinStack, DotGrid } from "./WaKit";
import { saver, stepAt } from "./waState";
import { inr, nav, unitsFor } from "./winterarcDays815Math";

const units = (v) => v.toLocaleString("en-IN", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
const rs2 = (v) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Jar({ assets, unitCount, navValue, extra = 0, formula }) {
  return (
    <div className="wk-jar">
      <DotGrid n={100 + extra} cols={10} tone={(k) => (k >= 100 ? "is-me" : "is-gold")} label={`${inr(assets)} in the jar`} />
      <div className="wk-jar-tags">
        <span>
          Assets <strong>{inr(assets)}</strong>
        </span>
        <span>
          Units <strong>{units(unitCount)}</strong>
        </span>
        <span className="wk-nav-tag">
          NAV <strong>{rs2(navValue)}</strong>
        </span>
      </div>
      {formula && <p className="wk-formula">{formula}</p>}
    </div>
  );
}

export default function UnitShop({ step, steps, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.fund || {};
  const save = saver(onState, "fund");
  const pool = c.friends * c.each;
  const u0 = pool / c.nav0;
  const grown = pool * (1 + c.rise / 100);
  const nav1 = nav(grown, u0);

  if (at === 0) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <Jar assets={pool} unitCount={u0} navValue={c.nav0} />
        <p className="wf-out">{c.texts.pool}</p>
        <p className="wf-foot">{c.texts.foot}</p>
      </div>
    );
  }

  if (at === 1) {
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <Jar assets={grown} unitCount={u0} navValue={nav1} formula={`${inr(grown)} ÷ ${units(u0)} units = ${rs2(nav1)}`} />
        <p className="wf-out">{c.texts.rise}</p>
      </div>
    );
  }

  if (at === 2) {
    const add = unitsFor(c.joiner.amount, nav1);
    const assets = grown + (s.joined ? c.joiner.amount : 0);
    const count = u0 + (s.joined ? add : 0);
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <Jar assets={assets} unitCount={count} navValue={nav(assets, count)} extra={s.joined ? 1 : 0} formula={s.joined ? `+${inr(c.joiner.amount)} ÷ ${rs2(nav1)} = ${units(add)} new units` : null} />
        <button type="button" className="wf-act" disabled={s.joined} onClick={() => save({ joined: true })}>
          {s.joined ? `${c.joiner.name} is in` : c.texts.invest}
        </button>
        <p className="wf-out" aria-live="polite">{s.joined ? c.texts.joined : `NAV today: ${rs2(nav1)}.`}</p>
      </div>
    );
  }

  const guessed = state.guesses?.[steps?.[3]?.step_id] !== undefined;
  const pots = c.compare.funds.map((f) => {
    const u = c.compare.amount / f.nav;
    const navEnd = f.nav * (1 + c.compare.rise / 100);
    return { ...f, u, navEnd, end: u * navEnd };
  });
  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <div className="wk-coin-row">
        {pots.map((p) => (
          <CoinStack
            key={p.id}
            value={guessed ? p.end : c.compare.amount}
            max={c.compare.amount * 1.2}
            label={guessed ? inr(p.end) : inr(c.compare.amount)}
            caption={`${p.label}: ${units(p.u)} units × ${rs2(guessed ? p.navEnd : p.nav)}`}
            tone={p.id === "a" ? "gold" : "purple"}
          />
        ))}
      </div>
      <p className="wf-out" aria-live="polite">{guessed ? c.texts.same : c.texts.guess_first}</p>
    </div>
  );
}
