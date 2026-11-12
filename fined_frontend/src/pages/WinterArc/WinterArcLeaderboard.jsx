// WinterArc leaderboards (/winterarc/leaderboard): one board per leaderboard
// week plus the overall board. Members only; names are first name + initial.
// Ranked by points, then days finished on time, then who got there first.
// Top 3 stand on a podium; everyone else is a ranked list; your own row
// stays pinned at the bottom when you're outside the top 50.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PiArrowRightBold, PiClockBold, PiCrownSimpleFill, PiTrophyBold } from "react-icons/pi";
import { WINTERARC as W, dayInfo } from "./winterarcConfig";
import { getWinterArcLeaderboard } from "../../services/api";
import WinterArcGate, { JoinFirst, WinterArcMessage } from "./WinterArcGate";

const TABS = [
  ...W.weeks.map((w, i) => ({ week: i + 1, label: w.label, dates: `${w.from}-${w.to} Dec`, closes: w.to })),
  { week: null, label: "Overall", dates: `${W.startDate}-${W.endDate}`, closes: W.totalDays },
];

const initials = (name) =>
  (name || "?").split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function Avatar({ name, size = "md" }) {
  return <span className={`wa-avatar is-${size}`} aria-hidden="true">{initials(name)}</span>;
}

function Podium({ rows }) {
  // Visual order 2nd, 1st, 3rd; the list underneath reads in rank order
  const order = [rows[1], rows[0], rows[2]].filter(Boolean);
  return (
    <ol className="wa-podium" aria-label="Top three">
      {order.map((r) => {
        const place = rows.indexOf(r) + 1;
        return (
          <li key={`${r.rank}-${r.name}`} className={`wa-step is-p${place}${r.me ? " is-me" : ""}`}>
            {place === 1 && <PiCrownSimpleFill className="wa-step-crown" aria-hidden="true" />}
            <Avatar name={r.name} size="lg" />
            <span className="wa-step-name">{r.name}{r.me ? " (you)" : ""}</span>
            <span className="wa-step-points">{r.points} pts</span>
            <span className="wa-step-block"><span>#{r.rank}</span></span>
          </li>
        );
      })}
    </ol>
  );
}

function Row({ r }) {
  return (
    <li className={`wa-rank-row${r.me ? " is-me" : ""}`}>
      <span className="wa-rank-num">#{r.rank}</span>
      <Avatar name={r.name} />
      <span className="wa-rank-name">
        {r.name}{r.me ? " (you)" : ""}
        <small>{r.on_time_days} {r.on_time_days === 1 ? "day" : "days"} on time</small>
      </span>
      <span className="wa-rank-points">{r.points}</span>
    </li>
  );
}

function Board() {
  const [week, setWeek] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = `Leaderboards | ${W.name} | FinEd`;
    let live = true;
    getWinterArcLeaderboard(week).then((d) => live && setData(d)).catch((e) => live && setError(e));
    return () => {
      live = false;
    };
  }, [week]);

  if (error?.status === 403) return <JoinFirst />;
  if (error) return <WinterArcMessage icon="error" title="Something went wrong">{error.message}</WinterArcMessage>;

  const tab = TABS.find((t) => t.week === week);
  const closeInfo = dayInfo(tab.closes);
  const shown = data && (data.week ?? null) === week ? data : null; // the board for the chosen tab
  const podium = shown ? shown.rows.slice(0, 3) : [];
  const rest = shown ? shown.rows.slice(3) : [];
  const meShown = shown?.rows.some((r) => r.me);

  return (
    <div className="wa wa-doc-page wa-app wa-boards">
      <div className="wa-wrap wa-narrow">
        <header className="wa-app-head">
          <div>
            <h1>Leaderboards</h1>
            <p className="wa-app-sub">Ranked by points, then days finished on time, then who got there first.</p>
          </div>
          <Link className="wa-btn wa-btn-ghost" to="/winterarc/challenge">Back to {W.name}</Link>
        </header>

        <div className="wa-tabs" role="tablist" aria-label="Choose a board">
          {TABS.map((t) => (
            <button
              key={t.label}
              type="button"
              role="tab"
              aria-selected={week === t.week}
              className="wa-tab"
              onClick={() => setWeek(t.week)}
            >
              <span>{t.label}</span>
              <small>{t.dates}</small>
            </button>
          ))}
        </div>

        <p className={`wa-board-status${shown?.closed ? " is-closed" : ""}`}>
          <PiClockBold aria-hidden="true" />
          {shown?.closed
            ? "This board has closed. Winners are checked before they're announced."
            : `Closes at the end of ${closeInfo.weekday} ${closeInfo.label} (IST).`}
        </p>

        {!shown ? (
          <div className="wa-skeleton" />
        ) : shown.rows.length === 0 ? (
          <div className="wa-board-empty">
            <span className="wa-icon-tile"><PiTrophyBold aria-hidden="true" /></span>
            <div>
              <h2>No points on this board yet</h2>
              <p>Names appear here as people finish their days.</p>
              <Link className="wa-btn wa-btn-primary wa-btn-small" to="/winterarc/challenge">
                Go to today's task <PiArrowRightBold aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <>
            <Podium rows={podium} />
            {rest.length > 0 && <ol className="wa-ranks" aria-label="Everyone else">{rest.map((r) => <Row key={`${r.rank}-${r.name}`} r={r} />)}</ol>}
            {shown.me && !meShown && (
              <ol className="wa-ranks wa-ranks-me" aria-label="Your place"><Row r={shown.me} /></ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function WinterArcLeaderboard() {
  return (
    <WinterArcGate>
      <Board />
    </WinterArcGate>
  );
}
