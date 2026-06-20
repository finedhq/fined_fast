// Inputs specific to the "cinematic" card type only.
// Receives the current card_data slice + a setter, no knowledge of module_id,
// order_index, title, or submission — that's all owned by AddCardForm.

const EMPHASIS_OPTIONS = [
  { value: "", label: "Normal" },
  { value: "em", label: "Highlight (indigo)" },
  { value: "em2", label: "Highlight (amber)" },
];

export const EMPTY_CINEMATIC_DATA = {
  lines: [
    { text: "", emphasis: "" },
    { text: "", emphasis: "" },
  ],
  tagline: "",
  cta_text: "Continue",
  finstars: 0,
};

function CinematicFields({ data, onChange }) {
  const { lines, tagline, cta_text, finstars } = data;

  const updateLine = (index, field, value) => {
    onChange({
      ...data,
      lines: lines.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    });
  };

  const addLine = () => {
    if (lines.length >= 5) return;
    onChange({ ...data, lines: [...lines, { text: "", emphasis: "" }] });
  };

  const removeLine = (index) => {
    if (lines.length <= 2) return; // schema requires min 2
    onChange({ ...data, lines: lines.filter((_, i) => i !== index) });
  };

  return (
    <>
      <fieldset className="cinematic-lines-fieldset">
        <legend>Cinematic lines ({lines.length}/5)</legend>

        {lines.map((line, i) => (
          <div key={i} className="cinematic-line-row">
            <input
              value={line.text}
              onChange={(e) => updateLine(i, "text", e.target.value)}
              placeholder={`Line ${i + 1}`}
              required
            />
            <select
              value={line.emphasis}
              onChange={(e) => updateLine(i, "emphasis", e.target.value)}
            >
              {EMPHASIS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeLine(i)}
              disabled={lines.length <= 2}
              className="remove-line-btn"
              aria-label={`Remove line ${i + 1}`}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addLine}
          disabled={lines.length >= 5}
          className="add-line-btn"
        >
          + Add line
        </button>
      </fieldset>

      <label>
        Tagline
        <textarea
          value={tagline}
          onChange={(e) => onChange({ ...data, tagline: e.target.value })}
          placeholder="One sentence that frames the module"
          rows={3}
          required
        />
      </label>

      <label>
        CTA button text
        <input
          value={cta_text}
          onChange={(e) => onChange({ ...data, cta_text: e.target.value })}
          placeholder="e.g., Let's get set up"
          required
        />
      </label>

      <label>
        FinStars teaser (0 to hide)
        <input
          type="number"
          min={0}
          value={finstars}
          onChange={(e) => onChange({ ...data, finstars: Number(e.target.value) })}
        />
      </label>
    </>
  );
}

export default CinematicFields;