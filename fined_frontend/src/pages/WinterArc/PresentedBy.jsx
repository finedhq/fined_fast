// "presented by Aguafuel": the presenting sponsor's line, used on the landing
// hero, prize box, hub, join page, popup and dashboard cards. Sponsor details
// and the on/off switch live in winterarcConfig.js.
import { WINTERARC as W } from "./winterarcConfig";
import { trackEvent } from "../../utils/analytics";
import "./PresentedBy.css";

/** The sponsor's site, tagged so they can see the visit came from WinterArc. */
const sponsorHref = (url, placement) => {
  const u = new URL(url);
  u.searchParams.set("utm_source", "fined");
  u.searchParams.set("utm_medium", "referral");
  u.searchParams.set("utm_campaign", "winterarc");
  u.searchParams.set("utm_content", placement);
  return u.toString();
};

/**
 * size: "sm" | "md" | "lg" (logo height 15 / 20 / 26 px).
 * onDark: use the white-text logo on dark backgrounds.
 * placement: where it sits (UTM utm_content + GTM sponsor_click). Without it
 * the logo is not a link (e.g. the popup, whose job is to send people to WinterArc).
 */
export default function PresentedBy({ size = "md", onDark = false, className = "", placement = null }) {
  if (!W.show.sponsor || !W.sponsor) return null;
  const s = W.sponsor;
  const img = (
    <img src={onDark ? s.logoOnDark : s.logo} alt={s.name} width="937" height="146" loading="lazy" decoding="async" />
  );
  return (
    <p className={`wa-presented wa-presented-${size}${onDark ? " is-dark" : ""} ${className}`.trim()}>
      <span className="wa-presented-label">presented by</span>
      {s.url && placement ? (
        <a
          className="wa-presented-link"
          href={sponsorHref(s.url, placement)}
          target="_blank"
          rel="sponsored noopener noreferrer"
          aria-label={`${s.name} (opens in a new tab)`}
          onClick={() => trackEvent("sponsor_click", { sponsor: s.name, placement })}
        >
          {img}
        </a>
      ) : (
        img
      )}
    </p>
  );
}
