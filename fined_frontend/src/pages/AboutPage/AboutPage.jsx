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
            <span className="brand-label">Our Story</span>
          </RevealOnScroll>
          <RevealOnScroll delay={200}>
            <h1>We build tools to make personal finance easy to understand.</h1>
          </RevealOnScroll>
          <RevealOnScroll delay={300}>
            <p className="hero-subtitle">
              FinEd started because we realized most people learn personal finance the hard way—through costly mistakes. We're here to change that with visual lessons and straightforward tools.
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* 2. Brand Context (Two Column) */}
      <section className="about-narrative-section">
        <div className="about-container">
          <div className="narrative-grid">
            <RevealOnScroll delay={200}>
              <div className="narrative-left">
                <h2>Why we built FinEd.</h2>
                <div className="narrative-accent-line"></div>
              </div>
            </RevealOnScroll>
            
            <RevealOnScroll delay={350}>
              <div className="narrative-right">
                <p>
                  Most of us finished school without ever learning how credit scores work, how to invest in a mutual fund, or how to budget our monthly expenses. We had to figure it out ourselves.
                </p>
                <p>
                  We built FinEd to fix this gap. Our goal is to make finance intuitive. We don't publish long, dry textbooks. Instead, we use interactive flashcards, calculators, and simple dashboards so you can learn by doing.
                </p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 3. Key Approaches (Replacing Pillars Grid) */}
      <section className="about-approach-section">
        <div className="about-container">
          <RevealOnScroll delay={100}>
            <div className="approach-header">
              <h2>The FinEd Approach</h2>
            </div>
          </RevealOnScroll>

          <div className="approach-grid">
            <RevealOnScroll delay={150}>
              <div className="approach-card">
                <div className="approach-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <h3>Bite-sized learning</h3>
                <p>Learn complex financial topics through interactive flashcard decks and progress trackers that fit into your day.</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={250}>
              <div className="approach-card">
                <div className="approach-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3>Zero sponsored bias</h3>
                <p>We match you with financial plans and savings schemes based on your metrics, not bank sponsorships.</p>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={350}>
              <div className="approach-card">
                <div className="approach-icon-wrapper">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <h3>Interactive tools</h3>
                <p>Apply your knowledge immediately with an integrated expense tracker and budgeting simulation tools.</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 4. Action Section */}
      <section className="about-action-section">
        <div className="about-container">
          <RevealOnScroll delay={200}>
            <div className="about-action-banner">
              <h2>Ready to build your financial confidence?</h2>
              <p>Explore articles, try our calculators, and learn how to make your money work for you.</p>
              <a href="/articles" className="btn-about-action">Get Started</a>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </div>
  );
}
