import { useState } from "react";
import "./ScenarioCard.css";

import { parseBoldText, renderDetailWithGlossary as renderDetailWithGlossaryCore } from "../../../../utils/textFormatters";

function renderDetailWithGlossary(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex, customPrefix) {
  // Wrap core function to map the span to p class conceptually, though it returns a span
  return renderDetailWithGlossaryCore(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex, customPrefix, "sc", "sc-detail-text");
}

function ScenarioCard({ card, onContinue }) {
  const { 
    card_label, 
    title, 
    intro_text = "", 
    stages = [], 
    reflection_question = "", 
    reflection_label = "", 
    reflection_options = [], 
    cta_text = "Continue →", 
    callouts = [],
    scenario_header = null,
    body_text = "",
    highlight_line = "",
    respond_label = "",
    respond_options = []
  } = card?.card_data || {};
  
  const actualQuestion = reflection_label || reflection_question || respond_label;
  const actualOptions = (reflection_options && reflection_options.length > 0) ? reflection_options : respond_options;

  const [activeStage, setActiveStage] = useState(0);
  const [activeTermId, setActiveTermId] = useState(null);

  return (
    <div className="sc-root" onClick={() => setActiveTermId(null)}>
      {card_label && <div className="sc-card-label">{card_label}</div>}
      {title && <h2 className="sc-title" dangerouslySetInnerHTML={{ __html: parseBoldText(title) }}></h2>}
      
      {scenario_header && (
        <div className="sc-header">
          <div className="sc-header-avatar">{scenario_header.avatar}</div>
          <div className="sc-header-info">
            <div className="sc-header-name">{scenario_header.name}</div>
            <div className="sc-header-sub">{scenario_header.sub}</div>
          </div>
        </div>
      )}

      {intro_text && <p className="sc-intro" dangerouslySetInnerHTML={{ __html: parseBoldText(intro_text) }}></p>}
      {body_text && <p className="sc-intro" dangerouslySetInnerHTML={{ __html: parseBoldText(body_text) }}></p>}

      {highlight_line && (
        <div className="sc-stat-line sc-highlight-line" dangerouslySetInnerHTML={{ __html: parseBoldText(highlight_line) }}>
        </div>
      )}

      {stages && stages.length > 0 && (
        <div className="sc-timeline">
          {stages.map((stage, idx) => {
            const isActive = activeStage === idx;
            const isPast = idx < activeStage;
            
            return (
              <div 
                key={idx} 
                className={`sc-stage ${isActive ? "sc-stage--active" : ""} ${isPast ? "sc-stage--past" : ""}`}
                onClick={() => setActiveStage(prev => prev === idx ? null : idx)}
              >
                <div className="sc-stage-icon">
                  {stage.icon}
                  {idx !== stages.length - 1 && <div className="sc-timeline-line"></div>}
                </div>
                
                <div className="sc-stage-content">
                  <h3 className="sc-stage-name" dangerouslySetInnerHTML={{ __html: parseBoldText(stage.name) }}></h3>
                  
                  <div className={`sc-stage-detail-wrapper ${isActive ? "open" : ""} ${typeof activeTermId === 'string' && activeTermId.startsWith(idx + "-") ? "tooltip-open" : ""}`}>
                    <div className="sc-stage-detail-inner">
                      {renderDetailWithGlossary(
                        stage.detail, 
                        stage.glossary_terms, 
                        activeTermId,
                        setActiveTermId,
                        idx
                      )}
                      
                      {stage.stat_line && (
                        <div className="sc-stat-line" dangerouslySetInnerHTML={{ __html: parseBoldText(stage.stat_line) }}>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {callouts && callouts.length > 0 && (
        <div className="sc-callouts">
          {callouts.map((callout, idx) => (
            <div key={idx} className={`sc-callout type-${callout.style || "note"}`}>
              <div className="sc-callout-inner">
                {callout.icon && <div className="sc-callout-icon">{callout.icon}</div>}
                <div className="sc-callout-text">
                  {renderDetailWithGlossary(callout.text, [], null, () => {}, idx + 100)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {actualOptions && actualOptions.length > 0 ? (
        <div className="sc-reflection">
          <p className="sc-reflection-q" dangerouslySetInnerHTML={{ __html: parseBoldText(actualQuestion) }}></p>
          <div className="sc-reflection-opts">
            {actualOptions.map((opt, idx) => (
              <button key={idx} className="sc-btn-opt" onClick={onContinue} dangerouslySetInnerHTML={{ __html: parseBoldText(opt) }}>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button className="sc-continue-btn" onClick={onContinue} dangerouslySetInnerHTML={{ __html: parseBoldText(cta_text) }}>
        </button>
      )}
    </div>
  );
}

export default ScenarioCard;
