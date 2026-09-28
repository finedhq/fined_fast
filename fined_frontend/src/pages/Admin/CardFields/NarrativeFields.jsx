// Inputs for the "narrative" card: one scrolling story with a sticky figure.
// Mirrors NarrativeCardData in fined_backend/app/models/card_data.py.
import { Section, Text, Area, Choice, Stars, ListEditor, GlossaryEditor } from "./fieldKit";
import { BODY_HINT, set, toId } from "./fieldUtils";
import { FIGURES } from "../../../components/scrolly/figures/registry";

// Figures come from the learner page's figure registry (one list for both).
// Adding a figure = component + registry entry + backend FigureKind.
const FIGURE_OPTIONS = Object.entries(FIGURES).map(([value, f]) => ({ value, label: f.label }));
const FIGURE_STEPS = Object.fromEntries(Object.entries(FIGURES).map(([kind, f]) => [kind, f.steps]));

const ACCENTS = [
  { value: "info", label: "Info (blue)" },
  { value: "highlight", label: "Highlight (indigo)" },
  { value: "warning", label: "Warning (amber)" },
];

const newStep = (n) => ({
  step_id: `step_${n + 1}`,
  badge_label: "",
  heading: "",
  body: "",
  glossary_terms: [],
});

export const EMPTY_NARRATIVE_DATA = {
  card_type: "narrative",
  title: "",
  chapter_label: "",
  figure: { kind: FIGURE_OPTIONS[0].value, title: "" },
  steps: [newStep(0), newStep(1)],
  cta_text: "Continue",
  allotted_finstars: 0,
};

function TapGuessEditor({ guess, onChange }) {
  if (!guess) {
    return (
      <button
        type="button"
        className="af-btn"
        onClick={() =>
          onChange({
            kind: "tap_guess",
            prompt: "",
            options: [
              { id: "a", label: "", feedback: "", correct: true },
              { id: "b", label: "", feedback: "", correct: false },
            ],
          })
        }
      >
        + Add a tap-to-guess question to this step
      </button>
    );
  }
  const setCorrect = (idx) => onChange(set(guess, "options", guess.options.map((o, i) => ({ ...o, correct: i === idx }))));
  return (
    <Section title="Tap-to-guess" hint="The learner taps an answer and sees its feedback. Pick exactly one correct option.">
      <Text label="Question" value={guess.prompt} onChange={(v) => onChange(set(guess, "prompt", v))} required />
      <ListEditor
        items={guess.options}
        onChange={(opts) => onChange(set(guess, "options", opts))}
        min={2}
        max={5}
        makeNew={(n) => ({ id: "abcde"[n] || `opt_${n + 1}`, label: "", feedback: "", correct: false })}
        itemLabel={(o, i) => `Option ${i + 1}${o.correct ? " ✓ correct" : ""}`}
        addLabel="Add option"
        renderItem={(o, update, i) => (
          <>
            <div className="af-row">
              <Text label="Label" value={o.label} onChange={(v) => update(set(o, "label", v))} required />
              <Text label="Id" value={o.id} onChange={(v) => update(set(o, "id", toId(v) || v))} hint="Short, unique" required />
            </div>
            <Text label="Feedback shown after tapping" value={o.feedback} onChange={(v) => update(set(o, "feedback", v))} required />
            <label className="af-inline">
              <input type="radio" checked={!!o.correct} onChange={() => setCorrect(i)} /> This is the correct answer
            </label>
          </>
        )}
      />
      <div>
        <button type="button" className="af-btn af-btn--danger" onClick={() => onChange(null)}>
          Remove tap-to-guess
        </button>
      </div>
    </Section>
  );
}

function NarrativeFields({ data, onChange }) {
  const figure = data.figure || EMPTY_NARRATIVE_DATA.figure;
  const steps = data.steps || [];
  const setField = (key, value) => onChange(set(data, key, value));

  return (
    <>
      <Section title="Story">
        <Text label="Title" value={data.title} onChange={(v) => setField("title", v)} placeholder="The Slow Leak" required />
        <Text label="Chapter label (optional)" value={data.chapter_label} onChange={(v) => setField("chapter_label", v)} placeholder="Chapter 1 · The Slow Leak" />
      </Section>

      <Section title="Sticky figure" hint="The picture that stays on screen while the steps scroll past. Each figure is built in code; pick which one this story uses.">
        <Choice label="Figure" value={figure.kind} options={FIGURE_OPTIONS} onChange={(v) => setField("figure", set(figure, "kind", v))} />
        <Text label="Figure title" value={figure.title} onChange={(v) => setField("figure", set(figure, "title", v))} placeholder="What ₹1,00,000 buys, ten years apart" required />
      </Section>

      <Section
        title={`Steps (${steps.length}${FIGURE_STEPS[figure.kind] ? ` of ${FIGURE_STEPS[figure.kind]}` : "/7"})`}
        hint={
          FIGURE_STEPS[figure.kind]
            ? `This figure is built for exactly ${FIGURE_STEPS[figure.kind]} steps: it changes at each step in order (1st, 2nd, …), so keep the steps in the story's order.`
            : "2 to 7 steps. Each scroll step changes what the figure shows."
        }
      >
        <ListEditor
          items={steps}
          onChange={(v) => setField("steps", v)}
          min={2}
          max={7}
          makeNew={newStep}
          itemLabel={(s, i) => `Step ${i + 1}${s.badge_label ? ` — ${s.badge_label}` : ""}`}
          addLabel="Add step"
          renderItem={(s, update) => (
            <>
              <div className="af-row">
                <Text label="Badge" value={s.badge_label} onChange={(v) => update(set(s, "badge_label", v))} placeholder="Meet Arjun" required />
                <Text label="Step id" value={s.step_id} onChange={(v) => update(set(s, "step_id", toId(v) || v))} hint="Unique within this card" required />
              </div>
              <Text label="Heading" value={s.heading} onChange={(v) => update(set(s, "heading", v))} required />
              <Area label="Body" value={s.body} onChange={(v) => update(set(s, "body", v))} hint={BODY_HINT} rows={5} required />
              <Text label="Big stat (optional)" value={s.stat} onChange={(v) => update(set(s, "stat", v || undefined))} placeholder="₹61,391" />

              <div className="af-row">
                <Choice
                  label="Side note (optional)"
                  value={s.annotation ? s.annotation.accent_type : ""}
                  options={[{ value: "", label: "None" }, ...ACCENTS]}
                  onChange={(v) => update(set(s, "annotation", v ? { accent_type: v, text: s.annotation?.text || "" } : undefined))}
                />
              </div>
              {s.annotation && (
                <Text label="Side note text" value={s.annotation.text} onChange={(v) => update(set(s, "annotation", set(s.annotation, "text", v)))} required />
              )}

              <Section title="Glossary terms for this step">
                <GlossaryEditor terms={s.glossary_terms} onChange={(v) => update(set(s, "glossary_terms", v))} />
              </Section>

              <TapGuessEditor guess={s.interaction} onChange={(v) => update(set(s, "interaction", v || undefined))} />
            </>
          )}
        />
      </Section>

      <Section title="Finish">
        <Text label="Button text" value={data.cta_text} onChange={(v) => setField("cta_text", v)} required />
        <Stars value={data.allotted_finstars} onChange={(v) => setField("allotted_finstars", v)} hint="Story cards are usually 0 — stars come from the tool and the checkpoints." />
      </Section>
    </>
  );
}

export default NarrativeFields;
