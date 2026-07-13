import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArticleReader from "../../components/ArticleReader";
import { fetchAuthorDetails } from "../../services/api";
import RevealOnScroll from "../../components/RevealOnScroll";
import Lenis from 'lenis';

const generateSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function AuthorPage() {
  const { slug, articleSlug } = useParams(); // /authors/:slug or /authors/:slug/:articleSlug
  const navigate = useNavigate();
  
  const [author, setAuthor] = useState(null);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setFetching(true);
    setError("");
    fetchAuthorDetails(slug)
      .then((data) => {
        setAuthor(data.author);
        setArticles(data.articles || []);
      })
      .catch((err) => setError(err.message || "Failed to load author profile."))
      .finally(() => setFetching(false));
  }, [slug]);

  // Lock body scroll when article open
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = "hidden";
      document.title = `${selectedArticle.title} | FinEd`;
      window.dispatchEvent(new CustomEvent("articleReaderOpen"));
    } else {
      document.body.style.overflow = "";
      if (author) {
        document.title = `${author.name} | FinEd`;
      }
      window.dispatchEvent(new CustomEvent("articleReaderClose"));
    }
    return () => { 
      document.body.style.overflow = ""; 
      document.title = "FinEd";
    };
  }, [selectedArticle, author]);

  useEffect(() => {
    if (articleSlug && articles.length > 0) {
      const article = articles.find(a => generateSlug(a.title) === articleSlug);
      if (article && (!selectedArticle || generateSlug(selectedArticle.title) !== articleSlug)) {
        setSelectedArticle(article);
      }
    } else if (!articleSlug && selectedArticle) {
      setSelectedArticle(null);
    }
  }, [articleSlug, articles]);

  const openArticle = (article) => {
    if (!article) return;
    navigate(`/authors/${slug}/${generateSlug(article.title)}`);
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    navigate(`/authors/${slug}`);
  };

  const selectedIndex = selectedArticle
    ? articles.findIndex((a) => a.id === selectedArticle.id)
    : -1;

  return (
    <div className="ap-root">
      <RevealOnScroll>
        <div className="ap-hero-strip" style={{ display: 'flex', alignItems: 'center', gap: '20px', textAlign: 'left' }}>
          {author?.image_url ? (
            <img 
              src={author.image_url} 
              alt={author?.name} 
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #333' }} 
            />
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', color: '#fff', border: '3px solid #333' }}>
              {author?.name?.charAt(0) || "A"}
            </div>
          )}
          <div>
            <h1 className="ap-headline" style={{ marginBottom: '8px' }}>{author?.name || "Loading..."}</h1>
            <p className="ap-sub" style={{ margin: 0, maxWidth: '600px', fontSize: '15px' }}>
              {author?.bio || "No bio available."}
            </p>
          </div>
        </div>
      </RevealOnScroll>

      {error && <div className="ap-error">{error}</div>}

      <div className="ap-explore-section" style={{ marginTop: '40px' }}>
        <h2 style={{ color: 'white', marginBottom: '20px', fontSize: '24px', fontWeight: '500', width: 'min(1180px, calc(100% - 32px))', margin: '0 auto 20px' }}>
          Articles by {author?.name}
        </h2>
        
        {fetching ? (
          <p className="ap-loading-more" style={{ textAlign: 'center', marginTop: '20px' }}>Loading articles...</p>
        ) : (
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
                      <span>By {author?.name}</span>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        )}
      </div>

      {selectedArticle && (
        <ArticleReader
          article={selectedArticle}
          onClose={closeArticle}
          isLoadingMore={false}
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
                className={`ap-nav-btn ${selectedIndex >= articles.length - 1 ? "" : "active"}`}
                onClick={() => {
                  const next = articles[selectedIndex + 1];
                  if (next) {
                    openArticle(next);
                  }
                }}
                disabled={selectedIndex >= articles.length - 1}
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

export default AuthorPage;
