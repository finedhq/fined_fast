export const EMPTY_CONCEPT_DATA = {
  title: "",
  explanation: "",
  example: "",
  key_takeaway: "",
};
function ConceptFields({ data, onChange }) {
  const { title, explanation, example, key_takeaway } = data;
  return (
    <>
      <label>
        Concept Title
        <input
          value={title || ""}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          placeholder="e.g. Compound Interest"
          required
        />
      </label>
      <label>
        Explanation
        <textarea
          value={explanation || ""}
          onChange={(e) => onChange({ ...data, explanation: e.target.value })}
          placeholder="Detailed explanation of the concept..."
          rows={4}
          required
          style={{ marginTop: "8px", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
        />
      </label>
      <label style={{ marginTop: "16px" }}>
        Example (Optional)
        <textarea
          value={example || ""}
          onChange={(e) => onChange({ ...data, example: e.target.value })}
          placeholder="e.g. If you invest ₹1000 at 10%..."
          rows={3}
          style={{ marginTop: "8px", width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db" }}
        />
      </label>
      <label style={{ marginTop: "16px" }}>
        Key Takeaway (Optional)
        <input
          value={key_takeaway || ""}
          onChange={(e) => onChange({ ...data, key_takeaway: e.target.value })}
          placeholder="One-sentence summary..."
          style={{ marginTop: "8px" }}
        />
      </label>
    </>
  );
}
export default ConceptFields;
