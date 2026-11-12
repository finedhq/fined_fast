// Waitlist form, the thank-you card with the referral link, and the countdown.
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import { PiCheckBold, PiCopyBold, PiWhatsappLogoBold } from "react-icons/pi";
import { WINTERARC as W } from "./winterarcConfig";
import ContestCard from "./ContestCard";
import { joinWinterArcWaitlist } from "../../services/api";
import { getAttribution } from "../../utils/attribution";
import { trackEvent } from "../../utils/analytics";
import { forgetJoined, joinedCode, markJoined } from "./winterarcVisitor";

const SITE = "https://myfined.com";

const HEARD_OPTIONS = [
  ["", "Choose one"],
  ["college", "My college or a campus event"],
  ["friend", "A friend"],
  ["instagram", "Instagram"],
  ["linkedin", "LinkedIn"],
  ["whatsapp", "WhatsApp"],
  ["youtube", "YouTube"],
  ["search", "Google or another search"],
  ["fined_site", "The FinEd website"],
  ["other", "Somewhere else"],
];

const timeLeft = () => Math.max(0, new Date(W.startsAt).getTime() - Date.now());

export function Countdown() {
  const [ms, setMs] = useState(timeLeft);
  useEffect(() => {
    const id = setInterval(() => setMs(timeLeft()), 30000);
    return () => clearInterval(id);
  }, []);

  if (ms === 0) return <p className="wa-count-live">WinterArc is live.</p>;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return (
    <div className="wa-count" aria-label={`${days} days, ${hours} hours and ${mins} minutes until Day 1`}>
      {[
        [days, "days"],
        [hours, "hours"],
        [mins, "minutes"],
      ].map(([v, l]) => (
        <div key={l} className="wa-count-cell">
          <span className="wa-count-num">{String(v).padStart(2, "0")}</span>
          <span className="wa-count-label">{l}</span>
        </div>
      ))}
    </div>
  );
}

function ThankYou({ code, already, remembered, onNotYou }) {
  const [copied, setCopied] = useState(false);
  const link = `${SITE}/winterarc?ref=${code}`;
  const shareText = `I'm doing WinterArc: 30 Days of Money with FinEd, 1 to 30 Dec. One short money task a day, free to join. Join with my link: ${link}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      trackEvent("share", { method: "copy_link", content_type: "winterarc_referral" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked: the link is on screen to copy by hand
    }
  };

  return (
    <div className="wa-form wa-thanks" role="status">
      <div className="wa-thanks-tick"><PiCheckBold aria-hidden="true" /></div>
      <h3>{already && !remembered ? "You're already on the list" : "You're on the list"}</h3>
      <p>We'll email you before Day 1 on {W.startDate}.</p>
      {W.show.referrals && (
        <>
          <ContestCard />
          <p className="wa-thanks-lead">Bring your friends along</p>
          <div className="wa-link-row">
            <code className="wa-ref-link">{link}</code>
            <button type="button" className="wa-btn wa-btn-ghost" onClick={copy}>
              <PiCopyBold aria-hidden="true" /> {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <a
            className="wa-btn wa-btn-whatsapp"
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("share", { method: "whatsapp", content_type: "winterarc_referral" })}
          >
            <PiWhatsappLogoBold aria-hidden="true" /> Share on WhatsApp
          </a>
          <p className="wa-small">
            You earn referral points when a friend who joined with your link finishes Day 3 and passes a quick check.
          </p>
        </>
      )}
      {remembered && (
        <button type="button" className="wa-thanks-other" onClick={onNotYou}>
          Not you? Join with a different email
        </button>
      )}
    </div>
  );
}

// Referral codes: letters and digits only, upper case (what the link carries)
const cleanCode = (v) => String(v || "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 12);

export default function SignupForm() {
  // The referral code box starts with the code from a friend's link, if any
  const [linkCode] = useState(() => cleanCode(getAttribution().ref));
  const [form, setForm] = useState(() => ({
    name: "", email: "", college: "", heard_from: "", age_confirmed: false, consent: false, ref: linkCode,
  }));
  const [refError, setRefError] = useState("");
  // A browser that already joined sees its invite link instead of the form
  const [state, setState] = useState(() => {
    const code = joinedCode();
    return code
      ? { status: "done", error: "", code, already: true, remembered: true }
      : { status: "idle", error: "", code: "", already: false };
  });
  const notYou = () => {
    forgetJoined();
    setState({ status: "idle", error: "", code: "", already: false });
  };

  // Signed-in learners: fill in their name and email (only into empty fields)
  const { user } = useAuth0();
  const [prefilled, setPrefilled] = useState(false);
  if (user && !prefilled) {
    setPrefilled(true);
    setForm((f) => ({ ...f, name: f.name || user.name || "", email: f.email || user.email || "" }));
  }

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (state.status === "sending") return;
    if (!form.age_confirmed) return setState((s) => ({ ...s, error: `WinterArc is for residents of ${W.residency} aged ${W.minAge} or over.` }));
    if (!form.consent) return setState((s) => ({ ...s, error: "Please agree to the WinterArc rules and the privacy policy to join." }));
    setState((s) => ({ ...s, status: "sending", error: "" }));
    setRefError("");
    try {
      // The box wins over the link: what's in it is what counts
      const res = await joinWinterArcWaitlist({ ...getAttribution(), ...form, ref: form.ref || null });
      setState({ status: "done", error: "", code: res.referral_code, already: res.already_joined });
      markJoined(res.referral_code);
      if (!res.already_joined) {
        const src = getAttribution();
        trackEvent("generate_lead", {
          form_type: "winterarc_waitlist",
          heard_from: form.heard_from || "unknown",
          utm_source: src.utm_source || "",
          referred: form.ref ? "yes" : "no",
        });
      }
    } catch (err) {
      const message = err.message || "Something went wrong. Please try again.";
      if (/referral code/i.test(message)) {
        setRefError(message);
        setState((s) => ({ ...s, status: "idle", error: "" }));
      } else {
        setState((s) => ({ ...s, status: "idle", error: message }));
      }
    }
  };

  if (state.status === "done") {
    return <ThankYou code={state.code} already={state.already} remembered={state.remembered} onNotYou={notYou} />;
  }

  return (
    <form className="wa-form" onSubmit={submit} noValidate>
      <div className="wa-field-row">
        <label className="wa-field">
          <span>Name</span>
          <input type="text" autoComplete="name" maxLength={100} value={form.name} onChange={set("name")} />
        </label>
        <label className="wa-field">
          <span>Email</span>
          <input type="email" required autoComplete="email" inputMode="email" maxLength={254} value={form.email} onChange={set("email")} />
        </label>
      </div>
      <label className="wa-field">
        <span>College <em>if you're a student</em></span>
        <input type="text" autoComplete="organization" maxLength={150} value={form.college} onChange={set("college")} />
      </label>
      <label className="wa-field">
        <span>How did you hear about WinterArc?</span>
        <select value={form.heard_from} onChange={set("heard_from")}>
          {HEARD_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </label>
      {W.show.referrals && (
        <label className={`wa-field wa-field-code${refError ? " has-error" : ""}`}>
          <span>Referral code <em>optional</em></span>
          <input
            type="text"
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck="false"
            maxLength={12}
            placeholder="e.g. K7MP3X"
            value={form.ref}
            aria-invalid={refError ? "true" : undefined}
            aria-describedby="wa-ref-help"
            onChange={(e) => {
              setRefError("");
              setForm((f) => ({ ...f, ref: cleanCode(e.target.value) }));
            }}
          />
          <small id="wa-ref-help" className={refError ? "wa-field-error" : "wa-field-hint"}>
            {refError || (linkCode && form.ref === linkCode
              ? "Filled in from your friend's link."
              : "Got a code from a friend? Put it here. Leave it empty if not.")}
          </small>
        </label>
      )}
      <label className="wa-check">
        <input type="checkbox" checked={form.age_confirmed} onChange={set("age_confirmed")} />
        <span>I am {W.minAge} or older and live in {W.residency}.</span>
      </label>
      <label className="wa-check">
        <input type="checkbox" checked={form.consent} onChange={set("consent")} />
        <span>
          I agree to the{" "}
          <Link to="/winterarc/rules" target="_blank">WinterArc rules</Link> and the{" "}
          <Link to="/privacy-policy" target="_blank">privacy policy</Link>.
        </span>
      </label>
      {state.error && <p className="wa-error" role="alert">{state.error}</p>}
      <button type="submit" className="wa-btn wa-btn-primary wa-btn-block" disabled={state.status === "sending"}>
        {state.status === "sending" ? "Joining..." : "Join the waitlist"}
      </button>
      <p className="wa-small wa-center">Entry is always free. No payment is needed to take part or to win.</p>
    </form>
  );
}
