import { useState } from "react";
import "./InteractiveCard.css";

function InteractiveCard({ card, onContinue }) {
  const { 
    title = "", 
    intro_text = "", 
    items = [], 
    variant = "list", 
    button_text = "" 
  } = card?.card_data || {};
  
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  return (
    <div className="ie-root">
      {title && <h2 className="ie-title">{title}</h2>}
      {intro_text && <p className="ie-intro" dangerouslySetInnerHTML={{ __html: intro_text }}></p>}

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
                    <div className="ie-tab-name">{item.label}</div>
                    {item.value && <div className="ie-tab-value-small">{item.value}</div>}
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
                  <div className="ie-tab-name">{item.label}</div>
                  {item.value && (
                    <div 
                      className="ie-tab-value-right" 
                      style={item.value_color ? { color: item.value_color } : {}}
                    >
                      {item.value}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <div className="ie-content-pane">
            {activeItem?.content_title && <h3 className="ie-content-title">{activeItem.content_title}</h3>}
            {/* fallback to title just in case older schema is used */}
            {!activeItem?.content_title && activeItem?.title && <h3 className="ie-content-title">{activeItem.title}</h3>}
            <div className="ie-content-text" dangerouslySetInnerHTML={{ __html: activeItem?.content || "" }}></div>
          </div>
        </div>
      )}

      <button className="ie-continue-btn" onClick={onContinue}>
        {button_text || "Continue"}
      </button>
    </div>
  );
}

export default InteractiveCard;
