// The one way into WinterArc (owner 2026-11-21): sign up -> join form page -> hub.
// Every "Join WinterArc" button uses this, so it always lands on the same step:
//   already joined   -> the hub
//   signed in        -> the join form page (/winterarc/join)
//   signed out       -> FinEd sign-up/log-in, which comes back to the form page
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import useWinterArcStatus from "./useWinterArcStatus";

export const JOIN_PATH = "/winterarc/join";
export const HUB_PATH = "/winterarc/challenge";

export default function useJoinWinterArc() {
  const navigate = useNavigate();
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { joined } = useWinterArcStatus();
  return useCallback(() => {
    if (joined) navigate(HUB_PATH);
    else if (isAuthenticated) navigate(JOIN_PATH);
    else loginWithRedirect({ appState: { returnTo: JOIN_PATH } });
  }, [joined, isAuthenticated, navigate, loginWithRedirect]);
}
