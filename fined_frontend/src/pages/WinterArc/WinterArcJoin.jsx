// /winterarc/join: the join form on its own page (owner 2026-11-21), so
// coming back from sign-up lands on the form and nothing else.
// Flow: sign up (FinEd account) -> register here (the competition) -> the hub.
// A 3-step tracker on top says which step you're on.
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  PiArrowLeftBold, PiCalendarCheckBold, PiCheckBold, PiFireBold, PiGiftBold, PiSnowflakeBold, PiUsersThreeBold,
} from "react-icons/pi";
import { WINTERARC as W } from "./winterarcConfig";
import SignupForm, { Countdown } from "./WinterArcSignup";
import sceneImg from "../../assets/newnewbg-imgofhomepg.webp";
import "./WinterArcLanding.css";

const PERKS = [
  [PiCalendarCheckBold, "One short money task a day, a few minutes each"],
  [PiFireBold, "Streaks, points and leaderboards"],
  [PiUsersThreeBold, "Your own invite link for friends"],
  [PiGiftBold, "Free to enter, free to win"],
];

function Steps({ signedIn }) {
  const steps = [
    ["FinEd account", signedIn ? "done" : "now"],
    ["Register for WinterArc", signedIn ? "now" : "next"],
    ["Your hub", "next"],
  ];
  return (
    <ol className="wa-steps-bar" aria-label="Joining WinterArc">
      {steps.map(([label, state], i) => (
        <li key={label} className={`is-${state}`} aria-current={state === "now" ? "step" : undefined}>
          <span className="wa-steps-dot">{state === "done" ? <PiCheckBold aria-hidden="true" /> : i + 1}</span>
          <span className="wa-steps-label">
            {label}
            {state === "done" && <span className="wa-sr"> (done)</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

export default function WinterArcJoin() {
  const { isAuthenticated } = useAuth0();
  useEffect(() => {
    document.title = `Join ${W.name} | FinEd`;
  }, []);

  return (
    <div className="wa wa-join-page">
      <div className="wa-join-scene" aria-hidden="true">
        <img src={sceneImg} alt="" />
      </div>
      <div className="wa-wrap wa-join-wrap">
        <Link className="wa-join-back" to="/winterarc">
          <PiArrowLeftBold aria-hidden="true" /> About {W.name}
        </Link>
        <Steps signedIn={isAuthenticated} />

        <div className="wa-join-grid">
          <aside className="wa-join-side">
            <p className="wa-eyebrow"><PiSnowflakeBold aria-hidden="true" /> {W.name} · 1 to 30 Dec</p>
            <h1>
              Give your money a <span className="wa-join-hl">winter arc.</span>
            </h1>
            <div className="wa-join-ticket">
              <p className="wa-join-ticket-label">Day 1 unlocks in</p>
              <Countdown />
              <ul className="wa-join-perks">
                {PERKS.map(([Icon, text]) => (
                  <li key={text}>
                    <span className="wa-join-perk-icon"><Icon aria-hidden="true" /></span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <div className="wa-form-wrap">
            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  );
}
