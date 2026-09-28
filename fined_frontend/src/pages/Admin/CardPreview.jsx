// Admin preview of one card inside the learner's card frame. Nothing is saved:
// Continue only shows what the card would report.
import { lazy, Suspense, useEffect, useState } from "react";
import CardRenderer from "../CoursesPage/CardViewer/CardRenderer";
import "../CoursesPage/CardViewer/CardViewer.css";
import { NEW_CARD_TYPES } from "./CardFields/registry";
import "./CardFields/authoring.css";

// New-type cards (hero / chapter / tool) are drawn as the real part of the
// one-page module, from the form's current values — the same component
// learners get, with saving switched off.
const ScrollyModulePage = lazy(() => import("../../components/scrolly/ScrollyModulePage"));

function PagePart({ template, title, data }) {
  const bundle = {
    module_id: "preview:card",
    module_title: title,
    cards: [{ card_id: "preview", slug: "preview", title, card_template: template, card_data: { ...data, card_type: template }, order_index: 1 }],
  };
  return (
    <Suspense fallback={<div className="af-hint">Loading preview…</div>}>
      <ScrollyModulePage bundle={bundle} preview embedded />
    </Suspense>
  );
}

export default function CardPreview({ template, title, data, onClose }) {
  const [continued, setContinued] = useState(null);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const isNew = NEW_CARD_TYPES.includes(template);
  const card = {
    card_id: "preview",
    slug: "preview",
    title,
    card_template: template,
    card_data: { ...data, card_type: template },
    status: "incompleted",
    userAnswer: null,
    order_index: 1,
    module_total_cards: 1,
    module_progress: 1,
    isFirstCardInModule: true,
    isLastCardInModule: true,
  };

  return (
    <div className="af-preview-backdrop" role="dialog" aria-modal="true" aria-label="Card preview" onClick={onClose}>
      <div className={`af-preview-frame${isNew ? " af-preview-frame--page" : ""}`} onClick={(e) => e.stopPropagation()}>
        <div className="af-preview-bar">
          <span>Preview — nothing is saved{isNew ? " (as this part looks on the module page)" : ""}</span>
          <button type="button" className="af-btn" onClick={onClose}>
            Close preview
          </button>
        </div>
        {continued && (
          <div className="af-ok">
            Continue pressed — answer: {String(continued.answer ?? "none")}, FinStars the card reports: {continued.stars ?? 0}
          </div>
        )}
        {isNew ? (
          <PagePart template={template} title={title} data={data} />
        ) : (
          <div className="cv-main-container" style={{ maxWidth: "none" }}>
            <div className="cv-card-box">
              <CardRenderer card={card} onContinue={(answer, stars) => setContinued({ answer, stars })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
