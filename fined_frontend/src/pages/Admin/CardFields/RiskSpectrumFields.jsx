import { useState, useEffect } from "react";

export const EMPTY_RISK_SPECTRUM_DATA = {
  card_type: "risk_spectrum",
  title: "",
  body_text: "",
  highlight_line: "",
  cta_text: "What's right for me?",
  dots: [
    { id: "1", label: "FD", position_pct: 10, color: "blue", title: "🏦 Fixed Deposits", desc: "", return_text: "7-8%", risk_text: "Very Low" },
    { id: "2", label: "Equities", position_pct: 90, color: "red", title: "📈 Equities", desc: "", return_text: "12-15%", risk_text: "High" }
  ]
};

function RiskSpectrumFields({ data, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const handleDotChange = (id, field, value) => {
    const newDots = data.dots.map(d => 
      d.id === id ? { ...d, [field]: value } : d
    );
    onChange({ ...data, dots: newDots });
  };

  const addDot = () => {
    if (data.dots.length >= 7) return;
    const newDot = {
      id: Date.now().toString(),
      label: "New Asset",
      position_pct: 50,
      color: "blue",
      title: "New Asset Title",
      desc: "Asset description goes here...",
      return_text: "0%",
      risk_text: "Medium"
    };
    onChange({ ...data, dots: [...data.dots, newDot] });
  };

  const removeDot = (id) => {
    if (data.dots.length <= 2) return;
    onChange({ ...data, dots: data.dots.filter(d => d.id !== id) });
  };

  return (
    <>
      <label>
        Main Title
        <input 
          type="text" 
          value={data.title} 
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g. The one rule that governs every investment..."
          required
        />
      </label>

      <label>
        Body Text
        <textarea 
          rows={3}
          value={data.body_text} 
          onChange={(e) => handleChange("body_text", e.target.value)}
          placeholder="Introductory paragraph before the spectrum..."
          required
        />
      </label>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "24px" }}>
        <legend>Spectrum Dots (Min 2, Max 7)</legend>

        {data.dots.map((dot, index) => (
          <div key={dot.id} style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <strong>Dot {index + 1}</strong>
              <button 
                type="button" 
                className="remove-line-btn"
                onClick={() => removeDot(dot.id)}
                disabled={data.dots.length <= 2}
              >
                ✕ Remove Dot
              </button>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <label style={{ flex: 1 }}>
                Label (on track)
                <input 
                  type="text" 
                  value={dot.label} 
                  onChange={(e) => handleDotChange(dot.id, "label", e.target.value)}
                  placeholder="e.g. FD, Gold"
                  required
                />
              </label>
              <label style={{ width: "100px" }}>
                Position %
                <input 
                  type="number" 
                  min="0" 
                  max="100"
                  value={dot.position_pct} 
                  onChange={(e) => handleDotChange(dot.id, "position_pct", Number(e.target.value))}
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                Color Theme
                <select 
                  value={dot.color} 
                  onChange={(e) => handleDotChange(dot.id, "color", e.target.value)}
                  style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--border-color)" }}
                >
                  <option value="blue">Blue (Low Risk)</option>
                  <option value="green">Green (Low-Med)</option>
                  <option value="amber">Amber (Medium)</option>
                  <option value="red">Red (High Risk)</option>
                </select>
              </label>
            </div>

            <label>
              Detail Title
              <input 
                type="text" 
                value={dot.title} 
                onChange={(e) => handleDotChange(dot.id, "title", e.target.value)}
                placeholder="e.g. 🏦 Fixed Deposits"
                required
              />
            </label>

            <label>
              Detail Description
              <textarea 
                rows={2}
                value={dot.desc} 
                onChange={(e) => handleDotChange(dot.id, "desc", e.target.value)}
                placeholder="Explain the asset..."
                required
              />
            </label>

            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <label style={{ flex: 1 }}>
                Avg Return Text
                <input 
                  type="text" 
                  value={dot.return_text} 
                  onChange={(e) => handleDotChange(dot.id, "return_text", e.target.value)}
                  placeholder="e.g. 7-8% avg"
                  required
                />
              </label>
              <label style={{ flex: 1 }}>
                Risk Text
                <input 
                  type="text" 
                  value={dot.risk_text} 
                  onChange={(e) => handleDotChange(dot.id, "risk_text", e.target.value)}
                  placeholder="e.g. Very Low"
                  required
                />
              </label>
            </div>
          </div>
        ))}

        <button 
          type="button" 
          className="add-line-btn" 
          onClick={addDot}
          disabled={data.dots.length >= 7}
        >
          + Add Dot
        </button>
      </fieldset>

      <label style={{ marginTop: "24px" }}>
        Highlight Line (Optional)
        <textarea 
          rows={2}
          value={data.highlight_line || ""} 
          onChange={(e) => handleChange("highlight_line", e.target.value)}
          placeholder="Important takeaway line at the bottom..."
        />
      </label>

      <label>
        CTA Button Text
        <input 
          type="text" 
          value={data.cta_text} 
          onChange={(e) => handleChange("cta_text", e.target.value)}
          placeholder="e.g. Continue →"
          required
        />
      </label>
    </>
  );
}

export default RiskSpectrumFields;
