// Admin: every source link behind the facts and numbers in course content,
// grouped by module (backend routes/sources.py, migration 004). Learners never
// see this. Sources stay editable after a course is published, so "checked on"
// dates can be kept current — anything not checked for 6 months is flagged.
// `?module=<id>` opens the page filtered to that module (link from its card list).
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { addSource, deleteSource, editSource, getAdminCourses, getCourseModules, getSources } from "../../services/api";
import "./CardFields/authoring.css";

const GENERAL = "general"; // filter value for sources not tied to a module
const RECHECK_AFTER_DAYS = 183;

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (moduleId = "") => ({ module_id: moduleId, label: "", url: "", backs: "", checked_on: today() });

// FastAPI validation errors arrive as a JSON list; show them as one readable line.
function readableError(err) {
  const msg = err?.message || "Something went wrong.";
  try {
    const list = JSON.parse(msg);
    if (Array.isArray(list)) return list.map((e) => `${(e.loc || []).slice(-1)[0]}: ${e.msg}`).join(" · ");
  } catch {
    /* not JSON */
  }
  return msg;
}

function needsRecheck(checkedOn) {
  if (!checkedOn) return true;
  return (Date.now() - new Date(checkedOn).getTime()) / 86400000 > RECHECK_AFTER_DAYS;
}

function toPayload(form) {
  return {
    module_id: form.module_id || null,
    label: form.label.trim(),
    url: form.url.trim(),
    backs: form.backs.trim() || null,
    checked_on: form.checked_on || null,
  };
}

function SourceFields({ form, setForm, modules }) {
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  return (
    <>
      <label>
        Module
        <select value={form.module_id} onChange={set("module_id")}>
          <option value="">Not tied to a module</option>
          {modules.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        The fact, and where it comes from
        <input value={form.label} onChange={set("label")} placeholder="SBI savings rate 2.50% (from 15 Jun 2025)" maxLength={300} />
      </label>
      <label>
        Link
        <input value={form.url} onChange={set("url")} placeholder="https://…" type="url" maxLength={2000} />
      </label>
      <label>
        Where it's used in the content (optional)
        <input value={form.backs} onChange={set("backs")} placeholder="Chapter 1 step 1.4; Leak Lab" maxLength={500} />
      </label>
      <label>
        Last checked on
        <input value={form.checked_on || ""} onChange={set("checked_on")} type="date" />
      </label>
    </>
  );
}

export default function AdminSources() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = searchParams.get("module") || "";
  const [sources, setSources] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [notice, setNotice] = useState(null); // { ok, message }
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(() => emptyForm(filter && filter !== GENERAL ? filter : ""));
  const [editing, setEditing] = useState(null); // { id, form }

  // Sources, plus every module of every course for the "Module" choice.
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getSources(),
      getAdminCourses().then((courses) =>
        Promise.all(
          (courses || []).map((c) =>
            getCourseModules(c.id)
              .then((mods) => (mods || []).map((m) => ({ ...m, course: c })))
              .catch(() => []) // a course with no modules yet
          )
        )
      ),
    ])
      .then(([rows, perCourse]) => {
        if (cancelled) return;
        setSources(rows || []);
        const all = perCourse
          .flat()
          .sort((a, b) => a.course.title.localeCompare(b.course.title) || (a.order_index || 0) - (b.order_index || 0))
          .map((m) => ({ id: m.id, label: `${m.course.title} · Module ${m.order_index ?? "?"}: ${m.title}` }));
        setModules(all);
      })
      .catch((err) => !cancelled && setNotice({ ok: false, message: readableError(err) }))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const moduleLabel = useMemo(() => Object.fromEntries(modules.map((m) => [m.id, m.label])), [modules]);
  const shown = sources.filter((s) => !filter || (filter === GENERAL ? !s.module_id : s.module_id === filter));
  const groups = [];
  shown.forEach((s) => {
    const key = s.module_id || GENERAL;
    let g = groups.find((x) => x.key === key);
    if (!g) {
      g = { key, title: s.module_id ? moduleLabel[s.module_id] || s.module_title || "Module" : "Not tied to a module", rows: [] };
      groups.push(g);
    }
    g.rows.push(s);
  });
  const recheckCount = sources.filter((s) => needsRecheck(s.checked_on)).length;

  const run = async (action, okMessage) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      setNotice({ ok: true, message: okMessage });
      setReloadKey((k) => k + 1);
      return true;
    } catch (err) {
      setNotice({ ok: false, message: readableError(err) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onAdd = async (e) => {
    e.preventDefault();
    if (await run(() => addSource(toPayload(form)), "Source added.")) setForm(emptyForm(form.module_id));
  };
  const onSave = async () => {
    if (await run(() => editSource(editing.id, toPayload(editing.form)), "Source updated.")) setEditing(null);
  };
  const onDelete = (s) => {
    if (window.confirm(`Delete this source?\n\n${s.label}`)) run(() => deleteSource(s.id), "Source deleted.");
  };
  const onFilter = (value) => {
    setSearchParams(value ? { module: value } : {});
    if (value && value !== GENERAL) setForm((f) => ({ ...f, module_id: value }));
  };

  return (
    <main className="af-page">
      <div className="af-page-head">
        <div>
          <h1>Content sources</h1>
          <div className="af-hint">
            The links behind the facts and numbers in course content — rates, dates, rules. Only admins see this page; learners never do.
            Unlike cards, sources can be edited after a course is published.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="af-btn" to="/admin/courses">
            ← Courses
          </Link>
        </div>
      </div>

      {notice && <div className={notice.ok ? "af-ok" : "af-error"}>{notice.message}</div>}
      {recheckCount > 0 && (
        <div className="af-warn">
          {recheckCount} source{recheckCount === 1 ? "" : "s"} not checked in the last 6 months — open the link, confirm it still says the same, then update
          “Last checked on”.
        </div>
      )}

      <form onSubmit={onAdd}>
        <fieldset className="af-section">
          <legend>Add a source</legend>
          <SourceFields form={form} setForm={setForm} modules={modules} />
          <button className="af-btn af-btn--primary" type="submit" disabled={busy || !form.label.trim() || !form.url.trim()}>
            Add source
          </button>
        </fieldset>
      </form>

      <div className="af-section">
        <label>
          Show
          <select value={filter} onChange={(e) => onFilter(e.target.value)}>
            <option value="">All modules</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
            <option value={GENERAL}>Not tied to a module</option>
          </select>
        </label>
      </div>

      {loading && <div className="af-hint">Loading…</div>}
      {!loading && groups.length === 0 && <div className="af-hint">No sources here yet.</div>}

      {groups.map((g) => (
        <fieldset key={g.key} className="af-section">
          <legend>{g.title}</legend>
          <table className="af-table">
            <thead>
              <tr>
                <th>Fact and source</th>
                <th>Link</th>
                <th>Last checked</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((s) =>
                editing?.id === s.id ? (
                  <tr key={s.id}>
                    <td colSpan={4}>
                      <div className="af-section">
                        <SourceFields form={editing.form} setForm={(f) => setEditing({ ...editing, form: f })} modules={modules} />
                        <div className="af-table-actions">
                          <button type="button" className="af-btn af-btn--primary" disabled={busy} onClick={onSave}>
                            Save
                          </button>
                          <button type="button" className="af-btn" onClick={() => setEditing(null)}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={s.id}>
                    <td>
                      <strong>{s.label}</strong>
                      {s.backs && <div className="af-hint">Used in: {s.backs}</div>}
                    </td>
                    <td style={{ wordBreak: "break-all" }}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer">
                        {s.url}
                      </a>
                    </td>
                    <td>
                      {s.checked_on || "—"}
                      {needsRecheck(s.checked_on) && (
                        <div>
                          <span className="af-badge af-badge--draft">re-check</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="af-table-actions">
                        <button
                          type="button"
                          className="af-btn"
                          disabled={busy}
                          onClick={() =>
                            setEditing({
                              id: s.id,
                              form: { module_id: s.module_id || "", label: s.label, url: s.url, backs: s.backs || "", checked_on: s.checked_on || "" },
                            })
                          }
                        >
                          Edit
                        </button>
                        <button type="button" className="af-btn af-btn--danger" disabled={busy} onClick={() => onDelete(s)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </fieldset>
      ))}
    </main>
  );
}
