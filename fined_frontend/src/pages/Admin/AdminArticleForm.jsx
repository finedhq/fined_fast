import { useState } from "react";
import { postArticle } from "../../services/api";
import { useNavigate } from "react-router-dom";

function AdminArticleForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: "", content: "", description: "", tag: "Finance" });
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const ARTICLE_TAGS = [
  "Finance",
  "IPO",
  "Economy",
  "Investing",
  "Banking",
  "Savings",
  "Stocks",
  "Markets",
  "Personal Finance",
  "Business",
];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("content", form.content);
    formData.append("description", form.description);
    formData.append("tag", form.tag);
    if (imageFile) formData.append("image", imageFile);

    try {
      await postArticle(formData);
      setForm({ title: "", content: "", description: "", tag: "Finance" });
      setImageFile(null);
      event.target.reset();
      setStatus("Article posted successfully.");
    } catch (err) {
      setStatus(err.message || "Failed to post article.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="admin-form-page">
      <section className="admin-form-card">
        <div className="form-heading">
          <h1>Add New Article</h1>
          <button onClick={() => navigate("/admin")}>Back to Dashboard</button>
        </div>

        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input
              name="title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="e.g., Basics of Cryptocurrency"
              required
            />
          </label>

          <label>
            Tag
            <select
              name="tag"
              value={form.tag}
              onChange={(event) => setForm((prev) => ({ ...prev, tag: event.target.value }))}
              required
            >
    {ARTICLE_TAGS.map((t) => (
      <option key={t} value={t}>{t}</option>
    ))}
  </select>
</label>

          <label>
            Custom Description (For article preview lists)
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Short description for preview (max 3 lines)..."
              rows={3}
            />
          </label>

          <label>
            Content
            <div className="editor-toolbar" aria-hidden="true">
              <span>↶</span><span>↷</span><span>H⌄</span><span>≡⌄</span><span>▣</span>
              <span>B</span><span>I</span><span>S</span><span>&lt;/&gt;</span><span>U</span>
              <span>⌁</span><span>🔗</span><span>x²</span><span>x₂</span><span>≡</span>
            </div>
            <textarea
              name="content"
              value={form.content}
              onChange={(event) => setForm((prev) => ({ ...prev, content: event.target.value }))}
              placeholder="Write your article here..."
              rows={10}
              required
            />
          </label>

          <label>
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setImageFile(event.target.files?.[0] || null)}
            />
          </label>

          <button className="primary-btn" type="submit" disabled={saving}>
            {saving ? "Posting..." : "Post Article"}
          </button>
        </form>

        {status && <p className="form-status">{status}</p>}
      </section>
    </main>
  );
}

export default AdminArticleForm;
