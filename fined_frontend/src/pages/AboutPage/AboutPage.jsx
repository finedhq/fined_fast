import { useEffect } from "react";
import Lenis from 'lenis';
import RevealOnScroll from '../../components/RevealOnScroll';
import "./AboutPage.css";

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
      {/* 1. Hero Section */}
      <section className="about-hero">
        <div className="about-hero-container">
          <RevealOnScroll delay={100}>
            <span className="badge">ABOUT FINED</span>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <h1>Democratizing Financial Literacy for Everyone</h1>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <p className="hero-subtitle">
              Most people never learned how money works—not in school, and not at home. FinEd is here to change that. We make financial education engaging, visual, and highly practical.
            </p>
          </RevealOnScroll>
        </div>
        <div className="hero-gradient-orb"></div>
      </section>

      {/* 2. Our Mission Section */}
      <section className="about-mission-section">
        <div className="about-container">
          <div className="mission-grid">
            <RevealOnScroll delay={200}>
              <div className="mission-text-block">
                <h2>Our Mission</h2>
                <div className="mission-line"></div>
                <p>
                  We believe that financial independence shouldn't require an MBA or hours of sorting through complex bank paperwork. Our mission is to bridge the gap between financial theory and real-life action.
                </p>
                <p>
                  FinEd empowers you to build positive financial habits, discover the best savings and investment products suited to your profile, and take control of your financial future.
                </p>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={400}>
              <div className="mission-stat-box">
                <div className="stat-card">
                  <h3>01</h3>
                  <h4>Visual & Interactive</h4>
                  <p>Skip the textbooks. Learn via interactive flashcards, courses, and visual dashboards.</p>
                </div>
                <div className="stat-card">
                  <h3>02</h3>
                  <h4>Tailored For You</h4>
                  <p>Our algorithms match you with the top financial products based on your goals and habits.</p>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 3. Core Values Grid */}
      <section className="about-values-section">
        <div className="about-container">
          <RevealOnScroll delay={100}>
            <div className="section-header">
              <h2>Our Core Pillars</h2>
              <p>The principles guiding our platform design and curriculum.</p>
            </div>
          </RevealOnScroll>

          <div className="values-grid">
            <RevealOnScroll delay={100}>
              <div className="value-card">
                <div className="value-icon">💡</div>
                <h3>Clarity First</h3>
                <p>We translate complex financial jargon into simple, actionable concepts you can apply immediately.</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div className="value-card">
                <div className="value-icon">🎯</div>
                <h3>Action Oriented</h3>
                <p>We don't just teach. We provide tools like the Expense Tracker to help you practice what you learn.</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
              <div className="value-card">
                <div className="value-icon">🔒</div>
                <h3>Unbiased Trust</h3>
                <p>We suggest banks and plans that match your data point requirements, not paying sponsors.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 4. CTA / Final Wave */}
      <section className="about-cta-section">
        <div className="about-container">
          <RevealOnScroll delay={200}>
            <div className="about-cta-box">
              <h2>Ready to start your financial journey?</h2>
              <p>Explore our latest visual guides, track your expenses, or find the best schemes today.</p>
              <a href="/articles" className="btn-about-cta">Explore Insights</a>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
