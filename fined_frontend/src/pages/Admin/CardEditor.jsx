// Shared add/edit form for one course card. The backend validates every save
// and only accepts changes to cards in DRAFT courses.
import { useState } from "react";
import { CARD_TYPES, cardTypeInfo, emptyDataFor } from "./CardFields/registry";
import CardPreview from "./CardPreview";
import { parseImportedCard, slugFromTitle } from "./cardEditorUtils";
import "./CardFields/authoring.css";

export default function CardEditor({ mode, initial, onSubmit, submitLabel }) {
  const isEdit = mode === "edit";
  const [moduleId, setModuleId] = useState(initial.moduleId || "");
  const [orderIndex, setOrderIndex] = useState(initial.orderIndex ?? 1);
  const [title, setTitle] = useState(initial.title || "");
  const [slug, setSlug] = useState(initial.slug || "");
  const [cardType, setCardType] = useState(initial.cardType || "narrative");
  const [cardData, setCardData] = useState(initial.cardData || emptyDataFor(initial.cardType || "narrative"));

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null); // { ok: bool, message }

  const Fields = cardTypeInfo(cardType)?.Fields;

  const changeType = (value) => {
    setCardType(value);
    setCardData(emptyDataFor(value));
  };

  const applyImport = () => {
    setImportError("");
    try {
      const card = parseImportedCard(importText, cardType);
      if (isEdit && card.cardType !== cardType) {
        throw new Error(`This card is a "${cardType}" card; the pasted JSON is "${card.cardType}". A card's type can't change — add a new card instead.`);
      }
      setCardType(card.cardType);
      setCardData(card.cardData);
      if (card.title) setTitle(card.title);
      if (card.slug) setSlug(card.slug);
      if (card.orderIndex) setOrderIndex(card.orderIndex);
      setImportOpen(false);
      setImportText("");
      setResult({ ok: true, message: "Imported into the form below. Nothing is saved until you press the save button." });
    } catch (err) {
      setImportError(err.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setResult(null);
    try {
      const message = await onSubmit({
        moduleId,
        orderIndex: Number(orderIndex),
        title,
        slug: slug.trim() || null,
        cardType,
        cardData: { ...cardData, card_type: cardType },
      });
      setResult({ ok: true, message: message || "Saved." });
      if (!isEdit) {
        // ready for the next card in the same module
        setTitle("");
        setSlug("");
        setCardData(emptyDataFor(cardType));
        setOrderIndex((n) => Number(n) + 1);
      }
    } catch (err) {
      setResult({ ok: false, message: err.message || "Save failed." });
    } finally {
      setSaving(false);
    }
  };

  const autoSlug = slugFromTitle(title);

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="af-section">
          <div className="af-row">
            {isEdit ? (
              <label>
                Card type
                <input value={cardTypeInfo(cardType)?.label || cardType} disabled />
                <span className="af-hint">A card's type can't be changed.</span>
              </label>
            ) : (
              <label>
                Card type
                <select value={cardType} onChange={(e) => changeType(e.target.value)}>
                  {CARD_TYPES.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Order in module
              <input type="number" min={1} value={orderIndex} onChange={(e) => setOrderIndex(e.target.value)} required />
            </label>
          </div>

          {!isEdit && (
            <label>
              Module ID
              <input value={moduleId} onChange={(e) => setModuleId(e.target.value)} placeholder="Filled in when you come from a module's card list" required />
            </label>
          )}

          <div className="af-row">
            <label>
              Admin label
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. The Slow Leak" required />
            </label>
            <label>
              Slug (web address)
              <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug ? `auto: ${autoSlug}` : "v2-m1-the-slow-leak"} />
              <span className="af-hint">
                Must be unique across the whole site. For the new course use a prefix like <code>v2-m1-</code>. Lowercase letters, digits and hyphens.
              </span>
            </label>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="af-btn" onClick={() => setImportOpen((v) => !v)}>
              {importOpen ? "Cancel import" : "Import JSON"}
            </button>
            <button type="button" className="af-btn" onClick={() => setPreviewing(true)}>
              Preview
            </button>
          </div>

          {importOpen && (
            <div className="af-item">
              <label>
                Paste one card as JSON
                <textarea rows={10} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{ "card_type": "narrative", "title": "…", "card_data": { … } }' />
                <span className="af-hint">
                  Either a whole card (with card_type, title, slug, order_index, card_data) or just its card_data. It fills the form; you still review and save.
                </span>
              </label>
              {importError && <div className="af-error">{importError}</div>}
              <div>
                <button type="button" className="af-btn af-btn--primary" onClick={applyImport} disabled={!importText.trim()}>
                  Fill the form
                </button>
              </div>
            </div>
          )}
        </div>

        {Fields ? <Fields data={cardData} onChange={setCardData} /> : <p>No fields defined yet for this card type.</p>}

        {result && <div className={result.ok ? "af-ok" : "af-error"}>{result.message}</div>}

        <button className="primary-btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : submitLabel}
        </button>
      </form>

      {previewing && <CardPreview template={cardType} title={title} data={cardData} onClose={() => setPreviewing(false)} />}
    </>
  );
}
