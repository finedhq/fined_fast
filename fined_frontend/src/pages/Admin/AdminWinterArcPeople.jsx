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
import { AdminWinterArcStyles } from "./AdminWinterArcReferrals";
import "./CardFields/authoring.css";

const KIND = {
  streak_bonus: "Streak bonus",
  referral: "Referral approved",
  referral_rejected: "Referral rejected (no points)",
  admin_grant: "Points granted",
  reversal: "Points taken back",
  reset_used: "Reset used",
  reset_earned: "Reset earned",
};

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

  if (!p) return notice ? <div className="af-error">{notice.message}</div> : null;
  const person = p.person;
  return (
    <section className="af-item">
      <div className="wa-ref-top">
        <div>
          <h2 style={{ margin: 0 }}>{person.name || "(no name)"}</h2>
          <div className="af-hint">{person.email}{person.college ? ` · ${person.college}` : ""}</div>
          <div className="af-hint">
            Joined {when(person.created_at)} · code {person.referral_code}
            {person.referred_by_code ? ` · referred with ${person.referred_by_code}` : ""} ·{" "}
            {p.has_account ? `FinEd account since ${when(p.account_created_at)}` : "no FinEd account"}
          </div>
        </div>
        {person.disqualified_at && <span className="af-badge af-badge--archived">Disqualified</span>}
      </div>
      {person.disqualified_at && <div className="af-warn">Disqualified {when(person.disqualified_at)}: {person.disqualified_reason}</div>}
      {notice && <div className={notice.ok ? "af-ok" : "af-error"}>{notice.message}</div>}

      <div className="wa-admin-tiles" style={{ marginTop: 12 }}>
        <div className="wa-admin-tile"><strong>{p.total_points}</strong><span>points</span></div>
        {W.weeks.map((w, i) => (
          <div key={w.label} className="wa-admin-tile"><strong>{p.week_points[i + 1] || 0}</strong><span>{w.label}</span></div>
        ))}
        <div className="wa-admin-tile"><strong>{p.streak.current}</strong><span>streak (best {p.streak.best})</span></div>
        <div className="wa-admin-tile"><strong>{p.resets.left}</strong><span>resets left ({p.resets.used} used)</span></div>
      </div>
      <p className="af-hint">
        Days done on time or repaired: {p.days_done.length ? p.days_done.join(", ") : "none"}. Missed: {p.days_missed.length ? p.days_missed.join(", ") : "none"}.
      </p>

      <div className="wa-admin-actions">
        <button type="button" className="af-btn" onClick={grant}>Grant or take back points</button>
        <button type="button" className="af-btn" onClick={gift}>Gift a reset</button>
        {person.disqualified_at ? (
          <button type="button" className="af-btn" onClick={reinstate}>Reinstate</button>
        ) : (
          <button type="button" className="af-btn af-btn--danger" onClick={dq}>Disqualify</button>
        )}
      </div>

      <h3>Friends who joined with their link ({p.friends.length})</h3>
      {p.friends.length ? (
        <ul>{p.friends.map((f) => <li key={f.id}><Link to={`/admin/winterarc/people?id=${f.id}`}>{f.name || f.email}</Link> <span className="af-hint">{when(f.created_at)}</span></li>)}</ul>
      ) : <p className="af-hint">None.</p>}

      <h3>History</h3>
      {p.history.length ? (
        <div className="wa-admin-scroll">
          <table className="wa-admin-table">
            <thead><tr><th>When</th><th>What</th><th>Points</th><th>Week</th><th>Detail</th></tr></thead>
            <tbody>
              {p.history.map((h, i) => (
                <tr key={i}><td>{when(h.at)}</td><td>{KIND[h.kind] || h.kind}</td><td>{h.points}</td><td>{h.week}</td><td>{h.day ? `Day ${h.day}` : h.ref}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <p className="af-hint">Nothing yet. Points from answering questions show in the weekly totals above.</p>}
    </section>
  );
}

function Winners() {
  const [week, setWeek] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    getWinners(week).then((d) => live && setData(d)).catch((e) => live && setError(e.message));
    return () => {
      live = false;
    };
  }, [week]);
  const shown = data && (data.week ?? null) === week ? data : null;
  return (
    <section>
      <h2>Winners to verify</h2>
      <div className="wa-admin-filters">
        {[...W.weeks.map((w, i) => [i + 1, w.label]), [null, "Overall"]].map(([w, l]) => (
          <button key={l} type="button" className={`af-btn${week === w ? " af-btn--primary" : ""}`} onClick={() => setWeek(w)}>{l}</button>
        ))}
      </div>
      {error && <div className="af-error">{error}</div>}
      {shown && (
        <>
          <p className="af-hint">{shown.closed ? "Closed" : "Still open, closes"} {when(shown.closes_at)}. Disqualified people are already left out.</p>
          {shown.rows.length === 0 ? <p className="af-hint">No points on this board yet.</p> : (
            <div className="wa-admin-scroll">
              <table className="wa-admin-table">
                <thead><tr><th>Rank</th><th>Name</th><th>Email</th><th>College</th><th>Points</th><th>Days on time</th><th></th></tr></thead>
                <tbody>
                  {shown.rows.map((r) => (
                    <tr key={r.email}>
                      <td>{r.rank}</td><td>{r.name || r.display_name}</td><td>{r.email}</td><td>{r.college || ""}</td>
                      <td>{r.points}</td><td>{r.on_time_days}</td>
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
    <main className="af-page wa-admin-page">
      <div className="af-page-head">
        <div>
          <h1>WinterArc people</h1>
          <div className="af-hint">Find someone by name, email, college or referral code. Every change is kept with your email and a reason; nothing is deleted.</div>
        </div>
        <div className="wa-admin-actions">
          <Link className="af-btn" to="/admin/winterarc/referrals">Referral checks</Link>
          <Link className="af-btn" to="/admin/winterarc">Calendar</Link>
        </div>
      </div>

      <form className="wa-admin-search" onSubmit={search}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, college or code" aria-label="Search people" />
        <button type="submit" className="af-btn af-btn--primary">Search</button>
      </form>
      {error && <div className="af-error">{error}</div>}
      {results && (
        results.length === 0 ? <p className="af-hint">Nobody found.</p> : (
          <div className="wa-admin-list">
            {results.map((r) => (
              <button key={r.id} type="button" className="af-item" style={{ textAlign: "left", cursor: "pointer" }} onClick={() => setParams({ id: r.id })}>
                <strong>{r.name || "(no name)"}</strong> <span className="af-hint">{r.email}</span>
                <div className="af-hint">{r.college || "No college"} · code {r.referral_code}{r.disqualified_at ? " · disqualified" : ""}</div>
              </button>
            ))}
          </div>
        )
      )}

      {id && <Person key={id} id={id} />}
      <Winners />
      <AdminWinterArcStyles />
    </main>
  );
}
