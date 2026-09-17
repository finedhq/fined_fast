import { useState, useEffect } from "react";
import { sendContactQuery } from "../../services/api";
import toast from "react-hot-toast";
import Lenis from "lenis";
import RevealOnScroll from "../../components/RevealOnScroll";
import {
  IoMailOutline,
  IoCallOutline,
  IoCopyOutline,
  IoCheckmarkOutline,
  IoSendOutline,
  IoPersonOutline,
  IoTimeOutline,
  IoCheckmarkCircle,
  IoAlertCircle
} from "react-icons/io5";
import "./ContactPage.css";

const TOPICS = [
  "General Inquiry",
  "Course Support",
  "Editorial Feedback",
  "Partnerships & Press"
];

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [copied, setCopied] = useState(false);

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

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("support@myfined.com");
      setCopied(true);
      toast.success("Email copied to clipboard: support@myfined.com");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast("support@myfined.com");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const fullMessage = `[Topic: ${selectedTopic}]\n\n${message.trim()}`;
      const res = await sendContactQuery(name.trim(), email.trim(), fullMessage);
      setSubmitStatus({
        type: "success",
        text: res.message || "Thank you! Your message has been sent. We'll be in touch soon."
      });
      toast.success("Message sent successfully!");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setSubmitStatus({
        type: "error",
        text: err.message || "Something went wrong. Please try again or email us directly at support@myfined.com"
      });
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-wrapper">
      <div className="contact-page-container">
        {/* ── HERO HEADER ── */}
        <RevealOnScroll delay={100}>
          <div className="contact-hero-header">
            <h1 className="contact-hero-title">
              Get in Touch with <span className="contact-hero-brand">FinEd</span>
            </h1>
            <p className="contact-hero-subtitle">
              Have questions about our financial courses, explainers, or need research support? Reach out directly or send us a message below.
            </p>
          </div>
        </RevealOnScroll>

        {/* ── 2-COLUMN GRID LAYOUT ── */}
        <div className="contact-grid-layout">
          {/* LEFT COLUMN: DIRECT SUPPORT */}
          <div className="contact-info-column">
            <RevealOnScroll delay={200}>
              <div className="contact-email-card">
                <div className="contact-email-header">
                  <div className="contact-email-icon-box">
                    <IoMailOutline />
                  </div>
                  <div>
                    <h2 className="contact-email-title">Direct Support</h2>
                    <span className="contact-email-badge">
                      <IoTimeOutline size={13} /> Replies within 24 hours
                    </span>
                  </div>
                </div>

                <p className="contact-email-desc">
                  For urgent help, institutional partnerships, or general inquiries, reach out directly to our team.
                </p>

                {/* Email Support */}
                <div className="contact-direct-item">
                  <span className="contact-direct-label">Email</span>
                  <div className="contact-email-pill-box">
                    <a
                      href="mailto:support@myfined.com"
                      className="contact-email-link"
                      title="Send email to support@myfined.com"
                    >
                      support@myfined.com
                    </a>
                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className={`contact-copy-btn ${copied ? "copied" : ""}`}
                      aria-label="Copy email address"
                    >
                      {copied ? (
                        <>
                          <IoCheckmarkOutline size={14} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <IoCopyOutline size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Contact Numbers */}
                <div className="contact-direct-item">
                  <span className="contact-direct-label">Phone Support</span>
                  <div className="contact-phone-pill-box">
                    <div className="contact-phone-icon">
                      <IoCallOutline />
                    </div>
                    <div className="contact-phone-links">
                      <a href="tel:7507972411" className="contact-phone-link" title="Call 7507972411">
                        7507972411
                      </a>
                      <span className="contact-phone-divider">/</span>
                      <a href="tel:9325586658" className="contact-phone-link" title="Call 9325586658">
                        9325586658
                      </a>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="contact-hours-box">
                  <div className="contact-hours-icon">
                    <IoTimeOutline />
                  </div>
                  <div className="contact-hours-content">
                    <span className="contact-hours-label">Working Hours</span>
                    <span className="contact-hours-text">Mon – Sat: 9:00 AM – 7:00 PM IST</span>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>

          {/* RIGHT COLUMN: INTERACTIVE CONTACT FORM */}
          <RevealOnScroll delay={250}>
            <div className="contact-form-card">
              <div className="contact-form-header">
                <h2 className="contact-form-title">Send us a Message</h2>
                <p className="contact-form-subtitle">
                  Fill out the form below and we'll get back to you promptly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="contact-form-body">
                {/* Topic Selector Pills */}
                <div>
                  <label className="contact-topic-pills-label">Select Inquiry Topic</label>
                  <div className="contact-topic-pills-row">
                    {TOPICS.map((topic) => (
                      <button
                        key={topic}
                        type="button"
                        onClick={() => setSelectedTopic(topic)}
                        className={`contact-topic-pill ${selectedTopic === topic ? "active" : ""}`}
                      >
                        {topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Input */}
                <div className="contact-form-group">
                  <label htmlFor="contact-name" className="contact-form-label">
                    Your Name
                  </label>
                  <div className="contact-input-wrapper">
                    <IoPersonOutline className="contact-input-icon" />
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="contact-input-field"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="contact-form-group">
                  <label htmlFor="contact-email" className="contact-form-label">
                    Your Email Address
                  </label>
                  <div className="contact-input-wrapper">
                    <IoMailOutline className="contact-input-icon" />
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="e.g. rahul@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="contact-input-field"
                      required
                    />
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="contact-form-group">
                  <label htmlFor="contact-message" className="contact-form-label">
                    <span>Your Message</span>
                    <span style={{ fontSize: "12px", color: "#625D6D", fontWeight: "normal" }}>
                      {message.length} characters
                    </span>
                  </label>
                  <textarea
                    id="contact-message"
                    placeholder="Tell us what you need help with or share your feedback..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="contact-textarea-field"
                    required
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="contact-submit-btn"
                  disabled={isSubmitting}
                  aria-label="Send contact query"
                >
                  {isSubmitting ? (
                    <>
                      <div className="contact-spinner" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <>
                      <IoSendOutline size={18} />
                      <span>Send Message</span>
                    </>
                  )}
                </button>

                {/* Feedback Status Box */}
                {submitStatus && (
                  <div className={`contact-status-box ${submitStatus.type}`}>
                    {submitStatus.type === "success" ? (
                      <IoCheckmarkCircle size={20} style={{ color: "#4100BC", flexShrink: 0 }} />
                    ) : (
                      <IoAlertCircle size={20} style={{ color: "#2D007F", flexShrink: 0 }} />
                    )}
                    <span>{submitStatus.text}</span>
                  </div>
                )}
              </form>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </div>
  );
}
