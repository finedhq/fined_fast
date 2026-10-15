import { useState } from "react";
import { motion } from "motion/react";
import { FaWhatsapp } from "react-icons/fa";
import WhatsAppCommunityModal from "./WhatsAppCommunityModal";
import "./Community.css";

export default function FloatingWhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        className="cm-float"
        onClick={() => setIsOpen(true)}
        aria-label="Join the FinEd WhatsApp community"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="cm-float-icon"><FaWhatsapp /></span>
        <span className="cm-float-label">Community</span>
      </motion.button>

      <WhatsAppCommunityModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
