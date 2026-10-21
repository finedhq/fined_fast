// App start screen for logged-out users (app build only), in place of the website's landing page.
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { PiArrowRightBold } from 'react-icons/pi';
import logo from '../../resources/app-logo.png';
import './Welcome.css';

export default function Welcome() {
  const navigate = useNavigate();
  const { loginWithRedirect } = useAuth0();
  const returnHome = { appState: { returnTo: '/dashboard' } };

  return (
    <div className="app-welcome">
      <div className="app-welcome-top">
        <img className="app-welcome-logo" src={logo} alt="FinEd" />
        <h1 className="app-welcome-title">
          Learn money skills in <span>10 minutes</span> a day
        </h1>
        <p className="app-welcome-sub">
          Bite-sized interactive personal finance courses built for the youth. No jargon, no fees, no excuses.
        </p>
      </div>

      <div className="app-welcome-actions">
        <button
          type="button"
          className="app-welcome-btn app-welcome-primary"
          onClick={() => loginWithRedirect({ ...returnHome, authorizationParams: { screen_hint: 'signup' } })}
        >
          Create free account
        </button>
        <button type="button" className="app-welcome-btn app-welcome-secondary" onClick={() => loginWithRedirect(returnHome)}>
          Log in
        </button>
        <button type="button" className="app-welcome-link" onClick={() => navigate('/try')}>
          Try Module 1 first <PiArrowRightBold aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
