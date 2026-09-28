import React, { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import WhatsAppCommunityModal from "./WhatsAppCommunityModal";

export default function FloatingWhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 z-[999]">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-4 py-3 rounded-full flex items-center gap-2 font-bold text-white bg-[#25D366] hover:bg-[#20ba59] shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer"
          aria-label="Join WhatsApp Community"
          title="FinEd WhatsApp Community"
        >
          <FaWhatsapp size={22} className="shrink-0 text-white" />
          <span className="tracking-wide pr-1 text-sm">
            Community
          </span>
        </button>
      </div>

      <WhatsAppCommunityModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
