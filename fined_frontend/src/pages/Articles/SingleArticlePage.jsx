import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArticleReader from "../../components/ArticleReader";
import { fetchArticleBySlug, fetchAdjacentArticles } from "../../services/api";
import { ETF_DEMO_ARTICLE } from "../../lib/demoArticle";
import NotFoundPage from "../NotFound/NotFoundPage";

function SingleArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [adjacent, setAdjacent] = useState({ previous: null, next: null });

  const notFound = !loading && (error || !article);

  // The reader is a full-screen overlay; the 404 page needs normal scrolling
  useEffect(() => {
    if (notFound) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [notFound]);

  useEffect(() => {
    async function loadArticle() {
      if (slug === "understanding-etfs-exchange-traded-funds" || slug === "etf-101-guide") {
        setArticle(ETF_DEMO_ARTICLE);
        setLoading(false);
        return;
      }

      try {
        setError("");
        setLoading(true);
        const data = await fetchArticleBySlug(slug);
        setArticle(data);
        setLoading(false); // Stop loading immediately for the main article
        
        // Fetch adjacent silently in the background
        fetchAdjacentArticles(slug).then(adjData => {
          setAdjacent(adjData);
        }).catch(console.error);
      } catch (err) {
        // If article not found in DB, check if it's the demo article before redirecting
        if (slug.includes("etf")) {
          setArticle(ETF_DEMO_ARTICLE);
          setLoading(false);
        } else {
          setError("Article not found.");
          setLoading(false);
        }
      }
    }
    if (slug) {
      loadArticle();
    }
  }, [slug]);

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
    return <NotFoundPage />;
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
