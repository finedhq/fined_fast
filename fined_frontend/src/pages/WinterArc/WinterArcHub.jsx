// The WinterArc hub (/winterarc/challenge). Two columns on desktop:
//   main  today's task, then the month as five leaderboard-week strips
//         (each with its day chips and that week's points)
//   side  streak ladder, resets as tokens, the invite card
// Phones stack them: today, streak, resets, month, invite.
// Missed days can be repaired with a reset from the Resets card.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  PiArrowCounterClockwiseBold, PiArrowRightBold, PiCheckBold, PiClockBold, PiCopyBold, PiLockSimpleBold, PiTrophyBold,
} from "react-icons/pi";
import { WINTERARC as W, dayInfo } from "./winterarcConfig";
import { getWinterArcMe, spendWinterArcReset } from "../../services/api";
import WinterArcGate, { JoinFirst, WinterArcMessage } from "./WinterArcGate";
import { Countdown } from "./WinterArcSignup";

const SITE = "https://myfined.com";
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FULL_HOURS = 36;

const at = (iso, opts) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", ...opts });
const timeOf = (d) => at(d, { hour: "numeric", minute: "2-digit" });

/** What a chip on the month shows: done, started, missed, repaired, open, locked. */
function chipState(d) {
  if (!d.open) return "locked";
  if (d.status === "done") return "done";
  if (d.repaired) return "repaired";
  if (d.streak === "missed") return "missed";
  if (d.status === "started") return "started";
  return "open";
}

const CHIP_LABEL = {
  done: "done",
  started: "started",
  missed: "missed",
  repaired: "repaired with a reset",
  open: "open",
  locked: "not open yet",
};

function Today({ day, now }) {
  const info = dayInfo(day.day);
  const opens = new Date(day.opens_at);
  const fullUntil = new Date(opens.getTime() + FULL_HOURS * 3600 * 1000);
  const pips = Array.from({ length: day.questions || 0 }, (_, i) => i < day.finished_questions);
  let timing;
  if (day.status === "done") timing = `Done. You earned ${day.points} points.`;
  else if (now < fullUntil) {
    const sameDay = at(fullUntil, { day: "numeric" }) === at(now, { day: "numeric" });
    timing = `Full points until ${timeOf(fullUntil)} ${sameDay ? "today" : "tomorrow"}.`;
  }
  else timing = `Half points until this week's board closes on Sunday night.`;

  return (
    <section className="wa-today" aria-labelledby="wa-today-title">
      <span className="wa-today-bignum" aria-hidden="true">{String(day.day).padStart(2, "0")}</span>
      <p className="wa-today-kicker">Day {day.day} · {info.weekday} {info.label}</p>
      <h2 id="wa-today-title">{day.title}</h2>
      {pips.length > 0 && (
        <div className="wa-pips" aria-label={`${day.finished_questions} of ${day.questions} questions done`}>
          {pips.map((on, i) => <span key={i} className={`wa-pip${on ? " is-on" : ""}`} />)}
        </div>
      )}
      <p className={`wa-today-timing${day.status === "done" ? " is-done" : ""}`}>
        {day.status === "done" ? <PiCheckBold aria-hidden="true" /> : <PiClockBold aria-hidden="true" />} {timing}
      </p>
      <Link className="wa-btn wa-btn-primary" to={`/winterarc/day/${day.day}`}>
        {day.status === "done" ? "Review today" : day.status === "started" ? "Carry on" : "Start today's task"}
        <PiArrowRightBold aria-hidden="true" />
      </Link>
    </section>
  );
}

function BeforeStart({ opensAt }) {
  return (
    <section className="wa-today wa-today-wait">
      <span className="wa-today-bignum" aria-hidden="true">01</span>
      <p className="wa-today-kicker">Day 1 · {at(opensAt, { weekday: "short", day: "numeric", month: "short" })}</p>
      <h2>Your first task opens soon</h2>
      <p className="wa-today-timing"><PiClockBold aria-hidden="true" /> Opens at {timeOf(opensAt)} IST.</p>
      <Countdown />
    </section>
  );
}

function Month({ days, weekPoints, today }) {
  const byDay = Object.fromEntries(days.map((d) => [d.day, d]));
  return (
    <section className="wa-month" aria-labelledby="wa-month-title">
      <div className="wa-month-head">
        <h2 id="wa-month-title">Your month</h2>
        <p>Each row is one leaderboard week.</p>
      </div>
      <div className="wa-weeks">
        <div className="wa-week is-head" aria-hidden="true">
          <ol className="wa-week-days">
            {WEEKDAYS.map((d) => <li key={d} className={d === "Sun" ? "is-sun" : ""}>{d}</li>)}
          </ol>
        </div>
        {W.weeks.map((w, i) => {
          const first = WEEKDAYS.indexOf(dayInfo(w.from).weekday);
          const slots = [
            ...Array.from({ length: first }, () => null),
            ...Array.from({ length: w.to - w.from + 1 }, (_, k) => w.from + k),
          ];
          while (slots.length < 7) slots.push(null);
          return (
            <div key={w.label} className="wa-week">
              <div className="wa-week-label">
                <strong>{w.label}</strong>
                <span>{w.from}-{w.to} Dec</span>
              </div>
              <ol className="wa-week-days">
                {slots.map((n, k) => {
                  if (!n) return <li key={`b${k}`} className="wa-chip is-blank" aria-hidden="true" />;
                  const d = byDay[n] || { day: n, open: false };
                  const state = chipState(d);
                  const label = `Day ${n}, ${CHIP_LABEL[state]}${d.points ? `, ${d.points} points` : ""}`;
                  const inner = (
                    <>
                      <span className="wa-chip-num">{n}</span>
                      {state === "done" && <PiCheckBold className="wa-chip-mark" aria-hidden="true" />}
                      {state === "repaired" && <PiArrowCounterClockwiseBold className="wa-chip-mark" aria-hidden="true" />}
                      {state === "locked" && <PiLockSimpleBold className="wa-chip-mark" aria-hidden="true" />}
                    </>
                  );
                  return (
                    <li key={n} className={`wa-chip is-${state}${n === today ? " is-today" : ""}`}>
                      {d.open ? <Link to={`/winterarc/day/${n}`} aria-label={label}>{inner}</Link> : <span aria-label={label}>{inner}</span>}
                    </li>
                  );
                })}
              </ol>
              <div className="wa-week-points">
                <strong>{weekPoints[i + 1] || 0}</strong>
                <span>pts</span>
              </div>
            </div>
          );
        })}
      </div>
      <ul className="wa-legend" aria-label="What the colours mean">
        <li><span className="wa-chip-key is-done" /> Done</li>
        <li><span className="wa-chip-key is-started" /> Started</li>
        <li><span className="wa-chip-key is-missed" /> Missed</li>
        <li><span className="wa-chip-key is-repaired" /> Repaired</li>
        <li><span className="wa-chip-key is-locked" /> Not open yet</li>
      </ul>
    </section>
  );
}

function Streak({ streak }) {
  const cur = streak.current;
  const next = streak.next_bonus;
  return (
    <section className="wa-side-card" aria-labelledby="wa-streak-title">
      <h3 id="wa-streak-title">Streak</h3>
      <p className="wa-streak-num">
        <strong>{cur}</strong> <span>{cur === 1 ? "day" : "days"}</span>
      </p>
      <ol className="wa-ladder" aria-label="Streak bonuses">
        {W.streakBonuses.map((b) => {
          const reached = cur >= b.days;
          const isNext = next && next.days === b.days;
          return (
            <li key={b.days} className={`wa-rung${reached ? " is-reached" : ""}${isNext ? " is-next" : ""}`}>
              <span className="wa-rung-days">{b.days}</span>
              <span className="wa-rung-pts">+{b.points}</span>
            </li>
          );
        })}
      </ol>
      <p className="wa-side-note">
        {next ? `${next.days - cur} more ${next.days - cur === 1 ? "day" : "days"} for +${next.points} points.` : "Every bonus on this streak reached."}
        {streak.best > cur && ` Your best is ${streak.best}.`} Finish each day by noon the next day.
      </p>
    </section>
  );
}

function Resets({ resets, busy, msg, onRepair }) {
  const total = resets.left + resets.used;
  return (
    <section className="wa-side-card" aria-labelledby="wa-resets-title">
      <h3 id="wa-resets-title">Resets</h3>
      <div className="wa-tokens" aria-label={`${resets.left} of ${total} resets left`}>
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`wa-token${i < resets.left ? " is-left" : ""}`}>
            <PiArrowCounterClockwiseBold aria-hidden="true" />
          </span>
        ))}
        <span className="wa-tokens-count">{resets.left} left</span>
      </div>
      {resets.missed_days.length > 0 && resets.left > 0 ? (
        <>
          <p className="wa-side-note">A reset puts a missed day back in your streak.</p>
          <div className="wa-repair">
            {resets.missed_days.map((d) => (
              <button key={d} type="button" className="wa-btn wa-btn-ghost wa-btn-small" disabled={busy} onClick={() => onRepair(d)}>
                Repair Day {d}
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="wa-side-note">Finish every task in a week to earn another.</p>
      )}
      {msg && <p className={`wa-side-msg${msg.ok ? "" : " is-error"}`} role="status">{msg.text}</p>}
    </section>
  );
}

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
    <section className="wa-invite" aria-labelledby="wa-invite-title">
      <h3 id="wa-invite-title">Bring a friend along</h3>
      <p>+{r.points_each} points for each friend who finishes Day 3 (up to {r.cap}).</p>
      <dl className="wa-invite-stats">
        <div><dt>Joined</dt><dd>{r.joined}</dd></div>
        <div><dt>Counted</dt><dd>{r.counted}</dd></div>
        <div><dt>Pending</dt><dd>{r.pending}</dd></div>
      </dl>
      <div className="wa-invite-link">
        <code>{link}</code>
        <button type="button" className="wa-btn wa-btn-primary wa-btn-small" onClick={copy}>
          <PiCopyBold aria-hidden="true" /> {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </section>
  );
}

function Hub() {
  const { user } = useAuth0();
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
      setResetMsg({ ok: true, text: `Day ${day} repaired. Its task is still open for half points.` });
      await load();
    } catch (e) {
      setResetMsg({ ok: false, text: e.message || "Couldn't use the reset. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  if (error) return <WinterArcMessage icon="error" title="Something went wrong">{error}</WinterArcMessage>;
  if (!data) return <div className="wa wa-doc-page wa-app"><div className="wa-wrap"><div className="wa-skeleton" /></div></div>;
  if (!data.joined) return <JoinFirst />;

  const now = new Date(data.now); // the server's clock, so "today" and the hub agree
  const today = data.days.find((d) => d.day === data.today);
  const first = (user?.given_name || user?.name || "").split(" ")[0];

  return (
    <div className="wa wa-doc-page wa-app">
      <div className="wa-wrap">
        <header className="wa-app-head">
          <div>
            <h1>{first ? `${first}'s WinterArc` : `Your ${W.name}`}</h1>
            <p className="wa-app-sub">
              {today ? `Day ${today.day} of ${W.totalDays}` : `Starts ${W.startDate}`} <span aria-hidden="true">·</span> <strong>{data.total_points}</strong> points
            </p>
          </div>
          <Link className="wa-btn wa-btn-ghost" to="/winterarc/leaderboard">
            <PiTrophyBold aria-hidden="true" /> Leaderboards
          </Link>
        </header>

        <div className="wa-app-grid">
          <div className="wa-app-main">
            {today ? <Today day={today} now={now} /> : <BeforeStart opensAt={data.days[0].opens_at} />}
            <Month days={data.days} weekPoints={data.week_points} today={data.today} />
          </div>
          <aside className="wa-app-side">
            <Streak streak={data.streak} />
            <Resets resets={data.resets} busy={busy} msg={resetMsg} onRepair={repair} />
            <Invite r={data.referrals} />
            <p className="wa-app-rules"><Link to="/winterarc/rules">How points work</Link></p>
          </aside>
        </div>
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
