import React from "react";
import { FaWhatsapp } from "react-icons/fa";
import { WHATSAPP_COMMUNITY_FORM_URL } from "./WhatsAppCommunityModal";

export default function ArticleCommunityBanner() {
  return (
    <div
      className="ar-community-banner w-full my-8 p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-emerald-50/70 to-slate-50 border border-emerald-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 box-border shadow-xs"
      style={{ order: 10 }}
    >
      <div className="flex-1 min-w-0">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full inline-block mb-2">
          COMMUNITY DISCUSSIONS
        </span>
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 leading-snug">
          Liked this article? Join our WhatsApp circle
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed max-w-xl">
          We break down policies, fintech updates, and real money mechanics daily with our readers. Free from noise and tips.
        </p>
      </div>

      <div className="w-full sm:w-auto shrink-0">
        <a
          href={WHATSAPP_COMMUNITY_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 w-full sm:w-auto text-center cursor-pointer"
        >
          <FaWhatsapp size={18} className="text-white shrink-0" />
          <span>Join the Community</span>
        </a>
      </div>
    </div>
  );
}
