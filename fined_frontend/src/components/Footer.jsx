import React, { useEffect, useRef, useState } from "react";
import "./Footer.css";
import footerLogo from "../assets/fined-footer-logo.png";
import { Link } from "react-router-dom";
function RevealOnScroll({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  const child = React.Children.only(children);
  const existingClassName = child.props.className || "";
  const className = `${existingClassName} reveal-on-scroll ${isVisible ? "is-visible" : ""}`.trim();

  return React.cloneElement(child, {
    ref,
    className,
    style: { ...child.props.style, transitionDelay: `${delay}ms` }
  });
}


export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-inner">

                {/* LEFT — Logo + tagline + socials */}
                <div className="footer-brand">
                    <div className="footer-logo">
                        <img src={footerLogo} alt="FinEd Logo" style={{ height: "48px", width: "auto" }} />
                    </div>
                    <p className="footer-tagline">Financial Education made Easy.</p>
                    <div className="footer-socials">
                        {/* LinkedIn */}
                        <a href="https://www.linkedin.com/company/fined-personal-finance/" className="social-icon" aria-label="LinkedIn">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="4" fill="#0077B5" />
                                <path d="M7 9h2v8H7V9zm1-1a1.1 1.1 0 110-2.2A1.1 1.1 0 018 8zm4 1h2v1.1C14.4 9.4 15 9 16 9c2 0 3 1.3 3 3.3V17h-2v-4.4c0-1-.4-1.6-1.3-1.6-.8 0-1.4.6-1.7 1.2V17h-2V9z" fill="white" />
                            </svg>
                        </a>
                        {/* Instagram */}
                        <a href="https://www.instagram.com/fined.personalfinance/" className="social-icon" aria-label="Instagram">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                <rect width="24" height="24" rx="6" fill="url(#ig)" />
                                <circle cx="12" cy="12" r="3.5" stroke="white" strokeWidth="1.5" />
                                <circle cx="17" cy="7" r="1" fill="white" />
                                <rect x="4" y="4" width="16" height="16" rx="5" stroke="white" strokeWidth="1.5" fill="none" />
                                <defs>
                                    <linearGradient id="ig" x1="0" y1="24" x2="24" y2="0">
                                        <stop stopColor="#f09433" />
                                        <stop offset="0.25" stopColor="#e6683c" />
                                        <stop offset="0.5" stopColor="#dc2743" />
                                        <stop offset="0.75" stopColor="#cc2366" />
                                        <stop offset="1" stopColor="#bc1888" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </a>
                    </div>
                </div>
                                {/* FEATURED links */}
                <div className="footer-col">
                    <h4 className="footer-col-title">FEATURED</h4>
                    <ul>
                        <li><Link to="/courses">Courses</Link></li>
                        <li><Link to="/articles">Articles</Link></li>
                        <li><Link to="/fin-tools">FinTools</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                    </ul>
                </div>

                {/* OTHER links */}
                <div className="footer-col">
                    <h4 className="footer-col-title">OTHER</h4>
                    <ul>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/feedback">Feedback</Link></li>
                    </ul>
                </div>

                {/* NEWSLETTER */}
                <div className="footer-col footer-newsletter">
                    <h4 className="footer-col-title">NEWSLETTER</h4>
                        <input
                            type="email"
                            placeholder="Enter your email address"
                            className="footer-email-input"
                        />
                        <button className="footer-subscribe-btn">Subscribe Now</button>
                   
                </div>

            </div>

           
                <div className="footer-bottom">
                    <p>© Copyright 2025, All Rights Reserved by FinEd.</p>
                </div>

        </footer>
    );
}