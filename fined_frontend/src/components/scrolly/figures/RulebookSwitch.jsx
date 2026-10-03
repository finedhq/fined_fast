// Module 3 Chapter 2 figure — "rulebook_switch" (port of the prototype's
// RulebookSwitchFigure.js, fined-scrolly/module-1-market/js/figures/, with
// Module 3's company and numbers from module3Figures.js).
// Steps by position: 0 a short timeline — bad news is coming · 1 flip a
// rulebook OFF/ON and watch who finds out first (the price falls to the same
// level either way; what changes is whether a few insiders sell first) ·
// 2 the crowd resolves into a registered-vs-traded dot grid.
// The switch is not saved: entering step 1 always starts at OFF, as in the
// prototype ("reverse scroll always restores OFF").
import { useEffect, useState } from "react";
import { rulebookScene, spreadCells } from "./blocksMath";
import { rand } from "./figureMath";

const DOT_COUNT = 16;
const DOTS = Array.from({ length: DOT_COUNT }, (_, i) => ({ left: 8 + rand(i) * 84, top: 10 + rand(i + 30) * 75 }));

function Timeline({ items }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const timers = items.map((_, i) => setTimeout(() => setShown(i + 1), i * 220));
    return () => timers.forEach(clearTimeout);
  }, [items]);
  return (
    <div className="timeline-strip">
      {items.map((t, i) => (
        <div key={t.when} className={`timeline-stop${i < shown ? " revealed" : ""}`}>
          <div className="timeline-year">{t.when}</div>
          <div className="timeline-dot"></div>
          <div className="timeline-label">{t.label}</div>
        </div>
      ))}
    </div>
  );
}

// One play-through of the scenario, with the prototype's timings. A flip
// mounts a fresh stage (new key), so it always starts from the beginning.
function Stage({ rule, config }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [setTimeout(() => setPhase(1), 300)];
    if (rule === "off") timers.push(setTimeout(() => setPhase(2), 1400));
    return () => timers.forEach(clearTimeout);
  }, [rule]);
  const scene = rulebookScene(rule, phase, config);
  return (
    <>
      <div className="dots-stage" aria-hidden="true">
        {DOTS.map((d, i) => (
          <div key={i} className={`switch-dot ${scene.dot(i)}`} style={{ left: `${d.left}%`, top: `${d.top}%` }}></div>
        ))}
        <div className="switch-price-tag">{scene.tag}</div>
      </div>
      <div className="switch-legend" aria-hidden="true">
        <span>
          <i className="switch-dot insider"></i>a few insiders
        </span>
        <span>
          <i className="switch-dot"></i>still holding
        </span>
        <span>
          <i className="switch-dot sold-late"></i>sold after the news
        </span>
      </div>
      <div className="switch-feedback" aria-live="polite">
        {scene.feedback}
      </div>
    </>
  );
}

function SwitchPanel({ config }) {
  const [rule, setRule] = useState("off");
  const [run, setRun] = useState(0);
  const flip = () => {
    setRule(rule === "off" ? "on" : "off");
    setRun(run + 1);
  };

  return (
    <div className="switch-panel">
      <div className="scenario-card">{config.company} is about to report that its profits collapsed.</div>
      <div className="rulebook-toggle-row">
        <span id="rulebook-label">Rulebook</span>
        <button
          type="button"
          className={`rulebook-toggle${rule === "on" ? " is-on" : ""}`}
          role="switch"
          aria-checked={rule === "on"}
          aria-labelledby="rulebook-label"
          onClick={flip}
        >
          <span className="toggle-track">
            <span className="toggle-thumb"></span>
          </span>
          <span className="toggle-state-label">{rule.toUpperCase()}</span>
        </button>
      </div>
      <Stage key={run} rule={rule} config={config} />
    </div>
  );
}

// One highlighted dot per `activeEvery`, spread over the grid (not in a column).
function CrowdGrid({ crowd }) {
  const active = new Set(spreadCells(Math.round(crowd.dots / crowd.activeEvery), crowd.dots));
  return (
    <div className="crowd-grid-wrap">
      <div className="crowd-grid" role="img" aria-label={crowd.caption}>
        {Array.from({ length: crowd.dots }, (_, i) => (
          <div key={i} className={`crowd-grid-dot${active.has(i) ? " active" : ""}`}></div>
        ))}
      </div>
      <div className="crowd-grid-caption">{crowd.caption}</div>
    </div>
  );
}

export default function RulebookSwitch({ step, config }) {
  const s = step ?? 0;
  return (
    <div className="rulebook-figure">
      {s === 0 && <Timeline items={config.timeline} />}
      {s === 1 && <SwitchPanel config={config} />}
      {s >= 2 && <CrowdGrid crowd={config.crowd} />}
    </div>
  );
}
