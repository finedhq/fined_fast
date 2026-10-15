import { FaWhatsapp } from "react-icons/fa";
import { PiArrowRightBold } from "react-icons/pi";
import { WHATSAPP_COMMUNITY_FORM_URL } from "./WhatsAppCommunityModal";
import "./Community.css";

// Inline WhatsApp community invite: end of articles and the bottom of the dashboard
export default function CommunityBanner({
  className = "",
  heading = "Talk money with other FinEd readers",
}) {
  return (
    <aside className={`ar-community-banner cm-banner ${className}`}>
      <span className="cm-banner-icon"><FaWhatsapp /></span>
      <div className="cm-banner-text">
        <h3 className="cm-banner-title">{heading}</h3>
        <p className="cm-banner-sub">A daily explainer and open questions on WhatsApp. No tips, no spam.</p>
      </div>
      <a
        href={WHATSAPP_COMMUNITY_FORM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="cm-banner-cta"
      >
        Join on WhatsApp
        <PiArrowRightBold />
      </a>
    </aside>
  );
}
