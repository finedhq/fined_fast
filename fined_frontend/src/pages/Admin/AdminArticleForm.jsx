import { useState, useEffect } from "react";
import { postArticle, fetchAuthors } from "../../services/api";
import { useNavigate } from "react-router-dom";

function AdminArticleForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    slug: "",
    content: "",
    description: "",
    seo_title: "",
    meta_description: "",
    tag: "Deep Dives",
    author_id: ""
  });
  const [authors, setAuthors] = useState([]);
  const [imageFile, setImageFile] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const ARTICLE_TAGS = [
    "Personal Finance",
    "IPO",
    "Investing",
    "Deep Dives",
    "Economy",
  ];

  useEffect(() => {
    fetchAuthors().then(setAuthors).catch(console.error);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setStatus("");

    const formData = new FormData();
    formData.append("title", form.title);
    if (form.slug) formData.append("slug", form.slug);
    formData.append("content", form.content);
    formData.append("description", form.description);
    if (form.seo_title) formData.append("seo_title", form.seo_title);
    if (form.meta_description) formData.append("meta_description", form.meta_description);
    formData.append("tag", form.tag);
    if (form.author_id) formData.append("author_id", form.author_id);
    if (imageFile) formData.append("image", imageFile);

    try {
      await postArticle(formData);
      setForm({
        title: "",
        slug: "",
        content: "",
        description: "",
        seo_title: "",
        meta_description: "",
        tag: "Deep Dives",
        author_id: form.author_id
      });
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
            Custom URL Slug (Optional)
            <input
              name="slug"
              value={form.slug}
              onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') }))}
              placeholder={form.title ? form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : "e.g., cryptocurrency-basics-guide"}
            />
            <span style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", display: "block" }}>
              Live URL: <code>/articles/{form.slug || (form.title ? form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') : "custom-slug")}</code>
            </span>
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
            Author (Optional)
            <select
              name="author_id"
              value={form.author_id}
              onChange={(event) => setForm((prev) => ({ ...prev, author_id: event.target.value }))}
            >
              <option value="">-- No Author (Fallback) --</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </label>

          <label>
            Custom Description (For article preview cards)
            <textarea
              name="description"
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Short 2-3 line description shown on article cards..."
              rows={2}
            />
          </label>

          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0", margin: "12px 0 20px 0" }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>
              🔍 SEO & Technical Meta Tags (Optional)
            </h3>
            
            <label style={{ marginBottom: "14px", display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Custom SEO Title (&lt;title&gt;)</span>
                <span style={{ fontSize: "11px", color: form.seo_title.length > 60 ? "#ef4444" : "#64748b" }}>
                  {form.seo_title.length}/60 chars (Recommended: 40–60)
                </span>
              </div>
              <input
                name="seo_title"
                value={form.seo_title}
                onChange={(event) => setForm((prev) => ({ ...prev, seo_title: event.target.value }))}
                placeholder={form.title || "e.g., How Visa Makes Money: Four-Party Model Explained | FinEd"}
              />
            </label>

            <label style={{ display: "block", margin: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Meta Description (&lt;meta name="description"&gt; &amp; Social Snippet)</span>
                <span style={{ fontSize: "11px", color: form.meta_description.length > 160 ? "#ef4444" : "#64748b" }}>
                  {form.meta_description.length}/160 chars (Recommended: 140–160)
                </span>
              </div>
              <textarea
                name="meta_description"
                value={form.meta_description}
                onChange={(event) => setForm((prev) => ({ ...prev, meta_description: event.target.value }))}
                placeholder={form.description || "Compelling search snippet including primary keyword naturally..."}
                rows={3}
              />
            </label>
          </div>

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
