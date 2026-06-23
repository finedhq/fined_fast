import { useState, useMemo } from "react";
import "./SliderCalculatorCard.css";

// Helper to replace terms in text with interactive spans
function renderDetailWithGlossary(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex) {
  if (!glossaryTerms || glossaryTerms.length === 0) return <span className="slider-detail-text">{detailText}</span>;

  let elements = [detailText];

  glossaryTerms.forEach((gTerm, termIdx) => {
    const newElements = [];
    const termRegex = new RegExp(`\\b(${gTerm.term})\\b`, "i");

    elements.forEach((el) => {
      if (typeof el !== "string") {
        newElements.push(el);
        return;
      }
      const parts = el.split(termRegex);
      parts.forEach((part) => {
        if (part.toLowerCase() === gTerm.term.toLowerCase()) {
          const isActive = activeTermIndex === termIdx;
          newElements.push(
            <span key={`${termIdx}`} className="slider-glossary-wrapper">
              <button
                className={`slider-glossary-term ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTermIndex(isActive ? null : termIdx);
                }}
              >
                {part}
              </button>
              {isActive && (
                <div className="slider-glossary-tooltip">
                  <strong>{gTerm.term}</strong>
                  <p>{gTerm.definition}</p>
                  {gTerm.example && <p className="slider-example">e.g., {gTerm.example}</p>}
                </div>
              )}
            </span>
          );
        } else if (part) {
          newElements.push(part);
        }
      });
    });
    elements = newElements;
  });

  return <span className="slider-detail-text">{elements}</span>;
}

function SliderCalculatorCard({ card, onContinue }) {
  const {
    title = "",
    body_text = "",
    glossary_terms = [],
    highlight_line,
    cta_text = "Continue",
    default_monthly_investment = 5000,
    default_investment_period = 10,
    default_expected_return = 12.0
  } = card?.card_data || {};

  const [activeTermIndex, setActiveTermIndex] = useState(null);

  // Slider States
  const [monthly, setMonthly] = useState(default_monthly_investment);
  const [years, setYears] = useState(default_investment_period);
  const [rate, setRate] = useState(default_expected_return);

  // SIP Math Calculation
  const { invested, gains, corpus, multiplier } = useMemo(() => {
    const n = years * 12; // total months
    const i = rate / 100 / 12; // monthly interest rate
    
    // M = P × ({[1 + i]^n – 1} / i) × (1 + i)
    let M = 0;
    if (i === 0) {
      M = monthly * n;
    } else {
      M = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    }

    const totalInvested = monthly * n;
    const totalGains = M - totalInvested;
    const mult = totalInvested > 0 ? (M / totalInvested).toFixed(1) : 0;

    return {
      invested: totalInvested,
      gains: totalGains,
      corpus: M,
      multiplier: mult
    };
  }, [monthly, years, rate]);

  // Format Large Numbers (Lakhs/Crores)
  const formatCurrency = (val) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="slider-root" onClick={() => setActiveTermIndex(null)}>
      <h2 className="slider-title">{title}</h2>
      {body_text && (
        <p className="slider-body">
          {renderDetailWithGlossary(body_text, glossary_terms, activeTermIndex, setActiveTermIndex)}
        </p>
      )}

      <div className="calc-shell" onClick={(e) => e.stopPropagation()}>
        <div className="calc-sliders">
          <div className="calc-field">
            <label>Monthly Investment <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(monthly)}</span></label>
            <input 
              type="range" 
              className="calc-slider" 
              min="500" max="100000" step="500" 
              value={monthly} 
              onChange={(e) => setMonthly(Number(e.target.value))}
            />
          </div>
          <div className="calc-field">
            <label>Investment Period <span>{years} years</span></label>
            <input 
              type="range" 
              className="calc-slider" 
              min="1" max="40" step="1" 
              value={years} 
              onChange={(e) => setYears(Number(e.target.value))}
            />
          </div>
          <div className="calc-field">
            <label>Expected Annual Return <span>{rate}%</span></label>
            <input 
              type="range" 
              className="calc-slider" 
              min="1" max="30" step="0.5" 
              value={rate} 
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="calc-results-grid">
          <div className="calc-result-box">
            <div className="crb-label">Total Invested</div>
            <div className="crb-val">{formatCurrency(invested)}</div>
            <div className="crb-sub">Your actual outflow</div>
          </div>
          <div className="calc-result-box">
            <div className="crb-label">Gains Earned</div>
            <div className="crb-val accent">{formatCurrency(gains)}</div>
            <div className="crb-sub">Returns on top</div>
          </div>
          <div className="calc-result-box highlight">
            <div className="crb-label">Final Corpus</div>
            <div className="crb-val accent">{formatCurrency(corpus)}</div>
            <div className="crb-sub">{multiplier}× your investment</div>
          </div>
        </div>
        
        <p className="slider-disclaimer">
          Illustrative only. Assumes constant returns which don't reflect actual market volatility. Not investment advice.
        </p>
      </div>

      {highlight_line && (
        <div className="slider-highlight-line">
          {highlight_line}
        </div>
      )}

      <button className="slider-btn-primary" onClick={onContinue}>
        {cta_text} →
      </button>
    </div>
  );
}

export default SliderCalculatorCard;
