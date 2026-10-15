import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FiX } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { PiArrowRightBold, PiChatsCircle, PiNewspaper, PiShieldCheck } from "react-icons/pi";
import "./Community.css";

export const WHATSAPP_COMMUNITY_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe7Z7fG0mO2aPoorxp2eREOenkVs8Ff9UDqCc9zVu6DONluGw/viewform";

const POINTS = [
  { Icon: PiNewspaper, text: "A money explainer from the FinEd team every day" },
  { Icon: PiChatsCircle, text: "Ask questions and talk through the news" },
  { Icon: PiShieldCheck, text: "No stock tips and no spam, ever" },
];

export default function WhatsAppCommunityModal({ isOpen, onClose }) {
  // Lock page scroll and close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="cm-overlay"
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="cm-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cm-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" className="cm-close" onClick={onClose} aria-label="Close">
              <FiX />
            </button>

            <span className="cm-icon"><FaWhatsapp /></span>
            <h2 id="cm-title" className="cm-title">Join FinEd on WhatsApp</h2>
            <p className="cm-text">
              A small group for FinEd learners who want to get better with money, one day at a time.
            </p>

            <ul className="cm-points">
              {POINTS.map(({ Icon, text }) => (
                <li key={text}><Icon />{text}</li>
              ))}
            </ul>

            <a
              href={WHATSAPP_COMMUNITY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="cm-cta"
            >
              Apply to join
              <span className="cm-cta-arrow"><PiArrowRightBold /></span>
            </a>
            <p className="cm-fine">A 2-minute form keeps the group useful for everyone.</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
