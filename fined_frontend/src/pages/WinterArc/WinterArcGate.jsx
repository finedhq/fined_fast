// Who may see the challenge itself (the hub and each day): signed-in people
// on the WinterArc list. Everyone else gets a short message here and a way
// in; the landing and rules pages stay open to all. The server checks the
// same thing on every request (routes/winterarc_days.py).
import { useAuth0 } from "@auth0/auth0-react";
import { Link, useLocation } from "react-router-dom";
import { PiCalendarBlankBold, PiKeyBold, PiTicketBold, PiWarningCircleBold } from "react-icons/pi";
import { WINTERARC as W } from "./winterarcConfig";
import "./WinterArcLanding.css";
import "./WinterArcChallenge.css";

const ICONS = { signin: PiKeyBold, join: PiTicketBold, wait: PiCalendarBlankBold, error: PiWarningCircleBold };

/** A full-page message: text and actions beside an icon tile. */
export function WinterArcMessage({ title, children, actions, icon = "wait" }) {
  const Icon = ICONS[icon] || PiCalendarBlankBold;
  return (
    <div className="wa wa-doc-page wa-msg-page">
      <div className="wa-wrap">
        <div className={`wa-msg-card is-${icon}`}>
          <div className="wa-msg-text">
            <h1>{title}</h1>
            <div className="wa-msg-body">{children}</div>
            {actions && <div className="wa-msg-actions">{actions}</div>}
          </div>
          <span className="wa-msg-art" aria-hidden="true"><Icon /></span>
        </div>
      </div>
    </div>
  );
}

export function JoinFirst() {
  return (
    <WinterArcMessage
      icon="join"
      title={`Join ${W.name} first`}
      actions={<Link className="wa-btn wa-btn-primary" to="/winterarc#join">Join the waitlist</Link>}
    >
      The challenge is open to people on the {W.name} list. Joining is free and takes a minute. Use the same email you
      signed in with.
    </WinterArcMessage>
  );
}

/** Renders `children` only for signed-in visitors; others are asked to sign in. */
export default function WinterArcGate({ children }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const { pathname } = useLocation();
  if (isLoading) return null;
  if (!isAuthenticated) {
    return (
      <WinterArcMessage
        icon="signin"
        title={`Sign in to open ${W.name}`}
        actions={
          <>
            <button type="button" className="wa-btn wa-btn-primary" onClick={() => loginWithRedirect({ appState: { returnTo: pathname } })}>
              Sign in
            </button>
            <Link className="wa-btn wa-btn-ghost" to="/winterarc">About {W.name}</Link>
          </>
        }
      >
        The daily tasks are for {W.name} members. Sign in with the email you joined with.
      </WinterArcMessage>
    );
  }
  return children;
}
