// Admin: WinterArc numbers (backend routes/winterarc_metrics.py; every
// definition is in migration 010_winterarc_metrics.sql). No emails are shown
// or exported. Each table downloads as CSV for reports.
import { useEffect, useState } from "react";
import { getWinterArcMetrics, getWinterArcReferralContest } from "../../services/api";
import WinterArcAdminShell, { Loading, Notice } from "./WinterArcAdminShell";

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

function CsvButton({ onClick }) {
  return (
    <button type="button" className="adm-btn adm-btn--sm" onClick={onClick}>
      Download CSV
    </button>
  );
}

function Table({ title, firstCol, rows, file, extra = [] }) {
  const cols = [...extra, ...COLS];
  return (
    <section className="adm-card">
      <div className="adm-card-head">
        <h2>{title}</h2>
        {rows.length > 0 && (
          <CsvButton onClick={() => download(file, [firstCol, ...cols.map((c) => c[1])], rows.map((r) => [r.group ?? r.code, ...cols.map(([k]) => r[k])]))} />
        )}
      </div>
      {rows.length === 0 ? (
        <div className="adm-empty">Nothing yet.</div>
      ) : (
        <div className="adm-table-scroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>{firstCol}</th>
                {cols.map(([k, l]) => <th key={k} className={k === "name" ? "" : "num"}>{l}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.group ?? r.code}>
                  <td>{r.group ?? r.code}</td>
                  {cols.map(([k]) => <td key={k} className={k === "name" ? "" : "num"}>{r[k]}{k.endsWith("_rate") ? "%" : ""}</td>)}
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
  // Which contest to show: the one running now (null) or a chosen one
  const [contestKey, setContestKey] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getWinterArcMetrics().then(setData).catch((e) => setError(e.message || "Couldn't load the numbers."));
  }, []);
  useEffect(() => {
    let live = true;
    getWinterArcReferralContest(contestKey)
      .then((c) => live && setContest(c))
      .catch(() => live && setContest({ rows: [], failed: true, contest: contestKey }));
    return () => {
      live = false;
    };
  }, [contestKey]);

  const shell = (body) => (
    <WinterArcAdminShell
      title="Numbers"
      lede={
        <>
          Exact counts from the database. <strong>Activated</strong> = answered at least one WinterArc question.{" "}
          <strong>Came back within 7 days</strong> = activated, then answered again on a different day (IST) within 7 days of
          their first answer; its % is out of those activated. No emails are shown or exported.
        </>
      }
    >
      {body}
    </WinterArcAdminShell>
  );

  if (error) return shell(<Notice kind="bad">{error}</Notice>);
  if (!data) return shell(<Loading />);
  const t = data.totals;
  const stamp = new Date().toISOString().slice(0, 10);
  const min = contest?.minimum ?? 3;

  return shell(
    <>
      <div className="adm-stats">
        {COLS.map(([k, l]) => (
          <div key={k} className="adm-stat">
            <b>{t[k]}{k.endsWith("_rate") ? "%" : ""}</b>
            <span>{l}</span>
          </div>
        ))}
      </div>

      {Object.entries(data.breakdowns).map(([key, b]) => (
        <Table key={key} title={b.label} firstCol={b.label} rows={b.rows} file={`winterarc-${key}-${stamp}.csv`} />
      ))}

      <section className="adm-card">
        <div className="adm-card-head">
          <h2>Avalanche Award (₹500 each contest)</h2>
          {contest?.rows?.length > 0 && (
            <CsvButton
              onClick={() => download(`winterarc-referral-contest-${contest.contest}-${stamp}.csv`, ["Rank", "Code", "Referrer", "Joined", "Counted (3 days)", "Eligible (3+)", "Leading", "Reached that count at"], contest.rows.map((r) => [r.rank, r.code, r.referrer_name, r.joined, r.referrals, r.eligible ? "yes" : "no", r.leading ? "yes" : "", r.reached_at]))}
            />
          )}
        </div>
        <div className="adm-seg" role="group" aria-label="Contest">
          {[["nov", "By 30 Nov"], ["dec", "1–30 Dec"]].map(([k, l]) => (
            <button key={k} type="button" className={contest?.contest === k ? "on" : ""} aria-pressed={contest?.contest === k} onClick={() => setContestKey(k)}>{l}</button>
          ))}
        </div>
        <p className="adm-note" style={{ margin: "10px 0 12px" }}>
          Counts a friend who joined with the referral link inside the contest's dates and has a FinEd account with the same
          email by its close, and has then finished 3 full days ({contest?.contest === "dec" ? "any 3 by 30 Dec" : "Days 1-3 by 3 Dec"}; results {contest?.results_on}). "Joined" is everyone who signed up with the link. Only referrers with at least {min} friends can win; the leader among them is
          highlighted. Ties go to whoever reached the count first. Check the winner by hand before paying.
        </p>
        {!contest ? null : contest.failed ? (
          <Notice kind="warn">Couldn't load the contest (has migration 014 run?).</Notice>
        ) : contest.rows.length === 0 ? (
          <div className="adm-empty">No counted referrals yet.</div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead><tr><th>Rank</th><th>Code</th><th>Referrer</th><th className="num">Joined</th><th className="num">Counted (3 days)</th><th>Eligible</th></tr></thead>
              <tbody>
                {contest.rows.map((r) => (
                  <tr key={r.code} className={r.leading ? "is-lead" : ""}>
                    <td>{r.rank}</td>
                    <td>{r.code}</td>
                    <td>{r.referrer_name || "(unknown)"}</td>
                    <td className="num">{r.joined ?? ""}</td>
                    <td className="num">{r.referrals}</td>
                    <td>
                      {r.leading ? <span className="adm-pill adm-pill--gold">Winner if checks pass</span>
                        : r.eligible ? <span className="adm-pill adm-pill--live">Yes</span>
                        : <span className="adm-pill adm-pill--draft">Needs {min - r.referrals} more</span>}
                    </td>
                  </tr>
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

      <section className="adm-card">
        <div className="adm-card-head">
          <h2>By challenge day</h2>
          {data.days.length > 0 && (
            <CsvButton
              onClick={() => download(`winterarc-days-${stamp}.csv`, ["Day", "Started", "Finished", "Average points", "Did the action"], data.days.map((d) => [d.day_no, d.started, d.done, d.avg_points, d.actions_done ?? 0]))}
            />
          )}
        </div>
        {data.days.length === 0 ? (
          <div className="adm-empty">No answers yet. This fills in from Day 1.</div>
        ) : (
          <div className="adm-table-scroll">
            <table className="adm-table">
              <thead><tr><th>Day</th><th className="num">Started</th><th className="num">Finished</th><th className="num">Finished %</th><th className="num">Average points</th><th className="num">Did the action</th></tr></thead>
              <tbody>
                {data.days.map((d) => (
                  <tr key={d.day_no}>
                    <td>Day {d.day_no}</td>
                    <td className="num">{d.started}</td>
                    <td className="num">{d.done}</td>
                    <td className="num">{d.started ? `${Math.round((d.done / d.started) * 100)}%` : ""}</td>
                    <td className="num">{d.avg_points ?? ""}</td>
                    <td className="num">{d.actions_done ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
