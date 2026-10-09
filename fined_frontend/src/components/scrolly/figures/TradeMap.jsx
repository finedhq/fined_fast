// Reusable figure (Module 4 on) — "trade_map": boxes joined by lines, built
// up step by step, with small tokens (₹, shares, an order) that move between
// boxes. Everything comes from `config` (see module4Figures.js):
//   nodes   {id: {label, sub?, x, y}}  positions in % of the figure
//   tokens  {id: {label, kind}}
//   links   [[from, to]]  faint lines, drawn when both boxes are shown
//   steps   one entry per step (so the step count is the config's), each
//           {show, lit, arrows?, back?, tokens?: {id: {at, from?}}, badges?,
//            pulse?, tag?, caption}; `null` = the chapter shows another figure
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

export default function TradeMap({ step, steps, state, config }) {
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
    <div className="tm-figure" role="img" aria-label={mapSummary(config, s)}>
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
        </svg>
        {Object.entries(config.nodes).map(([id, n]) => (
          <div
            key={id}
            className={`tm-node${shown.has(id) ? " is-shown" : ""}${lit.has(id) ? " is-lit" : ""}${pulsing === id ? " is-pulse" : ""}${n.sub ? " has-sub" : ""}`}
            style={{ left: `${n.x}%`, top: `${n.y}%` }}
            aria-hidden="true"
          >
            <span className="tm-node-label">{n.label}</span>
            {n.sub && <span className="tm-node-sub">{n.sub}</span>}
            {s.badges?.[id] && <span className="tm-badge">{s.badges[id]}</span>}
          </div>
        ))}
        {Object.entries(s.tokens || {}).map(([id, t], i) => (
          <Token key={`${id}-${at}`} token={config.tokens[id]} spot={config.nodes[t.at]} from={t.from && config.nodes[t.from]} index={i} />
        ))}
      </div>
      <p className="tm-caption">{s.caption}</p>
    </div>
  );
}
