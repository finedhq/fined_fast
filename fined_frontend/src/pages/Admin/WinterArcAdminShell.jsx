// Shared frame for the WinterArc admin pages: back link, title, a line of
// explanation, optional actions, and the section tabs.
import { Link, NavLink } from "react-router-dom";
import "./admin-ui.css";
import "./winterarc-admin.css";

const TABS = [
  ["/admin/winterarc", "Calendar"],
  ["/admin/winterarc/metrics", "Numbers"],
  ["/admin/winterarc/people", "People and winners"],
  ["/admin/winterarc/referrals", "Referral checks"],
];

export default function WinterArcAdminShell({ title, lede, actions, children }) {
  return (
    <main className="adm">
      <div className="adm-wrap">
        <header className="adm-head">
          <div>
            <Link className="adm-back" to="/admin">← Admin</Link>
            <h1>WinterArc: {title}</h1>
            {lede && <p className="adm-lede">{lede}</p>}
          </div>
          {actions && <div className="adm-actions">{actions}</div>}
        </header>
        <nav className="adm-tabs" aria-label="WinterArc admin">
          {TABS.map(([to, label]) => (
            <NavLink key={to} to={to} end className="adm-tab">{label}</NavLink>
          ))}
        </nav>
        {children}
      </div>
    </main>
  );
}

export function Notice({ kind, children }) {
  return <div className={`adm-alert adm-alert--${kind}`} role={kind === "bad" ? "alert" : "status"}>{children}</div>;
}

export function Loading() {
  return <p className="adm-empty">Loading…</p>;
}
