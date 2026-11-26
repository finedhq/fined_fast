// Admin: WinterArc people. Search the list, open one person, and act:
// grant or take back points (with a reason), gift a reset, disqualify or
// reinstate. Also the winners of each board for verifying. `?id=` opens a
// person directly (links from the referral checks).
import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { WINTERARC as W } from "../WinterArc/winterarcConfig";
import {
  disqualifyPerson, getPerson, getWinners, giftReset, grantPoints, reinstatePerson, searchPeople, when,
} from "./winterarcAdminApi";
import WinterArcAdminShell, { Notice } from "./WinterArcAdminShell";

const KIND = {
  streak_bonus: "Streak bonus",
  referral: "Referral approved",
  referral_rejected: "Referral rejected (no points)",
  admin_grant: "Points granted",
  reversal: "Points taken back",
  reset_used: "Reset used",
  reset_earned: "Reset earned",
};

function DayStrip({ done, missed }) {
  const doneSet = new Set(done);
  const missedSet = new Set(missed);
  return (
    <div className="waa-strip">
      <div className="waa-strip-cells" role="img" aria-label={`Days done: ${done.length ? done.join(", ") : "none"}. Missed: ${missed.length ? missed.join(", ") : "none"}.`}>
        {Array.from({ length: W.totalDays }, (_, i) => i + 1).map((n) => (
          <i key={n} className={doneSet.has(n) ? "done" : missedSet.has(n) ? "missed" : ""} title={`Day ${n}`}>{n}</i>
        ))}
      </div>
      <p className="adm-note" style={{ marginTop: 6 }}>
        Purple: done on time or repaired ({done.length}). Red: missed ({missed.length}). Grey: not yet.
      </p>
    </div>
  );
}

function Person({ id, onChanged }) {
  const [p, setP] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(() => getPerson(id).then(setP).catch((e) => setNotice({ ok: false, message: e.message })), [id]);
  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okText) => {
    setNotice(null);
    try {
      await fn();
      setNotice({ ok: true, message: okText });
      await load();
      onChanged?.();
    } catch (e) {
      setNotice({ ok: false, message: e.message });
    }
  };

  const grant = () => {
    const raw = window.prompt("Points to add (use a minus sign to take points back, e.g. -10):");
    const points = Number(raw);
    if (!raw || !Number.isInteger(points) || points === 0) return;
    const reason = window.prompt("Reason (kept with the points, at least 3 characters):");
    if (!reason || reason.trim().length < 3) return;
    run(() => grantPoints(id, points, reason), points > 0 ? `Added ${points} points.` : `Took back ${-points} points.`);
  };
  const gift = () => {
    const reason = window.prompt("Why gift a reset?");
    if (!reason || reason.trim().length < 3) return;
    run(() => giftReset(id, reason), "Reset gifted.");
  };
  const dq = () => {
    const reason = window.prompt("Why disqualify? They'll be removed from every leaderboard and the referral contest, and can't open the challenge.");
    if (!reason || reason.trim().length < 3) return;
    run(() => disqualifyPerson(id, reason), "Disqualified.");
  };
  const reinstate = () => {
    if (!window.confirm("Reinstate this person?")) return;
    run(() => reinstatePerson(id), "Reinstated.");
  };

  if (!p) return notice ? <Notice kind="bad">{notice.message}</Notice> : <p className="adm-empty">Loading…</p>;
  const person = p.person;
  return (
    <section className="adm-card waa-person" aria-label="Person">
      <div className="waa-person-top">
        <div>
          <h2>{person.name || "(no name)"}</h2>
          <div className="waa-person-meta">{person.email}{person.college ? ` · ${person.college}` : ""}</div>
          <div className="waa-person-meta">
            Joined {when(person.created_at)} · code <code>{person.referral_code}</code>
            {person.referred_by_code ? <> · referred with <code>{person.referred_by_code}</code></> : null} ·{" "}
            {p.has_account ? `FinEd account since ${when(p.account_created_at)}` : "no FinEd account"}
          </div>
        </div>
        {person.disqualified_at && <span className="adm-pill adm-pill--bad">Disqualified</span>}
      </div>

      {person.disqualified_at && (
        <div style={{ marginTop: 14 }}>
          <Notice kind="warn">Disqualified {when(person.disqualified_at)}: {person.disqualified_reason}</Notice>
        </div>
      )}
      {notice && <div style={{ marginTop: 14 }}><Notice kind={notice.ok ? "ok" : "bad"}>{notice.message}</Notice></div>}

      <div className="adm-stats">
        <div className="adm-stat"><b>{p.total_points}</b><span>Points</span></div>
        {W.weeks.map((w, i) => (
          <div key={w.label} className="adm-stat"><b>{p.week_points[i + 1] || 0}</b><span>{w.label}</span></div>
        ))}
        <div className="adm-stat"><b>{p.streak.current}</b><span>Streak (best {p.streak.best})</span></div>
        <div className="adm-stat"><b>{p.resets.left}</b><span>Resets left ({p.resets.used} used)</span></div>
      </div>

      <DayStrip done={p.days_done} missed={p.days_missed} />

      <div className="adm-actions">
        <button type="button" className="adm-btn" onClick={grant}>Grant or take back points</button>
        <button type="button" className="adm-btn" onClick={gift}>Gift a reset</button>
        {person.disqualified_at ? (
          <button type="button" className="adm-btn" onClick={reinstate}>Reinstate</button>
        ) : (
          <button type="button" className="adm-btn adm-btn--danger" onClick={dq}>Disqualify</button>
        )}
      </div>

      <h3>Friends who joined with their link ({p.friends.length})</h3>
      {p.friends.length ? (
        <ul className="waa-friends">
          {p.friends.map((f) => (
            <li key={f.id}><Link to={`/admin/winterarc/people?id=${f.id}`}>{f.name || f.email}</Link> <span className="waa-sub">{when(f.created_at)}</span></li>
          ))}
        </ul>
      ) : <p className="adm-note">None.</p>}

      <h3>History</h3>
      {p.history.length ? (
        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead><tr><th>When</th><th>What</th><th className="num">Points</th><th>Week</th><th>Detail</th></tr></thead>
            <tbody>
              {p.history.map((h, i) => (
                <tr key={i}>
                  <td>{when(h.at)}</td>
                  <td>{KIND[h.kind] || h.kind}</td>
                  <td className="num">{h.points > 0 ? `+${h.points}` : h.points}</td>
                  <td>{h.week}</td>
                  <td>{h.day ? `Day ${h.day}` : h.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <div className="adm-empty">Nothing yet. Points from answering questions show in the weekly totals above.</div>}
    </section>
  );
}

function Winners() {
  // board: a week number, null for overall, or "day" for the daily boards
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const daily = week === "day";
  useEffect(() => {
    let live = true;
    getWinners(daily ? null : week, daily ? day : null)
      .then((d) => { if (live) { setData(d); setError(""); } })
      .catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [week, day, daily]);
  const shown = data && (daily ? data.day === day : !data.day && (data.week ?? null) === week) ? data : null;
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>Winners to verify</h2>
        {shown && (
          <span className={`adm-pill ${shown.closed ? "adm-pill--draft" : "adm-pill--live"}`}>
            {shown.closed ? "Closed" : "Still open, closes"} {when(shown.closes_at)}
          </span>
        )}
      </div>
      <div className="waa-winners-bar">
        <div className="adm-seg" role="group" aria-label="Board">
          {[["day", "Daily"], ...W.weeks.map((w, i) => [i + 1, w.label]), [null, "Overall"]].map(([w, l]) => (
            <button key={l} type="button" className={week === w ? "on" : ""} aria-pressed={week === w} onClick={() => setWeek(w)}>{l}</button>
          ))}
        </div>
        {daily && (
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} aria-label="Day">
            {Array.from({ length: W.totalDays }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Day {n}</option>)}
          </select>
        )}
      </div>
      {daily && (
        <p className="adm-note" style={{ marginBottom: 12 }}>
          Daily prize: ₹{shown?.prize ?? 100} to rank 1. A day's score counts only questions finished inside its {W.lateFullHours}-hour
          full-points window; ties go to whoever finished first.
        </p>
      )}
      {error && <Notice kind="bad">{error}</Notice>}
      {shown && (
        <>
          <p className="adm-note" style={{ marginBottom: 12 }}>Disqualified people are already left out.</p>
          {shown.rows.length === 0 ? <div className="adm-empty">No points on this board yet.</div> : (
            <div className="adm-table-scroll">
              <table className="adm-table">
                <thead><tr><th>Rank</th><th>Name</th><th>Email</th><th>College</th><th className="num">Points</th><th>{daily ? "Finished at" : "Days on time"}</th><th></th></tr></thead>
                <tbody>
                  {shown.rows.map((r) => (
                    <tr key={r.email}>
                      <td>{r.rank}</td>
                      <td>{r.name || r.display_name}</td>
                      <td>{r.email}</td>
                      <td>{r.college || ""}</td>
                      <td className="num">{r.points}</td>
                      <td>{daily ? when(r.reached_at) : r.on_time_days}</td>
                      <td>{r.person_id && <Link to={`/admin/winterarc/people?id=${r.person_id}`}>Open</Link>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default function AdminWinterArcPeople() {
  const [params, setParams] = useSearchParams();
  const id = params.get("id");
  const [q, setQ] = useState("");
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");

  const search = async (e) => {
    e.preventDefault();
    setError("");
    try {
      setResults((await searchPeople(q)).people);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <WinterArcAdminShell
      title="People and winners"
      lede="Find someone by name, email, college or referral code. Every change is kept with your email and a reason; nothing is deleted."
    >
      <section className="adm-card">
        <form className="waa-search" onSubmit={search} role="search">
          <input className="adm-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, college or code" aria-label="Search people" />
          <button type="submit" className="adm-btn adm-btn--primary">Search</button>
        </form>
        {error && <div style={{ marginTop: 12 }}><Notice kind="bad">{error}</Notice></div>}
        {results && (
          results.length === 0 ? <div className="adm-empty" style={{ marginTop: 14 }}>Nobody found.</div> : (
            <div className="waa-results">
              {results.map((r) => (
                <button key={r.id} type="button" className={`waa-result${r.id === id ? " is-on" : ""}`} onClick={() => setParams({ id: r.id })}>
                  <strong>{r.name || "(no name)"}{r.disqualified_at ? <span className="adm-pill adm-pill--bad" style={{ marginLeft: 6 }}>Disqualified</span> : null}</strong>
                  <small>{r.email} · {r.college || "No college"} · {r.referral_code}</small>
                </button>
              ))}
            </div>
          )
        )}
      </section>

      {id && <Person key={id} id={id} />}
      <Winners />
    </WinterArcAdminShell>
  );
}
