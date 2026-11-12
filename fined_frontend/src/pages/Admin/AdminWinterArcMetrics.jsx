// Admin: WinterArc numbers (backend routes/winterarc_metrics.py; every
// definition is in migration 010_winterarc_metrics.sql). No emails are shown
// or exported. Each table downloads as CSV for reports.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWinterArcMetrics, getWinterArcReferralContest } from "../../services/api";
import "./CardFields/authoring.css";

const COLS = [
  ["signed_up", "Signed up"],
  ["has_account", "Has a FinEd account"],
  ["activated", "Activated"],
  ["activation_rate", "Activated %"],
  ["returned_7d", "Came back within 7 days"],
  ["return_rate", "Came back %"],
];

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function download(name, header, rows) {
  const text = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Table({ title, firstCol, rows, file, extra = [] }) {
  const cols = [...extra, ...COLS];
  return (
    <section className="wa-metrics-block">
      <div className="wa-metrics-head">
        <h2>{title}</h2>
        {rows.length > 0 && (
          <button
            type="button"
            className="af-btn"
            onClick={() => download(file, [firstCol, ...cols.map((c) => c[1])], rows.map((r) => [r.group ?? r.code, ...cols.map(([k]) => r[k])]))}
          >
            Download CSV
          </button>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="af-hint">Nothing yet.</p>
      ) : (
        <div className="wa-metrics-scroll">
          <table className="wa-metrics-table">
            <thead>
              <tr>
                <th>{firstCol}</th>
                {cols.map(([k, l]) => <th key={k}>{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.group ?? r.code}>
                  <td>{r.group ?? r.code}</td>
                  {cols.map(([k]) => <td key={k}>{r[k]}{k.endsWith("_rate") ? "%" : ""}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminWinterArcMetrics() {
  const [data, setData] = useState(null);
  const [contest, setContest] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getWinterArcMetrics().then(setData).catch((e) => setError(e.message || "Couldn't load the numbers."));
    getWinterArcReferralContest().then(setContest).catch(() => setContest({ rows: [], failed: true }));
  }, []);

  if (error) return <main className="af-page"><div className="af-error">{error}</div></main>;
  if (!data) return null;
  const t = data.totals;
  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <main className="af-page wa-metrics-page">
      <div className="af-page-head">
        <div>
          <h1>WinterArc numbers</h1>
          <div className="af-hint">
            Exact counts from the database. <strong>Activated</strong> = answered at least one WinterArc question.{" "}
            <strong>Came back within 7 days</strong> = activated, then answered again on a different day (IST) within 7 days of
            their first answer; its % is out of those activated. No emails are shown or exported.
          </div>
        </div>
        <Link className="af-btn" to="/admin/winterarc">Calendar</Link>
      </div>

      <div className="wa-metrics-tiles">
        {COLS.map(([k, l]) => (
          <div key={k} className="wa-metrics-tile">
            <strong>{t[k]}{k.endsWith("_rate") ? "%" : ""}</strong>
            <span>{l}</span>
          </div>
        ))}
      </div>

      {Object.entries(data.breakdowns).map(([key, b]) => (
        <Table key={key} title={b.label} firstCol={b.label} rows={b.rows} file={`winterarc-${key}-${stamp}.csv`} />
      ))}

      <section className="wa-metrics-block">
        <div className="wa-metrics-head">
          <h2>Referral contest (₹500, closes 30 Nov 11:59 pm IST)</h2>
          {contest?.rows?.length > 0 && (
            <button
              type="button"
              className="af-btn"
              onClick={() => download(`winterarc-referral-contest-${stamp}.csv`, ["Rank", "Code", "Referrer", "Counted referrals", "Reached that count at"], contest.rows.map((r) => [r.rank, r.code, r.referrer_name, r.referrals, r.reached_at]))}
            >
              Download CSV
            </button>
          )}
        </div>
        <p className="af-hint">
          Counts a friend who joined with the referral link AND has a FinEd account with the same email, both by the close.
          Ties go to whoever reached the count first. Check the winner by hand before paying.
        </p>
        {!contest ? null : contest.failed ? (
          <p className="af-hint">Couldn't load the contest (has migration 011 run?).</p>
        ) : contest.rows.length === 0 ? (
          <p className="af-hint">No counted referrals yet.</p>
        ) : (
          <div className="wa-metrics-scroll">
            <table className="wa-metrics-table">
              <thead><tr><th>Rank</th><th>Code</th><th>Referrer</th><th>Counted referrals</th></tr></thead>
              <tbody>
                {contest.rows.map((r) => (
                  <tr key={r.code}><td>{r.rank}</td><td>{r.code}</td><td>{r.referrer_name || "(unknown)"}</td><td>{r.referrals}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Table
        title="Top referral codes"
        firstCol="Code"
        rows={data.referrers}
        file={`winterarc-referrers-${stamp}.csv`}
        extra={[["name", "Referrer"]]}
      />

      <section className="wa-metrics-block">
        <div className="wa-metrics-head">
          <h2>By challenge day</h2>
          {data.days.length > 0 && (
            <button
              type="button"
              className="af-btn"
              onClick={() => download(`winterarc-days-${stamp}.csv`, ["Day", "Started", "Finished", "Average points", "Did the action"], data.days.map((d) => [d.day_no, d.started, d.done, d.avg_points, d.actions_done ?? 0]))}
            >
              Download CSV
            </button>
          )}
        </div>
        {data.days.length === 0 ? (
          <p className="af-hint">No answers yet. This fills in from Day 1.</p>
        ) : (
          <div className="wa-metrics-scroll">
            <table className="wa-metrics-table">
              <thead><tr><th>Day</th><th>Started</th><th>Finished</th><th>Average points</th><th>Did the action</th></tr></thead>
              <tbody>
                {data.days.map((d) => (
                  <tr key={d.day_no}><td>{d.day_no}</td><td>{d.started}</td><td>{d.done}</td><td>{d.avg_points ?? ""}</td><td>{d.actions_done ?? 0}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <style>{`
        .wa-metrics-page > * { min-width: 0; }
        .wa-metrics-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; margin: 16px 0 8px; }
        .wa-metrics-tile { display: flex; flex-direction: column; gap: 2px; padding: 14px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }
        .wa-metrics-tile strong { font-size: 1.5rem; }
        .wa-metrics-tile span { font-size: 0.82rem; color: #6b7280; }
        .wa-metrics-block { margin-top: 28px; }
        .wa-metrics-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .wa-metrics-head h2 { font-size: 1.1rem; margin: 0; }
        .wa-metrics-scroll { overflow-x: auto; margin-top: 10px; }
        .wa-metrics-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 640px; }
        .wa-metrics-table th, .wa-metrics-table td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .wa-metrics-table th { font-weight: 700; color: #374151; }
      `}</style>
    </main>
  );
}
