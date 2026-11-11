// WinterArc leaderboards (/winterarc/leaderboard): one board per leaderboard
// week plus the overall board. Members only. Names are first name + initial.
// Ranked by points, then days finished on time, then who got there first.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { WINTERARC as W } from "./winterarcConfig";
import { getWinterArcLeaderboard } from "../../services/api";
import WinterArcGate, { JoinFirst, WinterArcMessage } from "./WinterArcGate";

const TABS = [...W.weeks.map((w, i) => ({ week: i + 1, label: w.label })), { week: null, label: "Overall" }];

function Row({ r }) {
  return (
    <div className={`wa-board-row${r.me ? " is-me" : ""}`}>
      <span className="wa-board-rank">#{r.rank}</span>
      <span className="wa-board-name">{r.name}{r.me ? " (you)" : ""}</span>
      <span className="wa-board-points">{r.points}</span>
    </div>
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
  if (error) return <WinterArcMessage title="Something went wrong">{error.message}</WinterArcMessage>;

  const shown = data && (data.week ?? null) === week ? data : null; // the board for the chosen tab
  const meShown = shown?.rows.some((r) => r.me);
  return (
    <div className="wa wa-doc-page wa-hub">
      <div className="wa-wrap wa-narrow">
        <h1>Leaderboards</h1>
        <p className="wa-lede">
          Weekly boards close on Sunday night; the overall board closes at the end of {W.endDate}. Ties go to more days finished
          on time, then to whoever reached the score first.
        </p>
        <div className="wa-board-tabs" role="group" aria-label="Choose a board">
          {TABS.map((t) => (
            <button key={t.label} type="button" className="wa-board-tab" aria-pressed={week === t.week} onClick={() => setWeek(t.week)}>
              {t.label}
            </button>
          ))}
        </div>

        {shown && (
          <>
            <p className="wa-small">{shown.closed ? "This board has closed." : "This board is still open."}</p>
            {shown.rows.length === 0 ? (
              <p className="wa-hub-sub">No points on this board yet.</p>
            ) : (
              <div className="wa-board">{shown.rows.map((r) => <Row key={`${r.rank}-${r.name}`} r={r} />)}</div>
            )}
            {shown.me && !meShown && (
              <div className="wa-board wa-board-me"><Row r={shown.me} /></div>
            )}
          </>
        )}

        <p className="wa-small wa-center wa-hub-links">
          <Link to="/winterarc/challenge">Back to {W.name}</Link>
          <Link to="/winterarc/rules">Rules</Link>
        </p>
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
