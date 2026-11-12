// Admin: WinterArc referral checks. A referral can be approved (+10 to the
// referrer, at most 20) once the friend has finished Day 3. Flags are reasons
// to look closely; none of them blocks anything. Rejections need a reason
// and can be undone; approved points are taken back with a -10 grant on the
// referrer (People page).
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { decideReferral, getReferrals, when } from "./winterarcAdminApi";
import "./CardFields/authoring.css";

const FILTERS = [
  ["ready", "Ready to check"],
  ["waiting", "Waiting for Day 3"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["flagged", "Flagged"],
  ["all", "All"],
];
const LABEL = { ready: "Ready to check", waiting: "Waiting for Day 3", approved: "Approved", rejected: "Rejected" };

export default function AdminWinterArcReferrals() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("ready");
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = useCallback(() => getReferrals().then(setData).catch((e) => setNotice({ ok: false, message: e.message })), []);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (r, decision) => {
    let reason = null;
    if (decision === "reject") {
      reason = window.prompt(`Why reject ${r.friend_name || r.friend_email} (referred by ${r.referrer_name || r.code})?`);
      if (!reason || !reason.trim()) return;
    } else if (decision === "approve") {
      if (!window.confirm(`Approve: +${data.points} points to ${r.referrer_name || r.referrer_email} for referring ${r.friend_name || r.friend_email}?`)) return;
    }
    setBusy(r.friend_id);
    setNotice(null);
    try {
      await decideReferral(r.friend_id, decision, reason);
      setNotice({ ok: true, message: decision === "approve" ? "Approved." : decision === "reject" ? "Rejected." : "Rejection undone." });
      await load();
    } catch (e) {
      setNotice({ ok: false, message: e.message });
    } finally {
      setBusy(null);
    }
  };

  const rows = (data?.referrals || []).filter((r) =>
    filter === "all" ? true : filter === "flagged" ? r.flags.length > 0 : r.status === filter
  );

  return (
    <main className="af-page wa-admin-page">
      <div className="af-page-head">
        <div>
          <h1>WinterArc referral checks</h1>
          <div className="af-hint">
            A referral earns the referrer +{data?.points ?? 10} points (up to {data?.cap ?? 20}) once the friend finishes Day 3 and you
            approve it. Flags are reasons to look closely; they don't block anything. The pre-launch ₹500 contest is on the Numbers page.
          </div>
        </div>
        <div className="wa-admin-actions">
          <Link className="af-btn" to="/admin/winterarc/people">People</Link>
          <Link className="af-btn" to="/admin/winterarc/metrics">Numbers</Link>
        </div>
      </div>

      {notice && <div className={notice.ok ? "af-ok" : "af-error"}>{notice.message}</div>}

      <div className="wa-admin-filters" role="group" aria-label="Filter">
        {FILTERS.map(([k, l]) => (
          <button key={k} type="button" className={`af-btn${filter === k ? " af-btn--primary" : ""}`} onClick={() => setFilter(k)}>
            {l}
            {k in (data?.counts || {}) ? ` (${data.counts[k]})` : k === "flagged" && data ? ` (${data.referrals.filter((r) => r.flags.length).length})` : ""}
          </button>
        ))}
      </div>

      {data && rows.length === 0 && <p className="af-hint">Nothing here.</p>}
      <div className="wa-admin-list">
        {rows.map((r) => (
          <div key={r.friend_id} className={`af-item wa-ref-item${r.flags.length ? " is-flagged" : ""}`}>
            <div className="wa-ref-top">
              <div>
                <strong>{r.friend_name || "(no name)"}</strong> <span className="af-hint">{r.friend_email}</span>
                {r.friend_college && <div className="af-hint">{r.friend_college}</div>}
                <div className="af-hint">
                  Joined {when(r.joined_at)} with code {r.code}, from{" "}
                  {r.referrer_id ? <Link to={`/admin/winterarc/people?id=${r.referrer_id}`}>{r.referrer_name || r.referrer_email}</Link> : "nobody on the list"}
                </div>
              </div>
              <span className={`af-badge af-badge--${r.status === "approved" ? "published" : r.status === "rejected" ? "archived" : "draft"}`}>{LABEL[r.status]}</span>
            </div>
            {r.flags.length > 0 && (
              <ul className="wa-ref-flags">{r.flags.map((f) => <li key={f}>{f}</li>)}</ul>
            )}
            {r.decided_reason && <div className="af-hint">Note: {r.decided_reason}</div>}
            <div className="wa-admin-actions">
              {r.status === "ready" && (
                <button type="button" className="af-btn af-btn--primary" disabled={busy === r.friend_id} onClick={() => act(r, "approve")}>Approve</button>
              )}
              {(r.status === "ready" || r.status === "waiting") && (
                <button type="button" className="af-btn af-btn--danger" disabled={busy === r.friend_id} onClick={() => act(r, "reject")}>Reject</button>
              )}
              {r.status === "rejected" && (
                <button type="button" className="af-btn" disabled={busy === r.friend_id} onClick={() => act(r, "undo")}>Undo rejection</button>
              )}
              <Link className="af-btn" to={`/admin/winterarc/people?id=${r.friend_id}`}>Friend's record</Link>
            </div>
          </div>
        ))}
      </div>
      <AdminWinterArcStyles />
    </main>
  );
}

export function AdminWinterArcStyles() {
  return (
    <style>{`
      .wa-admin-page > * { min-width: 0; }
      .wa-admin-actions { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
      .wa-admin-filters { display: flex; gap: 6px; flex-wrap: wrap; }
      .wa-admin-list { display: grid; gap: 10px; }
      .wa-ref-item.is-flagged { border-color: #f59e0b; }
      .wa-ref-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
      .wa-ref-top > div { min-width: 0; overflow-wrap: anywhere; }
      .wa-ref-flags { margin: 8px 0; padding-left: 18px; color: #92400e; font-size: 0.9rem; }
      .wa-admin-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; min-width: 560px; }
      .wa-admin-table th, .wa-admin-table td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
      .wa-admin-scroll { overflow-x: auto; }
      .wa-admin-tiles { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
      .wa-admin-tile { padding: 12px; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff; }
      .wa-admin-tile strong { display: block; font-size: 1.3rem; }
      .wa-admin-tile span { font-size: 0.8rem; color: #6b7280; }
      .wa-admin-search { display: flex; gap: 8px; }
      .wa-admin-search input { flex: 1; min-width: 0; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 10px; }
    `}</style>
  );
}
