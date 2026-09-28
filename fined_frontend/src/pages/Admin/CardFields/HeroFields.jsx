// Inputs for the "hero" card: the top of a module page, exactly as in the
// prototype — badge, headline, subhead, read time + info chips, and the
// warm-up (a one-tap poll plus an optional "how much have you saved?" chip).
// Mirrors HeroCardData in fined_backend/app/models/card_data.py.
import { Section, Text, Area, Num, Stars, ListEditor } from "./fieldKit";
import { BODY_HINT, set, toId } from "./fieldUtils";

export const EMPTY_HERO_DATA = {
  card_type: "hero",
  badge: "",
  short_title: "",
  headline: "",
  subhead: "",
  read_time: "",
  meta_chips: [],
  warmup_label: "Before you start",
  poll: {
    id: "hero_poll",
    prompt: "",
    options: [
      { id: "a", label: "" },
      { id: "b", label: "" },
    ],
    ack: "Noted. We'll come back to this at the end.",
  },
  note: "No right answers here. Tap whatever feels true.",
  scroll_cta: "Scroll to begin",
  allotted_finstars: 0,
};

const NEW_CHIP = {
  id: "hero_savings",
  prompt: "",
  options: [
    { id: "small", label: "", value: 0 },
    { id: "skip", label: "Skip", value: null },
  ],
  ack: "Got it. The Leak Lab will start from this amount.",
  skip_ack: "No problem. We'll use ₹1 lakh as the example.",
};

function HeroFields({ data, onChange }) {
  const poll = data.poll || EMPTY_HERO_DATA.poll;
  const chip = data.chip;
  const setField = (key, value) => onChange(set(data, key, value));

  return (
    <>
      <Section title="Top of the page" hint="The first thing learners see. “Earn up to N FinStars” is added automatically from the module's cards.">
        <Text label="Badge" value={data.badge} onChange={(v) => setField("badge", v)} placeholder="Module 1 · Basics of the Stock Market" required />
        <Text
          label="Short title for the top bar (optional)"
          value={data.short_title}
          onChange={(v) => setField("short_title", v || undefined)}
          placeholder="Why does the stock market exist?"
          hint="Shown next to “Module 1” in the bar at the top. Left empty, the module's title is used."
        />
        <Area label="Headline" value={data.headline} onChange={(v) => setField("headline", v)} rows={2} required />
        <Area label="Subhead" value={data.subhead} onChange={(v) => setField("subhead", v)} rows={2} hint={BODY_HINT} required />
        <Text label="Read time (optional)" value={data.read_time} onChange={(v) => setField("read_time", v || undefined)} placeholder="4 min" hint="Shown as “4 min read”." />
      </Section>

      <Section title="Info chips (optional)" hint="Small chips under the subhead, e.g. “3 short stages”. Up to 5.">
        <ListEditor
          items={data.meta_chips || []}
          onChange={(v) => setField("meta_chips", v)}
          max={5}
          makeNew={() => ""}
          itemLabel={(_, i) => `Chip ${i + 1}`}
          addLabel="Add chip"
          renderItem={(text, update) => <Text label="" value={text} onChange={update} required />}
        />
      </Section>

      <Section title="Warm-up poll" hint="One tap, no right answer. The completion screen can replay what the learner picked.">
        <Text label="Label above the warm-up" value={data.warmup_label} onChange={(v) => setField("warmup_label", v)} required />
        <div className="af-row">
          <Text label="Question" value={poll.prompt} onChange={(v) => setField("poll", set(poll, "prompt", v))} required />
          <Text label="Poll id" value={poll.id} onChange={(v) => setField("poll", set(poll, "id", toId(v) || v))} required />
        </div>
        <ListEditor
          items={poll.options}
          onChange={(opts) => setField("poll", set(poll, "options", opts))}
          min={2}
          max={5}
          makeNew={(n) => ({ id: "abcde"[n] || `opt_${n + 1}`, label: "" })}
          itemLabel={(o, i) => `Option ${i + 1}`}
          addLabel="Add option"
          renderItem={(o, update) => (
            <div className="af-row">
              <Text label="Label" value={o.label} onChange={(v) => update(set(o, "label", v))} required />
              <Text label="Id" value={o.id} onChange={(v) => update(set(o, "id", toId(v) || v))} required />
            </div>
          )}
        />
        <Text label="Line shown after they answer" value={poll.ack} onChange={(v) => setField("poll", set(poll, "ack", v))} required />
      </Section>

      <Section title="Savings chips (optional)" hint="A quick number the learner can share. The Leak Lab starts from it. Leave a chip's value empty for “Skip”.">
        <label className="af-inline">
          <input type="checkbox" checked={!!chip} onChange={(e) => setField("chip", e.target.checked ? NEW_CHIP : undefined)} />
          Include the savings chips
        </label>
        {chip && (
          <>
            <div className="af-row">
              <Text label="Question" value={chip.prompt} onChange={(v) => setField("chip", set(chip, "prompt", v))} required />
              <Text label="Chip id" value={chip.id} onChange={(v) => setField("chip", set(chip, "id", toId(v) || v))} required />
            </div>
            <ListEditor
              items={chip.options}
              onChange={(opts) => setField("chip", set(chip, "options", opts))}
              min={2}
              max={6}
              makeNew={(n) => ({ id: `chip_${n + 1}`, label: "", value: 0 })}
              itemLabel={(o, i) => `Chip ${i + 1}${o.value === null || o.value === "" ? " (skip)" : ""}`}
              addLabel="Add chip"
              renderItem={(o, update) => (
                <div className="af-row">
                  <Text label="Label" value={o.label} onChange={(v) => update(set(o, "label", v))} placeholder="₹50k" required />
                  <Text label="Id" value={o.id} onChange={(v) => update(set(o, "id", toId(v) || v))} required />
                  <Num label="Value (₹, empty = skip)" value={o.value ?? ""} min={0} step={1} onChange={(v) => update(set(o, "value", v === "" ? null : v))} />
                </div>
              )}
            />
            <Text label="Line shown after they pick an amount" value={chip.ack} onChange={(v) => setField("chip", set(chip, "ack", v))} required />
            <Text label="Line shown after they skip" value={chip.skip_ack} onChange={(v) => setField("chip", set(chip, "skip_ack", v))} required />
          </>
        )}
      </Section>

      <Section title="Finish">
        <Text label="Small note under the warm-up (optional)" value={data.note} onChange={(v) => setField("note", v || undefined)} />
        <Text label="Scroll prompt" value={data.scroll_cta} onChange={(v) => setField("scroll_cta", v)} required />
        <Stars value={data.allotted_finstars} onChange={(v) => setField("allotted_finstars", v)} hint="Usually 0." />
      </Section>
    </>
  );
}

export default HeroFields;
