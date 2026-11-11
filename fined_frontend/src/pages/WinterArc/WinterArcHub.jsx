// The WinterArc hub (/winterarc/challenge): today's task, streak and resets,
// points by leaderboard week, and the 30 days. Missed days can be repaired
// with a reset from here.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PiArrowCounterClockwiseBold, PiArrowRightBold, PiCheckBold, PiCopyBold, PiFireBold, PiLockSimpleBold, PiTrophyBold, PiUsersThreeBold } from "react-icons/pi";
import { WINTERARC as W, dayInfo } from "./winterarcConfig";
import { getWinterArcMe, spendWinterArcReset } from "../../services/api";
import WinterArcGate, { JoinFirst, WinterArcMessage } from "./WinterArcGate";
import { Countdown } from "./WinterArcSignup";

const SITE = "https://myfined.com";

function Invite({ r }) {
  const [copied, setCopied] = useState(false);
  if (!r?.code || !W.show.referrals) return null;
  const link = `${SITE}/winterarc?ref=${r.code}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: the link is on screen
    }
  };
  return (
    <div className="wa-hub-panel wa-hub-invite">
      <p className="wa-hub-panel-title"><PiUsersThreeBold aria-hidden="true" /> Invite friends</p>
      <p className="wa-hub-sub">
        {r.joined
          ? `${r.joined} joined with your link · ${r.counted} counted · ${r.pending} pending.`
          : "Nobody has joined with your link yet."}{" "}
        A friend counts (+{r.points_each} points, up to {r.cap}) once they finish Day 3 and pass a quick check.
      </p>
      <div className="wa-link-row">
        <code className="wa-ref-link">{link}</code>
        <button type="button" className="wa-btn wa-btn-ghost wa-btn-small" onClick={copy}>
          <PiCopyBold aria-hidden="true" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

const opensLabel = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

function Hub() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [resetMsg, setResetMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => getWinterArcMe().then(setData).catch((e) => setError(e.message || "Couldn't load WinterArc.")), []);
  useEffect(() => {
    document.title = `${W.name} | FinEd`;
    load();
  }, [load]);

  const repair = async (day) => {
    if (!window.confirm(`Use a reset on Day ${day}?\n\nYour streak counts that day again. You can still do Day ${day}'s task for half points until the end of ${W.endDate}.`)) return;
    setBusy(true);
    setResetMsg(null);
    try {
      await spendWinterArcReset(day);
      setResetMsg({ ok: true, text: `Day ${day} repaired. Do its task any time for half points.` });
      await load();
    } catch (e) {
      setResetMsg({ ok: false, text: e.message || "Couldn't use the reset. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  if (error) return <WinterArcMessage title="Something went wrong">{error}</WinterArcMessage>;
  if (!data) return null;
  if (!data.joined) return <JoinFirst />;

  const today = data.days.find((d) => d.day === data.today);
  return (
    <div className="wa wa-doc-page wa-hub">
      <div className="wa-wrap wa-narrow">
        <h1>{W.name}: {W.tagline}</h1>

        {today ? (
          <div className="wa-hub-today">
            <p className="wa-hub-kicker">Day {today.day} · {dayInfo(today.day).label}</p>
            <h2>{today.title}</h2>
            <p className="wa-hub-sub">
              {today.status === "done"
                ? `Done. You earned ${today.points} points.`
                : `${today.finished_questions} of ${today.questions} questions done.`}
            </p>
            <Link className="wa-btn wa-btn-primary" to={`/winterarc/day/${today.day}`}>
              {today.status === "done" ? "Review today" : today.status === "started" ? "Carry on" : "Start today's task"}
              <PiArrowRightBold aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="wa-hub-today">
            <p className="wa-hub-kicker">Day 1 opens {opensLabel(data.days[0].opens_at)} IST</p>
            <Countdown />
          </div>
        )}

        <div className="wa-hub-panels">
          <div className="wa-hub-panel">
            <p className="wa-hub-panel-title"><PiFireBold aria-hidden="true" /> Streak</p>
            <p className="wa-hub-big">{data.streak.current} <span>{data.streak.current === 1 ? "day" : "days"}</span></p>
            <p className="wa-hub-sub">
              {data.streak.next_bonus
                ? `${data.streak.next_bonus.days - data.streak.current} more for +${data.streak.next_bonus.points} points.`
                : "Every streak bonus reached."}
              {data.streak.best > data.streak.current && ` Best: ${data.streak.best}.`}
            </p>
            <p className="wa-small">Finish a day by noon the next day to keep it going.</p>
          </div>
          <div className="wa-hub-panel">
            <p className="wa-hub-panel-title"><PiArrowCounterClockwiseBold aria-hidden="true" /> Resets</p>
            <p className="wa-hub-big">{data.resets.left} <span>left</span></p>
            {data.resets.missed_days.length > 0 && data.resets.left > 0 ? (
              <div className="wa-hub-repair">
                <p className="wa-hub-sub">Missed a day? A reset puts it back in your streak.</p>
                {data.resets.missed_days.map((d) => (
                  <button key={d} type="button" className="wa-btn wa-btn-ghost wa-btn-small" disabled={busy} onClick={() => repair(d)}>
                    Repair Day {d}
                  </button>
                ))}
              </div>
            ) : (
              <p className="wa-hub-sub">Finish every task in a week to earn one more.</p>
            )}
            {resetMsg && <p className={`wa-hub-note${resetMsg.ok ? "" : " is-error"}`} role="status">{resetMsg.text}</p>}
          </div>
        </div>

        <Invite r={data.referrals} />

        <div className="wa-hub-score" aria-label="Your points by leaderboard week">
          <div className="wa-hub-total"><strong>{data.total_points}</strong><span>points</span></div>
          {W.weeks.map((w, i) => (
            <div key={w.label} className="wa-hub-week">
              <strong>{data.week_points[i + 1] || 0}</strong>
              <span>{w.label}</span>
            </div>
          ))}
        </div>

        <ol className="wa-hub-days">
          {data.days.map((d) => {
            const info = dayInfo(d.day);
            const body = (
              <>
                <span className="wa-hub-day-no">{d.day}</span>
                <span className="wa-hub-day-text">
                  <span className="wa-hub-day-title">{d.open ? d.title : `Opens ${info.label}`}</span>
                  <span className="wa-hub-day-meta">
                    {info.weekday} · {info.week}
                    {d.open && d.status !== "not_started" && ` · ${d.points} points`}
                    {d.repaired && " · repaired"}
                    {d.streak === "missed" && " · missed"}
                  </span>
                </span>
                <span className="wa-hub-day-mark" aria-hidden="true">
                  {!d.open ? <PiLockSimpleBold /> : d.status === "done" ? <PiCheckBold /> : <PiArrowRightBold />}
                </span>
              </>
            );
            return (
              <li key={d.day} className={`wa-hub-day is-${d.open ? d.status : "locked"}`}>
                {d.open ? <Link to={`/winterarc/day/${d.day}`}>{body}</Link> : <div>{body}</div>}
              </li>
            );
          })}
        </ol>

        <p className="wa-small wa-center wa-hub-links">
          <Link to="/winterarc/leaderboard"><PiTrophyBold aria-hidden="true" /> Leaderboards</Link>
          <Link to="/winterarc/rules">How points work</Link>
        </p>
      </div>
    </div>
  );
}

export default function WinterArcHub() {
  return (
    <WinterArcGate>
      <Hub />
    </WinterArcGate>
  );
}
