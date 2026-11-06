// December as an advent calendar: one frosted door per challenge day.
// 1 Dec 2026 is a Tuesday, so each Monday-to-Sunday row is exactly one
// leaderboard week. Each door carries a colour stripe for its learning theme
// (themes are separate from leaderboard weeks). Tap a door to swing it open
// and see that day's topic.
import { useState } from "react";
import {
  PiTrophyFill, PiMegaphoneFill, PiBookOpenTextFill, PiFlagCheckeredFill, PiSnowflakeBold,
  PiWalletFill, PiBankFill, PiChartLineUpFill, PiCreditCardFill, PiUmbrellaFill, PiTargetFill,
  PiBuildingsFill, PiPlantFill, PiScalesFill, PiChartBarFill, PiChartPieSliceFill, PiRepeatFill,
  PiScrollFill, PiCoinsFill, PiMagnifyingGlassFill, PiFactoryFill, PiFileTextFill, PiTagFill,
  PiPercentFill, PiBrainFill, PiWarningFill, PiChartLineFill, PiPresentationChartFill,
  PiWaveSineFill, PiSwapFill, PiStackFill, PiArmchairFill, PiCalculatorFill, PiMapTrifoldFill,
} from "react-icons/pi";
import { WINTERARC as W, dayInfo } from "./winterarcConfig";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FIRST_COL = 1; // 1 Dec 2026 falls on a Tuesday (Mon = 0)

const themeOf = (n) => W.themes.find((t) => n >= t.from && n <= t.to);
const topicOf = (n) => W.topics.find((t) => t.day === n);

// Leaderboard moments worth calling out on a day (nothing on ordinary days)
function eventNote(info) {
  if (info.n === 1) return "Day 1. Your arc begins.";
  if (info.finale) return `Worth ${W.finalePoints} points. The final leaderboard closes tonight.`;
  if (info.cutoff) return `The ${info.week} leaderboard closes tonight.`;
  if (info.weekday === "Mon") return "Last week's winners are announced today.";
  return null;
}

// One icon per day's topic, shown inside the opened door
const TOPIC_ICONS = {
  1: PiWalletFill, 2: PiBankFill, 3: PiChartLineUpFill, 4: PiCreditCardFill, 5: PiUmbrellaFill,
  6: PiTargetFill, 7: PiBuildingsFill, 8: PiPlantFill, 9: PiScalesFill, 10: PiChartBarFill,
  11: PiChartPieSliceFill, 12: PiRepeatFill, 13: PiScrollFill, 14: PiCoinsFill, 15: PiMagnifyingGlassFill,
  16: PiFactoryFill, 17: PiFileTextFill, 18: PiTagFill, 19: PiPercentFill, 20: PiBrainFill,
  21: PiWarningFill, 22: PiChartLineFill, 23: PiPresentationChartFill, 24: PiWaveSineFill, 25: PiSwapFill,
  26: PiStackFill, 27: PiArmchairFill, 28: PiCalculatorFill, 29: PiMapTrifoldFill, 30: PiTrophyFill,
};

function DoorInside({ info, topic }) {
  const Icon = TOPIC_ICONS[info.n] || PiBookOpenTextFill;
  const badge = info.finale ? null
    : info.cutoff ? <PiFlagCheckeredFill />
      : info.weekday === "Mon" && info.n > 1 ? <PiMegaphoneFill />
        : null;
  return (
    <>
      <Icon className="wa-door-icon" />
      {topic?.short && <span className="wa-door-label">{topic.short}</span>}
      {badge && <span className="wa-door-badge">{badge}</span>}
    </>
  );
}

export default function AdventCalendar() {
  const [open, setOpen] = useState(() => new Set());
  const [selected, setSelected] = useState(null);

  const toggle = (n) => {
    setSelected(n);
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      return next;
    });
  };

  const info = selected ? dayInfo(selected) : null;
  const theme = selected ? themeOf(selected) : null;
  const topic = selected ? topicOf(selected) : null;
  const note = info ? eventNote(info) : null;

  return (
    <div className="wa-cal">
      <div className="wa-cal-grid" role="group" aria-label="WinterArc days in December 2026">
        <div className="wa-cal-corner" aria-hidden="true" />
        {WEEKDAYS.map((d) => (
          <div key={d} className={`wa-cal-wd ${d === "Sun" ? "is-sun" : ""}`} aria-hidden="true">{d}</div>
        ))}

        {W.weeks.map((week) => {
          const cells = [];
          for (let col = 0; col < 7; col += 1) {
            const day = week.from === 1 ? col - FIRST_COL + 1 : week.from + col;
            const inRange = day >= week.from && day <= week.to;
            if (!inRange) {
              cells.push(<div key={`${week.label}-${col}`} className="wa-cal-blank" aria-hidden="true" />);
              continue;
            }
            const d = dayInfo(day);
            const t = topicOf(day);
            const isOpen = open.has(day);
            cells.push(
              <button
                key={day}
                type="button"
                className={[
                  "wa-door",
                  `wa-theme-${themeOf(day)?.key || "none"}`,
                  isOpen ? "is-open" : "",
                  d.cutoff && !d.finale ? "is-cutoff" : "",
                  d.finale ? "is-finale" : "",
                  selected === day ? "is-selected" : "",
                ].join(" ")}
                onClick={() => toggle(day)}
                aria-pressed={isOpen}
                aria-label={`Day ${day}, ${d.weekday} ${d.label}${t ? `: ${t.title}` : ""}`}
              >
                <span className="wa-door-inside" aria-hidden="true">
                  <DoorInside info={d} topic={t} />
                </span>
                <span className="wa-door-front" aria-hidden="true">
                  <span className="wa-door-num">{day}</span>
                  {d.finale && <PiTrophyFill className="wa-door-trophy" />}
                </span>
              </button>,
            );
          }
          return (
            <div key={week.label} className="wa-cal-row">
              <div className={`wa-cal-week ${week.to === W.totalDays ? "is-final" : ""}`}>
                <span>{week.label}</span>
                <small>{week.from}-{week.to} Dec</small>
              </div>
              {cells}
            </div>
          );
        })}
      </div>

      <ul className="wa-cal-themes" aria-label="Learning themes">
        {W.themes.map((t) => (
          <li key={t.key} className={`wa-theme-${t.key}`}>
            <span className="wa-theme-swatch" aria-hidden="true" />
            {t.name} <small>Days {t.from}-{t.to}</small>
          </li>
        ))}
      </ul>

      <div className="wa-cal-info" aria-live="polite">
        {info ? (
          <>
            <p className="wa-cal-info-day">
              Day {info.n} <span>{info.weekday} {info.label}, {info.week} leaderboard</span>
            </p>
            {theme && !info.finale && <p className={`wa-cal-theme-chip wa-theme-${theme.key}`}>{theme.name}</p>}
            {topic && <p className="wa-cal-topic">{topic.title}</p>}
            {topic && <p>{topic.learn}</p>}
            {note && <p className="wa-cal-note">{note}</p>}
          </>
        ) : (
          <p className="wa-cal-hint"><PiSnowflakeBold aria-hidden="true" /> Tap any door to see that day's topic.</p>
        )}
      </div>
    </div>
  );
}
