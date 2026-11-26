// Admin: the WinterArc 30-day calendar (backend routes/winterarc_days.py).
// Day n is the module with order_index n in the WinterArc course (a draft
// course, so the normal course pages never show it). A day opens to members
// at midnight IST on n Dec, and only once its module is published here.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import instance from "../../lib/axios";
import { getWinterArcCalendar } from "../../services/api";
import { WINTERARC as W } from "../WinterArc/winterarcConfig";
import WinterArcAdminShell, { Loading, Notice } from "./WinterArcAdminShell";

const when = (iso) =>
  new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
const shortDate = (iso) => new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

function Day({ d, courseId, onStatus }) {
  const status = d.open_now ? ["live", "Open now"] : d.released ? ["ok", "Published"] : ["", "Draft"];
  return (
    <tr className={d.problems.length ? "has-problem" : ""}>
      <td><strong>Day {d.day}</strong></td>
      <td>{when(d.opens_at)}</td>
      <td>
        {d.module ? (
          <Link to={`/admin/courses/${courseId}/modules/${d.module.id}/cards`}>{d.module.title}</Link>
        ) : (
          <span className="waa-sub">No module yet</span>
        )}
        {d.module && <div className="waa-sub">{d.questions} {d.questions === 1 ? "question" : "questions"}</div>}
      </td>
      <td>{d.module && <span className={`adm-pill${status[0] ? ` adm-pill--${status[0]}` : ""}`}>{status[1]}</span>}</td>
      <td>
        {d.problems.length ? (
          <ul className="waa-problems">{d.problems.map((p) => <li key={p}>{p}</li>)}</ul>
        ) : (
          <span className="waa-ok">OK</span>
        )}
      </td>
      <td>
        {d.module && (
          <div className="adm-actions">
            <Link className="adm-btn adm-btn--sm" to={`/winterarc/day/${d.day}`}>Preview</Link>
            <button
              type="button"
              className={`adm-btn adm-btn--sm${d.released ? "" : " adm-btn--primary"}`}
              onClick={() => onStatus(d, d.released ? "draft" : "published")}
            >
              {d.released ? "Hide" : "Publish"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}

export default function AdminWinterArc() {
  const [cal, setCal] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(() => {
    getWinterArcCalendar().then((c) => { setNow(Date.now()); setCal(c); }).catch((e) => setError(e.message || "Couldn't load the calendar."));
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

  const slug = cal?.course?.slug || cal?.course_slug;
  const shell = (body) => (
    <WinterArcAdminShell
      title="Calendar"
      lede={
        <>
          Day n is the module with order n in the course <code>{slug || "winterarc"}</code>. Keep that course a draft. Each
          day opens at midnight IST on its date once published, and needs 3 questions with explanations (the finale can have more).
        </>
      }
      actions={cal?.course && (
        <Link className="adm-btn" to={`/admin/courses/${cal.course.id}/modules`}>Edit the modules</Link>
      )}
    >
      {body}
    </WinterArcAdminShell>
  );

  if (error) return shell(<Notice kind="bad">{error}</Notice>);
  if (!cal) return shell(<Loading />);

  const days = cal.days;
  const problems = days.filter((d) => d.problems.length).length;
  const published = days.filter((d) => d.released).length;
  const openNow = days.filter((d) => d.open_now).length;
  const next = days.find((d) => Date.parse(d.opens_at) > now);

  return shell(
    <>
      {!cal.course ? (
        <Notice kind="warn">
          There is no course with the slug <code>{cal.course_slug}</code> yet. Create it as a draft, then add a module per day.
        </Notice>
      ) : (
        <>
          <div className="adm-stats">
            <div className="adm-stat"><b>{published} / {W.totalDays}</b><span>Days published</span></div>
            <div className="adm-stat"><b>{openNow}</b><span>Open to members now</span></div>
            <div className={`adm-stat${problems ? " adm-stat--warn" : ""}`}><b>{problems}</b><span>{problems === 1 ? "Day needs" : "Days need"} attention</span></div>
            <div className="adm-stat">
              <b>{next ? `Day ${next.day}` : "None"}</b>
              <span>{next ? `Opens next, ${shortDate(next.opens_at)} (${next.released ? "published" : "draft"})` : "Every day has opened"}</span>
            </div>
          </div>

          <div className="adm-card">
            <div className="adm-table-scroll">
              <table className="adm-table waa-cal">
                <thead>
                  <tr><th>Day</th><th>Opens (IST)</th><th>Module</th><th>Status</th><th>Checks</th><th></th></tr>
                </thead>
                <tbody>
                  {W.weeks.map((w, i) => {
                    const inWeek = days.filter((d) => d.week === i + 1);
                    if (!inWeek.length) return null;
                    const pub = inWeek.filter((d) => d.released).length;
                    return [
                      <tr key={w.label} className="waa-week-row">
                        <td colSpan={6}>{w.label} (Days {w.from}–{w.to}), {pub} of {inWeek.length} published</td>
                      </tr>,
                      ...inWeek.map((d) => <Day key={d.day} d={d} courseId={cal.course.id} onStatus={setStatus} />),
                    ];
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
