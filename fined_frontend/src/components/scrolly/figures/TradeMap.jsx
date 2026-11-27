// Reusable figure (Module 4 on) — "trade_map": boxes joined by lines, built
// up step by step, with small tokens (₹, shares, an order) that move between
// boxes. Everything comes from `config` (see module4Figures.js):
//   nodes   {id: {label, sub?, x, y}}  positions in % of the figure
//   tokens  {id: {label, kind}}
//   links   [[from, to]]  faint lines, drawn when both boxes are shown
//   steps   one entry per step (so the step count is the config's), each
//           {show, lit, arrows?, back?, tokens?: {id: {at, from?}}, badges?,
//            notes?, linkLabels?, pulse?, tag?, caption}; `null` = the
//           chapter shows another figure. badges: {box: text or [texts]} pills
//           on a box's top edge; notes: {box: text} a line under the box;
//           linkLabels: [[from, to, text]] a pill on that line's middle;
//           thick / thin: [[from, to]] arrows drawn heavier or lighter, for
//           an effect that lands harder on one box than another (Module 9)
// Config `tall: true` (Module 10) gives a four-row layout more height.
// `pulse` may be a list of boxes (Module 11: the whole map pulses).
// Config `wrapNotes: true` (WinterArc Day 2 on) lets a box's note wrap onto
// a second line and lines it up with the box's outer edge (left boxes from
// their left edge, right boxes from their right), so a long note on a phone
// stays on screen. Older maps keep one centred line.
// Config `record: {tool, node, empty}` (WinterArc Day 4): on a step with
// `record: true`, box `node` shows the reader's own on-time / late record,
// saved by that tool card (its slug) in the page's tool state; `empty` shows
// instead if they haven't played it.
// The reader doesn't touch the map. Its one reaction: once the step's
// tap-to-guess is answered, the `pulse` box pulses. Nothing is saved.
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { edgeLine, mapStep, mapSummary } from "./blocksMath";

// Box size in % of the figure's width, and px of its height (match the CSS).
const BOX_W = 0.2;
const BACK_OFFSET = 9; // px: the faint "selling" arrow runs beside the forward one
const BOX_H = 44;

// A line moved sideways by `d` px (to its right, seen from its start).
function shift(l, d) {
  if (!d) return l;
  const len = Math.hypot(l.x2 - l.x1, l.y2 - l.y1) || 1;
  const nx = (-(l.y2 - l.y1) / len) * d;
  const ny = ((l.x2 - l.x1) / len) * d;
  return { x1: l.x1 + nx, y1: l.y1 + ny, x2: l.x2 + nx, y2: l.y2 + ny };
}

function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

// A token starts at its `from` box and slides to `at` once it is on screen.
function Token({ token, spot, from, index }) {
  const [here, setHere] = useState(from || spot);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setHere(spot));
    return () => cancelAnimationFrame(raf);
  }, [spot]);
  return (
    <span className={`tm-token tm-token--${token.kind}`} style={{ left: `${here.x}%`, top: `${here.y}%`, "--tm-nudge": index }}>
      {token.label}
    </span>
  );
}

// The reader's own repayment record (✓ on time, ✗ late), under a box.
function RecordStrip({ record, empty }) {
  if (!record?.length) return <span className="tm-note tm-record-empty">{empty}</span>;
  const lates = record.filter((r) => r === "late").length;
  return (
    <span className="tm-record" aria-hidden="true">
      {record.map((r, k) => (
        <i key={k} className={`tm-record-box is-${r}`}>
          {r === "late" ? "✗" : "✓"}
        </i>
      ))}
      <em>{lates ? `${lates} late` : "all on time"}</em>
    </span>
  );
}

export default function TradeMap({ step, steps, state, config, tools }) {
  const s = mapStep(config, step);
  const at = Math.min(Math.max(step ?? 0, 0), config.steps.length - 1);
  const stageRef = useRef(null);
  const { w, h } = useSize(stageRef);
  const head = `tm-head-${useId().replace(/:/g, "")}`;

  const shown = new Set(s.show);
  const lit = new Set(s.lit);
  const guessId = steps?.[at]?.step_id;
  const pulsing = s.pulse && guessId && state.guesses?.[guessId] !== undefined ? s.pulse : null;

  const px = (id) => ({ x: (config.nodes[id].x / 100) * w, y: (config.nodes[id].y / 100) * h });
  const line = ([a, b]) => (w && h ? edgeLine(px(a), px(b), (BOX_W * w) / 2, BOX_H / 2) : null);
  const both = ([a, b]) => shown.has(a) && shown.has(b);
  const draw = (pairs, cls, marker, offset = 0) =>
    (pairs || []).filter(both).map((pair) => {
      const l = line(pair);
      return l && <line key={`${cls}-${pair.join("-")}`} className={cls} {...shift(l, offset)} markerEnd={marker} />;
    });

  return (
    <div className={`tm-figure${config.tall ? " tm-figure--tall" : ""}`} role="img" aria-label={mapSummary(config, s)}>
      <div className="tm-tag-row">{s.tag && <span className="tm-tag">{s.tag}</span>}</div>
      <div className="tm-stage" ref={stageRef}>
        <svg className="tm-lines" width={w} height={h} aria-hidden="true">
          <defs>
            <marker id={head} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="tm-head" />
            </marker>
          </defs>
          {draw(config.links, "tm-link")}
          {draw(s.back, "tm-back", `url(#${head})`, BACK_OFFSET)}
          {draw(s.arrows, "tm-arrow", `url(#${head})`)}
          {draw(s.thick, "tm-arrow tm-arrow--thick", `url(#${head})`)}
          {draw(s.thin, "tm-arrow tm-arrow--thin", `url(#${head})`)}
        </svg>
        {Object.entries(config.nodes).map(([id, n]) => (
          <div
            key={id}
            className={`tm-node${shown.has(id) ? " is-shown" : ""}${lit.has(id) ? " is-lit" : ""}${pulsing && [pulsing].flat().includes(id) ? " is-pulse" : ""}${n.sub ? " has-sub" : ""}`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            aria-hidden="true"
          >
            <span className="tm-node-label">{n.label}</span>
            {n.sub && <span className="tm-node-sub">{n.sub}</span>}
            {s.badges?.[id] && (
              <span className="tm-badges">
                {[s.badges[id]].flat().map((b) => (
                  <span key={b} className="tm-badge">{b}</span>
                ))}
              </span>
            )}
            {s.record && config.record?.node === id && <RecordStrip record={tools?.[config.record.tool]?.record} empty={config.record.empty} />}
            {s.notes?.[id] && (
              <span className={`tm-note${config.wrapNotes ? ` tm-note--wrap${n.x < 40 ? " tm-note--start" : n.x > 60 ? " tm-note--end" : ""}` : ""}`}>{s.notes[id]}</span>
            )}
          </div>
        ))}
        {(s.linkLabels || []).filter(both).map(([a, b, text]) => (
          <span key={`ll-${a}-${b}`} className="tm-link-label" style={{ left: `${(config.nodes[a].x + config.nodes[b].x) / 2}%`, top: `${(config.nodes[a].y + config.nodes[b].y) / 2}%` }} aria-hidden="true">
            {text}
          </span>
        ))}
        {Object.entries(s.tokens || {}).map(([id, t], i) => (
          <Token key={`${id}-${at}`} token={config.tokens[id]} spot={config.nodes[t.at]} from={t.from && config.nodes[t.from]} index={i} />
        ))}
      </div>
      <p className="tm-caption">{s.caption}</p>
    </div>
  );
}
