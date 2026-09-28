import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { editCard, getModuleCards } from "../../services/api";
import CardEditor from "./CardEditor";

// Edits a card in place: it keeps its id, so recorded progress stays attached.
function EditCardForm() {
  const { courseId, moduleId, cardId } = useParams();
  const [card, setCard] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    getModuleCards(moduleId)
      .then((cards) => {
        if (cancelled) return;
        const found = (cards || []).find((c) => c.card_id === cardId);
        if (found) setCard(found);
        else setError("Card not found in this module.");
      })
      .catch((err) => !cancelled && setError(err.message || "Failed to load the card."));
    return () => {
      cancelled = true;
    };
  }, [moduleId, cardId]);

  const handleSubmit = async ({ orderIndex, title, slug, cardData }) => {
    const changes = { title, order_index: orderIndex, card_data: cardData };
    if (slug && slug !== card.slug) changes.slug = slug;
    const saved = await editCard(cardId, changes);
    setCard(saved);
    return "Saved. The card kept its id, so any recorded progress stays attached.";
  };

  const backLink = `/admin/courses/${courseId}/modules/${moduleId}/cards`;

  return (
    <main className="admin-form-page">
      <section className="admin-form-card">
        <div className="form-heading">
          <h1>Edit Card</h1>
          <Link to={backLink}>← Back to the module's cards</Link>
        </div>
        {error && <div className="af-error">{error}</div>}
        {!card && !error && <p>Loading…</p>}
        {card && (
          <CardEditor
            key={card.card_id}
            mode="edit"
            initial={{
              moduleId,
              orderIndex: card.order_index,
              title: card.title,
              slug: card.slug,
              cardType: card.card_template,
              cardData: card.card_data || {},
            }}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
          />
        )}
      </section>
    </main>
  );
}

export default EditCardForm;
