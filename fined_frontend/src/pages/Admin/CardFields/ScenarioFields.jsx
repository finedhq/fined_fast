export const EMPTY_SCENARIO_DATA = {
  intro_text: "",
  stages: [
    { icon: "🌱", name: "", detail: "", stat_line: "", glossary_terms: [] },
    { icon: "📈", name: "", detail: "", stat_line: "", glossary_terms: [] },
  ],
  reflection_question: "",
  reflection_options: ["", ""],
};

function ScenarioFields({ data, onChange }) {
  const { intro_text, stages, reflection_question, reflection_options } = data;

  const updateStage = (stageIdx, field, value) => {
    onChange({
      ...data,
      stages: stages.map((s, i) => (i === stageIdx ? { ...s, [field]: value } : s)),
    });
  };

  const addStage = () => {
    if (stages.length >= 6) return;
    onChange({
      ...data,
      stages: [...stages, { icon: "🔹", name: "", detail: "", stat_line: "", glossary_terms: [] }],
    });
  };

  const removeStage = (stageIdx) => {
    if (stages.length <= 2) return;
    onChange({
      ...data,
      stages: stages.filter((_, i) => i !== stageIdx),
    });
  };

  const addGlossaryTerm = (stageIdx) => {
    const stage = stages[stageIdx];
    updateStage(stageIdx, "glossary_terms", [
      ...stage.glossary_terms,
      { term: "", definition: "", example: "" },
    ]);
  };

  const updateGlossaryTerm = (stageIdx, termIdx, field, value) => {
    const stage = stages[stageIdx];
    const newTerms = stage.glossary_terms.map((t, i) => (i === termIdx ? { ...t, [field]: value } : t));
    updateStage(stageIdx, "glossary_terms", newTerms);
  };

  const removeGlossaryTerm = (stageIdx, termIdx) => {
    const stage = stages[stageIdx];
    updateStage(
      stageIdx,
      "glossary_terms",
      stage.glossary_terms.filter((_, i) => i !== termIdx)
    );
  };

  const addOption = () => {
    if (reflection_options.length >= 5) return;
    onChange({ ...data, reflection_options: [...reflection_options, ""] });
  };

  const updateOption = (idx, value) => {
    onChange({
      ...data,
      reflection_options: reflection_options.map((opt, i) => (i === idx ? value : opt)),
    });
  };

  const removeOption = (idx) => {
    if (reflection_options.length <= 2) return;
    onChange({
      ...data,
      reflection_options: reflection_options.filter((_, i) => i !== idx),
    });
  };

  return (
    <>
      <label>
        Intro Text (Optional)
        <textarea
          value={intro_text || ""}
          onChange={(e) => onChange({ ...data, intro_text: e.target.value })}
          placeholder="Brief introduction before the timeline..."
          rows={2}
        />
      </label>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "24px" }}>
        <legend>Timeline Stages ({stages.length}/6)</legend>
        
        {stages.map((stage, sIdx) => (
          <div key={sIdx} style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <strong>Stage {sIdx + 1}</strong>
              <button 
                type="button" 
                onClick={() => removeStage(sIdx)} 
                disabled={stages.length <= 2}
                className="remove-line-btn"
              >
                ✕ Remove Stage
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input 
                value={stage.icon} 
                onChange={(e) => updateStage(sIdx, "icon", e.target.value)} 
                placeholder="Icon (e.g. 🌱)" 
                style={{ width: "80px" }}
                required 
              />
              <input 
                value={stage.name} 
                onChange={(e) => updateStage(sIdx, "name", e.target.value)} 
                placeholder="Stage Name (e.g. Seed & Angels)" 
                style={{ flex: 1 }}
                required 
              />
            </div>
            
            <textarea 
              value={stage.detail} 
              onChange={(e) => updateStage(sIdx, "detail", e.target.value)} 
              placeholder="Stage detail paragraph..." 
              rows={3} 
              required 
              style={{ width: "100%", marginBottom: "8px" }}
            />
            
            <input 
              value={stage.stat_line || ""} 
              onChange={(e) => updateStage(sIdx, "stat_line", e.target.value)} 
              placeholder="Optional Stat Line (e.g. Valuation: ₹2 Cr)" 
              style={{ width: "100%", marginBottom: "12px" }}
            />
            
            <div style={{ padding: "8px", background: "#f9fafb", borderRadius: "6px" }}>
              <p style={{ fontSize: "0.85rem", marginBottom: "8px", fontWeight: "600" }}>Glossary Terms</p>
              {stage.glossary_terms.map((term, tIdx) => (
                <div key={tIdx} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input 
                    value={term.term} 
                    onChange={(e) => updateGlossaryTerm(sIdx, tIdx, "term", e.target.value)} 
                    placeholder="Term (e.g. Angel)" 
                    style={{ flex: 1 }}
                    required 
                  />
                  <input 
                    value={term.definition} 
                    onChange={(e) => updateGlossaryTerm(sIdx, tIdx, "definition", e.target.value)} 
                    placeholder="Definition" 
                    style={{ flex: 2 }}
                    required 
                  />
                  <input 
                    value={term.example || ""} 
                    onChange={(e) => updateGlossaryTerm(sIdx, tIdx, "example", e.target.value)} 
                    placeholder="Example (Opt)" 
                    style={{ flex: 1 }}
                  />
                  <button type="button" onClick={() => removeGlossaryTerm(sIdx, tIdx)} className="remove-line-btn">✕</button>
                </div>
              ))}
              <button type="button" onClick={() => addGlossaryTerm(sIdx)} className="add-line-btn" style={{ marginTop: "4px" }}>+ Add Term</button>
            </div>
          </div>
        ))}
        
        <button type="button" onClick={addStage} disabled={stages.length >= 6} className="add-line-btn">
          + Add Stage
        </button>
      </fieldset>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "24px" }}>
        <legend>Reflection Question</legend>
        <input
          value={reflection_question}
          onChange={(e) => onChange({ ...data, reflection_question: e.target.value })}
          placeholder="e.g., Where would you invest?"
          required
          style={{ marginBottom: "12px", width: "100%" }}
        />
        
        {reflection_options.map((opt, i) => (
          <div key={i} className="cinematic-line-row">
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`Option ${i + 1}`}
              required
            />
            <button
              type="button"
              onClick={() => removeOption(i)}
              disabled={reflection_options.length <= 2}
              className="remove-line-btn"
            >
              ✕
            </button>
          </div>
        ))}
        
        <button type="button" onClick={addOption} disabled={reflection_options.length >= 5} className="add-line-btn">
          + Add Option
        </button>
      </fieldset>
    </>
  );
}

export default ScenarioFields;
