import "./ConceptCard.css";

function ConceptCard({ card, onContinue }) {
  const { title = "", explanation = "", reasons = [], key_takeaway = "" } = card?.card_data || {};

  return (
    <div className="conc-root">
      {title && <h2 className="conc-title">{title}</h2>}

      {explanation && (
        <div className="conc-section">
          <p className="conc-text">{explanation}</p>
        </div>
      )}

      {reasons && reasons.length > 0 && (
        <div className="conc-reasons-grid">
          {reasons.map((reason, idx) => (
            <div key={idx} className="conc-reason-card">
              <div className="conc-reason-icon">{reason.icon}</div>
              <div className="conc-reason-body">
                <div className="conc-reason-title">{reason.title}</div>
                <div className="conc-reason-desc" dangerouslySetInnerHTML={{ __html: reason.description }}></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {key_takeaway && (
        <div className="conc-takeaway">
          <span className="conc-takeaway-label">Key Takeaway</span>
          <p className="conc-text" dangerouslySetInnerHTML={{ __html: key_takeaway }}></p>
        </div>
      )}

      <button className="conc-continue-btn" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

export default ConceptCard;
