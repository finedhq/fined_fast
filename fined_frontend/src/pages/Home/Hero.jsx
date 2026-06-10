import "./Hero.css";
import bgImage from "../../assets/landingpage-bg.png";

function Hero() {
  return (
    <>
      

      {/* HERO */}
      <section
        className="hero-section"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="hero-content">
          <h1 className="hero-title">
            Learn money skills in
            <br />
            <span className="highlight">
              10 minutes
            </span>{" "}
            a day
          </h1>

          <p className="hero-sub">
            Bite-sized interactive personal finance courses built
            <br />
            for 15–35 year olds.
            <br />
            No jargon, no fees, no excuses.
          </p>

          <div className="hero-buttons">
            <button className="btn-hero-primary">
              Register now →
            </button>

            <button className="btn-hero-secondary">
              Explore a course →
            </button>
          </div>

          <div className="learners-row">
            <div className="avatars">
              <div className="avatar a1">A</div>
              <div className="avatar a2">B</div>
              <div className="avatar a3">C</div>
              <div className="avatar-count">2k+</div>
            </div>

            <span>
              Join 2000+ learners building
              <br />
              their financial future
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <div className="features-strip">
        {/* Feature 1 */}

        <div className="feature-item">
          <div className="feature-icon-box fi-blue-soft">
            {/* SVG */}
          </div>

          <div className="feature-title">
            Bite sized lessons
          </div>

          <div className="feature-desc">
            Short, focused & easy to understand
          </div>
        </div>
<div className="feature-item">
  <div className="feature-icon-box fi-yellow-soft">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="#F5A623"
        strokeWidth="2"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="#F5A623"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>

  <div className="feature-title">
    Interactive Learning
  </div>

  <div className="feature-desc">
    Short, focused & easy to understand
  </div>
</div><div className="feature-item">
  <div className="feature-icon-box fi-blue-soft">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"
        stroke="#4A3AFF"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  </div>

  <div className="feature-title">
    Real Rewards
  </div>

  <div className="feature-desc">
    Short, focused & easy to understand
  </div>
</div><div className="feature-item">
  <div className="feature-icon-box fi-yellow-soft">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect
        x="2"
        y="8"
        width="6"
        height="13"
        rx="1"
        stroke="#F5A623"
        strokeWidth="2"
      />
      <rect
        x="9"
        y="5"
        width="6"
        height="16"
        rx="1"
        stroke="#F5A623"
        strokeWidth="2"
      />
      <rect
        x="16"
        y="2"
        width="6"
        height="19"
        rx="1"
        stroke="#F5A623"
        strokeWidth="2"
      />
    </svg>
  </div>

  <div className="feature-title">
    Leaderboards
  </div>

  <div className="feature-desc">
    Short, focused & easy to understand
  </div>
</div>
      </div>
    </>
  );
}

export default Hero;
