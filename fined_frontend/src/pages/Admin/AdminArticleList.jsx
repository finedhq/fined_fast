import { useEffect, useState } from "react";
import ArticleReader from "../../components/ArticleReader";
import { deleteArticle, fetchAdminArticles } from "../../services/api";
import { useNavigate } from "react-router-dom";

function AdminArticleList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all', 'published', 'scheduled', 'draft'

  const load = async (filter = activeFilter) => {
    setLoading(true);
    setStatus("");
    try {
      const data = await fetchAdminArticles({ limit: 100, offset: 0, status: filter });
      setArticles(Array.isArray(data) ? data : data.articles || []);
    } catch (err) {
      setStatus(err.message || "Failed to fetch articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(activeFilter);
  }, [activeFilter]);

  const handleDelete = async (event, id) => {
    event.stopPropagation();
    const confirmed = window.confirm("Delete this article?");
    if (!confirmed) return;
    try {
      await deleteArticle(id);
      setArticles((prev) => prev.filter((article) => article.id !== id));
      setStatus("Article deleted.");
    } catch (err) {
      setStatus(err.message || "Failed to delete article.");
    }
  };

  const formatScheduledDate = (isoStr) => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const filteredArticles = articles.filter((a) => {
    if (activeFilter === "all") return true;
    return (a.status || "published") === activeFilter;
  });

  return (
    <main className="admin-list-page">
      <div className="admin-list-head">
        <div>
          <h1>Articles Management</h1>
          <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
            View, schedule, and manage published and drafted educational articles.
          </p>
        </div>
        <div>
          <button className="primary-btn" style={{ padding: "8px 18px", fontSize: "15px" }} onClick={() => navigate("/admin/articles/add")}>
            ➕ Add New Article
          </button>
          <button className="admin-secondary-btn" onClick={() => navigate("/admin")}>
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-article-filter-bar">
        <div style={{ display: "flex", gap: "8px" }}>
          {[
            { id: "all", label: "All Articles" },
            { id: "published", label: "🟢 Published" },
            { id: "scheduled", label: "⏰ Scheduled" },
            { id: "draft", label: "📝 Drafts" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`admin-filter-tab-btn ${activeFilter === tab.id ? "active" : ""}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600" }}>
          Showing {filteredArticles.length} {activeFilter === "all" ? "" : activeFilter} articles
        </span>
      </div>

      {status && <p className="form-status">{status}</p>}
      {loading && <p className="status">Loading articles...</p>}
      {!loading && filteredArticles.length === 0 && (
        <div style={{ background: "#ffffff", padding: "40px", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", margin: "20px 0" }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: "16px" }}>No articles found in this category.</p>
        </div>
      )}

      <section className="admin-article-stack">
        {filteredArticles.map((article) => {
          const artStatus = article.status || "published";
          return (
            <div
              key={article.id}
              className="admin-article-card"
              onClick={() => setSelectedArticle(article)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ padding: "16px 20px 0 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#0ea5e9", letterSpacing: "0.5px" }}>
                    {article.tag || "Finance"}
                  </span>
                  
                  {/* Status Badge */}
                  {artStatus === "published" && (
                    <span style={{ fontSize: "11px", background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>
                      ● Published
                    </span>
                  )}
                  {artStatus === "scheduled" && (
                    <span style={{ fontSize: "11px", background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }} title={`Scheduled for ${article.scheduled_at}`}>
                      ⏰ {formatScheduledDate(article.scheduled_at) || "Scheduled"}
                    </span>
                  )}
                  {artStatus === "draft" && (
                    <span style={{ fontSize: "11px", background: "#f1f5f9", color: "#475569", padding: "2px 8px", borderRadius: "12px", fontWeight: "700" }}>
                      📝 Draft
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: "18px", lineHeight: "1.3", margin: "0 0 6px 0", color: "#0f172a" }}>
                  {article.title}
                </h2>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Rating: ★ {article.rating || 0}
                </span>
              </div>

              {article.image_url && (
                <div style={{ margin: "10px 0", maxHeight: "180px", overflow: "hidden" }}>
                  <img src={article.image_url} alt={article.title} style={{ width: "100%", height: "180px", objectFit: "cover" }} />
                </div>
              )}

              <div style={{ padding: "0 20px 20px 20px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <p style={{ fontSize: "13px", color: "#475569", lineClamp: 3, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden", margin: "0 0 16px 0" }}>
                  {article.description || article.content}
                </p>

                <div className="admin-card-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
                  <span style={{ fontSize: "13px", color: "#4338ca", fontWeight: "600" }}>Preview Article →</span>
                  <button
                    type="button"
                    onClick={(event) => handleDelete(event, article.id)}
                    style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#dc2626", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {selectedArticle && (
        <ArticleReader article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </main>
  );
}

export default AdminArticleList;

