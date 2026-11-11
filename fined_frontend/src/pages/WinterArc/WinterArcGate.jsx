// Who may see the challenge itself (the hub and each day): signed-in people
// on the WinterArc list. Everyone else gets a short message here and a way
// in; the landing and rules pages stay open to all. The server checks the
// same thing on every request (routes/winterarc_days.py).
import { useAuth0 } from "@auth0/auth0-react";
import { Link, useLocation } from "react-router-dom";
import { WINTERARC as W } from "./winterarcConfig";
import "./WinterArcLanding.css";
import "./WinterArcChallenge.css";

export function WinterArcMessage({ title, children, actions }) {
  return (
    <div className="wa wa-doc-page wa-msg-page">
      <div className="wa-wrap wa-narrow wa-center">
        <div className="wa-msg-card">
          <h1>{title}</h1>
          <div className="wa-lede">{children}</div>
          <div className="wa-msg-actions">{actions}</div>
        </div>
      </div>
    </div>
  );
}

export function JoinFirst() {
  return (
    <WinterArcMessage
      title={`Join ${W.name} first`}
      actions={<Link className="wa-btn wa-btn-primary" to="/winterarc#join">Join the waitlist</Link>}
    >
      The challenge is open to people on the {W.name} list. It's free to join and takes a minute.
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
