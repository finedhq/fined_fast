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
import sceneImg from "../../assets/newnewbg-imgofhomepg.webp";
import planeImg from "../../assets/newnewplane.webp";
import markImg from "../../assets/fined-mark.png";
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

// Brand colours, as on the WinterArc landing page
const INK = "#171321";
const INK_2 = "#3E3A4A";
const INK_3 = "#625D6D";
const PURPLE = "#4100BC";
const AMBER = "#FFB600";
const DISPLAY = "'Plus Jakarta Sans', 'Segoe UI', sans-serif";

/** Rounded rectangle path (canvas roundRect is missing on older Safari). */
function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** A filled box with an ink border and a solid offset shadow (the brand's card look). */
function inkBox(g, x, y, w, h, r, { fill = "#FFFFFF", shadow = INK, off = 8, border = 5 } = {}) {
  if (off) {
    g.fillStyle = shadow;
    rr(g, x + off, y + off, w, h, r);
    g.fill();
  }
  g.fillStyle = fill;
  rr(g, x, y, w, h, r);
  g.fill();
  if (border) {
    g.lineWidth = border;
    g.strokeStyle = INK;
    g.stroke();
  }
}

/** Sets the largest font (down to `min`) that keeps `text` within `maxW`. */
function fitFont(g, text, weight, size, min, maxW) {
  let px = size;
  g.font = `${weight} ${px}px ${DISPLAY}`;
  while (px > min && g.measureText(text).width > maxW) {
    px -= 4;
    g.font = `${weight} ${px}px ${DISPLAY}`;
  }
}

/** Text with letter spacing where the browser supports it. */
function spaced(g, text, x, y, px) {
  if ("letterSpacing" in g) {
    g.letterSpacing = `${px}px`;
    g.fillText(text, x, y);
    g.letterSpacing = "0px";
  } else {
    g.fillText(text, x, y);
  }
}

/**
 * Draws the share image (1080 x 1350) and returns it as a PNG blob: the
 * landing page's winter scene, a ticket card with the 30 calendar doors (the
 * days done in gold), the points on a gold sticker, and the sponsor strip.
 */
async function drawCard({ name, milestone, points }) {
  const finished = milestone >= W.totalDays;
  try {
    // The canvas only uses fonts the page has loaded, so ask for these weights first
    await Promise.all(["700 48px", "800 48px"].map((f) => document.fonts?.load(`${f} 'Plus Jakarta Sans'`)));
    await document.fonts?.ready;
  } catch {
    // fonts not ready: the fallbacks are fine
  }
  const sponsorOn = W.show.sponsor && W.sponsor;
  const [scene, plane, mark, logo] = await Promise.all([
    loadImage(sceneImg),
    loadImage(planeImg),
    loadImage(markImg),
    sponsorOn ? loadImage(W.sponsor.logo) : null,
  ]);

  const c = document.createElement("canvas");
  c.width = 1080;
  c.height = 1350;
  const g = c.getContext("2d");

  // Sky, then the home page's hills along the bottom
  const sky = g.createLinearGradient(0, 0, 0, 1350);
  sky.addColorStop(0, "#EEF1FF");
  sky.addColorStop(0.45, "#F9F7F9");
  sky.addColorStop(1, "#F9F7F9");
  g.fillStyle = sky;
  g.fillRect(0, 0, 1080, 1350);
  if (scene) {
    g.save();
    // mirrored, like the landing hero, so the temple sits on the left
    g.translate(1080, 0);
    g.scale(-1, 1);
    g.drawImage(scene, -80, 1350 - 700, 1240, (1240 * scene.naturalHeight) / scene.naturalWidth);
    g.restore();
  }
  // Snow (a fixed pattern, so every card looks the same)
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  g.fillStyle = "#C9D1FF";
  for (let i = 0; i < 70; i += 1) {
    const x = rnd() * 1080;
    const y = rnd() * 1350;
    const r = 3 + rnd() * 7;
    g.globalAlpha = 0.35 + rnd() * 0.45;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;

  // Header: a big WinterArc wordmark (the largest brand on the card), then "by FinEd"
  g.textAlign = "left";
  g.fillStyle = PURPLE;
  g.font = `800 88px ${DISPLAY}`;
  const wordW = g.measureText("WinterArc").width;
  g.fillText("WinterArc", 76, 134);
  let bx = 76 + wordW + 26;
  g.fillStyle = INK_3;
  g.font = `700 32px ${DISPLAY}`;
  g.fillText("by", bx, 132);
  bx += g.measureText("by").width + 12;
  if (mark) {
    g.drawImage(mark, bx, 96, 46, 40);
    bx += 46 + 8;
  }
  g.fillStyle = PURPLE;
  g.font = `800 34px ${DISPLAY}`;
  g.fillText("FinEd", bx, 132);

  // The ticket card, with the paper plane flying over its corner
  inkBox(g, 80, 210, 920, 800, 40, { shadow: PURPLE, off: 16, border: 5 });
  if (plane) {
    // the same crop of the plane artwork the banners use
    g.save();
    g.translate(92, 196);
    g.rotate((-10 * Math.PI) / 180);
    g.drawImage(plane, 541, 331, 443, 307, -66, -45, 132, 92);
    g.restore();
  }

  g.textAlign = "center";
  g.fillStyle = PURPLE;
  g.font = `800 34px ${DISPLAY}`;
  spaced(g, finished ? "CHALLENGE COMPLETE" : `${milestone}-DAY STREAK`, 540, 300, 5);

  const who = finished ? `${name || "I"} finished` : `${name || "I"} hit`;
  g.fillStyle = INK_3;
  fitFont(g, who, 700, 48, 30, 600);
  g.fillText(who, 540, 376);

  const big = finished ? "all 30 days" : `${milestone} days`;
  g.font = `800 ${finished ? 126 : 150}px ${DISPLAY}`;
  // gold underline doodle behind the number, like the landing headline
  const bw = Math.min(g.measureText(big).width, 640);
  g.strokeStyle = AMBER;
  g.lineWidth = 16;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(540 - bw / 2, 560);
  g.bezierCurveTo(540 - bw / 4, 540, 540 + bw / 6, 538, 540 + bw / 2, 552);
  g.stroke();
  g.fillStyle = INK;
  g.fillText(big, 540, 520);

  g.fillStyle = INK_2;
  g.font = `700 50px ${DISPLAY}`;
  g.fillText(finished ? "of WinterArc" : "in a row", 540, 636);

  // The 30 calendar doors, the days done in gold
  const door = 68;
  const gap = 13;
  const perRow = 10;
  const gx = 540 - (perRow * door + (perRow - 1) * gap) / 2;
  const gy = 686;
  for (let d = 1; d <= W.totalDays; d += 1) {
    const i = d - 1;
    const x = gx + (i % perRow) * (door + gap);
    const y = gy + Math.floor(i / perRow) * (door + gap);
    if (d <= milestone) {
      inkBox(g, x, y, door, door, 14, { fill: AMBER, off: 4, border: 3 });
      g.fillStyle = INK;
    } else if (d === W.totalDays) {
      inkBox(g, x, y, door, door, 14, { fill: PURPLE, off: 0, border: 0 });
      g.fillStyle = "#FFFFFF";
    } else {
      const ice = g.createLinearGradient(x, y, x + door, y + door);
      ice.addColorStop(0, "#FFFFFF");
      ice.addColorStop(1, "#EEF1FF");
      g.fillStyle = ice;
      rr(g, x, y, door, door, 14);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = "#DDE2FF";
      g.stroke();
      g.fillStyle = "#8F86C9";
    }
    g.font = `800 28px ${DISPLAY}`;
    g.fillText(String(d), x + door / 2, y + door / 2 + 10);
  }

  // Points on a round gold sticker over the card's corner
  g.save();
  g.translate(925, 205);
  g.rotate((10 * Math.PI) / 180);
  g.fillStyle = INK;
  g.beginPath();
  g.arc(7, 7, 108, 0, Math.PI * 2);
  g.fill();
  const gold = g.createLinearGradient(-108, -108, 108, 108);
  gold.addColorStop(0, "#FFD15C");
  gold.addColorStop(1, AMBER);
  g.fillStyle = gold;
  g.beginPath();
  g.arc(0, 0, 108, 0, Math.PI * 2);
  g.fill();
  g.lineWidth = 5;
  g.strokeStyle = INK;
  g.stroke();
  g.fillStyle = INK;
  fitFont(g, String(points), 800, 70, 40, 170);
  g.fillText(String(points), 0, 14);
  g.font = `800 22px ${DISPLAY}`;
  spaced(g, "POINTS", 0, 50, 3);
  g.restore();

  // Sponsor strip (kept smaller than the WinterArc wordmark), then the link
  if (logo) {
    const logoH = 38;
    const logoW = (logo.naturalWidth / logo.naturalHeight) * logoH;
    const label = "PRESENTED BY";
    g.font = `800 21px ${DISPLAY}`;
    const labelW = g.measureText(label).width + 3 * label.length;
    const sw = labelW + 18 + logoW + 72;
    const sx = 540 - sw / 2;
    inkBox(g, sx, 1080, sw, 76, 38, { off: 5, border: 3.5 });
    g.textAlign = "left";
    g.fillStyle = INK_3;
    spaced(g, label, sx + 36, 1126, 3);
    g.drawImage(logo, sx + 36 + labelW + 18, 1118 - logoH / 2, logoW, logoH);
    g.textAlign = "center";
  }
  // The link, in a pill sized to the text
  const link = "Join free · myfined.com/winterarc";
  g.font = `800 38px ${DISPLAY}`;
  const linkW = g.measureText(link).width + 72;
  g.fillStyle = "rgba(255, 255, 255, 0.9)";
  rr(g, 540 - linkW / 2, 1206, linkW, 76, 38);
  g.fill();
  g.fillStyle = INK;
  g.fillText(link, 540, 1257);

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
