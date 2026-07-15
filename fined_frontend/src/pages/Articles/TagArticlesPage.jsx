import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArticleReader from "../../components/ArticleReader";
import { fetchArticles } from "../../services/api";
import RevealOnScroll from "../../components/RevealOnScroll";
import Lenis from 'lenis';

const ARTICLES_PER_PAGE = 30;

const CATEGORIES = ["Personal Finance", "IPO", "Investing", "Deep Dives", "Economy"];

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const generateSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

function TagArticlesPage() {
  const { tag, slug } = useParams(); // URL params: /tags/:tag or /tags/:tag/:slug
  const toTitleCase = (str) => str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  const displayTag = CATEGORIES.find(c => generateSlug(c) === tag?.toLowerCase()) || (tag ? toTitleCase(tag) : "");
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingArticle, setFetchingArticle] = useState(false);
  const [error, setError] = useState("");
  const loaderRef = useRef(null);
  const loadingRef = useRef(false);

  useEffect(() => {
    const lenis = new Lenis()
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => {
      lenis.destroy()
    }
  }, [])

  const loadArticles = async (nextOffset = 0, append = false) => {
    if (loadingRef.current || (!hasMore && append)) return;
    loadingRef.current = true;
    setFetchingArticle(true);
    setError("");
    try {
      const data = await fetchArticles({ limit: ARTICLES_PER_PAGE, offset: nextOffset, tag: displayTag });
      const incoming = Array.isArray(data) ? data : data.articles || [];
      setArticles((prev) => (append ? [...prev, ...incoming] : incoming));
      setOffset(nextOffset + incoming.length);
      setHasMore(incoming.length === ARTICLES_PER_PAGE);
    } catch (err) {
      setError(err.message || "Failed to load articles.");
    } finally {
      loadingRef.current = false;
      setFetchingArticle(false);
    }
  };

  // When tag changes, reset and load
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setArticles([]);
    setOffset(0);
    setHasMore(true);
    loadArticles(0, false);
  }, [tag]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingRef.current && hasMore) {
          loadArticles(offset, true);
        }
      },
      { threshold: 1 }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [articles, hasMore, offset, tag]);

  // Lock body scroll when article open
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = "hidden";
      document.title = `${selectedArticle.title} | FinEd`;
      window.dispatchEvent(new CustomEvent("articleReaderOpen"));
    } else {
      document.body.style.overflow = "";
      document.title = `Articles tagged "${displayTag}" | FinEd`;
      window.dispatchEvent(new CustomEvent("articleReaderClose"));
    }
    return () => { 
      document.body.style.overflow = ""; 
      document.title = "FinEd";
    };
  }, [selectedArticle, tag]);

  const openArticle = (article) => {
    if (!article) return;
    navigate(`/tags/${tag}/${generateSlug(article.title)}`);
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    navigate(`/tags/${tag}`);
  };

  useEffect(() => {
    if (slug && articles.length > 0) {
      const article = articles.find(a => generateSlug(a.title) === slug);
      if (article && (!selectedArticle || generateSlug(selectedArticle.title) !== slug)) {
        setSelectedArticle(article);
      }
    } else if (!slug && selectedArticle) {
      setSelectedArticle(null);
    }
  }, [slug, articles]);

  const selectedIndex = selectedArticle
    ? articles.findIndex((a) => a.id === selectedArticle.id)
    : -1;

  return (
    <div className="ap-root">
      <RevealOnScroll>
        <div className="ap-hero-strip">
          <h1 className="ap-headline">Tag: {displayTag}</h1>
          <p className="ap-sub">Articles tagged with {displayTag}.</p>
        </div>
      </RevealOnScroll>

      {error && <div className="ap-error">{error}</div>}

      <div className="ap-explore-section" style={{ marginTop: '40px' }}>
        <div className="ap-articles-grid" style={{ width: 'min(1180px, calc(100% - 32px))', margin: '0 auto' }}>
          {articles.map((article, idx) => (
            <RevealOnScroll key={article.id} delay={100 + (idx % 4) * 50}>
              <div
                className="ap-grid-card"
                onClick={() => openArticle(article)}
              >
                <div className="ap-grid-card-img-wrap">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="ap-grid-card-img"
                    />
                  ) : (
                    <div className="ap-grid-card-img-placeholder" />
                  )}
                </div>
                <div className="ap-grid-card-content">
                  <span 
                    className="ap-grid-category"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (article.tag) navigate(`/tags/${generateSlug(article.tag)}`);
                    }}
                  >
                    {article.tag?.toUpperCase()}
                  </span>
                  <h3 className="ap-grid-title">{article.title}</h3>
                  <p className="ap-grid-excerpt" style={{ flexGrow: 1 }}>
                    {article.description || ""}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
                    <span>{formatDate(article.created_at)}</span>
                    {article.authors ? (
                      <span 
                        style={{ cursor: 'pointer', color: '#10b981' }} 
                        onClick={(e) => { e.stopPropagation(); navigate(`/authors/${article.authors.slug}`); }}
                      >
                        By {article.authors.name}
                      </span>
                    ) : (
                      <span>By {article.author || "Shravan Mutha"}</span>
                    )}
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>

        <div ref={loaderRef} className="ap-sentinel" />

        {fetchingArticle && (
          <p className="ap-loading-more" style={{ textAlign: 'center', marginTop: '20px' }}>Loading more articles...</p>
        )}
      </div>

      {selectedArticle && (
        <ArticleReader
          article={selectedArticle}
          onClose={closeArticle}
          isLoadingMore={fetchingArticle && selectedIndex === articles.length - 1}
          footer={
            <div className="ap-reader-footer">
              <button
                className={`ap-nav-btn ${selectedIndex <= 0 ? "" : "active"}`}
                onClick={() => {
                  if (selectedIndex > 0) openArticle(articles[selectedIndex - 1]);
                }}
                disabled={selectedIndex <= 0}
              >
                ← Previous
              </button>
              <button
                className={`ap-nav-btn ${(!hasMore && selectedIndex >= articles.length - 1) ? "" : "active"}`}
                onClick={() => {
                  const next = articles[selectedIndex + 1];
                  if (next) {
                    openArticle(next);
                  } else if (hasMore) {
                    loadArticles(offset, true);
                  }
                }}
                disabled={!hasMore && selectedIndex >= articles.length - 1}
              >
                Next →
              </button>
            </div>
          }
        />
      )}
    </div>
  );
}

export default TagArticlesPage;
