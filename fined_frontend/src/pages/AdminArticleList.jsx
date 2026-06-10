import { useEffect, useState } from "react";
import ArticleReader from "../components/ArticleReader";
import { deleteArticle, fetchArticles } from "../services/api";
import { useNavigate } from "react-router-dom";

function AdminArticleList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const load = async () => {
    setLoading(true);
    setStatus("");
    try {
      const data = await fetchArticles({ limit: 50, offset: 0 });
      setArticles(Array.isArray(data) ? data : data.articles || []);
    } catch (err) {
      setStatus(err.message || "Failed to fetch articles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  return (
    <main className="admin-list-page">
      <div className="admin-list-head">
        <h1>All Articles</h1>
        <div>
          <button onClick={() => navigate("/admin/articles/add")}>Add Article</button>
          <button onClick={() => navigate("/admin")}>Back to Dashboard</button>
        </div>
      </div>

      {status && <p className="form-status">{status}</p>}
      {loading && <p className="status">Loading articles...</p>}
      {!loading && articles.length === 0 && <p className="status">No articles found.</p>}

      <section className="admin-article-stack">
        {articles.map((article) => (
          <button
            key={article.id}
            className="admin-article-card"
            onClick={() => setSelectedArticle(article)}
          >
            <div>
              <h2>{article.title}</h2>
              <span>Rating: {article.rating || 0}</span>
            </div>
            {article.image_url && <img src={article.image_url} alt={article.title} />}
            <p>{article.content}</p>
            <div className="admin-card-actions">
              <span>View Full Article</span>
              <button onClick={(event) => handleDelete(event, article.id)}>Delete article</button>
            </div>
          </button>
        ))}
      </section>

      {selectedArticle && (
        <ArticleReader article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </main>
  );
}

export default AdminArticleList;
