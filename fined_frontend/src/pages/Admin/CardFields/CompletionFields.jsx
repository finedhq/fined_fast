// Inputs for the "completion" card (end of a module). The learner-facing card
// already exists; until now the admin had no form for it.
// Mirrors CompletionCardData in the backend.
import { Section, Text, Area, ListEditor } from "./fieldKit";
import { set } from "./fieldUtils";

export const EMPTY_COMPLETION_DATA = {
  card_type: "completion",
  card_label: "",
  title: "",
  subtitle: "",
  badge_icon: "🔔",
  learnings: [""],
  cta_text: "Continue",
};

function CompletionFields({ data, onChange }) {
  const teaser = data.next_module_teaser;
  const setField = (key, value) => onChange(set(data, key, value));

  return (
    <>
      <Section title="Headline">
        <div className="af-row">
          <Text label="Badge text (optional)" value={data.card_label} onChange={(v) => setField("card_label", v || undefined)} placeholder="Room Explained" />
          <Text label="Badge icon" value={data.badge_icon} onChange={(v) => setField("badge_icon", v)} />
        </div>
        <Area label="Title" value={data.title} onChange={(v) => setField("title", v)} rows={2} required />
        <Text label="Subtitle" value={data.subtitle} onChange={(v) => setField("subtitle", v)} placeholder="Module 1 complete" required />
      </Section>

      <Section title="What you learned">
        <ListEditor
          items={data.learnings || []}
          onChange={(v) => setField("learnings", v)}
          max={8}
          makeNew={() => ""}
          itemLabel={(_, i) => `Point ${i + 1}`}
          addLabel="Add point"
          renderItem={(text, update) => <Area label="" value={text} onChange={update} rows={2} required />}
        />
      </Section>

      <Section
        title="Replay the warm-up answer (optional)"
        hint="Write {choice} where the learner's poll answer should go. If they skipped the poll, this line is not shown."
      >
        <Area
          label="Replay line"
          value={data.poll_replay}
          onChange={(v) => setField("poll_replay", v || undefined)}
          rows={3}
          placeholder="At the start you said the market mostly exists so {choice}. The fuller answer: …"
        />
        {data.poll_replay && !data.poll_replay.includes("{choice}") && (
          <div className="af-warn">This line has no {"{choice}"}, so it won't mention what the learner picked.</div>
        )}
        <div className="af-hint">
          Some answers don't read well inside the sentence (e.g. “…exists so honestly, no idea”). For those, write a whole replacement line below.
        </div>
        <ListEditor
          items={Object.entries(data.poll_replay_by_choice || {}).map(([id, text]) => ({ id, text }))}
          onChange={(rows) => setField("poll_replay_by_choice", Object.fromEntries(rows.map((r) => [r.id, r.text])))}
          max={5}
          makeNew={() => ({ id: "", text: "" })}
          itemLabel={(r, i) => `Replacement ${i + 1}${r.id ? ` — for “${r.id}”` : ""}`}
          addLabel="Add replacement line"
          renderItem={(r, update) => (
            <>
              <Text label="Poll option id" value={r.id} onChange={(v) => update(set(r, "id", v))} placeholder="dont_know" required />
              <Area label="Line to show instead" value={r.text} onChange={(v) => update(set(r, "text", v))} rows={2} required />
            </>
          )}
        />
      </Section>

      <Section title="Next module teaser (optional)">
        <label className="af-inline">
          <input
            type="checkbox"
            checked={!!teaser}
            onChange={(e) => setField("next_module_teaser", e.target.checked ? { label: "Up next", title: "", description: "" } : undefined)}
          />
          Show a teaser for the next module
        </label>
        {teaser && (
          <>
            <div className="af-row">
              <Text label="Label" value={teaser.label} onChange={(v) => setField("next_module_teaser", set(teaser, "label", v))} required />
              <Text label="Title" value={teaser.title} onChange={(v) => setField("next_module_teaser", set(teaser, "title", v))} required />
            </div>
            <Area label="Description" value={teaser.description} onChange={(v) => setField("next_module_teaser", set(teaser, "description", v))} rows={2} required />
          </>
        )}
      </Section>

      <Section title="Finish" hint="Completion cards never award stars; they show the total the learner earned in the module.">
        <Text label="Button text" value={data.cta_text} onChange={(v) => setField("cta_text", v)} required />
      </Section>
    </>
  );
}

export default CompletionFields;
