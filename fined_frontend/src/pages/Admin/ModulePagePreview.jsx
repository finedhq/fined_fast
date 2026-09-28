// Admin: the whole module drawn as learners will see it (the v2 one-page
// module), straight from the module's current cards — draft or not. Nothing is
// saved and the page starts empty each time. `?part=<card slug>` opens at that
// part. The back arrow and "Close preview" return to the module's card list.
import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { getCourseModules, getModuleCards } from "../../services/api";
import "./CardFields/authoring.css";

const ScrollyModulePage = lazy(() => import("../../components/scrolly/ScrollyModulePage"));

export default function ModulePagePreview() {
  const { courseId, moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState("");
  const cardsPage = `/admin/courses/${courseId}/modules/${moduleId}/cards`;

  useEffect(() => {
    let cancelled = false;
    Promise.all([getCourseModules(courseId), getModuleCards(moduleId)])
      .then(([modules, cards]) => {
        if (cancelled) return;
        const mod = (modules || []).find((m) => m.id === moduleId) || {};
        setBundle({
          module_id: `preview:${moduleId}`,
          module_title: mod.title || "Module",
          module_order_index: mod.order_index,
          cards: (cards || []).map((c) => ({ ...c, status: "incompleted", userAnswer: null })),
          nextModuleFirstCard: null,
        });
      })
      .catch((err) => !cancelled && setError(err.message || "Failed to load this module."));
    return () => {
      cancelled = true;
    };
  }, [courseId, moduleId]);

  if (error) {
    return (
      <main className="af-page">
        <div className="af-error">{error}</div>
        <Link className="af-btn" to={cardsPage}>
          ← Back to the cards
        </Link>
      </main>
    );
  }
  if (!bundle) return <main className="af-page">Loading preview…</main>;

  return (
    <>
      <Suspense fallback={null}>
        <ScrollyModulePage bundle={bundle} focusSlug={searchParams.get("part")} preview backTo={cardsPage} />
      </Suspense>
      <div className="af-page-preview-pill" role="status">
        Admin preview — nothing is saved
        <Link to={cardsPage}>Close preview</Link>
      </div>
    </>
  );
}
