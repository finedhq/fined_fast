import { useState } from "react";

export const EMPTY_SIP_CALCULATOR_DATA = {
  card_type: "sip_calculator",
  title: "",
  body_text: "",
  glossary_terms: [],
  default_monthly_investment: 5000,
  default_investment_period: 10,
  default_expected_return: 12.0,
  highlight_line: "",
  cta_text: "Continue",
};

function SIPCalculatorFields({ data, onChange }) {
  const { 
    title, 
    body_text, 
    glossary_terms = [], 
    default_monthly_investment, 
    default_investment_period, 
    default_expected_return, 
    highlight_line, 
    cta_text 
  } = data;

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const addGlossaryTerm = () => {
    handleChange("glossary_terms", [
      ...glossary_terms,
      { term: "", definition: "", example: "" },
    ]);
  };

  const updateGlossaryTerm = (termIdx, field, value) => {
    const newTerms = glossary_terms.map((t, i) => (i === termIdx ? { ...t, [field]: value } : t));
    handleChange("glossary_terms", newTerms);
  };

  const removeGlossaryTerm = (termIdx) => {
    handleChange(
      "glossary_terms",
      glossary_terms.filter((_, i) => i !== termIdx)
    );
  };

  return (
    <>
      <label>
        Main Title
        <input 
          type="text" 
          value={title} 
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g. Rupee Cost Averaging..."
          required
        />
      </label>

      <label>
        Body Text
        <textarea 
          rows={3}
          value={body_text} 
          onChange={(e) => handleChange("body_text", e.target.value)}
          placeholder="Introductory paragraph..."
          required
        />
      </label>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "12px", marginBottom: "24px" }}>
        <legend>Glossary Terms for Body Text (Optional)</legend>
        {glossary_terms.map((term, tIdx) => (
          <div key={tIdx} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "flex-start" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  value={term.term} 
                  onChange={(e) => updateGlossaryTerm(tIdx, "term", e.target.value)} 
                  placeholder="Term (e.g. Rupee Cost Averaging)" 
                  style={{ flex: 1 }}
                  required 
                />
                <input 
                  value={term.example || ""} 
                  onChange={(e) => updateGlossaryTerm(tIdx, "example", e.target.value)} 
                  placeholder="Example (Optional)" 
                  style={{ flex: 1 }}
                />
              </div>
              <textarea 
                value={term.definition} 
                onChange={(e) => updateGlossaryTerm(tIdx, "definition", e.target.value)} 
                placeholder="Definition" 
                rows={2}
                style={{ width: "100%" }}
                required 
              />
            </div>
            <button type="button" onClick={() => removeGlossaryTerm(tIdx)} className="remove-line-btn" style={{ marginTop: "0" }}>✕</button>
          </div>
        ))}
        <button type="button" onClick={addGlossaryTerm} className="add-line-btn" style={{ marginTop: "8px" }}>+ Add Term</button>
      </fieldset>

      <fieldset className="cinematic-lines-fieldset" style={{ marginBottom: "24px" }}>
        <legend>Default Slider Values</legend>
        <div style={{ display: "flex", gap: "16px" }}>
          <label style={{ flex: 1 }}>
            Monthly Investment (₹)
            <input 
              type="number" 
              min="500" max="100000" step="500"
              value={default_monthly_investment} 
              onChange={(e) => handleChange("default_monthly_investment", Number(e.target.value))}
              required
            />
          </label>
          <label style={{ flex: 1 }}>
            Period (Years)
            <input 
              type="number" 
              min="1" max="40" step="1"
              value={default_investment_period} 
              onChange={(e) => handleChange("default_investment_period", Number(e.target.value))}
              required
            />
          </label>
          <label style={{ flex: 1 }}>
            Expected Return (%)
            <input 
              type="number" 
              min="1" max="30" step="0.5"
              value={default_expected_return} 
              onChange={(e) => handleChange("default_expected_return", Number(e.target.value))}
              required
            />
          </label>
        </div>
      </fieldset>

      <label>
        Highlight Line (Optional)
        <textarea 
          rows={2}
          value={highlight_line || ""} 
          onChange={(e) => handleChange("highlight_line", e.target.value)}
          placeholder="Important takeaway line at the bottom..."
        />
      </label>

      <label>
        CTA Button Text
        <input 
          type="text" 
          value={cta_text} 
          onChange={(e) => handleChange("cta_text", e.target.value)}
          placeholder="e.g. Continue →"
          required
        />
      </label>
    </>
  );
}

export default SIPCalculatorFields;
