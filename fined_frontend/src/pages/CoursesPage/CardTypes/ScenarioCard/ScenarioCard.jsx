import { useState } from "react";
import "./ScenarioCard.css";

// Helper to replace terms in text with interactive spans
function renderDetailWithGlossary(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex, stageIndex) {
  if (!glossaryTerms || glossaryTerms.length === 0) return <p className="sc-detail-text">{detailText}</p>;

  // We want to find the first occurrence of each term and wrap it.
  // A simple approach is splitting the string based on terms.
  // To avoid complex overlapping replacements, we'll iterate through terms
  // and construct a regex.
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
        // Since split with capturing group returns the match itself in the array,
        // we can check if this part matches our term
        if (part.toLowerCase() === gTerm.term.toLowerCase()) {
          const isActive = activeTermIndex === termIdx;
          newElements.push(
            <span key={`${stageIndex}-${termIdx}`} className="sc-glossary-wrapper">
              <button
                className={`sc-glossary-term ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTermIndex(isActive ? null : termIdx);
                }}
              >
                {part}
              </button>
              {isActive && (
                <div className="sc-glossary-tooltip">
                  <strong>{gTerm.term}</strong>
                  <p>{gTerm.definition}</p>
                  {gTerm.example && <p className="sc-example">e.g., {gTerm.example}</p>}
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

  return <p className="sc-detail-text">{elements}</p>;
}

function ScenarioCard({ card, onContinue }) {
  const { intro_text = "", stages = [], reflection_question = "", reflection_options = [] } = card?.card_data || {};

  const [activeStage, setActiveStage] = useState(0);
  const [activeTermObj, setActiveTermObj] = useState(null); // { stageIdx, termIdx }

  const handleTermClick = (stageIdx, termIdx) => {
    setActiveTermObj(prev => prev?.stageIdx === stageIdx && prev?.termIdx === termIdx ? null : { stageIdx, termIdx });
  };

  return (
    <div className="sc-root" onClick={() => setActiveTermObj(null)}>
      {intro_text && <p className="sc-intro">{intro_text}</p>}

      <div className="sc-timeline">
        {stages.map((stage, idx) => {
          const isActive = activeStage === idx;
          const isPast = idx < activeStage;
          
          return (
            <div 
              key={idx} 
              className={`sc-stage ${isActive ? "sc-stage--active" : ""} ${isPast ? "sc-stage--past" : ""}`}
              onClick={() => setActiveStage(idx)}
            >
              <div className="sc-stage-icon">
                {stage.icon}
                {idx !== stages.length - 1 && <div className="sc-timeline-line"></div>}
              </div>
              
              <div className="sc-stage-content">
                <h3 className="sc-stage-name">{stage.name}</h3>
                
                <div className={`sc-stage-detail-wrapper ${isActive ? "open" : ""}`}>
                  <div className="sc-stage-detail-inner">
                    {renderDetailWithGlossary(
                      stage.detail, 
                      stage.glossary_terms, 
                      activeTermObj?.stageIdx === idx ? activeTermObj.termIdx : null,
                      (termIdx) => handleTermClick(idx, termIdx),
                      idx
                    )}
                    
                    {stage.stat_line && (
                      <div className="sc-stat-line">
                        {stage.stat_line}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sc-reflection">
        <p className="sc-reflection-q">{reflection_question}</p>
        <div className="sc-reflection-opts">
          {reflection_options.map((opt, idx) => (
            <button key={idx} className="sc-btn-opt" onClick={onContinue}>
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ScenarioCard;
