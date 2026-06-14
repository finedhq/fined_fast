import { useState } from "react";
import { sendFeedback } from "../services/api";
import "./FeedbackPage.css";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState(null);
  const [q4, setQ4] = useState("");
  const [q5, setQ5] = useState("");
  const [q5Details, setQ5Details] = useState("");
  const [q6, setQ6] = useState("");
  const [q7, setQ7] = useState(null);
  const [additionalFeedback, setAdditionalFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (q1 === null || q3 === null || q7 === null) {
      setSubmitStatus({ type: "error", text: "Please answer all scale-rating questions (Q1, Q3, Q7)." });
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = {
      name,
      email,
      q1_helpfulness: q1,
      q2_difficulty: q2,
      q3_navigation: q3,
      q4_design: q4,
      q5_confusing: q5,
      q5_details: q5 === "Yes" ? q5Details : "",
      q6_favFeature: q6,
      q7_returnLikelihood: q7,
      additionalFeedback,
    };

    try {
      const res = await sendFeedback(payload);
      setSubmitStatus({ type: "success", text: res.message || "Feedback submitted successfully. Thank you!" });
      // Reset form
      setName("");
      setEmail("");
      setQ1(null);
      setQ2("");
      setQ3(null);
      setQ4("");
      setQ5("");
      setQ5Details("");
      setQ6("");
      setQ7(null);
      setAdditionalFeedback("");
    } catch (err) {
      setSubmitStatus({ type: "error", text: err.message || "Failed to submit feedback. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-page-wrapper">
      <div className="feedback-page-container">
        <div className="feedback-page-header">
          <h1>We Value Your Feedback</h1>
          <div className="section-divider"></div>
          <p>Please share your experience to help us improve the FinEd platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="feedback-page-form">
          {/* Name & Email */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="feedback-name">Name</label>
              <input
                id="feedback-name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="feedback-email">Email</label>
              <input
                id="feedback-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Q1 */}
          <div className="form-group">
            <label>Q1. How helpful did you find the financial learning content?</label>
            <div className="rating-scale">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`rating-btn ${q1 === num ? "selected" : ""}`}
                  onClick={() => setQ1(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>Not helpful</span>
              <span>Extremely helpful</span>
            </div>
          </div>

          {/* Q2 */}
          <div className="form-group">
            <label htmlFor="feedback-q2">Q2. Did the content feel too basic, too advanced, or just right for you?</label>
            <select
              id="feedback-q2"
              value={q2}
              onChange={(e) => setQ2(e.target.value)}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Too basic">Too basic</option>
              <option value="Slightly basic">Slightly basic</option>
              <option value="Just right">Just right</option>
              <option value="Slightly advanced">Slightly advanced</option>
              <option value="Too advanced">Too advanced</option>
            </select>
          </div>

          {/* Q3 */}
          <div className="form-group">
            <label>Q3. On a scale of 1–5, how easy was it to navigate the website?</label>
            <div className="rating-scale">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`rating-btn ${q3 === num ? "selected" : ""}`}
                  onClick={() => setQ3(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>Very difficult</span>
              <span>Very easy</span>
            </div>
          </div>

          {/* Q4 */}
          <div className="form-group">
            <label htmlFor="feedback-q4">Q4. How would you rate the overall design and layout of the website?</label>
            <select
              id="feedback-q4"
              value={q4}
              onChange={(e) => setQ4(e.target.value)}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Very poor">Very poor</option>
              <option value="Poor">Poor</option>
              <option value="Average">Average</option>
              <option value="Good">Good</option>
              <option value="Excellent">Excellent</option>
            </select>
          </div>

          {/* Q5 */}
          <div className="form-group">
            <label htmlFor="feedback-q5">Q5. Were there any parts of the website that felt confusing?</label>
            <select
              id="feedback-q5"
              value={q5}
              onChange={(e) => {
                setQ5(e.target.value);
                if (e.target.value !== "Yes") setQ5Details("");
              }}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {q5 === "Yes" && (
            <div className="form-group conditional-group">
              <label htmlFor="feedback-q5-details">Please describe what parts felt confusing:</label>
              <textarea
                id="feedback-q5-details"
                placeholder="Details about confusing parts..."
                value={q5Details}
                onChange={(e) => setQ5Details(e.target.value)}
                required
              />
            </div>
          )}

          {/* Q6 */}
          <div className="form-group">
            <label htmlFor="feedback-q6">Q6. What feature did you find most useful?</label>
            <select
              id="feedback-q6"
              value={q6}
              onChange={(e) => setQ6(e.target.value)}
              required
            >
              <option value="" disabled>Select...</option>
              <option value="Courses">Courses</option>
              <option value="Articles">Articles</option>
              <option value="FinTools (Expense Tracker)">FinTools (Expense Tracker)</option>
              <option value="Rewards (Finstars and Finscore)">Rewards (Finstars and Finscore)</option>
              <option value="Scheme Recommendations">Scheme Recommendations</option>
              <option value="Haven't used any yet">Haven't used any yet</option>
            </select>
          </div>

          {/* Q7 */}
          <div className="form-group">
            <label>Q7. Based on your experience, how likely are you to return to FinEd?</label>
            <div className="rating-scale">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`rating-btn ${q7 === num ? "selected" : ""}`}
                  onClick={() => setQ7(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="rating-labels">
              <span>Very unlikely</span>
              <span>Very likely</span>
            </div>
          </div>

          {/* Additional Feedback */}
          <div className="form-group">
            <label htmlFor="feedback-additional">Additional Feedback</label>
            <textarea
              id="feedback-additional"
              placeholder="Any other comments or suggestions..."
              value={additionalFeedback}
              onChange={(e) => setAdditionalFeedback(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-feedback-submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
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
