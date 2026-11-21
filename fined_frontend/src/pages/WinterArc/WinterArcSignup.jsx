// The join form (its own page, /winterarc/join) and the countdown.
// Flow (owner 2026-11-21): sign up -> this form -> straight to the hub.
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { PiArrowRightBold, PiCheckCircleFill, PiGoogleLogoBold, PiLockSimpleBold } from "react-icons/pi";
import { WINTERARC as W } from "./winterarcConfig";
import { joinWinterArcWaitlist } from "../../services/api";
import { getAttribution } from "../../utils/attribution";
import { trackEvent } from "../../utils/analytics";
import { markJoined } from "./winterarcVisitor";
import useWinterArcStatus, { refreshWinterArcStatus } from "./useWinterArcStatus";
import { HUB_PATH, JOIN_PATH } from "./useJoinWinterArc";

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

// Referral codes: letters and digits only, upper case (what the link carries)
const cleanCode = (v) =>
  String(v || "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase()
    .slice(0, 12);

export default function SignupForm() {
  // The referral code box starts with the code from a friend's link, if any
  const [linkCode] = useState(() => cleanCode(getAttribution().ref));
  const [form, setForm] = useState(() => ({
    name: "",
    email: "",
    college: "",
    heard_from: "",
    age_confirmed: false,
    consent: false,
    newsletter: false,
    ref: linkCode,
  }));
  const [refError, setRefError] = useState("");
  const [state, setState] = useState({ status: "idle", error: "" });
  const navigate = useNavigate();
  const status = useWinterArcStatus();

  // Signed-in learners: fill in their name and email (only into empty fields)
  const { user, isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const [prefilled, setPrefilled] = useState(false);
  if (user && !prefilled) {
    setPrefilled(true);
    setForm((f) => ({
      ...f,
      name: f.name || user.name || "",
      email: user.email || f.email || "",
    }));
  }

  const set = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    if (state.status === "sending") return;
    if (!form.age_confirmed)
      return setState((s) => ({
        ...s,
        error: `WinterArc is for residents of ${W.residency} aged ${W.minAge} or over.`,
      }));
    if (!form.consent)
      return setState((s) => ({
        ...s,
        error: "Please agree to the WinterArc rules and the privacy policy to join.",
      }));
    setState((s) => ({ ...s, status: "sending", error: "" }));
    setRefError("");
    try {
      // The box wins over the link: what's in it is what counts
      const res = await joinWinterArcWaitlist({
        ...getAttribution(),
        ...form,
        ref: form.ref || null,
      });
      markJoined(res.referral_code);
      refreshWinterArcStatus();
      if (form.newsletter) trackEvent("newsletter_optin", { form_type: "winterarc_waitlist" });
      if (!res.already_joined) {
        const src = getAttribution();
        trackEvent("generate_lead", {
          form_type: "winterarc_waitlist",
          heard_from: form.heard_from || "unknown",
          utm_source: src.utm_source || "",
          referred: form.ref ? "yes" : "no",
        });
      }
      // Straight to the hub, which says "You're in" once
      navigate(HUB_PATH, {
        state: { welcome: res.already_joined ? "already" : "new" },
      });
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

  // Joining needs a FinEd account, so the hub can find you with the same email.
  // A friend's referral code survives the sign-in trip (it is kept in this browser).
  if (!isAuthenticated) {
    // Same Auth0 call as the navbar's Sign Up. A screen_hint: "signup" makes
    // this tenant answer "connection not found for the client", so none here.
    const goSignIn = () => loginWithRedirect({ appState: { returnTo: JOIN_PATH } });
    return (
      <div className="wa-form wa-join-card wa-signin-first">
        <p className="wa-join-step">First step</p>
        <h2 className="wa-join-title">First, make your free FinEd account</h2>
        <p className="wa-join-text">
          You'll use it to open each day's task and track your streak. It takes one tap with Google, and then you come
          straight back here to register for the competition.
        </p>
        {linkCode && (
          <p className="wa-join-note">
            Your friend's code <strong>{linkCode}</strong> is saved and will be filled in.
          </p>
        )}
        <button type="button" className="wa-btn wa-btn-primary wa-btn-block" disabled={isLoading} onClick={goSignIn}>
          <PiGoogleLogoBold aria-hidden="true" /> Sign up for free
        </button>
        <button type="button" className="wa-thanks-other" disabled={isLoading} onClick={goSignIn}>
          Already have an account? Log in
        </button>
      </div>
    );
  }

  // Already a member (checked with the server): nothing to fill in
  if (status.checked && status.joined) return <Navigate to={HUB_PATH} replace />;

  return (
    <form className="wa-form wa-join-card" onSubmit={submit} noValidate>
      {/* You have a FinEd account now; WinterArc is a separate sign-up */}
      <div className="wa-join-signed">
        <PiCheckCircleFill aria-hidden="true" />
        <span>
          You're signed up
          {user?.email ? (
            <>
              {" "}
              as <strong>{user.email}</strong>
            </>
          ) : null}
        </span>
      </div>
      <p className="wa-join-step">Last step</p>
      <h2 className="wa-join-title">Now register for the competition</h2>
      <p className="wa-join-text">
        Your FinEd account is ready. {W.name} is a separate competition, so tell us a little about you and you're in.
      </p>

      <fieldset className="wa-join-group">
        <legend>About you</legend>
        <div className="wa-field-row">
          <label className="wa-field">
            <span>Name</span>
            <input type="text" autoComplete="name" maxLength={100} value={form.name} onChange={set("name")} />
          </label>
          <label className="wa-field">
            <span>
              Email {user?.email && <PiLockSimpleBold className="wa-field-lock" aria-label="from your FinEd account" />}
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              value={form.email}
              onChange={set("email")}
              readOnly={!!user?.email}
              title={user?.email ? "The email on your FinEd account" : undefined}
              className={user?.email ? "is-locked" : undefined}
            />
          </label>
        </div>
        <label className="wa-field">
          <span>
            College <em>if you're a student</em>
          </span>
          <input type="text" autoComplete="organization" maxLength={150} value={form.college} onChange={set("college")} />
        </label>
      </fieldset>

      <fieldset className="wa-join-group">
        <legend>Almost there</legend>
        <label className="wa-field">
          <span>How did you hear about WinterArc?</span>
          <select value={form.heard_from} onChange={set("heard_from")}>
            {HEARD_OPTIONS.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        {W.show.referrals && (
          <label className={`wa-field wa-field-code${refError ? " has-error" : ""}`}>
            <span>
              Referral code <em>optional</em>
            </span>
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
              {refError ||
                (linkCode && form.ref === linkCode
                  ? "Filled in from your friend's link."
                  : "Got a code from a friend? Put it here. Leave it empty if not.")}
            </small>
          </label>
        )}
      </fieldset>

      <fieldset className="wa-join-group wa-join-agree">
        <legend className="wa-sr">Before you join</legend>
        <label className="wa-check">
          <input type="checkbox" checked={form.age_confirmed} onChange={set("age_confirmed")} />
          <span>
            I am {W.minAge} or older and live in {W.residency}.
          </span>
        </label>
        <label className="wa-check">
          <input type="checkbox" checked={form.consent} onChange={set("consent")} />
          <span>
            I agree to the{" "}
            <Link to="/winterarc/rules" target="_blank">
              WinterArc rules
            </Link>{" "}
            and the{" "}
            <Link to="/privacy-policy" target="_blank">
              privacy policy
            </Link>
            .
          </span>
        </label>
        <label className="wa-check">
          <input type="checkbox" checked={form.newsletter} onChange={set("newsletter")} />
          <span>
            Email me a short money article each day during {W.name}. <em>Optional</em>
          </span>
        </label>
      </fieldset>
      {state.error && (
        <p className="wa-error" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="wa-btn wa-btn-primary wa-btn-block" disabled={state.status === "sending"}>
        {state.status === "sending" ? (
          "Registering..."
        ) : (
          <>
            Register for {W.name} <PiArrowRightBold aria-hidden="true" />
          </>
        )}
      </button>
      <p className="wa-small wa-center wa-join-free">Entry is always free. No payment is needed to take part or to win.</p>
    </form>
  );
}
