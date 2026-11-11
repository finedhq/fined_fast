// Admin: the WinterArc 30-day calendar (backend routes/winterarc_days.py).
// Day n is the module with order_index n in the WinterArc course (a draft
// course, so the normal course pages never show it). A day opens to members
// at midnight IST on n Dec, and only once its module is published here.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import instance from "../../lib/axios";
import { getWinterArcCalendar } from "../../services/api";
import "./CardFields/authoring.css";

const when = (iso) =>
  new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function AdminWinterArc() {
  const [cal, setCal] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    getWinterArcCalendar().then(setCal).catch((e) => setError(e.message || "Couldn't load the calendar."));
  }, []);
  useEffect(load, [load]);

  const setStatus = async (d, status) => {
    const msg = status === "published"
      ? `Publish Day ${d.day} ("${d.module.title}")?\n\nMembers can open it from ${when(d.opens_at)} IST (straight away if that time has passed).`
      : `Hide Day ${d.day} again?\n\nMembers lose access until it is published again.`;
    if (!window.confirm(msg)) return;
    try {
      await instance.put(`/modules/${d.module.id}/status`, { status });
      load();
    } catch (err) {
      alert(err?.response?.data?.detail || "Couldn't change the status.");
    }
  };

  if (error) return <main className="af-page"><div className="af-error">{error}</div></main>;
  if (!cal) return null;

  const problems = cal.days.filter((d) => d.problems.length).length;
  return (
    <main className="af-page">
      <div className="af-page-head">
        <div>
          <h1>WinterArc calendar</h1>
          <div className="af-hint">
            Day n is the module with order {"n"} in the course <code>{cal.course?.slug || cal.course_slug}</code>. Keep that
            course a draft. Each day opens at midnight IST on its date once published, and needs 3 questions with explanations
            (the finale can have more).
          </div>
        </div>
        <div className="wa-admin-actions">
          <Link className="af-btn" to="/admin/winterarc/metrics">Numbers</Link>
          <Link className="af-btn" to="/admin/winterarc/people">People</Link>
          <Link className="af-btn" to="/admin/winterarc/referrals">Referral checks</Link>
          {cal.course && <Link className="af-btn" to={`/admin/courses/${cal.course.id}/modules`}>Edit the modules</Link>}
        </div>
      </div>

      {!cal.course && (
        <div className="af-warn">
          There is no course with the slug <code>{cal.course_slug}</code> yet. Create it as a draft, then add a module per day.
        </div>
      )}
      {cal.course && problems > 0 && <div className="af-warn">{problems} {problems === 1 ? "day needs" : "days need"} attention.</div>}

      {cal.course && (
        <table className="wa-admin-cal">
          <thead>
            <tr>
              <th>Day</th>
              <th>Opens (IST)</th>
              <th>Module</th>
              <th>Status</th>
              <th>Checks</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cal.days.map((d) => (
              <tr key={d.day} className={d.problems.length ? "has-problem" : ""}>
                <td><strong>{d.day}</strong> <span className="af-hint">wk {d.week}</span></td>
                <td>{when(d.opens_at)}</td>
                <td>
                  {d.module ? (
                    <Link to={`/admin/courses/${cal.course.id}/modules/${d.module.id}/cards`}>{d.module.title}</Link>
                  ) : (
                    <span className="af-hint">None</span>
                  )}
                  {d.module && <div className="af-hint">{d.questions} questions</div>}
                </td>
                <td>
                  {d.module && (
                    <span className={`af-badge af-badge--${d.released ? "published" : "draft"}`}>
                      {d.open_now ? "Open now" : d.released ? "Published" : "Draft"}
                    </span>
                  )}
                </td>
                <td>{d.problems.length ? d.problems.join(" ") : "OK"}</td>
                <td className="wa-admin-actions">
                  {d.module && <Link className="af-btn" to={`/winterarc/day/${d.day}`}>Preview</Link>}
                  {d.module && (
                    <button type="button" className={`af-btn${d.released ? "" : " af-btn--primary"}`} onClick={() => setStatus(d, d.released ? "draft" : "published")}>
                      {d.released ? "Hide" : "Publish"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <style>{`
        .wa-admin-cal { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 0.92rem; }
        .wa-admin-cal th, .wa-admin-cal td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
        .wa-admin-cal tr.has-problem td { background: #fffbeb; }
        .wa-admin-actions { display: flex; gap: 6px; flex-wrap: wrap; }
        @media (max-width: 760px) {
          .wa-admin-cal thead { display: none; }
          .wa-admin-cal tr { display: block; border-bottom: 1px solid #e5e7eb; padding: 8px 0; }
          .wa-admin-cal td { display: block; border: 0; padding: 4px 0; }
        }
      `}</style>
    </main>
  );
}
