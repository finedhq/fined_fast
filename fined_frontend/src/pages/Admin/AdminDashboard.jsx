// Admin home: a WinterArc status line (from the calendar endpoint) and the
// admin tools grouped by job. Styles in admin-ui.css.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getWinterArcCalendar } from "../../services/api";
import { WINTERARC as W } from "../WinterArc/winterarcConfig";
import "./admin-ui.css";

const GROUPS = [
  {
    title: "Courses",
    tools: [
      { to: "/admin/courses", label: "All courses", hint: "Edit courses, modules and cards, publish or hide" },
      { to: "/admin/courses/add", label: "Add a course", hint: "Start a new course as a draft" },
      { to: "/admin/cards/add", label: "Add a card", hint: "Add one card to any module" },
    ],
  },
  {
    title: "Articles and newsletter",
    tools: [
      { to: "/admin/articles", label: "All articles", hint: "Edit, publish or remove articles" },
      { to: "/admin/articles/add", label: "Add an article" },
      { to: "/admin/newsletters", label: "Send newsletter", hint: "Mails every subscriber" },
      { to: "/admin/sources", label: "Content sources", hint: "Source links behind the facts in course content" },
    ],
  },
  {
    title: "WinterArc",
    tools: [
      { to: "/admin/winterarc", label: "Calendar", hint: "Publish or hide each day" },
      { to: "/admin/winterarc/metrics", label: "Numbers", hint: "Sign-ups, activation, days, referral contest" },
      { to: "/admin/winterarc/people", label: "People and winners", hint: "Grant points, gift resets, verify boards" },
      { to: "/admin/winterarc/referrals", label: "Referral checks", hint: "Approve or reject referred friends" },
    ],
  },
  {
    title: "Other",
    tools: [
      { to: "/admin/certificate-preview", label: "Certificate preview", hint: "Try any name and course, test the downloads" },
      { label: "Settings", hint: "Coming soon" },
    ],
  },
];

function WinterArcLine() {
  const [cal, setCal] = useState(null);
  const [failed, setFailed] = useState(false);
  const [now] = useState(() => Date.now());
  useEffect(() => {
    let live = true;
    getWinterArcCalendar().then((c) => live && setCal(c)).catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, []);

  const start = Date.parse(W.startsAt);
  const dayNow = Math.floor((now - start) / 86400000) + 1;
  const left = Math.ceil((start - now) / 86400000);
  const when = dayNow < 1 ? `Starts in ${left} ${left === 1 ? "day" : "days"}` : dayNow <= W.totalDays ? `Day ${dayNow} of ${W.totalDays} today` : "Finished";

  const days = cal?.days || [];
  const published = days.filter((d) => d.released).length;
  const attention = days.filter((d) => d.problems.length).length;
  let line = "Loading…";
  if (failed) line = "Couldn't load the calendar.";
  else if (cal && !cal.course) line = `No course with the slug "${cal.course_slug}" yet.`;
  else if (cal) line = `${published} of ${W.totalDays} days published${attention ? `, ${attention} need attention` : ""}.`;

  return (
    <section className="adm-card adm-wa-line">
      <div>
        <h2>WinterArc: {when}</h2>
        <p>{line}</p>
      </div>
      <Link className="adm-btn" to="/admin/winterarc">Open the calendar</Link>
    </section>
  );
}

function AdminDashboard() {
  return (
    <main className="adm">
      <div className="adm-wrap">
        <header className="adm-head">
          <h1>Admin panel</h1>
          <Link className="adm-btn" to="/">Back to the site</Link>
        </header>

        <WinterArcLine />

        <div className="adm-groups">
          {GROUPS.map((g) => (
            <section key={g.title} className="adm-card">
              <h2 style={{ marginBottom: 10 }}>{g.title}</h2>
              <ul className="adm-links">
                {g.tools.map((t) => (
                  <li key={t.label}>
                    {t.to ? <Link to={t.to}>{t.label}</Link> : <span className="soon">{t.label}</span>}
                    {t.hint && <span>{t.hint}</span>}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export default AdminDashboard;
