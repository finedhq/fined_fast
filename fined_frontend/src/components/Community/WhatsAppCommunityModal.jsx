import React, { useEffect } from "react";
import { FiX, FiCheckCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export const WHATSAPP_COMMUNITY_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe7Z7fG0mO2aPoorxp2eREOenkVs8Ff9UDqCc9zVu6DONluGw/viewform";

export default function WhatsAppCommunityModal({ isOpen, onClose }) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
      };
    }
  }, [isOpen]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-community-title"
    >
      <div
        className="relative w-full max-w-md my-auto bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top-Right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 sm:top-6 sm:right-6 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Close dialog"
        >
          <FiX size={20} />
        </button>

        {/* WhatsApp Icon Box */}
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#25D366] mb-4">
          <FaWhatsapp className="text-2xl text-[#25D366]" />
        </div>

        {/* Content Copy */}
        <h3
          id="whatsapp-community-title"
          className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
        >
          FinEd WhatsApp Community
        </h3>

        <p className="text-xs sm:text-sm font-semibold text-emerald-700 mt-1">
          Curated discussions for curious minds. No stock tips, no spam.
        </p>

        <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
          Get daily deep-dives, real-world finance breakdown, and engage in thoughtful discussions curated directly by the FinEd team.
        </p>

        {/* Quality note */}
        <div className="mt-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
          <FiCheckCircle className="text-emerald-600 shrink-0 mt-0.5 text-base" />
          <p className="text-xs text-slate-600 leading-normal font-medium">
            Every member joins through a quick 2-minute form so we keep the group high-quality.
          </p>
        </div>

        {/* Primary CTA Button */}
        <a
          href={WHATSAPP_COMMUNITY_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-[#FA7516] hover:bg-[#e0650d] text-white font-semibold text-sm sm:text-base shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 mt-6 cursor-pointer text-center"
        >
          <span>Apply to Join Group →</span>
        </a>

        {/* Secondary / Close action */}
        <button
          type="button"
          onClick={onClose}
          className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 mt-3 py-1 transition cursor-pointer"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
