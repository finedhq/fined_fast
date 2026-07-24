import { useState } from "react";
import "./ConceptCard.css";

// Helper for jargon
function renderDetailWithGlossary(detailText, glossaryTerms, activeTermIndex, setActiveTermIndex) {
  if (!glossaryTerms || glossaryTerms.length === 0 || typeof detailText !== "string") {
    if (typeof detailText === "string") {
      // Allow raw HTML like <strong> via dangerouslySetInnerHTML if it doesn't have glossary
      // But we must wrap in span if doing raw HTML? Actually let's just return it as dangerouslySetInnerHTML if we must, 
      // but the old code used dangerouslySetInnerHTML for `key_takeaway` and `reason.description`.
      // To keep it simple and unified, if it has HTML we should use dangerouslySetInnerHTML.
      return <span className="conc-text-span" dangerouslySetInnerHTML={{ __html: detailText }} />;
    }
    return <span className="conc-text-span">{detailText}</span>;
  }

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
            <span key={`${termIdx}-${part}`} className="conc-glossary-wrapper">
              <button
                className={`conc-glossary-term ${isActive ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTermIndex(isActive ? null : termIdx);
                }}
              >
                {part}
              </button>
              {isActive && (
                <div className="conc-glossary-tooltip">
                  <strong>{gTerm.term}</strong>
                  <p>{gTerm.definition}</p>
                  {gTerm.example && <p className="conc-example">e.g., {gTerm.example}</p>}
                </div>
              )}
            </span>
          );
        } else if (part) {
          // Wrap text chunks in dangerouslySetInnerHTML to preserve strong tags from backend
          newElements.push(<span key={Math.random()} dangerouslySetInnerHTML={{ __html: part }} />);
        }
      });
    });
    elements = newElements;
  });

  return <span className="conc-text-span">{elements}</span>;
}

function ConceptCard({ card, onContinue }) {
  const [activeTermIndex, setActiveTermIndex] = useState(null);

  const {
    card_label,
    title = "",
    body_text_1 = "",
    explanation = "", // legacy
    timeline = [],
    book_panels = [],
    bar_scenario,
    data_rows,
    grid_cards = [],
    reasons = [], // legacy
    comparison_panels = [],
    body_text_2 = "",
    table,
    simple_list = [],
    stat_boxes = [],
    body_text_3 = "",
    key_takeaway = "", // legacy
    callouts = [],
    glossary_terms = [],
    cta_text = "Continue",
  } = card?.card_data || {};

  const actualBodyText1 = body_text_1 || explanation;
  const actualGridCards = grid_cards.length > 0 ? grid_cards : reasons;
  const allCallouts = [...callouts];
  if (key_takeaway) {
    allCallouts.push({ style: "takeaway", text: key_takeaway });
  }

  return (
    <div className="conc-root" onClick={() => setActiveTermIndex(null)}>
      {card_label && <div className="conc-card-label">{card_label}</div>}
      
      {title && <h2 className="conc-title">{title}</h2>}

      {actualBodyText1 && (
        <p className="conc-body-text">
          {renderDetailWithGlossary(actualBodyText1, glossary_terms, activeTermIndex, setActiveTermIndex)}
        </p>
      )}

      {/* 1. Bar Scenario */}
      {bar_scenario && (
        <div className="conc-bar-scenario">
          {bar_scenario.title && <div className="conc-bar-title">{bar_scenario.title}</div>}
          <div className="conc-bar-tracks">
            {bar_scenario.bars?.map((bar, idx) => (
              <div key={idx} className="conc-bar-row">
                <div className="conc-bar-label">{bar.label}</div>
                <div className="conc-bar-track-wrap">
                  <div className="conc-bar-fill" style={{ width: bar.percent_width || "0%", background: bar.color_var ? `var(${bar.color_var}, ${bar.color_var})` : "rgba(255,255,255,0.15)" }}></div>
                </div>
                <div className="conc-bar-value" style={{ color: bar.color_var ? `var(${bar.color_var}, ${bar.color_var})` : "inherit" }}>
                  {bar.value}
                </div>
              </div>
            ))}
          </div>
          {bar_scenario.summary && <div className="conc-bar-summary">{bar_scenario.summary}</div>}
        </div>
      )}

      {/* 2. Timeline */}
      {timeline && timeline.length > 0 && (
        <div className="conc-timeline">
          {timeline.map((day, idx) => (
            <div key={idx} className={`conc-timeline-day theme-${day.color_theme || "default"}`}>
              <div className="conc-day-header">
                <div className="conc-day-label">{day.label}</div>
                <div className="conc-day-name">{day.title}</div>
              </div>
              <div className="conc-day-events">
                {day.events?.map((ev, i) => (
                  <div key={i} className="conc-day-event">{ev}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Book Panels */}
      {book_panels && book_panels.length > 0 && (
        <div className="conc-dual-books">
          {book_panels.map((panel, idx) => {
            const numCols = panel.headers?.length || (panel.rows?.[0]?.length) || 1;
            const gridLayout = panel.column_layout || (numCols === 3 ? "2fr 1fr 1fr" : `repeat(${numCols}, 1fr)`);
            return (
              <div key={idx} className="conc-book-panel">
                <div className="conc-book-header">{panel.title}</div>
                {panel.headers && panel.headers.length > 0 && (
                  <div className="conc-book-row header-row" style={{ gridTemplateColumns: gridLayout }}>
                    {panel.headers.map((h, i) => <div key={i}>{h}</div>)}
                  </div>
                )}
                {panel.rows?.map((row, i) => (
                  <div key={i} className="conc-book-row data-row" style={{ gridTemplateColumns: gridLayout }}>
                    {row.map((cell, j) => (
                      <div key={j} dangerouslySetInnerHTML={{ __html: cell }}></div>
                    ))}
                  </div>
                ))}
                {panel.footer && <div className="conc-book-footer" dangerouslySetInnerHTML={{ __html: panel.footer }}></div>}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Data Rows */}
      {data_rows && data_rows.rows && (
        <div className="conc-data-rows">
          {data_rows.title && <div className="conc-dr-title">{data_rows.title}</div>}
          {data_rows.rows.map((row, idx) => (
            <div key={idx} className="conc-dr-row">
              <span className="conc-dr-label">{row.label}</span>
              <span className="conc-dr-val" style={{ color: row.is_highlight ? "var(--accent)" : "inherit" }}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 5. Grid Cards */}
      {actualGridCards && actualGridCards.length > 0 && (
        <div className="conc-grid-cards">
          {actualGridCards.map((item, idx) => (
            <div key={idx} className="conc-grid-card">
              <div className="conc-grid-header">
                <div className="conc-grid-icon">{item.icon}</div>
                <div className="conc-grid-title">{item.title}</div>
              </div>
              <div className="conc-grid-body">
                <div className="conc-grid-desc">
                  {renderDetailWithGlossary(item.desc || item.description || "", glossary_terms, activeTermIndex, setActiveTermIndex)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Comparison Panels */}
      {comparison_panels && comparison_panels.length > 0 && (
        <div className="conc-comparison">
          {comparison_panels.map((panel, idx) => (
            <div key={idx} className={`conc-comp-col theme-${panel.style || "neutral"}`}>
              <div className="conc-comp-header">
                {panel.icon && <span>{panel.icon}</span>}
                <span>{panel.title}</span>
              </div>
              <div className="conc-comp-body">
                <ul>
                  {panel.items?.map((item, i) => (
                    <li key={i}>
                      {renderDetailWithGlossary(item, glossary_terms, activeTermIndex, setActiveTermIndex)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {body_text_2 && (
        <p className="conc-body-text">
          {renderDetailWithGlossary(body_text_2, glossary_terms, activeTermIndex, setActiveTermIndex)}
        </p>
      )}

      {/* 7. Table */}
      {table && table.rows && (
        <table className="conc-table">
          {table.headers && table.headers.length > 0 && (
            <thead>
              <tr>
                {table.headers.map((h, i) => <th key={i}>{h}</th>)}
              </tr>
            </thead>
          )}
          <tbody>
            {table.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} dangerouslySetInnerHTML={{ __html: cell }}></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 8. Simple List */}
      {simple_list && simple_list.length > 0 && (
        <div className="conc-simple-list">
          {simple_list.map((item, idx) => (
            <div key={idx} className="conc-sl-item">
              <span className="conc-sl-bullet">✓</span>
              {renderDetailWithGlossary(item, glossary_terms, activeTermIndex, setActiveTermIndex)}
            </div>
          ))}
        </div>
      )}

      {/* 9. Stat Boxes */}
      {stat_boxes && stat_boxes.length > 0 && (
        <div className="conc-stat-boxes">
          {stat_boxes.map((box, idx) => (
            <div key={idx} className="conc-stat-box">
              <div className="conc-stat-val" style={{ color: box.color_var ? `var(${box.color_var}, ${box.color_var})` : "inherit" }}>
                {box.value}
              </div>
              <div className="conc-stat-label">{box.label}</div>
            </div>
          ))}
        </div>
      )}

      {body_text_3 && (
        <p className="conc-body-text">
          {renderDetailWithGlossary(body_text_3, glossary_terms, activeTermIndex, setActiveTermIndex)}
        </p>
      )}

      {/* 10. Callouts */}
      {allCallouts && allCallouts.length > 0 && (
        <div className="conc-callouts">
          {allCallouts.map((callout, idx) => (
            <div key={idx} className={`conc-callout type-${callout.style || "note"}`}>
              {callout.style === "takeaway" && <div className="conc-takeaway-label">Key Takeaway</div>}
              <div className="conc-callout-inner">
                {callout.icon && <div className="conc-callout-icon">{callout.icon}</div>}
                <div className="conc-callout-text">
                  {renderDetailWithGlossary(callout.text, glossary_terms, activeTermIndex, setActiveTermIndex)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="conc-continue-btn" onClick={onContinue}>
        {cta_text}
      </button>
    </div>
  );
}

export default ConceptCard;
