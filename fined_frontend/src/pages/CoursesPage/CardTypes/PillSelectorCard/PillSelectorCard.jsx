import { useState, useMemo, useEffect } from "react";
import "./PillSelectorCard.css";
import { parseBoldText } from "../../../../utils/textFormatters";

function PillSelectorCard({ card, onContinue }) {
  const {
    card_label,
    title = "",
    body_text = "",
    output_categories = [],
    profiles = [],
    base_allocation = {},
    groups = [],
    cta_text = "Continue",
  } = card?.card_data || {};

  // State to hold the selected option 'value' for each group
  const [selections, setSelections] = useState({});

  // Initialize with the first option of each group when the component mounts
  useEffect(() => {
    const initialSelections = {};
    groups.forEach((group) => {
      if (group.options && group.options.length > 0) {
        initialSelections[group.group_id] = group.options[0].value;
      }
    });
    setSelections(initialSelections);
  }, [groups]);

  // Compute final allocation
  const alloc = useMemo(() => {
    // 1. Start with base allocation
    let scores = { ...base_allocation };

    // 2. Apply impacts from selections
    groups.forEach((group) => {
      const selectedValue = selections[group.group_id];
      const selectedOption = group.options?.find(opt => opt.value === selectedValue);
      if (selectedOption && selectedOption.impact) {
        Object.entries(selectedOption.impact).forEach(([key, val]) => {
          scores[key] = (scores[key] || 0) + val;
        });
      }
    });

    // 3. Optional clamping if needed in future, but for now we just normalize to 100%
    let total = 0;
    output_categories.forEach(cat => {
      // prevent negative scores
      scores[cat.id] = Math.max(0, scores[cat.id] || 0);
      total += scores[cat.id];
    });

    // 4. Normalize to 100%
    const finalAlloc = {};
    let accumulatedPct = 0;
    
    if (total === 0) {
      // fallback if all 0
      output_categories.forEach(cat => finalAlloc[cat.id] = 0);
      return finalAlloc;
    }

    output_categories.forEach((cat, idx) => {
      if (idx === output_categories.length - 1) {
        finalAlloc[cat.id] = 100 - accumulatedPct;
      } else {
        const pct = Math.round((scores[cat.id] / total) * 100);
        finalAlloc[cat.id] = pct;
        accumulatedPct += pct;
      }
    });

    return finalAlloc;
  }, [selections, groups, base_allocation, output_categories]);

  // Determine active profile dynamically
  const activeProfile = useMemo(() => {
    if (!profiles || profiles.length === 0) return null;
    
    // Sort descending by min_value to catch highest thresholds first
    const sortedProfiles = [...profiles].sort((a, b) => b.min_value - a.min_value);
    
    for (const p of sortedProfiles) {
      const score = alloc[p.threshold_key] || 0;
      if (score >= p.min_value) {
        return p;
      }
    }
    // Fallback to lowest threshold if none match perfectly
    return sortedProfiles[sortedProfiles.length - 1];
  }, [alloc, profiles]);

  const handleSelect = (groupId, value) => {
    setSelections(prev => ({ ...prev, [groupId]: value }));
  };

  return (
    <div className="ps-root">
      {card_label && <div className="ps-card-label">{card_label}</div>}
      {title && <h2 className="ps-title" dangerouslySetInnerHTML={{ __html: parseBoldText(title) }}></h2>}
      {body_text && <p className="ps-body" dangerouslySetInnerHTML={{ __html: parseBoldText(body_text) }}></p>}

      <div className="ps-selectors">
        {groups.map((group) => (
          <div key={group.group_id} className="ps-selector-group">
            <div className="ps-selector-label" dangerouslySetInnerHTML={{ __html: parseBoldText(group.label) }}></div>
            <div className="ps-pill-row">
              {group.options.map((opt) => (
                <button
                  key={opt.value}
                  className={`ps-pill ${selections[group.group_id] === opt.value ? "selected" : ""}`}
                  onClick={() => handleSelect(group.group_id, opt.value)}
                  dangerouslySetInnerHTML={{ __html: parseBoldText(opt.label) }}
                >
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ps-alloc-output">
        {activeProfile && (
          <div className="ps-alloc-profile" style={{ color: activeProfile.color_hex }} dangerouslySetInnerHTML={{ __html: parseBoldText(activeProfile.label) }}>
          </div>
        )}
        
        <div className="ps-alloc-bars">
          {output_categories.map((cat) => (
            <div key={cat.id} className="ps-alloc-bar-row">
              <span className="ps-alloc-bar-lbl" dangerouslySetInnerHTML={{ __html: parseBoldText(cat.label) }}></span>
              <div className="ps-alloc-bar-track">
                <div
                  className="ps-alloc-bar-fill"
                  style={{ width: `${alloc[cat.id] || 0}%`, background: cat.color_hex, opacity: 0.8 }}
                ></div>
              </div>
              <span className="ps-alloc-bar-pct" style={{ color: cat.color_hex }}>{alloc[cat.id] || 0}%</span>
            </div>
          ))}
        </div>
        
        {activeProfile && activeProfile.note && (
          <div className="ps-alloc-note" dangerouslySetInnerHTML={{ __html: parseBoldText(activeProfile.note) }}></div>
        )}
      </div>

      <p className="ps-footnote">
        ⚠ Illustrative only — not personalised financial advice. Actual allocation should be decided with a SEBI-registered financial advisor.
      </p>

      <button className="ps-btn-primary" onClick={onContinue}>
        {cta_text} →
      </button>
    </div>
  );
}

export default PillSelectorCard;
