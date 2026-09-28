// Inputs for the "model" card: a hands-on tool — the Leak Lab (typed fields)
// or "Your Slice" (its settings as a JSON box, owner-approved 2026-09-27).
// Mirrors ModelCardData / LeakLabConfig / SliceCalculatorConfig in the backend.
import { useState } from "react";
import { Section, Text, Area, Num, Choice, Stars, ListEditor } from "./fieldKit";
import { BODY_HINT, set, toId } from "./fieldUtils";
import { TOOLS } from "../../../components/scrolly/tools/registry";

const MODEL_OPTIONS = Object.entries(TOOLS).map(([value, t]) => ({ value, label: t.label }));

// Starting settings for "Your Slice" (made-up companies, round numbers).
const EMPTY_SLICE_CONFIG = {
  controls: {
    amount: { min: 1000, max: 100000, step: 1000, default: 5000, label: "Your money" },
    company: {
      label: "Company",
      options: [
        { id: "company_a", label: "Company A", price: 50, total_shares: 40000000 },
        { id: "company_b", label: "Company B", price: 2000, total_shares: 500000 },
      ],
      default: "company_a",
    },
    business_change: { min: -50, max: 50, step: 5, default: 0, label: "If the business does…" },
  },
  min_controls_to_complete: 2,
  neutrality_note: "",
  aside_text: "",
  footnote: "",
};

export const EMPTY_MODEL_DATA = {
  card_type: "model",
  title: "The Leak Lab",
  concept: "",
  model_kind: "leak_lab",
  config: {
    controls: {
      amount: { min: 10000, max: 1000000, step: 1000, default: 100000 },
      years: { min: 1, max: 30, step: 1, default: 10 },
      inflation: { min: 2, max: 8, step: 0.5, default: 5 },
      where: {
        options: [
          { id: "cash", label: "Cash at home", rate: 0 },
          { id: "savings", label: "Savings account", rate: 2.5 },
          { id: "fd", label: "Fixed deposit", rate: 6.25 },
        ],
        default: "savings",
      },
    },
    min_controls_to_complete: 2,
    neutrality_note: "",
    aside_text: "",
  },
  as_of: "",
  rate_source: "",
  cta_text: "Continue",
  allotted_finstars: 10,
};

function RangeEditor({ title, unit, range, onChange }) {
  const r = range || {};
  const bad = r.min !== "" && r.max !== "" && r.default !== "" && (r.default < r.min || r.default > r.max);
  return (
    <Section title={title}>
      <div className="af-row">
        <Num label={`Min ${unit}`} value={r.min} onChange={(v) => onChange(set(r, "min", v))} required />
        <Num label={`Max ${unit}`} value={r.max} onChange={(v) => onChange(set(r, "max", v))} required />
        <Num label="Step" value={r.step} min={0} onChange={(v) => onChange(set(r, "step", v))} required />
        <Num label="Starts at" value={r.default} onChange={(v) => onChange(set(r, "default", v))} required />
      </div>
      {bad && <div className="af-warn">“Starts at” must be between min and max.</div>}
    </Section>
  );
}

// A JSON text box that only passes on text that parses as an object.
function JsonBox({ label, value, onChange, hint }) {
  const [text, setText] = useState(() => JSON.stringify(value ?? {}, null, 2));
  const [error, setError] = useState("");
  const edit = (t) => {
    setText(t);
    try {
      const v = JSON.parse(t);
      if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Must be a { … } object.");
      setError("");
      onChange(v);
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <Area label={label} value={text} onChange={edit} rows={18} hint={hint} />
      {error && <div className="af-warn">Not valid JSON yet: {error}</div>}
    </>
  );
}

function SliceFields({ data, onChange, kindChoice }) {
  const setField = (key, value) => onChange(set(data, key, value));
  return (
    <>
      <Section title="Tool">
        {kindChoice}
        <Text label="Title" value={data.title} onChange={(v) => setField("title", v)} required />
        <Area label="What it shows (one line, optional)" value={data.concept} onChange={(v) => setField("concept", v || undefined)} hint={BODY_HINT} rows={2} />
        <Text label="Content checked in (month)" type="month" value={data.as_of} onChange={(v) => setField("as_of", v)} required hint="Not shown in this tool; the backend needs a month for every tool." />
      </Section>
      <Section
        title="Settings (JSON)"
        hint="controls.amount / controls.business_change: {min, max, step, default, label}; controls.company: {label, options: [{id, label, price, total_shares}] (2–5), default}; min_controls_to_complete (1–3); neutrality_note; aside_text (may use {ownership_pct}); aside_when: {amount_below}; footnote."
      >
        <JsonBox key={data.model_kind} label="Settings" value={data.config} onChange={(v) => setField("config", v)} />
      </Section>
      <Section title="Finish">
        <Text label="How to earn the stars (optional)" value={data.reward_rule} onChange={(v) => setField("reward_rule", v || undefined)} placeholder="Move at least two controls." />
        <Stars value={data.allotted_finstars} onChange={(v) => setField("allotted_finstars", v)} hint="The server always awards exactly this number for this card." />
      </Section>
    </>
  );
}

function ModelFields({ data, onChange }) {
  // Switching tool swaps in that tool's starting settings (the shapes differ).
  const changeKind = (kind) =>
    onChange({ ...data, model_kind: kind, config: kind === "slice_calculator" ? EMPTY_SLICE_CONFIG : EMPTY_MODEL_DATA.config });
  const kindChoice = <Choice label="Which tool" value={data.model_kind} options={MODEL_OPTIONS} onChange={changeKind} />;
  if (data.model_kind === "slice_calculator") return <SliceFields data={data} onChange={onChange} kindChoice={kindChoice} />;

  const config = data.config || EMPTY_MODEL_DATA.config;
  const controls = config.controls || EMPTY_MODEL_DATA.config.controls;
  const where = controls.where || EMPTY_MODEL_DATA.config.controls.where;
  const aside = config.aside_when;

  const setField = (key, value) => onChange(set(data, key, value));
  const setConfig = (key, value) => setField("config", set(config, key, value));
  const setControl = (key, value) => setConfig("controls", set(controls, key, value));

  return (
    <>
      <Section title="Tool">
        {kindChoice}
        <Text label="Title" value={data.title} onChange={(v) => setField("title", v)} required />
        <Area label="What it shows (one line, optional)" value={data.concept} onChange={(v) => setField("concept", v || undefined)} hint={BODY_HINT} rows={2} />
      </Section>

      <Section title="Rates are real numbers — say when they were checked" hint="Shown in the tool so learners know how current the rates are. Update when rates change.">
        <div className="af-row">
          <Text label="Rates checked in (month)" type="month" value={data.as_of} onChange={(v) => setField("as_of", v)} required />
          <Text label="Source (optional)" value={data.rate_source} onChange={(v) => setField("rate_source", v || undefined)} placeholder="SBI savings / FD rates" />
        </div>
      </Section>

      <Section title="Where the money sits" hint="Fixed rates only — no shares, which don't have a rate you can type in.">
        <ListEditor
          items={where.options}
          onChange={(opts) => setControl("where", set(where, "options", opts))}
          min={2}
          max={5}
          makeNew={(n) => ({ id: `place_${n + 1}`, label: "", rate: 0 })}
          itemLabel={(o, i) => `Place ${i + 1}${o.label ? ` — ${o.label}` : ""}`}
          addLabel="Add place"
          renderItem={(o, update) => (
            <div className="af-row">
              <Text label="Label" value={o.label} onChange={(v) => update(set(o, "label", v))} required />
              <Text label="Id" value={o.id} onChange={(v) => update(set(o, "id", toId(v) || v))} required />
              <Num label="Rate (% a year)" value={o.rate} min={0} max={30} onChange={(v) => update(set(o, "rate", v))} required />
            </div>
          )}
        />
        <Choice
          label="Selected at the start"
          value={where.default}
          options={where.options.map((o) => ({ value: o.id, label: o.label || o.id }))}
          onChange={(v) => setControl("where", set(where, "default", v))}
        />
      </Section>

      <RangeEditor title="Years slider" unit="(years)" range={controls.years} onChange={(v) => setControl("years", v)} />
      <RangeEditor title="Amount slider (under “More options”)" unit="(₹)" range={controls.amount} onChange={(v) => setControl("amount", v)} />
      <RangeEditor title="Inflation slider (under “More options”)" unit="(%)" range={controls.inflation} onChange={(v) => setControl("inflation", v)} />

      <Section title="Messages">
        <Area label="Note under the options (optional)" value={config.neutrality_note} onChange={(v) => setConfig("neutrality_note", v || undefined)} rows={2} />
        <Area label="Special line (optional)" value={config.aside_text} onChange={(v) => setConfig("aside_text", v || undefined)} rows={2} hint="Shown only when the learner lands exactly on the settings below." />
        <label className="af-inline">
          <input
            type="checkbox"
            checked={!!aside}
            onChange={(e) => setConfig("aside_when", e.target.checked ? { where: where.default, years: controls.years?.default, inflation: controls.inflation?.default } : undefined)}
          />
          Show the special line only for specific settings
        </label>
        {aside && (
          <div className="af-row">
            <Choice label="Where" value={aside.where} options={where.options.map((o) => ({ value: o.id, label: o.label || o.id }))} onChange={(v) => setConfig("aside_when", set(aside, "where", v))} />
            <Num label="Years" value={aside.years} onChange={(v) => setConfig("aside_when", set(aside, "years", v))} required />
            <Num label="Inflation %" value={aside.inflation} onChange={(v) => setConfig("aside_when", set(aside, "inflation", v))} required />
          </div>
        )}
      </Section>

      <Section title="Finish">
        <Num
          label="Controls the learner must move before Continue unlocks"
          value={config.min_controls_to_complete}
          min={1}
          max={4}
          step={1}
          onChange={(v) => setConfig("min_controls_to_complete", v)}
        />
        <Text
          label="How to earn the stars (optional)"
          value={data.reward_rule}
          onChange={(v) => setField("reward_rule", v || undefined)}
          placeholder="Move at least two controls."
          hint="Shown under the FinStars badge on the tool."
        />
        <Stars value={data.allotted_finstars} onChange={(v) => setField("allotted_finstars", v)} hint="The server always awards exactly this number for this card." />
      </Section>
    </>
  );
}

export default ModelFields;
