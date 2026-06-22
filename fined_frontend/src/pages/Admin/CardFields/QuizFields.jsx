import { useState } from "react";

export const EMPTY_QUIZ_DATA = {
  card_type: "quiz",
  title: "[Quiz] Test Your Knowledge",
  question: "",
  options: [
    { id: "opt_1", text: "", is_correct: true },
    { id: "opt_2", text: "", is_correct: false },
  ],
  explanation: "",
  cta_text: "Continue",
};

function QuizFields({ data, onChange }) {
  const { title, question, options = [], explanation, cta_text } = data;

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const addOption = () => {
    if (options.length >= 5) return; // limit to 5
    handleChange("options", [
      ...options,
      { id: Date.now().toString(), text: "", is_correct: false },
    ]);
  };

  const updateOptionText = (idx, text) => {
    const newOpts = [...options];
    newOpts[idx].text = text;
    handleChange("options", newOpts);
  };

  const setCorrectOption = (idx) => {
    const newOpts = options.map((opt, i) => ({
      ...opt,
      is_correct: i === idx,
    }));
    handleChange("options", newOpts);
  };

  const removeOption = (idx) => {
    if (options.length <= 2) return; // keep at least 2
    
    // If we're removing the correct one, make the first remaining one correct
    const isRemovingCorrect = options[idx].is_correct;
    let newOpts = options.filter((_, i) => i !== idx);
    if (isRemovingCorrect && newOpts.length > 0) {
      newOpts[0].is_correct = true;
    }
    handleChange("options", newOpts);
  };

  return (
    <>
      <label>
        Main Title
        <input 
          type="text" 
          value={title} 
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g. [Quiz] LTCG — When Does the Exemption Apply?"
          required
        />
      </label>

      <label>
        Question Text
        <textarea 
          rows={3}
          value={question} 
          onChange={(e) => handleChange("question", e.target.value)}
          placeholder="Write the scenario or question here..."
          required
        />
      </label>

      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "12px", marginBottom: "24px" }}>
        <legend>Quiz Options</legend>
        <div style={{ marginBottom: "12px", fontSize: "0.85rem", color: "#6b7280" }}>
          Select the radio button next to the correct answer. Minimum 2, maximum 5 options.
        </div>
        {options.map((opt, idx) => (
          <div key={opt.id} style={{ display: "flex", gap: "12px", marginBottom: "12px", alignItems: "center" }}>
            <input 
              type="radio" 
              name="quiz_correct_opt" 
              checked={opt.is_correct}
              onChange={() => setCorrectOption(idx)}
              style={{ width: "18px", height: "18px", cursor: "pointer" }}
            />
            <input 
              type="text" 
              value={opt.text} 
              onChange={(e) => updateOptionText(idx, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + idx)} text...`}
              style={{ flex: 1 }}
              required 
            />
            {options.length > 2 && (
              <button 
                type="button" 
                onClick={() => removeOption(idx)} 
                className="remove-line-btn" 
                style={{ marginTop: 0 }}
                title="Remove option"
              >✕</button>
            )}
          </div>
        ))}
        {options.length < 5 && (
          <button type="button" onClick={addOption} className="add-line-btn" style={{ marginTop: "8px" }}>
            + Add Option
          </button>
        )}
      </fieldset>

      <label>
        Explanation (Revealed after answer)
        <textarea 
          rows={4}
          value={explanation} 
          onChange={(e) => handleChange("explanation", e.target.value)}
          placeholder="Explain why the answer is correct and why the others are wrong..."
          required
        />
      </label>

      <label>
        CTA Button Text
        <input 
          type="text" 
          value={cta_text} 
          onChange={(e) => handleChange("cta_text", e.target.value)}
          placeholder="e.g. Complete this module →"
          required
        />
      </label>
    </>
  );
}

export default QuizFields;
