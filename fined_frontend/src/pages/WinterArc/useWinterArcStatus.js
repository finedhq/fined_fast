// Has the signed-in person joined WinterArc, which day is open, and is it done?
// Used by the navbar (WinterArc tab -> hub), the landing hero ("Go to your
// hub") and the dashboard card. One light request (/winterarc/status) per page
// load, shared by every caller; until it answers, this browser's memory of
// joining (winterarcVisitor) gives a first guess so links don't flicker.
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { getWinterArcStatus } from "../../services/api";
import { hasJoined, markJoined, joinedCode } from "./winterarcVisitor";

let shared = null; // the in-flight or finished request, shared by all callers

/** Forget the shared answer (call after joining so the next read is fresh). */
export const refreshWinterArcStatus = () => {
  shared = null;
};

export default function useWinterArcStatus() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [status, setStatus] = useState(() => ({ joined: hasJoined(), today: null, today_done: false, checked: false }));

  useEffect(() => {
    if (isLoading || !isAuthenticated) return undefined;
    let live = true;
    if (!shared) shared = getWinterArcStatus().catch(() => null);
    shared.then((s) => {
      if (!live || !s) return;
      // Remember a join made on another device, so the popup stops here too
      if (s.joined && !hasJoined()) markJoined(joinedCode());
      setStatus({ ...s, checked: true });
    });
    return () => {
      live = false;
    };
  }, [isAuthenticated, isLoading]);

  // Signed out: we can't know, so links stay on the public landing page
  return isAuthenticated ? status : { joined: false, today: null, today_done: false, checked: !isLoading };
}
