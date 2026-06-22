import { useState } from "react";

export const EMPTY_PILL_SELECTOR_DATA = {
  card_type: "pill_selector",
  title: "",
  body_text: "",
  base_allocation: { eq: 70, fd: 20, gold: 10 },
  groups: [
    {
      group_id: "age",
      label: "Your Age Bracket",
      options: [
        { label: "Under 30", value: "young", impact: { eq: 0, fd: 0, gold: 0 } },
        { label: "30-45", value: "mid", impact: { eq: -10, fd: 10, gold: 0 } },
      ]
    }
  ],
  cta_text: "Continue",
};

function PillSelectorFields({ data, onChange }) {
  const { title, body_text, base_allocation, groups = [], cta_text } = data;

  const handleChange = (field, value) => {
    onChange({ ...data, [field]: value });
  };

  const updateBaseAlloc = (key, value) => {
    handleChange("base_allocation", { ...base_allocation, [key]: Number(value) });
  };

  // Group operations
  const addGroup = () => {
    handleChange("groups", [
      ...groups,
      { group_id: Date.now().toString(), label: "New Group", options: [] }
    ]);
  };

  const updateGroup = (gIdx, field, value) => {
    const newGroups = groups.map((g, i) => i === gIdx ? { ...g, [field]: value } : g);
    handleChange("groups", newGroups);
  };

  const removeGroup = (gIdx) => {
    handleChange("groups", groups.filter((_, i) => i !== gIdx));
  };

  // Option operations
  const addOption = (gIdx) => {
    const newGroups = groups.map((g, i) => {
      if (i === gIdx) {
        return {
          ...g,
          options: [
            ...g.options,
            { label: "New Option", value: Date.now().toString(), impact: { eq: 0, fd: 0, gold: 0 } }
          ]
        };
      }
      return g;
    });
    handleChange("groups", newGroups);
  };

  const updateOption = (gIdx, optIdx, field, value) => {
    const newGroups = groups.map((g, i) => {
      if (i === gIdx) {
        const newOpts = g.options.map((opt, j) => {
          if (j === optIdx) {
            // Check if we are updating a nested impact field
            if (field === "eq" || field === "fd" || field === "gold") {
              return { ...opt, impact: { ...opt.impact, [field]: Number(value) } };
            }
            return { ...opt, [field]: value };
          }
          return opt;
        });
        return { ...g, options: newOpts };
      }
      return g;
    });
    handleChange("groups", newGroups);
  };

  const removeOption = (gIdx, optIdx) => {
    const newGroups = groups.map((g, i) => {
      if (i === gIdx) {
        return { ...g, options: g.options.filter((_, j) => j !== optIdx) };
      }
      return g;
    });
    handleChange("groups", newGroups);
  };

  return (
    <>
      <label>
        Main Title
        <input 
          type="text" 
          value={title} 
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g. What Kind of Investor Are You?"
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
        <legend>Base Allocation</legend>
        <div style={{ display: "flex", gap: "16px" }}>
          <label style={{ flex: 1 }}>
            Equities (%)
            <input type="number" value={base_allocation.eq} onChange={(e) => updateBaseAlloc("eq", e.target.value)} required />
          </label>
          <label style={{ flex: 1 }}>
            Fixed Income (%)
            <input type="number" value={base_allocation.fd} onChange={(e) => updateBaseAlloc("fd", e.target.value)} required />
          </label>
          <label style={{ flex: 1 }}>
            Gold / Safe (%)
            <input type="number" value={base_allocation.gold} onChange={(e) => updateBaseAlloc("gold", e.target.value)} required />
          </label>
        </div>
      </fieldset>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginBottom: "24px" }}>
        {groups.map((group, gIdx) => (
          <fieldset key={group.group_id} className="cinematic-lines-fieldset">
            <legend>Pill Group: {group.label}</legend>
            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              <label style={{ flex: 1, margin: 0 }}>
                Group Label (User Facing)
                <input 
                  type="text" 
                  value={group.label} 
                  onChange={(e) => updateGroup(gIdx, "label", e.target.value)}
                  required 
                />
              </label>
              <label style={{ flex: 1, margin: 0 }}>
                Internal Group ID
                <input 
                  type="text" 
                  value={group.group_id} 
                  onChange={(e) => updateGroup(gIdx, "group_id", e.target.value)}
                  required 
                />
              </label>
              <button type="button" onClick={() => removeGroup(gIdx)} className="remove-line-btn" style={{ marginTop: "24px" }}>Remove Group</button>
            </div>

            <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "8px", border: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: "12px", color: "#6b7280" }}>PILL OPTIONS</div>
              {group.options.map((opt, optIdx) => (
                <div key={opt.value} style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px dashed #d1d5db" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input style={{ flex: 1 }} type="text" placeholder="Pill Label (e.g. Under 30)" value={opt.label} onChange={(e) => updateOption(gIdx, optIdx, "label", e.target.value)} required />
                    <input style={{ flex: 1 }} type="text" placeholder="Internal Value (e.g. young)" value={opt.value} onChange={(e) => updateOption(gIdx, optIdx, "value", e.target.value)} required />
                    <button type="button" onClick={() => removeOption(gIdx, optIdx)} className="remove-line-btn" style={{ marginTop: 0 }}>✕</button>
                  </div>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "#4b5563", width: "60px" }}>Impact:</span>
                    <input type="number" placeholder="Eq" value={opt.impact.eq} onChange={(e) => updateOption(gIdx, optIdx, "eq", e.target.value)} required title="Equity Impact (%)" style={{ flex: 1 }} />
                    <input type="number" placeholder="FD" value={opt.impact.fd} onChange={(e) => updateOption(gIdx, optIdx, "fd", e.target.value)} required title="Fixed Income Impact (%)" style={{ flex: 1 }} />
                    <input type="number" placeholder="Gold" value={opt.impact.gold} onChange={(e) => updateOption(gIdx, optIdx, "gold", e.target.value)} required title="Gold Impact (%)" style={{ flex: 1 }} />
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addOption(gIdx)} className="add-line-btn">+ Add Pill Option</button>
            </div>
          </fieldset>
        ))}
        <button type="button" onClick={addGroup} className="primary-btn" style={{ background: "#4A3AFF" }}>+ Add Pill Group</button>
      </div>

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

export default PillSelectorFields;
