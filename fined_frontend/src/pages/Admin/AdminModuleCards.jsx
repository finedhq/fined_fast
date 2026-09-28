// Admin: every card of one module — check, preview, edit, reorder, delete,
// or import a whole module's cards from JSON. Changes are only possible while
// the course is a draft (the backend refuses otherwise).
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { addCard, deleteCard, editCard, getAdminCourses, getCourseModules, getModuleCards } from "../../services/api";
import { getCardFinstars } from "../../utils/finstars";
import { NEW_CARD_TYPES, cardTypeInfo } from "./CardFields/registry";
import CardPreview from "./CardPreview";
import { isScrollyModule } from "../../components/scrolly/templates";
import "./CardFields/authoring.css";

// Plain-English checks shown above the list (a lighter version of the
// pre-publish checklist in the integration plan).
function moduleChecks(cards) {
  const problems = [];
  if (cards.length === 0) return { problems: ["This module has no cards yet."], stars: 0 };

  const orders = cards.map((c) => c.order_index);
  const expected = cards.map((_, i) => i + 1);
  if (orders.join(",") !== expected.join(",")) {
    problems.push(`Card order should run 1, 2, 3 … ${cards.length} with no gaps or repeats (now: ${orders.join(", ")}). The progress bar uses it.`);
  }
  const completions = cards.filter((c) => c.card_template === "completion");
  if (completions.length !== 1) problems.push(`A module needs exactly one completion card (found ${completions.length}).`);
  else if (cards[cards.length - 1].card_template !== "completion") problems.push("The completion card should be the last card.");

  // Modules using the new types are drawn as one long page that starts with its hero.
  if (cards.some((c) => NEW_CARD_TYPES.includes(c.card_template))) {
    const heroes = cards.filter((c) => c.card_template === "hero");
    if (heroes.length !== 1) problems.push(`A module page needs exactly one Hero card (found ${heroes.length}).`);
    else if (cards[0].card_template !== "hero") problems.push("The Hero card should be the first card — it is the top of the module page.");
  }

  const unknown = cards.filter((c) => !cardTypeInfo(c.card_template));
  if (unknown.length) problems.push(`Unknown card type(s): ${unknown.map((c) => c.card_template).join(", ")}.`);

  const missingStars = cards.filter((c) => c.card_template !== "completion" && (c.card_data?.allotted_finstars ?? null) === null);
  if (missingStars.length) problems.push(`Stars not set explicitly on: ${missingStars.map((c) => c.title).join(", ")} (the site would fall back to a default).`);

  const stars = cards.reduce((sum, c) => sum + (c.card_template === "completion" ? 0 : getCardFinstars(c.card_data, c.card_template)), 0);
  return { problems, stars };
}

function StatusBadge({ status }) {
  const s = status || "published";
  return <span className={`af-badge af-badge--${s}`}>{s[0].toUpperCase() + s.slice(1)}</span>;
}

export default function AdminModuleCards() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState(null); // { ok, message }
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

  const load = useCallback(async () => {
    try {
      const [courses, modules, moduleCards] = await Promise.all([
        getAdminCourses(),
        getCourseModules(courseId),
        getModuleCards(moduleId),
      ]);
      setCourse((courses || []).find((c) => c.id === courseId) || null);
      setModule((modules || []).find((m) => m.id === moduleId) || null);
      setCards([...(moduleCards || [])].sort((a, b) => a.order_index - b.order_index));
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load this module.");
    } finally {
      setLoading(false);
    }
  }, [courseId, moduleId]);

  useEffect(() => {
    load();
  }, [load]);

  const isDraft = course?.status === "draft";
  const { problems, stars } = moduleChecks(cards);

  const run = async (action, okMessage) => {
    setBusy(true);
    setNotice(null);
    try {
      await action();
      if (okMessage) setNotice({ ok: true, message: okMessage });
    } catch (err) {
      setNotice({ ok: false, message: err.message || "Something went wrong." });
    } finally {
      await load();
      setBusy(false);
    }
  };

  // Swap positions with the neighbour, then renumber everything 1..N so gaps disappear.
  const move = (index, delta) =>
    run(async () => {
      const next = [...cards];
      const [card] = next.splice(index, 1);
      next.splice(index + delta, 0, card);
      for (let i = 0; i < next.length; i++) {
        if (next[i].order_index !== i + 1) await editCard(next[i].card_id, { order_index: i + 1 });
      }
    });

  const renumber = () =>
    run(async () => {
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].order_index !== i + 1) await editCard(cards[i].card_id, { order_index: i + 1 });
      }
    }, "Order fixed: cards now run 1 to " + cards.length + ".");

  const remove = (card) => {
    if (!window.confirm(`Delete “${card.title}”? This can't be undone.`)) return;
    run(() => deleteCard(card.card_id), `Deleted “${card.title}”.`);
  };

  const importModule = () =>
    run(async () => {
      let parsed;
      try {
        parsed = JSON.parse(importText);
      } catch {
        throw new Error("That isn't valid JSON.");
      }
      const list = Array.isArray(parsed) ? parsed : parsed?.cards;
      if (!Array.isArray(list) || list.length === 0) throw new Error('Paste a list of cards, or an object with a "cards" list.');
      let added = 0;
      for (const card of list) {
        try {
          await addCard({
            module_id: moduleId,
            order_index: card.order_index ?? cards.length + added + 1,
            card_type: card.card_type,
            title: card.title,
            ...(card.slug ? { slug: card.slug } : {}),
            card_data: { ...card.card_data, card_type: card.card_type },
          });
          added += 1;
        } catch (err) {
          throw new Error(`Stopped at card ${added + 1} (“${card.title || card.slug || "untitled"}”): ${err.message}\n${added} card(s) before it were added.`, { cause: err });
        }
      }
      setImportOpen(false);
      setImportText("");
      setNotice({ ok: true, message: `Imported ${added} card(s).` });
    });

  const addLink = `/admin/cards/add?moduleId=${moduleId}&courseId=${courseId}&order=${cards.length + 1}`;
  // A new-course module is one long page: preview it (or one part of it) as learners see it.
  const onePage = isScrollyModule(cards);
  const pagePreview = (slug) => `/admin/courses/${courseId}/modules/${moduleId}/preview${slug ? `?part=${encodeURIComponent(slug)}` : ""}`;

  return (
    <main className="af-page">
      <div className="af-page-head">
        <div>
          <div className="af-hint">
            {course ? (
              <>
                {course.title} <StatusBadge status={course.status} />
              </>
            ) : (
              "Course"
            )}
          </div>
          <h1>{module ? module.title : "Module"} — cards</h1>
          {module?.slug && (
            <div className="af-hint">
              Module slug: <code>{module.slug}</code>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="af-btn" to={`/admin/courses/${courseId}/modules`}>
            ← Modules
          </Link>
          {onePage && (
            <Link className="af-btn" to={pagePreview()}>
              Preview whole module page
            </Link>
          )}
          <Link className="af-btn" to={`/admin/sources?module=${moduleId}`}>
            Sources
          </Link>
          <button className="af-btn" type="button" disabled={!isDraft || busy} onClick={() => setImportOpen((v) => !v)}>
            {importOpen ? "Cancel import" : "Import module JSON"}
          </button>
          <button className="af-btn af-btn--primary" type="button" disabled={!isDraft || busy} onClick={() => navigate(addLink)}>
            + Add card
          </button>
        </div>
      </div>

      {error && <div className="af-error">{error}</div>}
      {course && !isDraft && (
        <div className="af-warn">
          This course is <strong>{course.status}</strong>, so its cards are read-only here. Cards can only be changed while a course is a draft.
        </div>
      )}
      {notice && <div className={notice.ok ? "af-ok" : "af-error"}>{notice.message}</div>}

      {importOpen && (
        <div className="af-section">
          <label>
            Paste the module's cards as JSON
            <textarea rows={12} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder='{ "cards": [ { "order_index": 1, "card_type": "cinematic", "title": "…", "slug": "v2-m1-…", "card_data": { … } }, … ] }' />
          </label>
          <div className="af-hint">Cards are added one by one in the order given. Each is checked by the server; import stops at the first problem and tells you which card.</div>
          <div>
            <button type="button" className="af-btn af-btn--primary" disabled={busy || !importText.trim()} onClick={importModule}>
              {busy ? "Importing…" : "Add these cards"}
            </button>
          </div>
        </div>
      )}

      {!loading && (
        <div className={problems.length ? "af-warn" : "af-ok"}>
          <strong>
            {cards.length} card(s) · {stars} FinStars in this module
          </strong>
          {problems.length === 0 ? (
            <div>Checks passed: order runs 1–{cards.length}, one completion card at the end, stars set on every card.</div>
          ) : (
            <ul style={{ margin: "6px 0 0 18px" }}>
              {problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          {problems.some((p) => p.startsWith("Card order")) && isDraft && (
            <div style={{ marginTop: 8 }}>
              <button type="button" className="af-btn" disabled={busy} onClick={renumber}>
                Fix order (renumber 1–{cards.length})
              </button>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : cards.length === 0 ? null : (
        <table className="af-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Admin label</th>
              <th>Slug</th>
              <th>Stars</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card, i) => (
              <tr key={card.card_id}>
                <td>{card.order_index}</td>
                <td>{cardTypeInfo(card.card_template)?.label || card.card_template}</td>
                <td>{card.title}</td>
                <td>
                  <code>{card.slug}</code>
                </td>
                <td>{card.card_template === "completion" ? "—" : getCardFinstars(card.card_data, card.card_template)}</td>
                <td>
                  <div className="af-table-actions">
                    <button type="button" className="af-btn" onClick={() => (onePage ? navigate(pagePreview(card.slug)) : setPreview(card))}>
                      Preview
                    </button>
                    <button
                      type="button"
                      className="af-btn"
                      disabled={!isDraft || busy}
                      onClick={() => navigate(`/admin/courses/${courseId}/modules/${moduleId}/cards/${card.card_id}/edit`)}
                    >
                      Edit
                    </button>
                    <button type="button" className="af-btn af-btn--icon" disabled={!isDraft || busy || i === 0} onClick={() => move(i, -1)} title="Move up">
                      ↑
                    </button>
                    <button type="button" className="af-btn af-btn--icon" disabled={!isDraft || busy || i === cards.length - 1} onClick={() => move(i, 1)} title="Move down">
                      ↓
                    </button>
                    <button type="button" className="af-btn af-btn--danger" disabled={!isDraft || busy} onClick={() => remove(card)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {preview && (
        <CardPreview template={preview.card_template} title={preview.title} data={preview.card_data || {}} onClose={() => setPreview(null)} />
      )}
    </main>
  );
}
