// Helpers for CrossSell.jsx (kept apart so that file only exports components).
import { useEffect, useRef, useState } from "react";
import { CROSS_SELL as X, WINTERARC as W } from "./winterarcConfig";
import { claimWinterArcBonus } from "../../services/api";
import { trackEvent } from "../../utils/analytics";

/** The milestone a person has reached and not hidden yet (hub). */
export function shareMilestone(bestStreak, finished) {
  if (finished) return W.totalDays;
  return [...X.shareMilestones].reverse().find((m) => m < W.totalDays && bestStreak >= m) || null;
}

const hiddenKey = (m) => `fined_wa_share_hidden_${m}`;
export const shareHidden = (m) => {
  try {
    return !!localStorage.getItem(hiddenKey(m));
  } catch {
    return false;
  }
};
export const hideShare = (m) => {
  try {
    localStorage.setItem(hiddenKey(m), "1");
  } catch {
    // ignore
  }
};

// --- Content bonus --------------------------------------------------------

/**
 * Claims today's +3 WinterArc bonus once `ready` is true (an article read to
 * the end, a course module finished). Silent for anyone not on WinterArc.
 * Returns true once a bonus was actually awarded, for a small note.
 */
export function useContentBonus(kind, ref, ready, enabled = true) {
  const [awarded, setAwarded] = useState(false);
  const sent = useRef(null);
  useEffect(() => {
    if (!enabled || !ready || !ref || sent.current === ref) return;
    const now = Date.now();
    // Only during 1-30 Dec (the server checks too)
    if (now < Date.parse(W.startsAt) || now >= Date.parse(W.startsAt) + W.totalDays * 86400000) return;
    sent.current = ref;
    claimWinterArcBonus(kind, ref)
      .then((res) => {
        if (res?.awarded) {
          setAwarded(true);
          trackEvent("winterarc_content_bonus", { kind, ref });
        }
      })
      .catch(() => {});
  }, [kind, ref, ready, enabled]);
  return awarded;
}

