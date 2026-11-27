// WinterArc Day 10 Chapter 1 — "Slice the company".
//   1.1 a slice stepper (1 lakh · 10 lakh · 1 crore shares): the company disc
//       splits finer, price per share ₹1,000 · ₹100 · ₹10;
//   1.2 2 lakh new slices sold at ₹100: ₹2 crore flows to the company's bank,
//       your slice shrinks to 83.3% of a ₹12 crore company (still ₹10 crore);
//   1.3 the reader guesses on the card; then share counts appear and B's
//       market cap towers over A's;
//   1.4 the disc becomes a ticker tile on two exchange boards.
// Saved as state.slicer = {shares}.
import { Seg } from "./WaKit";
import { saver, stepAt } from "./waState";
import { inr, inrBig, pricePerShare, raise } from "./winterarcDays815Math";

const count = (n) => (n >= 1e7 ? `${n / 1e7} crore` : `${n / 1e5} lakh`);

function Disc({ wedges, stake = 1, label }) {
  // wedges: number of visible cuts (large counts drawn as a fine texture)
  const r = 70;
  const lines = Array.from({ length: wedges }, (_, k) => {
    const a = (2 * Math.PI * k) / wedges - Math.PI / 2;
    return <line key={k} x1="80" y1="80" x2={80 + r * Math.cos(a)} y2={80 + r * Math.sin(a)} className="wk-disc-cut" />;
  });
  const a1 = 2 * Math.PI * stake - Math.PI / 2;
  const big = stake > 0.5 ? 1 : 0;
  return (
    <svg viewBox="0 0 160 160" className="wk-disc" role="img" aria-label={label}>
      <circle cx="80" cy="80" r={r} className="wk-disc-new" />
      {stake < 1 ? <path d={`M80 80 L80 ${80 - r} A ${r} ${r} 0 ${big} 1 ${80 + r * Math.cos(a1)} ${80 + r * Math.sin(a1)} Z`} className="wk-disc-mine" /> : <circle cx="80" cy="80" r={r} className="wk-disc-mine" />}
      {lines}
      <circle cx="80" cy="80" r="22" className="wk-disc-hub" />
      <text x="80" y="84" textAnchor="middle" className="wk-disc-label">
        ☕
      </text>
    </svg>
  );
}

export default function ShareSlicer({ step, steps, state = {}, onState, config: c }) {
  const at = stepAt(step, 3);
  const s = state.slicer || {};
  const save = saver(onState, "slicer");
  const shares = c.options.includes(s.shares) ? s.shares : c.options[0];

  if (at === 0) {
    const wedges = shares === 1e5 ? 12 : shares === 1e6 ? 48 : 120;
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[0]}</p>
        <Disc wedges={wedges} label={`Chai Point split into ${count(shares)} shares`} />
        <Seg label="Shares" value={shares} onPick={(v) => save({ shares: v })} options={c.options.map((v) => ({ id: v, label: count(v) }))} />
        <p className="wf-out" aria-live="polite">
          <strong>{inr(pricePerShare(c.value, shares))}</strong> a share · {c.texts.slice}
        </p>
      </div>
    );
  }

  if (at === 1) {
    const r = raise(c.raise);
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[1]}</p>
        <div className="wk-raise">
          <Disc wedges={48} stake={r.stake} label={`Your stake ${(r.stake * 100).toFixed(1)}%`} />
          <div className="wk-raise-bank">
            <span aria-hidden="true">🏦</span>
            <strong>+{inrBig(r.raised)}</strong>
            <small>into the company's bank, not to you</small>
          </div>
        </div>
        <div className="wf-meters">
          <span>Your slice: <strong>{(r.stake * 100).toFixed(1)}%</strong></span>
          <span>Company: <strong>{inrBig(r.value)}</strong></span>
          <span>Your stake: <strong>{inrBig(r.yours)}</strong></span>
        </div>
        <p className="wf-out">{c.texts.raise}</p>
      </div>
    );
  }

  if (at === 2) {
    const guessed = state.guesses?.[steps?.[2]?.step_id] !== undefined;
    const caps = c.compare.map((k) => ({ ...k, cap: k.price * k.shares }));
    const max = Math.max(...caps.map((k) => k.cap));
    return (
      <div className="wf-figure">
        <p className="wf-note">{c.notes[2]}</p>
        <div className="wk-caps">
          {caps.map((k) => (
            <div key={k.id} className="wk-cap">
              <div className="wk-cap-bar" style={{ height: guessed ? `${(k.cap / max) * 100}%` : "30%" }}>
                {guessed && <strong>{inrBig(k.cap)}</strong>}
              </div>
              <span>{k.label}</span>
              <small>
                {inr(k.price)} a share{guessed ? ` × ${count(k.shares)}` : ""}
              </small>
            </div>
          ))}
        </div>
        <p className="wf-out" aria-live="polite">{guessed ? c.texts.compare : c.texts.guess_first}</p>
      </div>
    );
  }

  return (
    <div className="wf-figure">
      <p className="wf-note">{c.notes[3]}</p>
      <div className="wk-boards">
        {c.exchanges.map((x) => (
          <div key={x} className="wk-board">
            <small>{x}</small>
            <div className="wk-ticker-tile">
              <strong>{c.ticker}</strong>
              <span>Chai Point Co.</span>
            </div>
          </div>
        ))}
      </div>
      <p className="wf-out">{c.texts.ticker}</p>
      <p className="wf-foot">Fictional company and ticker.</p>
    </div>
  );
}
