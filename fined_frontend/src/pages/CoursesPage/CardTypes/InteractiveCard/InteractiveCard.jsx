import { useState } from "react";
import "./InteractiveCard.css";

function InteractiveCard({ card, onContinue }) {
  const { title = "", intro_text = "", items = [] } = card?.card_data || {};
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = items[activeIndex];

  return (
    <div className="ie-root">
      {title && <h2 className="ie-title">{title}</h2>}
      {intro_text && <p className="ie-intro">{intro_text}</p>}

      {items.length > 0 && (
        <div className="ie-explorer">
          <div className="ie-tabs">
            {items.map((item, idx) => (
              <button
                key={idx}
                className={`ie-tab-btn ${activeIndex === idx ? "active" : ""}`}
                onClick={() => setActiveIndex(idx)}
              >
                {item.icon && <span className="ie-tab-icon">{item.icon}</span>}
                <span className="ie-tab-label">{item.label}</span>
              </button>
            ))}
          </div>
          
          <div className="ie-content-pane">
            <h3 className="ie-content-title">{activeItem?.title}</h3>
            <p className="ie-content-text" dangerouslySetInnerHTML={{ __html: activeItem?.content || "" }}></p>
          </div>
        </div>
      )}

      <button className="ie-continue-btn" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}

export default InteractiveCard;
