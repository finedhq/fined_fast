// Plain helpers shared by the new card editors (kept out of fieldKit.jsx so
// that file only exports components).

// Returns a copy of obj with obj[key] = value.
export const set = (obj, key, value) => ({ ...obj, [key]: value });

// "Meet Arjun" -> "meet_arjun" (used to suggest ids)
export const toId = (text) =>
  (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

export const BODY_HINT =
  "Plain text. Use **double stars** for bold and [[term]] to link a glossary term defined below (spelling must match). HTML is shown as text, never run.";
