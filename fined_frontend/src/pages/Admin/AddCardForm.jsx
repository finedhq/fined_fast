import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { addCard } from "../../services/api";
import CardEditor from "./CardEditor";

// New card types: add a Fields component + one entry in CardFields/registry.js.
function AddCardForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const moduleId = params.get("moduleId") || "";
  const courseId = params.get("courseId") || "";
  const nextOrder = Number(params.get("order")) || 1;
  const cardListLink = courseId && moduleId ? `/admin/courses/${courseId}/modules/${moduleId}/cards` : null;

  const handleSubmit = async ({ moduleId: mid, orderIndex, title, slug, cardType, cardData }) => {
    const saved = await addCard({
      module_id: mid,
      order_index: orderIndex,
      card_type: cardType,
      title,
      ...(slug ? { slug } : {}),
      card_data: cardData,
    });
    return `Card added (slug: ${saved.slug}). The form is ready for the next card.`;
  };

  return (
    <main className="admin-form-page">
      <section className="admin-form-card">
        <div className="form-heading">
          <h1>Add Card</h1>
          {cardListLink ? (
            <Link to={cardListLink}>← Back to the module's cards</Link>
          ) : (
            <button onClick={() => navigate("/admin")}>Back to Dashboard</button>
          )}
        </div>

        <CardEditor
          mode="add"
          initial={{ moduleId, orderIndex: nextOrder, cardType: "narrative" }}
          onSubmit={handleSubmit}
          submitLabel="Add Card"
        />
      </section>
    </main>
  );
}

export default AddCardForm;
