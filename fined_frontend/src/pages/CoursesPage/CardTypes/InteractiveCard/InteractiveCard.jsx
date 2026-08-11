import { useState } from "react";
import "./InteractiveCard.css";
import { parseBoldText } from "../../../../utils/textFormatters";

function InteractiveCard({ card, onContinue }) {
  const {
    card_label,
    title = "",
    intro_text = "",
    items = [],
    variant = "list",
    button_text = "",
    allotted_finstars = 0,
  } = card?.card_data || {};

  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  return (
    <div className="ie-root">
      {title && <h2 className="ie-title" dangerouslySetInnerHTML={{ __html: parseBoldText(title) }}></h2>}
      {intro_text && <p className="ie-intro" dangerouslySetInnerHTML={{ __html: parseBoldText(intro_text) }}></p>}

      {items.length > 0 && (
        <div className={`ie-explorer ${variant === "grid" ? "ie-explorer-grid" : "ie-explorer-list"}`}>
          <div className={`ie-tabs ${variant === "grid" ? "ie-tabs-grid" : "ie-tabs-list"}`}>
            {items.map((item, idx) => {
              const isActive = activeIndex === idx;

              if (variant === "grid") {
                return (
                  <button
                    key={idx}
                    className={`ie-tab-tile ${isActive ? "active" : ""}`}
                    onClick={() => setActiveIndex(idx)}
                  >
                    {item.icon && <div className="ie-tab-icon-large">{item.icon}</div>}
                    <div className="ie-tab-name" dangerouslySetInnerHTML={{ __html: parseBoldText(item.label) }}></div>
                    {item.value && <div className="ie-tab-value-small" dangerouslySetInnerHTML={{ __html: parseBoldText(item.value) }}></div>}
                  </button>
                );
              }

              // List variant (default)
              return (
                <button
                  key={idx}
                  className={`ie-tab-row ${isActive ? "active" : ""}`}
                  onClick={() => setActiveIndex(idx)}
                >
                  <div className="ie-tab-name" dangerouslySetInnerHTML={{ __html: parseBoldText(item.label) }}></div>
                  {item.value && (
                    <div
                      className="ie-tab-value-right"
                      style={item.value_color ? { color: item.value_color } : {}}
                      dangerouslySetInnerHTML={{ __html: parseBoldText(item.value) }}
                    >
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="ie-content-pane">
            {activeItem?.content_title && <h3 className="ie-content-title" dangerouslySetInnerHTML={{ __html: parseBoldText(activeItem.content_title) }}></h3>}
            {/* fallback to title just in case older schema is used */}
            {!activeItem?.content_title && activeItem?.title && <h3 className="ie-content-title" dangerouslySetInnerHTML={{ __html: parseBoldText(activeItem.title) }}></h3>}
            <div className="ie-content-text" dangerouslySetInnerHTML={{ __html: parseBoldText(activeItem?.content || "") }}></div>
          </div>
        </div>
      )}

      <button className="ie-continue-btn" onClick={() => onContinue(null, allotted_finstars)}>
        {button_text || "Continue"}
      </button>
    </div>
  );
}

export default InteractiveCard;
