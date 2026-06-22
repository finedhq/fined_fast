export const EMPTY_INTERACTIVE_DATA = {
  title: "",
  intro_text: "",
  items: [
    { label: "Item 1", title: "", content: "", icon: "📌" },
    { label: "Item 2", title: "", content: "", icon: "📌" }
  ]
};
function InteractiveFields({ data, onChange }) {
  const { title, intro_text, items = [] } = data;
  const updateItem = (idx, field, value) => {
    onChange({
      ...data,
      items: items.map((itm, i) => (i === idx ? { ...itm, [field]: value } : itm)),
    });
  };
  const addItem = () => {
    if (items.length >= 6) return;
    onChange({
      ...data,
      items: [...items, { label: `Item ${items.length + 1}`, title: "", content: "", icon: "📌" }],
    });
  };
  const removeItem = (idx) => {
    if (items.length <= 2) return;
    onChange({
      ...data,
      items: items.filter((_, i) => i !== idx),
    });
  };
  return (
    <>
      <label>
        Card Title
        <input
          value={title || ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="e.g. Explore the Market Participants"
          required
        />
      </label>
      <label>
        Intro Text (Optional)
        <textarea
          value={intro_text || ""}
          onChange={(e) => onChange({ ...data, intro_text: e.target.value })}
          placeholder="Brief instructions to click the tabs..."
          rows={2}
          style={{ marginTop: "8px", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
        />
      </label>
      <fieldset className="cinematic-lines-fieldset" style={{ marginTop: "24px" }}>
        <legend>Explorer Items ({items.length}/6)</legend>
        
        {items.map((item, idx) => (
          <div key={idx} style={{ padding: "12px", border: "1px solid #d1d5db", borderRadius: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <strong>Item {idx + 1}</strong>
              <button 
                type="button" 
                onClick={() => removeItem(idx)} 
                disabled={items.length <= 2}
                className="remove-line-btn"
              >
                ✕ Remove Item
              </button>
            </div>
            
            <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
              <input 
                value={item.icon || ""} 
                onChange={(e) => updateItem(idx, "icon", e.target.value)} 
                placeholder="Icon (e.g. 📌)" 
                style={{ width: "80px" }}
              />
              <input 
                value={item.label} 
                onChange={(e) => updateItem(idx, "label", e.target.value)} 
                placeholder="Tab Label (e.g. Retail)" 
                style={{ flex: 1 }}
                required 
              />
              <input 
                value={item.title} 
                onChange={(e) => updateItem(idx, "title", e.target.value)} 
                placeholder="Content Title (e.g. Retail Investors)" 
                style={{ flex: 1 }}
                required 
              />
            </div>
            
            <textarea 
              value={item.content} 
              onChange={(e) => updateItem(idx, "content", e.target.value)} 
              placeholder="Detailed content for this tab (HTML allowed)..." 
              rows={3} 
              required 
              style={{ width: "100%", marginBottom: "8px", padding: "8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            />
          </div>
        ))}
        
        <button type="button" onClick={addItem} disabled={items.length >= 6} className="add-line-btn">
          + Add Item
        </button>
      </fieldset>
    </>
  );
}
export default InteractiveFields;
