import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { setTokenFetcher } from "../lib/axios";

// Auth0 errors that mean the saved session can't be renewed (e.g. the refresh
// token expired or was revoked). Only signing in again fixes these.
const SESSION_ERRORS = new Set(["login_required", "missing_refresh_token", "invalid_grant", "consent_required"]);
const RELOGIN_KEY = "fined_relogin_at";
const RELOGIN_COOLDOWN_MS = 60_000;

const isSessionError = (err) =>
  SESSION_ERRORS.has(err?.error) || /refresh token/i.test(err?.message || "");

export const ApiTokenProvider = ({ children }) => {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      setTokenFetcher(null);
      return;
    }

    const signInAgain = () => {
      // At most one redirect a minute, so a broken login can never loop
      try {
        const last = Number(sessionStorage.getItem(RELOGIN_KEY) || 0);
        if (Date.now() - last < RELOGIN_COOLDOWN_MS) return;
        sessionStorage.setItem(RELOGIN_KEY, String(Date.now()));
      } catch {
        // storage blocked: still send them to sign in
      }
      loginWithRedirect({
        appState: { returnTo: window.location.pathname + window.location.search },
      });
    };

    // The axios instance fetches a fresh token before every request
    setTokenFetcher(async () => {
      try {
        return await getAccessTokenSilently();
      } catch (err) {
        if (isSessionError(err)) signInAgain();
        throw err;
      }
    });
  }, [getAccessTokenSilently, isAuthenticated, loginWithRedirect]);

  return children;
};
