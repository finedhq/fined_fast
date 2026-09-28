// Small shared pieces for the new card editors (narrative / model / hero /
// completion). Every editor follows the existing pattern: it receives
// (data, onChange) and returns the whole updated card_data object.
import "./authoring.css";
import { set } from "./fieldUtils";

export function Section({ title, hint, children }) {
  return (
    <fieldset className="af-section">
      <legend>{title}</legend>
      {hint && <div className="af-hint">{hint}</div>}
      {children}
    </fieldset>
  );
}

export function Text({ label, value, onChange, hint, required, placeholder, type = "text" }) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {hint && <span className="af-hint">{hint}</span>}
    </label>
  );
}

export function Area({ label, value, onChange, hint, required, placeholder, rows = 4 }) {
  return (
    <label>
      {label}
      <textarea
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
      {hint && <span className="af-hint">{hint}</span>}
    </label>
  );
}

// Number input that keeps an empty box empty while typing, and stores numbers.
export function Num({ label, value, onChange, hint, min, max, step = "any", required }) {
  return (
    <label>
      {label}
      <input
        type="number"
        value={value ?? ""}
        min={min}
        max={max}
        step={step}
        required={required}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
      {hint && <span className="af-hint">{hint}</span>}
    </label>
  );
}

export function Choice({ label, value, onChange, options, hint }) {
  return (
    <label>
      {label}
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="af-hint">{hint}</span>}
    </label>
  );
}

export function Stars({ value, onChange, hint }) {
  return (
    <Num
      label="FinStars awarded for this card"
      value={value}
      min={0}
      step={1}
      onChange={(v) => onChange(v === "" ? 0 : v)}
      hint={hint || "Set it explicitly on every card. Module 1 must total 20."}
    />
  );
}

// A list with add / remove / move up / move down, respecting min and max.
export function ListEditor({ items = [], onChange, min = 0, max = 99, makeNew, itemLabel, addLabel, renderItem }) {
  const move = (from, to) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };
  const update = (i, value) => onChange(items.map((it, j) => (j === i ? value : it)));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, i) => (
        <div className="af-item" key={i}>
          <div className="af-item-head">
            <span>{itemLabel(item, i)}</span>
            <span className="af-item-actions">
              <button type="button" className="af-btn af-btn--icon" disabled={i === 0} onClick={() => move(i, i - 1)} title="Move up">↑</button>
              <button type="button" className="af-btn af-btn--icon" disabled={i === items.length - 1} onClick={() => move(i, i + 1)} title="Move down">↓</button>
              <button type="button" className="af-btn af-btn--icon af-btn--danger" disabled={items.length <= min} onClick={() => onChange(items.filter((_, j) => j !== i))} title="Remove">✕</button>
            </span>
          </div>
          {renderItem(item, (value) => update(i, value), i)}
        </div>
      ))}
      <div>
        <button type="button" className="af-btn" disabled={items.length >= max} onClick={() => onChange([...items, makeNew(items.length)])}>
          + {addLabel} ({items.length}/{max})
        </button>
      </div>
    </div>
  );
}

// Glossary terms, same shape the older card types use: { term, definition }.
export function GlossaryEditor({ terms = [], onChange }) {
  return (
    <ListEditor
      items={terms}
      onChange={onChange}
      max={10}
      makeNew={() => ({ term: "", definition: "" })}
      itemLabel={(t, i) => `Term ${i + 1}${t.term ? ` — ${t.term}` : ""}`}
      addLabel="Add glossary term"
      renderItem={(t, update) => (
        <div className="af-row">
          <Text label="Term" value={t.term} onChange={(v) => update(set(t, "term", v))} required />
          <Text label="Plain-English definition" value={t.definition} onChange={(v) => update(set(t, "definition", v))} required />
        </div>
      )}
    />
  );
}
