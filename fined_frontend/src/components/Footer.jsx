// Site footer (every page under MainLayout): brand + socials, the two link
// columns and the newsletter sign-up. The sign-up saves the email against the
// signed-in account (the same list the admin newsletter is sent to); signed-out
// visitors are asked to log in first.
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { PiCheckCircleBold, PiInstagramLogoFill, PiLinkedinLogoFill } from "react-icons/pi";
import { saveNewsletterEmail } from "../services/api";
import footerLogo from "../assets/fined-footer-logo.webp";
import "./Footer.css";

function Newsletter() {
  const { isAuthenticated, user, loginWithRedirect } = useAuth0();
  const { pathname } = useLocation();
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | saving | done | error

  const submit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: pathname } });
      return;
    }
    setState("saving");
    try {
      await saveNewsletterEmail(user?.email || "", email.trim());
      setState("done");
    } catch {
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <p className="ft-done" role="status">
        <PiCheckCircleBold aria-hidden="true" /> You&apos;re subscribed. Watch your inbox.
      </p>
    );
  }

  return (
    <form className="ft-form" onSubmit={submit}>
      <label htmlFor="ft-email">Email address</label>
      <div className="ft-form-row">
        <input
          id="ft-email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "saving"}
        />
        <button type="submit" disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Subscribe Now"}
        </button>
      </div>
      {state === "error" && <p className="ft-error">Something went wrong. Please try again.</p>}
      {!isAuthenticated && <p className="ft-help">You&apos;ll be asked to log in first.</p>}
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="ft">
      <div className="ft-inner">
        <div className="ft-brand">
          <img src={footerLogo} alt="FinEd" className="ft-logo" />
          <p className="ft-tagline">Financial Education made Easy.</p>
          <div className="ft-socials">
            <a href="https://www.linkedin.com/company/fined-personal-finance/" aria-label="FinEd on LinkedIn" target="_blank" rel="noreferrer">
              <PiLinkedinLogoFill aria-hidden="true" />
            </a>
            <a href="https://www.instagram.com/fined.personalfinance/" aria-label="FinEd on Instagram" target="_blank" rel="noreferrer">
              <PiInstagramLogoFill aria-hidden="true" />
            </a>
          </div>
        </div>

        <nav className="ft-col" aria-label="Featured">
          <h4>Featured</h4>
          <ul>
            <li><Link to="/courses">Courses</Link></li>
            <li><Link to="/articles">Articles</Link></li>
            <li><Link to="/about">About Us</Link></li>
          </ul>
        </nav>

        <nav className="ft-col" aria-label="Other">
          <h4>Other</h4>
          <ul>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/feedback">Feedback</Link></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
            <li><Link to="/termsofservice">Terms of Service</Link></li>
          </ul>
        </nav>

        <div className="ft-news">
          <h4>Newsletter</h4>
          <Newsletter />
        </div>
      </div>

      <div className="ft-bottom">
        <p>© Copyright {new Date().getFullYear()}, All Rights Reserved by FinEd.</p>
      </div>
    </footer>
  );
}
