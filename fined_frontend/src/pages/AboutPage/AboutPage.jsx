import { useEffect } from "react";
import Lenis from 'lenis';
import RevealOnScroll from '../../components/RevealOnScroll';
import "./AboutPage.css";
import bgImage from '../../assets/abt-us-bg-img.png';
import img50kLearner from '../../assets/50klearner.png';
import img150Lessons from '../../assets/150lessons.png';
import imgStar from '../../assets/star.png';
import imgInstitute from '../../assets/institute.png';
import imgBiteSized from '../../assets/bite-sized-learning-abt-us.png';
import imgInteractive from '../../assets/interactivelearning-abt-us.png';
import imgRewards from '../../assets/realrewards-abtus.png';
import imgLeaderboards from '../../assets/leaderboards-abtus.png';
import imgInstitutional from '../../assets/institutional-partnerships.png';

export default function AboutPage() {
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="about-page-wrapper">
      <section 
        className="about-hero-section" 
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="about-hero-content">
          <RevealOnScroll delay={200}>
            <h1 className="hero-title">
              Making financial<br />
              education <span className="highlight-yellow">simple ,</span><br />
              <span className="highlight-yellow">practical</span> and accesssible .
            </h1>
          </RevealOnScroll>
        </div>
      </section>

      <section className="about-stats-section">
        <div className="stats-container">
          <RevealOnScroll delay={100}>
            <div className="stat-item">
              <img src={img50kLearner} alt="50K+ Active learners icon" className="stat-icon" />
              <h3>50K+</h3>
              <p>Active learners</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <div className="stat-item">
              <img src={img150Lessons} alt="150+ Lesson icon" className="stat-icon" />
              <h3>150+</h3>
              <p>Lesson</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <div className="stat-item">
              <img src={imgStar} alt="4.5/5 Learner Rating icon" className="stat-icon star-icon" />
              <h3>4.5/5</h3>
              <p>Learner Rating</p>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={400}>
            <div className="stat-item">
              <img src={imgInstitute} alt="100+ Partner Institutions icon" className="stat-icon" />
              <h3>100+</h3>
              <p>Partner Institutions</p>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      <section className="about-mission-section">
        <div className="mission-card">
          <div className="mission-left">
            <RevealOnScroll delay={100}>
              <h2 className="mission-title">Our Mission</h2>
            </RevealOnScroll>
            
            <RevealOnScroll delay={200}>
              <div className="mission-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mission-plus">
                  <path d="M12 4V20M4 12H20" stroke="#FFB600" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Most of us finished school without ever learning how credit scores work, how to invest in a mutual fund, or how to budget our monthly expenses.</p>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={300}>
              <div className="mission-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mission-plus">
                  <path d="M12 4V20M4 12H20" stroke="#FFB600" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Most of us finished school without ever learning how credit scores work, how to invest in a mutual fund, or how to budget our monthly expenses.</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={400}>
              <div className="mission-item">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mission-plus">
                  <path d="M12 4V20M4 12H20" stroke="#FFB600" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p>Most of us finished school without ever learning how credit scores work, how to invest in a mutual fund, or how to budget our monthly expenses.</p>
              </div>
            </RevealOnScroll>
          </div>
          
          <div className="mission-divider"></div>
          
          <div className="mission-right">
            <RevealOnScroll delay={150}>
              <h2 className="why-title">Why we built FinEd ?</h2>
            </RevealOnScroll>
            
            <RevealOnScroll delay={250}>
              <div className="why-content">
                <p>Most of us finished school without ever learning how credit scores work, how to invest in a mutual fund, or how to budget our monthly expenses.</p>
                <br/>
                <p>We built FinEd to fix this gap.</p>
                <br/>
                <p>Our goal is to make finance intuitive. We don't publish long, dry textbooks</p>
                <br/>
                <p>Instead, we use interactive flashcards, calculators, and simple dashboards so you can learn by doing.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      

      {/* Founders Section */}
      <section className="about-founders-section">
        <div className="founders-container">
          <RevealOnScroll delay={100}>
            <div className="founders-header">
              <h2>About the founders</h2>
              <svg width="220" height="15" viewBox="0 0 220 15" fill="none" className="founders-underline">
                <path d="M2 12C50 4 150 -2 218 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
          </RevealOnScroll>

          <div className="founders-grid">
            {/* Founder 1 */}
            <RevealOnScroll delay={200}>
              <div className="founder-card">
                <div className="founder-image-placeholder"></div>
                <div className="founder-info">
                  <h3>Founder Name</h3>
                  <h4>Founder & CEO</h4>
                  <p>Some more information about the founders and more informationabout them . Some more information about the foundersand more informationabout them . Some more information about the founders and more informationabout them . Some more information about the founders and more informationabout them</p>
                  <div className="founder-socials">
                    <div className="social-placeholder"></div>
                    <div className="social-placeholder"></div>
                    <div className="social-placeholder"></div>
                    <div className="social-placeholder"></div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>

            {/* Founder 2 */}
            <RevealOnScroll delay={300}>
              <div className="founder-card">
                <div className="founder-image-placeholder"></div>
                <div className="founder-info">
                  <h3>Founder Name</h3>
                  <h4>Founder & CEO</h4>
                  <p>Some more information about the founders and more informationabout them . Some more information about the foundersand more informationabout them . Some more information about the founders and more informationabout them . Some more information about the founders and more informationabout them</p>
                  <div className="founder-socials">
                    <div className="social-placeholder"></div>
                    <div className="social-placeholder"></div>
                    <div className="social-placeholder"></div>
                    <div className="social-placeholder"></div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Institutional Partnerships Section */}
      <section className="about-institutional-section">
        <div className="institutional-container">
          <div className="institutional-left">
            <RevealOnScroll delay={100}>
              <img src={imgInstitutional} alt="Institutional Partnerships" className="institutional-image" />
            </RevealOnScroll>
          </div>
          
          <div className="institutional-right">
            <RevealOnScroll delay={200}>
              <div>
                <h2>For Institutional Partnerships</h2>
                <p>We built FinEd to fix this gap. Our goal is to make finance intuitive. We don't publish long, dry textbooks. Instead, we use interactive flashcards, calculators, and simple dashboards so you can learn by doing.</p>
                <p>We built FinEd to fix this gap. Our goal is to make finance intuitive.</p>
                <button className="btn-partner-with-us">Partner with us</button>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>
    </div>
  );
}
