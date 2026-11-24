import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ArticleReader from "../../components/ArticleReader";
import { fetchArticleBySlug, fetchAdjacentArticles, getCachedArticle, prefetchArticle } from "../../services/api";
import { ETF_DEMO_ARTICLE } from "../../lib/demoArticle";
import NotFoundPage from "../NotFound/NotFoundPage";
import { ArticleReadBonus } from "../WinterArc/CrossSell";

function isEtfDemo(slug) {
  return slug === "understanding-etfs-exchange-traded-funds" || slug === "etf-101-guide";
}

function SingleArticlePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  // Instant synchronous cache resolution to prevent flicker on back/forward
  const initialArticle = isEtfDemo(slug) ? ETF_DEMO_ARTICLE : getCachedArticle(slug);
  const [article, setArticle] = useState(initialArticle);
  const [loading, setLoading] = useState(!initialArticle);
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
    let isCurrent = true;

    async function loadArticle() {
      if (isEtfDemo(slug)) {
        setArticle(ETF_DEMO_ARTICLE);
        setLoading(false);
        setError("");
        return;
      }

      // 1. Check synchronous cache first: if already loaded, show instantly (0ms)
      const cached = getCachedArticle(slug);
      if (cached) {
        setArticle(cached);
        setLoading(false);
        setError("");
      } else {
        // Only show skeleton if we have NO cached version at all
        setLoading(true);
        setError("");
      }

      try {
        const data = await fetchArticleBySlug(slug);
        if (!isCurrent) return;
        setArticle(data);
        setLoading(false);
        
        // Silently fetch and prefetch adjacent articles for instant next/prev transitions
        fetchAdjacentArticles(slug).then(adjData => {
          if (!isCurrent) return;
          setAdjacent(adjData || { previous: null, next: null });
          if (adjData?.previous?.slug) prefetchArticle(adjData.previous.slug);
          if (adjData?.next?.slug) prefetchArticle(adjData.next.slug);
        }).catch(console.error);
      } catch {
        if (!isCurrent) return;
        if (!cached) {
          if (slug && slug.includes("etf")) {
            setArticle(ETF_DEMO_ARTICLE);
            setLoading(false);
          } else {
            setError("Article not found.");
            setLoading(false);
          }
        }
      }
    }

    if (slug) {
      loadArticle();
    }

    return () => {
      isCurrent = false;
    };
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
            <ArticleReadBonus key={slug} slug={slug} />
            {/* Real links when there is somewhere to go, so search engines can follow them */}
            {adjacent.previous ? (
              <Link className="ap-nav-btn active" to={`/articles/${adjacent.previous.slug}`}>
                ← Previous
              </Link>
            ) : (
              <button type="button" className="ap-nav-btn" disabled>
                ← Previous
              </button>
            )}
            {adjacent.next ? (
              <Link className="ap-nav-btn active" to={`/articles/${adjacent.next.slug}`}>
                Next →
              </Link>
            ) : (
              <button type="button" className="ap-nav-btn" disabled>
                Next →
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}

export default SingleArticlePage;
