import { useState } from "react";

export const EMPTY_CHART_DATA = {
  card_type: "chart",
  title: "History doesn't lie. Look at 25 years of data.",
  body_text_top: "Let's stop talking in theory and look at what actually happened. ₹1 lakh invested in 1999 across three different asset classes by 2024:",
  labels: ["1999", "2002", "2005", "2008", "2011", "2014", "2017", "2020", "2024"],
  datasets: [
    { label: "📈 Equities (12%)", data: [100000, 140493, 197382, 277308, 389600, 547357, 768994, 1080362, 1700006], color: "#00e5a0" },
    { label: "🪙 Gold (10%)", data: [100000, 133100, 177156, 235795, 313843, 417725, 555992, 740025, 1083471], color: "#f59e0b" },
    { label: "🏦 FD (8%)", data: [100000, 125971, 158687, 199900, 251817, 317217, 399623, 503403, 684848], color: "#3b82f6" },
  ],
  chart_caption: "₹1 lakh invested in 1999. Illustrative returns based on long-term historical averages. Past performance is not a guarantee of future results.",
  stat_chips: [
    { value: "₹7.2L", label: "🏦 Fixed Deposit (~8%)", color: "#3b82f6" },
    { value: "₹10.8L", label: "🪙 Gold (~10%)", color: "#f59e0b" },
    { value: "₹17.4L", label: "📈 Sensex (~12%)", color: "#00e5a0" },
  ],
  body_text_bottom: "The Sensex and Nifty 50 have delivered roughly 12–15% CAGR over long periods. No other widely accessible asset class in India has matched this consistently.",
  glossary_terms: [
    { term: "Sensex", definition: "The BSE Sensex tracks the 30 largest companies on the Bombay Stock Exchange.", example: "In 1979 the Sensex was at 100. By 2024 it crossed 80,000." },
    { term: "Nifty 50", definition: "An index of India's 50 largest companies by market cap, listed on the NSE.", example: "Reliance, TCS, HDFC Bank." },
    { term: "CAGR", definition: "Compound Annual Growth Rate — the smooth annual growth rate of an investment over a period.", example: "₹1 lakh growing to ₹17.4 lakh in 25 years = ~12% CAGR." }
  ],
  cta_text: "Understood — but how do I spread the risk? →",
};

function ChartFields({ data, onChange }) {
  const { title, body_text_top, labels = [], datasets = [], chart_caption, stat_chips = [], body_text_bottom, glossary_terms = [], cta_text } = data;

  const handleChange = (field, value) => onChange({ ...data, [field]: value });

  // Arrays parsing
  const handleLabelsChange = (val) => {
    handleChange("labels", val.split(",").map(s => s.trim()));
  };

  const updateDataset = (idx, field, value) => {
    const newDs = [...datasets];
    if (field === "data") {
      newDs[idx].data = value.split(",").map(v => Number(v.trim()) || 0);
    } else {
      newDs[idx][field] = value;
    }
    handleChange("datasets", newDs);
  };
  const addDataset = () => handleChange("datasets", [...datasets, { label: "New Data", data: [0, 0, 0], color: "#3b82f6" }]);
  const removeDataset = (idx) => handleChange("datasets", datasets.filter((_, i) => i !== idx));

  // Stat Chips
  const updateChip = (idx, field, value) => {
    const newChips = [...stat_chips];
    newChips[idx][field] = value;
    handleChange("stat_chips", newChips);
  };
  const addChip = () => handleChange("stat_chips", [...stat_chips, { value: "₹X", label: "Label", color: "#3b82f6" }]);
  const removeChip = (idx) => handleChange("stat_chips", stat_chips.filter((_, i) => i !== idx));

  // Glossary Terms
  const addTerm = () => {
    handleChange("glossary_terms", [...glossary_terms, { term: "", definition: "", example: "" }]);
  };
  const updateTerm = (index, field, value) => {
    const newTerms = [...glossary_terms];
    newTerms[index][field] = value;
    handleChange("glossary_terms", newTerms);
  };
  const removeTerm = (index) => {
    handleChange("glossary_terms", glossary_terms.filter((_, i) => i !== index));
  };

  return (
    <>
      <label>
        Main Title
        <input type="text" value={title} onChange={(e) => handleChange("title", e.target.value)} required />
      </label>

      <label>
        Top Body Text (Supports Glossary)
        <textarea rows={3} value={body_text_top} onChange={(e) => handleChange("body_text_top", e.target.value)} required />
      </label>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "12px", marginBottom: "24px" }}>
        <legend>Chart Data Settings</legend>
        <label>
          X-Axis Labels (Comma-separated)
          <input 
            type="text" 
            value={labels.join(", ")} 
            onChange={(e) => handleLabelsChange(e.target.value)} 
            placeholder="e.g. 1999, 2002, 2005..." 
            required 
          />
        </label>
        
        <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "12px", color: "#6b7280" }}>DATASETS</div>
        {datasets.map((ds, idx) => (
          <div key={idx} style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", border: "1px solid #e5e7eb", marginBottom: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" value={ds.label} onChange={(e) => updateDataset(idx, "label", e.target.value)} placeholder="Dataset Label (e.g. Equities)" style={{ flex: 1 }} required />
              <input type="color" value={ds.color} onChange={(e) => updateDataset(idx, "color", e.target.value)} style={{ width: "40px", padding: "0" }} required title="Color" />
              <button type="button" onClick={() => removeDataset(idx)} className="remove-line-btn" style={{ marginTop: 0 }}>✕</button>
            </div>
            <label style={{ margin: 0 }}>
              Data Points (Comma-separated numbers)
              <input type="text" value={ds.data.join(", ")} onChange={(e) => updateDataset(idx, "data", e.target.value)} placeholder="e.g. 10000, 15000, 20000..." required />
            </label>
          </div>
        ))}
        {datasets.length < 5 && (
          <button type="button" onClick={addDataset} className="add-line-btn">+ Add Dataset</button>
        )}
      </fieldset>

      <label>
        Chart Caption (Optional)
        <input type="text" value={chart_caption || ""} onChange={(e) => handleChange("chart_caption", e.target.value)} />
      </label>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "12px", marginBottom: "24px" }}>
        <legend>Stat Chips (Optional Highlights)</legend>
        {stat_chips.map((chip, idx) => (
          <div key={idx} style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <input type="text" value={chip.value} onChange={(e) => updateChip(idx, "value", e.target.value)} placeholder="Value (e.g. ₹17.4L)" style={{ flex: 1 }} required />
            <input type="text" value={chip.label} onChange={(e) => updateChip(idx, "label", e.target.value)} placeholder="Label (e.g. Sensex)" style={{ flex: 1 }} required />
            <input type="color" value={chip.color} onChange={(e) => updateChip(idx, "color", e.target.value)} style={{ width: "40px", padding: "0" }} required />
            <button type="button" onClick={() => removeChip(idx)} className="remove-line-btn" style={{ marginTop: 0 }}>✕</button>
          </div>
        ))}
        <button type="button" onClick={addChip} className="add-line-btn">+ Add Stat Chip</button>
      </fieldset>

      <label>
        Bottom Body Text (Optional, Supports Glossary)
        <textarea rows={3} value={body_text_bottom || ""} onChange={(e) => handleChange("body_text_bottom", e.target.value)} />
      </label>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "12px", marginBottom: "24px" }}>
        <legend>Glossary Definitions</legend>
        {glossary_terms.map((term, index) => (
          <div key={index} style={{ marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px dashed #d1d5db" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <input type="text" placeholder="Term (e.g. CAGR)" value={term.term} onChange={(e) => updateTerm(index, "term", e.target.value)} style={{ flex: 1 }} required />
              <button type="button" onClick={() => removeTerm(index)} className="remove-line-btn" style={{ marginTop: 0 }}>✕</button>
            </div>
            <textarea rows={2} placeholder="Definition..." value={term.definition} onChange={(e) => updateTerm(index, "definition", e.target.value)} style={{ marginTop: "8px" }} required />
            <input type="text" placeholder="Example (Optional)" value={term.example || ""} onChange={(e) => updateTerm(index, "example", e.target.value)} style={{ marginTop: "8px" }} />
          </div>
        ))}
        <button type="button" onClick={addTerm} className="add-line-btn">+ Add Glossary Term</button>
      </fieldset>

      <label>
        CTA Button Text
        <input type="text" value={cta_text} onChange={(e) => handleChange("cta_text", e.target.value)} required />
      </label>
    </>
  );
}

export default ChartFields;
