// Home page popup introducing WinterArc. Shows once per visitor, a few
// seconds after landing, until the challenge ends. Snow from the WinterArc
// page falls inside it and piles up on its button. Clicking through tags the
// visitor's source as the popup (unless they already arrived with tags).
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PiSnowflakeBold, PiXBold, PiArrowRightBold, PiLightningFill, PiTrophyFill } from "react-icons/pi";
import { WINTERARC as W } from "./winterarcConfig";
import SnowField from "./SnowField";
import PrizeTicket from "./PrizeTicket";
import { trackEvent } from "../../utils/analytics";
import { tagSourceIfUntagged } from "../../utils/attribution";
import "./WinterArcPopup.css";

const SEEN_KEY = "fined_winterarc_popup_v1";
const SHOW_AFTER_MS = 3500;
// Last moment to show it: the end of the final day, IST
const SHOW_UNTIL = new Date("2026-12-30T23:59:59+05:30").getTime();

const alreadySeen = () => {
  try {
    return !!localStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
};
const markSeen = (how) => {
  try {
    localStorage.setItem(SEEN_KEY, how);
  } catch {
    // storage blocked: it may show again next visit, which is fine
  }
};

export default function WinterArcPopup() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const cardRef = useRef(null);
  const ctaRef = useRef(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (alreadySeen() || Date.now() > SHOW_UNTIL) return undefined;
    const id = setTimeout(() => {
      setLive(Date.now() >= new Date(W.startsAt).getTime());
      setOpen(true);
      trackEvent("winterarc_popup_view");
    }, SHOW_AFTER_MS);
    return () => clearTimeout(id);
  }, []);

  const close = (how = "dismissed") => {
    setOpen(false);
    markSeen(how);
    if (how === "dismissed") trackEvent("winterarc_popup_close");
  };

  // Esc closes it; focus starts on the main button
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => ctaRef.current?.focus({ preventScroll: true }), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [open]);

  const go = () => {
    tagSourceIfUntagged({ utm_source: "fined_site", utm_medium: "popup", utm_campaign: "winterarc" });
    trackEvent("winterarc_popup_click");
    close("clicked");
    navigate("/winterarc");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="wap-backdrop"
          onClick={(e) => e.target === e.currentTarget && close()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.25 }}
        >
          <motion.div
            ref={cardRef}
            className="wap-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="wap-title"
            initial={reduce ? false : { opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <button type="button" className="wap-close" onClick={() => close()} aria-label="Close">
              <PiXBold aria-hidden="true" />
            </button>

            <p className="wap-eyebrow"><PiSnowflakeBold aria-hidden="true" /> {W.name} · {live ? "Live now" : "1 to 30 Dec"}</p>
            <h2 id="wap-title">
              Skill up this winter. <span className="wap-hl">For free.</span>
            </h2>
            <p className="wap-sub">
              {W.totalDays} days of short, fun money lessons. One task a day, and you could win real cash.
            </p>

            {W.show.prizes && <PrizeTicket amount={W.prizePool} className="wap-ticket" />}

            <ul className="wap-chips">
              <li><PiLightningFill aria-hidden="true" /> Points every day</li>
              {W.show.prizes && <li><PiTrophyFill aria-hidden="true" /> Cash every week</li>}
            </ul>
            <div className="wap-actions">
              <button type="button" ref={ctaRef} className="wap-btn wap-btn-primary" data-snow-ledge="10" onClick={go}>
                Join for free <PiArrowRightBold aria-hidden="true" />
              </button>
              <button type="button" className="wap-btn wap-btn-ghost" onClick={() => close()}>
                Maybe later
              </button>
            </div>
            <SnowField hostRef={cardRef} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
