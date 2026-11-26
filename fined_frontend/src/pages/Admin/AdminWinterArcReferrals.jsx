// Admin: WinterArc referral checks. A referral can be approved (+10 to the
// referrer, at most 20) once the friend has finished Day 3. Flags are reasons
// to look closely; none of them blocks anything. Rejections need a reason
// and can be undone; approved points are taken back with a -10 grant on the
// referrer (People page).
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { decideReferral, getReferrals, when } from "./winterarcAdminApi";
import WinterArcAdminShell, { Loading, Notice } from "./WinterArcAdminShell";

const FILTERS = [
  ["ready", "Ready to check"],
  ["waiting", "Waiting for Day 3"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["flagged", "Flagged"],
  ["all", "All"],
];
const LABEL = { ready: "Ready to check", waiting: "Waiting for Day 3", approved: "Approved", rejected: "Rejected" };
const PILL = { ready: "ok", approved: "live", rejected: "bad" };

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
  const count = (k) =>
    !data ? null : k in (data.counts || {}) ? data.counts[k] : k === "flagged" ? data.referrals.filter((r) => r.flags.length).length : null;

  return (
    <WinterArcAdminShell
      title="Referral checks"
      lede={`A referral earns the referrer +${data?.points ?? 10} points (up to ${data?.cap ?? 20}) once the friend finishes Day 3 and you approve it. Flags are reasons to look closely; they don't block anything. The ₹500 Avalanche Award is on the Numbers page.`}
    >
      {notice && <Notice kind={notice.ok ? "ok" : "bad"}>{notice.message}</Notice>}

      <div className="adm-seg" role="group" aria-label="Filter">
        {FILTERS.map(([k, l]) => {
          const n = count(k);
          return (
            <button key={k} type="button" className={filter === k ? "on" : ""} aria-pressed={filter === k} onClick={() => setFilter(k)}>
              {l}
              {n != null && <span className="adm-count">({n})</span>}
            </button>
          );
        })}
      </div>

      {!data && !notice && <Loading />}
      {data && rows.length === 0 && <div className="adm-empty">Nothing here.</div>}
      <div className="waa-refs">
        {rows.map((r) => (
          <article key={r.friend_id} className={`waa-ref${r.flags.length ? " is-flagged" : ""}`}>
            <div className="waa-ref-top">
              <div>
                <strong>{r.friend_name || "(no name)"}</strong>
                <div className="waa-ref-line">{r.friend_email}{r.friend_college ? ` · ${r.friend_college}` : ""}</div>
                <div className="waa-ref-line">
                  Joined {when(r.joined_at)} with code <code>{r.code}</code>, from{" "}
                  {r.referrer_id ? <Link to={`/admin/winterarc/people?id=${r.referrer_id}`}>{r.referrer_name || r.referrer_email}</Link> : "nobody on the list"}
                </div>
              </div>
              <span className={`adm-pill${PILL[r.status] ? ` adm-pill--${PILL[r.status]}` : ""}`}>{LABEL[r.status]}</span>
            </div>
            {r.flags.length > 0 && (
              <ul className="waa-ref-flags">{r.flags.map((f) => <li key={f}>{f}</li>)}</ul>
            )}
            {r.decided_reason && <div className="waa-ref-note">Note: {r.decided_reason}</div>}
            <div className="adm-actions">
              {r.status === "ready" && (
                <button type="button" className="adm-btn adm-btn--primary" disabled={busy === r.friend_id} onClick={() => act(r, "approve")}>
                  Approve
                </button>
              )}
              {(r.status === "ready" || r.status === "waiting") && (
                <button type="button" className="adm-btn adm-btn--danger" disabled={busy === r.friend_id} onClick={() => act(r, "reject")}>
                  Reject
                </button>
              )}
              {r.status === "rejected" && (
                <button type="button" className="adm-btn" disabled={busy === r.friend_id} onClick={() => act(r, "undo")}>
                  Undo rejection
                </button>
              )}
              <Link className="adm-btn" to={`/admin/winterarc/people?id=${r.friend_id}`}>Friend's record</Link>
            </div>
          </article>
        ))}
      </div>
    </WinterArcAdminShell>
  );
}
