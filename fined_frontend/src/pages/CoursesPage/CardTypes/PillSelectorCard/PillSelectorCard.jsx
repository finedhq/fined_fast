import { useState, useMemo, useEffect } from "react";
import "./PillSelectorCard.css";

// Profile engine hardcoded for the FinEd platform based on Equity exposure
function getProfile(eq) {
  if (eq >= 70) {
    return {
      label: "🚀 Aggressive Investor",
      color: "#ef4444", // var(--danger)
      note: "High equity exposure suits your profile — stay invested through volatility and resist the urge to book profits early."
    };
  }
  if (eq >= 50) {
    return {
      label: "⚖️ Moderate Investor",
      color: "#f59e0b", // var(--accent3)
      note: "Balanced approach — enough equity for meaningful growth, enough stability to reduce anxiety during market corrections."
    };
  }
  return {
    label: "🛡️ Conservative Investor",
    color: "#3b82f6", // var(--accent2)
    note: "Conservative mix — prioritises capital preservation. Suitable if your time horizon is shorter or your risk tolerance is genuinely low."
  };
}

function PillSelectorCard({ card, onContinue }) {
  const {
    title = "",
    body_text = "",
    base_allocation = { eq: 70, fd: 20, gold: 10 },
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
    let eq = base_allocation.eq || 0;
    let fd = base_allocation.fd || 0;
    let gold = base_allocation.gold || 0;

    // Apply impacts from selections
    groups.forEach((group) => {
      const selectedValue = selections[group.group_id];
      const selectedOption = group.options.find(opt => opt.value === selectedValue);
      if (selectedOption && selectedOption.impact) {
        eq += selectedOption.impact.eq || 0;
        fd += selectedOption.impact.fd || 0;
        gold += selectedOption.impact.gold || 0;
      }
    });

    // Clamp values (matching the prototype's boundaries)
    eq = Math.max(10, Math.min(85, eq));
    fd = Math.max(10, Math.min(70, fd));
    gold = Math.max(5, Math.min(30, gold));

    // Normalize to 100%
    const total = eq + fd + gold;
    const finalEq = Math.round((eq / total) * 100) || 0;
    const finalFd = Math.round((fd / total) * 100) || 0;
    const finalGold = 100 - finalEq - finalFd;

    return { eq: finalEq, fd: finalFd, gold: finalGold };
  }, [selections, groups, base_allocation]);

  const profile = getProfile(alloc.eq);

  const handleSelect = (groupId, value) => {
    setSelections(prev => ({ ...prev, [groupId]: value }));
  };

  return (
    <div className="ps-root">
      <h2 className="ps-title">{title}</h2>
      {body_text && <p className="ps-body">{body_text}</p>}

      <div className="ps-selectors">
        {groups.map((group) => (
          <div key={group.group_id} className="ps-selector-group">
            <div className="ps-selector-label">{group.label}</div>
            <div className="ps-pill-row">
              {group.options.map((opt) => (
                <button
                  key={opt.value}
                  className={`ps-pill ${selections[group.group_id] === opt.value ? "selected" : ""}`}
                  onClick={() => handleSelect(group.group_id, opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ps-alloc-output">
        <div className="ps-alloc-profile" style={{ color: profile.color }}>
          {profile.label}
        </div>
        <div className="ps-alloc-bars">
          <div className="ps-alloc-bar-row">
            <span className="ps-alloc-bar-lbl">📈 Equities</span>
            <div className="ps-alloc-bar-track">
              <div
                className="ps-alloc-bar-fill"
                style={{ width: `${alloc.eq}%`, background: "rgba(0,229,160,0.7)" }}
              ></div>
            </div>
            <span className="ps-alloc-bar-pct" style={{ color: "#00c07a" }}>{alloc.eq}%</span>
          </div>
          <div className="ps-alloc-bar-row">
            <span className="ps-alloc-bar-lbl">🏦 Fixed Income</span>
            <div className="ps-alloc-bar-track">
              <div
                className="ps-alloc-bar-fill"
                style={{ width: `${alloc.fd}%`, background: "rgba(59,130,246,0.7)" }}
              ></div>
            </div>
            <span className="ps-alloc-bar-pct" style={{ color: "#2563eb" }}>{alloc.fd}%</span>
          </div>
          <div className="ps-alloc-bar-row">
            <span className="ps-alloc-bar-lbl">🥇 Gold / Safe</span>
            <div className="ps-alloc-bar-track">
              <div
                className="ps-alloc-bar-fill"
                style={{ width: `${alloc.gold}%`, background: "rgba(245,158,11,0.7)" }}
              ></div>
            </div>
            <span className="ps-alloc-bar-pct" style={{ color: "#d97706" }}>{alloc.gold}%</span>
          </div>
        </div>
        <div className="ps-alloc-note">{profile.note}</div>
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
