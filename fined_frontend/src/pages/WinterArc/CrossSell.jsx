// Cross-selling the FinEd course and articles from WinterArc (owner 2026-11-21):
//   GoDeeper      after a day is finished, on the days listed in CROSS_SELL.goDeeper
//   FinaleNext    Day 30 finish: "you definitely have a finance spark" + courses
//   ShareCard     a shareable image at 7/14/21-day streaks and at the finish
//   ArticleReadBonus / BonusToast  the +3 daily bonus for an article / module
//   (hooks and helpers live in crossSellUtils.js)
// Every link click is tagged for GTM through trackCrossSell.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { PiArrowRightBold, PiBookOpenTextBold, PiDownloadSimpleBold, PiShareNetworkBold, PiSparkleBold, PiWhatsappLogoBold, PiXBold } from "react-icons/pi";
import { CROSS_SELL as X, WINTERARC as W } from "./winterarcConfig";
import { useContentBonus } from "./crossSellUtils";
import { trackCrossSell, trackEvent } from "../../utils/analytics";
import "./CrossSell.css";

const SITE = "https://myfined.com";

function TrackedLink({ to, source, className, children }) {
  return (
    <Link to={to} className={className} onClick={() => trackCrossSell(source, to)}>
      {children}
    </Link>
  );
}

export function GoDeeper({ day }) {
  const link = X.goDeeper[day];
  if (!link) return null;
  return (
    <div className="wax wax-deeper">
      <p className="wax-kicker">Go deeper (optional)</p>
      <TrackedLink to={link.href} source={`winterarc_day_${day}`} className="wax-row wax-row-strong">
        <PiBookOpenTextBold aria-hidden="true" /> <span>{link.title}</span> <PiArrowRightBold aria-hidden="true" className="wax-row-go" />
      </TrackedLink>
      <p className="wax-note">Read an article or finish a course module any day for +{X.bonusPoints} bonus points (once a day).</p>
    </div>
  );
}

export function FinaleNext() {
  const f = X.finale;
  return (
    <div className="wax wax-finale">
      <p className="wax-spark" aria-hidden="true"><PiSparkleBold /></p>
      <h3>{f.title}</h3>
      <p className="wax-text">{f.text}</p>
      <ul className="wax-cards">
        {f.links.map((l) => (
          <li key={l.href}>
            <TrackedLink to={l.href} source="winterarc_finale" className="wax-card">
              <strong>{l.title}</strong>
              <span>{l.note}</span>
              <PiArrowRightBold aria-hidden="true" className="wax-row-go" />
            </TrackedLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Share card -----------------------------------------------------------

const headline = (milestone) => (milestone >= W.totalDays ? "I finished WinterArc" : `${milestone}-day streak`);

/** Loads a same-site image for the canvas; resolves null if it fails. */
const loadImage = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/** Draws the share image (1080 x 1350) and returns it as a PNG blob. */
async function drawCard({ name, milestone, points }) {
  try {
    await document.fonts?.ready;
  } catch {
    // fonts not ready: the fallbacks are fine
  }
  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, 1350);
  bg.addColorStop(0, "#EEF1FF");
  bg.addColorStop(1, "#FAFBFF");
  g.fillStyle = bg;
  g.fillRect(0, 0, 1080, 1350);
  // snow dots
  g.fillStyle = "#DDE2FF";
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 197) % 1080;
    const y = (i * 311) % 1350;
    g.beginPath();
    g.arc(x, y, 4 + (i % 5) * 2, 0, Math.PI * 2);
    g.fill();
  }
  // ink card
  g.fillStyle = "#171321";
  g.fillRect(96, 300, 900, 760);
  g.fillStyle = "#FFFFFF";
  g.fillRect(80, 284, 900, 760);
  g.strokeStyle = "#171321";
  g.lineWidth = 6;
  g.strokeRect(80, 284, 900, 760);

  const display = "'Plus Jakarta Sans', 'Segoe UI', sans-serif";
  g.textAlign = "center";
  g.fillStyle = "#4100BC";
  g.font = `800 44px ${display}`;
  g.fillText("WINTERARC · 30 DAYS OF MONEY", 540, 190);

  g.fillStyle = "#625D6D";
  g.font = `700 46px ${display}`;
  g.fillText(name ? `${name} hit` : "I hit", 540, 420);
  g.fillStyle = "#171321";
  g.font = `800 ${milestone >= W.totalDays ? 92 : 120}px ${display}`;
  g.fillText(milestone >= W.totalDays ? "all 30 days" : `${milestone} days`, 540, 570);
  g.fillStyle = "#F5A623";
  g.fillRect(300, 610, 480, 14);

  g.fillStyle = "#3E3A4A";
  g.font = `700 52px ${display}`;
  g.fillText(milestone >= W.totalDays ? "of WinterArc" : "in a row", 540, 720);
  g.fillStyle = "#4100BC";
  g.font = `800 64px ${display}`;
  g.fillText(`${points} points`, 540, 880);

  // "PRESENTED BY [logo]" between the card and the link
  const logo = W.show.sponsor && W.sponsor ? await loadImage(W.sponsor.logo) : null;
  if (logo) {
    const logoH = 46;
    const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
    g.font = `800 26px ${display}`;
    const label = "PRESENTED BY";
    const labelW = g.measureText(label).width;
    const gap = 18;
    const x0 = 540 - (labelW + gap + logoW) / 2;
    g.textAlign = "left";
    g.fillStyle = "#625D6D";
    g.fillText(label, x0, 1134);
    g.drawImage(logo, x0 + labelW + gap, 1134 - logoH + 6, logoW, logoH);
    g.textAlign = "center";
  }

  g.fillStyle = "#171321";
  g.font = `800 48px ${display}`;
  g.fillText("myfined.com/winterarc", 540, 1210);
  g.fillStyle = "#625D6D";
  g.font = `600 34px ${display}`;
  g.fillText("Learn money with FinEd", 540, 1270);

  return new Promise((resolve) => c.toBlob(resolve, "image/png"));
}

/**
 * The share card for one milestone. `onClose` hides it (the hub remembers that).
 * `code`: the person's invite code, so the shared link counts as a referral.
 */
export function ShareCard({ milestone, points, name, code, onClose }) {
  const [url, setUrl] = useState(null);
  const [canShare, setCanShare] = useState(false);
  const blobRef = useRef(null);
  const link = `${SITE}/winterarc${code ? `?ref=${code}` : ""}`;
  const text = milestone >= W.totalDays
    ? `I finished all 30 days of WinterArc with FinEd and scored ${points} points. Learn money one short task a day: ${link}`
    : `${milestone} days in a row on WinterArc with FinEd, ${points} points so far. Learn money one short task a day: ${link}`;

  useEffect(() => {
    let live = true;
    let made = null;
    drawCard({ name, milestone, points }).then((blob) => {
      if (!live || !blob) return;
      blobRef.current = blob;
      made = URL.createObjectURL(blob);
      setUrl(made);
      try {
        setCanShare(!!navigator.canShare?.({ files: [new File([blob], "winterarc.png", { type: "image/png" })] }));
      } catch {
        setCanShare(false);
      }
    });
    return () => {
      live = false;
      if (made) URL.revokeObjectURL(made);
    };
  }, [name, milestone, points]);

  const file = () => new File([blobRef.current], `winterarc-${milestone}.png`, { type: "image/png" });
  const share = async () => {
    trackEvent("share", { method: "native", content_type: "winterarc_milestone", milestone });
    try {
      await navigator.share({ files: [file()], text });
    } catch {
      // cancelled
    }
  };

  return (
    <section className="wax wax-share" aria-labelledby={`wax-share-${milestone}`}>
      {onClose && (
        <button type="button" className="wax-close" onClick={onClose} aria-label="Hide this card">
          <PiXBold aria-hidden="true" />
        </button>
      )}
      <p className="wax-kicker"><PiSparkleBold aria-hidden="true" /> {headline(milestone)}</p>
      <h3 id={`wax-share-${milestone}`}>{milestone >= W.totalDays ? "Show off your finish" : "Share your streak"}</h3>
      {url ? <img className="wax-share-img" src={url} alt={`Share card: ${headline(milestone)}, ${points} points`} /> : <div className="wax-share-img wax-share-wait" />}
      <div className="wax-share-actions">
        {canShare && (
          <button type="button" className="wax-btn" onClick={share}>
            <PiShareNetworkBold aria-hidden="true" /> Share
          </button>
        )}
        <a
          className="wax-btn wax-btn-wa"
          href={`https://wa.me/?text=${encodeURIComponent(text)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("share", { method: "whatsapp", content_type: "winterarc_milestone", milestone })}
        >
          <PiWhatsappLogoBold aria-hidden="true" /> WhatsApp
        </a>
        {url && (
          <a
            className="wax-btn wax-btn-ghost"
            href={url}
            download={`winterarc-${milestone}.png`}
            onClick={() => trackEvent("share", { method: "download", content_type: "winterarc_milestone", milestone })}
          >
            <PiDownloadSimpleBold aria-hidden="true" /> Save image
          </a>
        )}
      </div>
    </section>
  );
}

export function BonusToast({ show }) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (!show) return undefined;
    const id = setTimeout(() => setClosed(true), 6000);
    return () => clearTimeout(id);
  }, [show]);
  if (!show || closed) return null;
  return (
    <div className="wax wax-toast" role="status">
      <PiSparkleBold aria-hidden="true" /> +{X.bonusPoints} {W.name} bonus points for today.{" "}
      <Link to="/winterarc/challenge" onClick={() => trackCrossSell("winterarc_bonus_toast", "/winterarc/challenge")}>See your hub</Link>
    </div>
  );
}

/**
 * Put at the end of an article: once it scrolls into view (and the reader has
 * been on the page at least 30 seconds), today's WinterArc bonus is claimed.
 * Give it key={slug} so a new article starts fresh.
 */
export function ArticleReadBonus({ slug }) {
  const { isAuthenticated } = useAuth0();
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  const [openedAt] = useState(() => Date.now());
  useEffect(() => {
    const el = ref.current;
    if (!el || seen || !isAuthenticated) return undefined;
    let timer;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const wait = Math.max(0, 30000 - (Date.now() - openedAt));
      clearTimeout(timer);
      timer = setTimeout(() => setSeen(true), wait);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      clearTimeout(timer);
    };
  }, [seen, isAuthenticated, openedAt, slug]);
  const awarded = useContentBonus("article", slug, seen, isAuthenticated);
  return (
    <>
      <span ref={ref} aria-hidden="true" style={{ display: "block", height: 1 }} />
      <BonusToast show={awarded} />
    </>
  );
}
