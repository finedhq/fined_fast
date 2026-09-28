// Text rules for the module page — a port of the prototype's renderBody /
// autoLinkGlossary (fined-scrolly/module-1-market/js/engine.js), but producing
// plain tokens instead of HTML, so nothing typed into a card can ever run as
// code (see SafeText.jsx). Must give the same result as the prototype; the
// parity test in text.test.js checks every Module 1 text against it.
//
//   **bold**        -> bold
//   [[term]]        -> glossary link, using the step's definition if it has one
//   any MODULE_GLOSSARY word -> glossary link on its first use in a block
import { MODULE_GLOSSARY } from "./glossary";

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Card data stores step terms as { term, definition, example? }; the
// prototype's shape is { term, def, example? }. Accept both.
export function normaliseTerms(stepTerms = []) {
  return (stepTerms || []).map((t) => ({
    term: t.term,
    def: t.definition ?? t.def ?? "",
    ...(t.example ? { example: t.example } : {}),
  }));
}

const moduleEntryFor = (term) => MODULE_GLOSSARY.find((g) => g.term.toLowerCase() === term.toLowerCase());

// A step-level term, falling back to the module glossary (by term or form).
function glossaryEntryFor(phrase, stepTerms) {
  const lower = phrase.toLowerCase();
  return (
    stepTerms.find((g) => g.term.toLowerCase() === lower) ||
    MODULE_GLOSSARY.find((g) => g.term.toLowerCase() === lower || g.match.some((m) => m.toLowerCase() === lower))
  );
}

const termToken = (entry, phrase, bold) => ({
  kind: "term",
  text: phrase,
  term: capitalize(entry.term),
  def: entry.def,
  ...(entry.example ? { example: entry.example } : {}),
  bold,
});

// Links the first unused occurrence of each module glossary word in `text`.
function autoLink(text, used, stepTerms, bold) {
  if (!text.trim()) return [{ kind: "text", text, bold }];
  const hits = [];
  const overlaps = (s, e) => hits.some((h) => s < h.end && e > h.start);
  MODULE_GLOSSARY.forEach((g) => {
    if (used.has(g.term)) return;
    const forms = [...g.match].sort((a, b) => b.length - a.length).map(escapeRegex).join("|");
    const re = new RegExp(`(^|[^A-Za-z0-9-])(${forms})(?![A-Za-z0-9-])`, g.caseSensitive ? "g" : "gi");
    let m;
    while ((m = re.exec(text))) {
      const start = m.index + m[1].length;
      const end = start + m[2].length;
      const blocked = (g.avoid || []).some((a) => {
        const idx = text.toLowerCase().indexOf(a.toLowerCase(), Math.max(0, start - a.length));
        return idx !== -1 && idx <= start && idx + a.length >= end;
      });
      if (blocked || overlaps(start, end)) continue;
      // Use the step's own definition when it defines this term.
      const own = stepTerms.find((s) => s.term.toLowerCase() === g.term.toLowerCase());
      hits.push({ start, end, entry: { ...g, ...(own || {}), term: g.term } });
      used.add(g.term);
      break;
    }
  });
  hits.sort((a, b) => a.start - b.start);
  const out = [];
  let cursor = 0;
  hits.forEach((h) => {
    if (h.start > cursor) out.push({ kind: "text", text: text.slice(cursor, h.start), bold });
    out.push(termToken(h.entry, text.slice(h.start, h.end), bold));
    cursor = h.end;
  });
  if (cursor < text.length) out.push({ kind: "text", text: text.slice(cursor), bold });
  return out;
}

/**
 * Turns one block of text into tokens. `used` (a Set of module glossary terms)
 * is shared across the blocks of one step so a word is linked only once there.
 */
export function linkText(text, { stepTerms = [], used = new Set(), marks = true } = {}) {
  const terms = normaliseTerms(stepTerms);
  // 1. **bold**
  const segments = [];
  const src = String(text ?? "");
  const boldRe = /\*\*(.+?)\*\*/g;
  let last = 0;
  let b;
  while (marks && (b = boldRe.exec(src))) {
    if (b.index > last) segments.push({ text: src.slice(last, b.index), bold: false });
    segments.push({ text: b[1], bold: true });
    last = b.index + b[0].length;
  }
  if (last < src.length) segments.push({ text: src.slice(last), bold: false });

  // 2. [[term]] marks — resolved (and recorded as used) before auto-linking,
  //    exactly as the prototype does.
  const tokens = [];
  segments.forEach((seg) => {
    const markRe = /\[\[(.+?)\]\]/g;
    let cur = 0;
    let m;
    while (marks && (m = markRe.exec(seg.text))) {
      if (m.index > cur) tokens.push({ kind: "text", text: seg.text.slice(cur, m.index), bold: seg.bold });
      const entry = glossaryEntryFor(m[1], terms);
      if (entry) {
        const moduleEntry = moduleEntryFor(entry.term);
        if (moduleEntry) used.add(moduleEntry.term);
        tokens.push(termToken(entry, m[1], seg.bold));
      } else {
        tokens.push({ kind: "text", text: m[1], bold: seg.bold });
      }
      cur = m.index + m[0].length;
    }
    if (cur < seg.text.length) tokens.push({ kind: "text", text: seg.text.slice(cur), bold: seg.bold });
  });

  // 3. auto-link module glossary words in the remaining plain text
  return tokens.flatMap((t) => (t.kind === "text" ? autoLink(t.text, used, terms, t.bold) : [t]));
}

/**
 * A step body: paragraphs (split on blank lines) plus the step's glossary
 * terms that the text never says out loud — shown as "Key word" chips.
 */
export function stepBody(body, stepTerms = []) {
  const used = new Set();
  const paragraphs = String(body ?? "")
    .split("\n\n")
    .map((p) => linkText(p, { stepTerms, used }));
  const keyWords = normaliseTerms(stepTerms)
    .filter((t) => {
      const moduleEntry = moduleEntryFor(t.term);
      return !used.has(moduleEntry ? moduleEntry.term : t.term);
    })
    .map((t) => termToken(t, capitalize(t.term), false));
  return { paragraphs, keyWords };
}

/** Annotation text, minus authoring notes like "(Hand-off to Section 2.)". */
export function annotationText(text) {
  return String(text ?? "").replace(/\s*\(Hand-off to [^)]*\)\s*$/i, "");
}

/**
 * The completion screen's "your first answer, revisited" line for the hero
 * poll choice ("" if none). A per-choice text wins; otherwise {choice} in
 * `poll_replay` becomes the option's label, lower-cased, as in the prototype.
 */
export function replayText(cardData, poll, pollChoice) {
  if (pollChoice === undefined || pollChoice === null) return "";
  const byChoice = cardData?.poll_replay_by_choice?.[pollChoice];
  if (byChoice) return byChoice;
  if (!cardData?.poll_replay) return "";
  const option = (poll?.options || []).find((o) => o.id === pollChoice);
  return cardData.poll_replay.replace("{choice}", option ? option.label.toLowerCase() : "…");
}
