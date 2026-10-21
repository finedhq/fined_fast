import { FiArrowRight, FiCheck, FiRefreshCw } from "react-icons/fi";

export default function LensResultCard({ lens, onReset, onClose }) {
  if (!lens) return null;

  const why = lens.whyItMatters || lens.why_it_matters;
  const summary = lens.personalSummary || lens.personal_summary;
  const focus = lens.focusSections || lens.focus_sections || [];
  const todo = lens.whatToDo || lens.what_to_do;

  const scrollToHeading = (sectionName) => {
    // Match the section to a heading in the article by its text
    const headings = document.querySelectorAll(".ar-body h2, .ar-body h3, .ar-h2, .ar-h3");
    let target = null;
    const cleanSection = sectionName.toLowerCase().replace(/[^a-z0-9]/g, "");

    headings.forEach((h) => {
      const text = h.textContent.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (text.includes(cleanSection) || cleanSection.includes(text)) {
        target = h;
      }
    });

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="pl-result-wrap">
      <div className="pl-result-body">
        {why && (
          <section className="pl-why-matters-box">
            <span className="pl-label">Why this matters to you</span>
            <p className="pl-result-text">{why}</p>
          </section>
        )}

        {summary && (
          <section>
            <span className="pl-label">In short</span>
            <p className="pl-result-text">{summary}</p>
          </section>
        )}

        {focus.length > 0 && (
          <section>
            <span className="pl-label">Read these first</span>
            <ol className="pl-focus-chips">
              {focus.map((sec, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    className="pl-focus-chip"
                    onClick={() => scrollToHeading(sec)}
                    title="Jump to this section"
                  >
                    <span className="pl-get-num">{idx + 1}</span>
                    <span className="pl-focus-chip-text">{sec}</span>
                    <FiArrowRight size={14} className="pl-focus-chip-arrow" />
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}

        {lens.takeaway && (
          <section className="pl-takeaway-box">
            <span className="pl-label">Remember this</span>
            <p className="pl-result-text">{lens.takeaway}</p>
          </section>
        )}

        {todo && (
          <section>
            <span className="pl-label">Try this next</span>
            <div className="pl-action-box">
              <span className="pl-action-icon" aria-hidden="true">
                <FiCheck size={13} strokeWidth={3} />
              </span>
              <p className="pl-result-text">{todo}</p>
            </div>
          </section>
        )}
      </div>

      <div className="pl-result-footer">
        <button type="button" className="pl-reset-btn" onClick={onReset}>
          <FiRefreshCw size={13} />
          <span>Change my answers</span>
        </button>
      </div>
    </div>
  );
}
