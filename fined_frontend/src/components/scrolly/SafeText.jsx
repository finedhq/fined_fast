// Renders text tokens from text.js as React elements. Everything is plain
// text — no dangerouslySetInnerHTML — so HTML typed into a card shows as text.
// Glossary words become the prototype's `.jargon` spans; GlossaryTooltip.jsx
// shows their definitions.
import { Fragment } from "react";
import { linkText } from "./text";

// `inButton`: the word sits inside a button (e.g. a Leak Lab choice), so it
// isn't a separate tab stop / button — as in the prototype.
export function Term({ token, inButton = false }) {
  return (
    <span
      className="jargon"
      tabIndex={inButton ? undefined : 0}
      role={inButton ? undefined : "button"}
      aria-label={`${token.text}: show definition`}
      data-term={token.term}
      data-def={token.def}
      data-example={token.example}
    >
      {token.text}
    </span>
  );
}

export function Tokens({ tokens, inButton = false }) {
  // Group consecutive bold tokens into one <strong>, as the prototype does.
  const groups = [];
  tokens.forEach((t) => {
    const last = groups[groups.length - 1];
    if (last && last.bold === !!t.bold) last.items.push(t);
    else groups.push({ bold: !!t.bold, items: [t] });
  });
  const draw = (items) => items.map((t, i) => (t.kind === "term" ? <Term key={i} token={t} inButton={inButton} /> : t.text));
  return groups.map((g, i) => (g.bold ? <strong key={i}>{draw(g.items)}</strong> : <Fragment key={i}>{draw(g.items)}</Fragment>));
}

/** Text with the module glossary auto-linked. `marks` also handles **bold** and [[term]]. */
export default function SafeText({ text, stepTerms, used, marks = false, inButton = false }) {
  return <Tokens tokens={linkText(text, { stepTerms, used, marks })} inButton={inButton} />;
}
