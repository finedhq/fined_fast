import { useState } from "react";
import { sendContactQuery } from "../services/api";
import "./ContactPage.css";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      const res = await sendContactQuery(name, email, message);
      setSubmitStatus({ type: "success", text: res.message || "Message sent successfully!" });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setSubmitStatus({ type: "error", text: err.message || "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page-wrapper">
      <div className="contact-page-container">
        <div className="contact-page-header">
          <h1>Get in Touch</h1>
          <div className="section-divider"></div>
          <p>Have questions, feedback, or need support? Send us a message and our team will get back to you.</p>
        </div>

        <form onSubmit={handleSubmit} className="contact-page-form">
          <div className="form-group">
            <label htmlFor="contact-name">Your Name</label>
            <input
              id="contact-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-email">Your Email</label>
            <input
              id="contact-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-message">Your Message</label>
            <textarea
              id="contact-message"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>
          </div>

          <button type="submit" className="btn-contact-submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>

          {submitStatus && (
            <p className={`submit-status ${submitStatus.type}`}>
              {submitStatus.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
