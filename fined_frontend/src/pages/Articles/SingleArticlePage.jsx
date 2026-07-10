import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArticleReader from "../../components/ArticleReader";
import { fetchArticleBySlug, fetchAdjacentArticles } from "../../services/api";

function SingleArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjacent, setAdjacent] = useState({ previous: null, next: null });

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    async function loadArticle() {
      try {
        setLoading(true);
        const data = await fetchArticleBySlug(slug);
        setArticle(data);
        setLoading(false); // Stop loading immediately for the main article
        
        // Fetch adjacent silently in the background
        fetchAdjacentArticles(slug).then(adjData => {
          setAdjacent(adjData);
        }).catch(console.error);
      } catch (err) {
        setError("Article not found.");
        navigate("/articles", { replace: true });
      }
    }
    if (slug) {
      loadArticle();
    }
  }, [slug, navigate]);

  const closeArticle = () => {
    navigate("/articles");
  };

  if (loading) {
    return (
      <div className="ap-root" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="ap-skeleton-featured" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
      </div>
    );
  }

  if (error || !article) {
    return null; // the useEffect will redirect
  }

  return (
    <div className="ap-root">
      <ArticleReader
        article={article}
        onClose={closeArticle}
        footer={
          <div className="ap-reader-footer">
            <button
              className={`ap-nav-btn ${adjacent.previous ? "active" : ""}`}
              onClick={() => {
                if (adjacent.previous) navigate(`/articles/${adjacent.previous.slug}`);
              }}
              disabled={!adjacent.previous}
            >
              ← Previous
            </button>
            <button
              className={`ap-nav-btn ${adjacent.next ? "active" : ""}`}
              onClick={() => {
                if (adjacent.next) navigate(`/articles/${adjacent.next.slug}`);
              }}
              disabled={!adjacent.next}
            >
              Next →
            </button>
          </div>
        }
      />
    </div>
  );
}

export default SingleArticlePage;
