import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchArticles } from "../../services/api";
import RevealOnScroll from "../../components/RevealOnScroll";
import Lenis from 'lenis';
import { ETF_DEMO_ARTICLE } from "../../lib/demoArticle";
import { 
  IoSparkles, 
  IoSearchOutline, 
  IoCloseCircleOutline,
  IoArrowForward,
  IoArrowBack,
  IoCheckmarkCircle
} from "react-icons/io5";
import { hasAiLens } from "../../utils/textFormatters";
import "./ArticlesPage.css";

const ARTICLES_PER_PAGE = 9;

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

const CATEGORIES = ["All", "Deep Dives", "Personal Finance", "IPO", "Economy", "Investing"];

function ArticlesPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [fetchingArticle, setFetchingArticle] = useState(false);
  const [error, setError] = useState("");
  const exploreSectionRef = useRef(null);

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);

  const loadArticles = async () => {
    setFetchingArticle(true);
    setError("");
    try {
      let incoming = [];
      try {
        const data = await fetchArticles({ limit: 100, offset: 0 });
        incoming = Array.isArray(data) ? data : data.articles || [];
      } catch (err) {
        console.warn("Could not fetch articles from server, using local fallback", err);
      }

      // Ensure ETF demo article is available as fallback or appended
      if (incoming.length === 0) {
        incoming = [ETF_DEMO_ARTICLE];
      } else if (!incoming.some((a) => (a.slug || "").includes("etf") || (a.title || "").toLowerCase().includes("etf"))) {
        incoming = [...incoming, ETF_DEMO_ARTICLE];
      }

      setArticles(incoming);
    } catch (err) {
      setError(err.message || "Failed to load articles.");
    } finally {
      setFetchingArticle(false);
    }
  };

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    loadArticles();
  }, []);

  // Reset page to 1 whenever category or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory, searchQuery]);

  const openArticle = (article) => {
    if (!article) return;
    const targetSlug = article.slug || generateSlug(article.title);
    navigate(`/articles/${targetSlug}`);
  };

  // Dynamic counts per category
  const categoryCounts = useMemo(() => {
    const counts = { All: articles.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = articles.filter((a) => (a.tag || "").toLowerCase() === cat.toLowerCase()).length;
      }
    });
    return counts;
  }, [articles]);

  // Filtered articles list based on active category & search query
  const filteredArticles = useMemo(() => {
    let result = articles;
    if (activeCategory !== "All") {
      result = result.filter(
        (a) => (a.tag || "").toLowerCase() === activeCategory.toLowerCase()
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(q) ||
          (a.description || "").toLowerCase().includes(q) ||
          (a.tag || "").toLowerCase().includes(q) ||
          (a.author || "").toLowerCase().includes(q) ||
          (a.authors?.name || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [articles, activeCategory, searchQuery]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE));
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(start, start + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    if (exploreSectionRef.current) {
      exploreSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Lead featured story and trending top picks
  const leadArticle = articles[0] || ETF_DEMO_ARTICLE;
  const trendingArticles = articles.slice(1, 5);

  return (
    <div className="ap-root">

      {/* ── PUBLICATION MASTHEAD & SEARCH BAR ── */}
      <section className="ap-masthead-section">
        <div className="ap-container">
          <RevealOnScroll>
            <div className="ap-masthead-header">
              <div className="ap-masthead-text">
                <span className="ap-eyebrow-tag">FINANCIAL KNOWLEDGE HUB</span>
                <h1 className="ap-main-title">Articles & Insights</h1>
                <p className="ap-main-subtitle">
                  Clear, research-backed financial explainers, deep dives, and market perspectives.
                </p>
              </div>

              {/* Real-time search box */}
              <div className="ap-search-wrapper">
                <div className="ap-search-input-box">
                  <IoSearchOutline className="ap-search-icon" size={18} />
                  <input
                    type="text"
                    className="ap-search-input"
                    placeholder="Search articles or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search articles"
                  />
                  {searchQuery && (
                    <button
                      className="ap-search-clear"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      <IoCloseCircleOutline size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ── PERSONAL LENS SPOTLIGHT BANNER ── */}
      <section className="ap-spotlight-section">
        <div className="ap-container">
          <RevealOnScroll>
            <div className="ap-spotlight-banner">
              <div className="ap-spotlight-content">
                <div className="ap-spotlight-tag">
                  <IoSparkles size={11} color="#FFB600" />
                  <span>Personal Lens AI</span>
                </div>
                <h2 className="ap-spotlight-title">
                  FinEd Personal Lens — Your AI Pre-Reading Coach
                </h2>
                <p className="ap-spotlight-desc">
                  Answer 4 quick questions (~20s) inside any article to get personalized analogies, priority sections, and plain-English takeaways tailored to your experience level.
                </p>
              </div>
              <button
                onClick={() => openArticle(leadArticle)}
                className="ap-spotlight-btn"
              >
                <span>Try on Latest Article</span>
                <IoArrowForward size={14} />
              </button>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {error && (
        <div className="ap-container">
          <div className="ap-error">{error}</div>
        </div>
      )}

      {/* Loading Skeletons */}
      {articles.length === 0 && fetchingArticle && (
        <div className="ap-container">
          <div className="ap-skeleton-hero">
            <div className="ap-skeleton-featured" />
            <div className="ap-skeleton-list">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="ap-skeleton-row" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FEATURED HERO SECTION ── */}
      {!searchQuery.trim() && articles.length > 0 && (
        <section className="ap-hero-section">
          <div className="ap-container">
            <div className="ap-hero-grid">

              {/* Lead Feature Story Column */}
              <div className="ap-lead-col">
                <div className="ap-section-label-row">
                  <span className="ap-section-kicker">FEATURE STORY</span>
                  <span className="ap-section-dot" />
                  <span className="ap-section-meta">Today's Top Pick</span>
                </div>

                <RevealOnScroll delay={100}>
                  <article
                    className="ap-lead-card"
                    onClick={() => openArticle(leadArticle)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && openArticle(leadArticle)}
                  >
                    <div className="ap-lead-img-wrap">
                      {leadArticle.image_url ? (
                        <img
                          src={leadArticle.image_url}
                          alt={leadArticle.title}
                          className="ap-lead-img"
                          loading="eager"
                        />
                      ) : (
                        <div className="ap-lead-img-placeholder" />
                      )}
                      {leadArticle.tag && (
                        <span
                          className="ap-floating-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/tags/${generateSlug(leadArticle.tag)}`);
                          }}
                        >
                          {leadArticle.tag.toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="ap-lead-body">
                      {hasAiLens(leadArticle) && (
                        <div className="ap-lead-badges">
                          <span className="ap-lens-pill">
                            <IoSparkles size={10} color="#FFB600" /> AI Lens Ready
                          </span>
                        </div>
                      )}

                      <h2 className="ap-lead-title">{leadArticle.title}</h2>
                      <p className="ap-lead-excerpt">{leadArticle.description}</p>

                      {/* Footer: Date on Left, Author & Reviewer on Right */}
                      <div className="ap-lead-footer">
                        <span className="ap-date">
                          {formatDate(leadArticle.published_at || leadArticle.created_at)}
                        </span>

                        <div className="ap-lead-authors-col">
                          {leadArticle.authors ? (
                            <span
                              className="ap-author-name"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/authors/${leadArticle.authors.slug}`);
                              }}
                            >
                              By {leadArticle.authors.name}
                            </span>
                          ) : (
                            <span
                              className="ap-author-name"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/authors/shravan-mutha`);
                              }}
                            >
                              By {leadArticle.author || "Shravan Mutha"}
                            </span>
                          )}

                          {leadArticle.reviewer && (
                            <span
                              className="ap-reviewer-tag"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/authors/${leadArticle.reviewer.slug}`);
                              }}
                            >
                              <IoCheckmarkCircle size={12} color="#4100BC" />
                              <span>Reviewed by {leadArticle.reviewer.name}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                </RevealOnScroll>
              </div>

              {/* Trending Stories Side Column (140px 4:3 Image Thumbnails) */}
              <div className="ap-trending-col">
                <div className="ap-section-label-row">
                  <span className="ap-section-kicker">TRENDING</span>
                  <span className="ap-section-dot" />
                  <span className="ap-section-meta">Featured Articles</span>
                </div>

                <div className="ap-trending-stack">
                  {trendingArticles.map((article, idx) => (
                    <RevealOnScroll key={article.id} delay={150 + idx * 50}>
                      <article
                        className="ap-row"
                        onClick={() => openArticle(article)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && openArticle(article)}
                      >
                        <div className="ap-row-img-wrap">
                          {article.image_url ? (
                            <img
                              src={article.image_url}
                              alt={article.title}
                              className="ap-row-img"
                              loading="lazy"
                            />
                          ) : (
                            <div className="ap-row-img-placeholder" />
                          )}
                        </div>

                        <div className="ap-row-body">
                          <div className="ap-row-top-meta">
                            <div className="ap-row-tag-group">
                              {article.tag && (
                                <span
                                  className="ap-category-tag-link"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/tags/${generateSlug(article.tag)}`);
                                  }}
                                >
                                  {article.tag.toUpperCase()}
                                </span>
                              )}
                              {hasAiLens(article) && (
                                <span className="ap-lens-pill-mini">
                                  <IoSparkles size={9} color="#FFB600" /> Lens
                                </span>
                              )}
                            </div>
                            <span className="ap-row-date">
                              {formatDate(article.published_at || article.created_at)}
                            </span>
                          </div>

                          <h3 className="ap-row-title">{article.title}</h3>
                          
                          {article.description && (
                            <p className="ap-row-excerpt">{article.description}</p>
                          )}

                          <div className="ap-row-footer">
                            <span
                              className="ap-author-link"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (article.authors?.slug) {
                                  navigate(`/authors/${article.authors.slug}`);
                                } else {
                                  navigate(`/authors/shravan-mutha`);
                                }
                              }}
                            >
                              By {article.authors?.name || article.author || "Shravan Mutha"}
                            </span>
                          </div>
                        </div>
                      </article>
                    </RevealOnScroll>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
      )}

      {/* ── EXPLORE ARTICLES & CATEGORY FILTER SECTION ── */}
      <section className="ap-explore-section" ref={exploreSectionRef}>
        <div className="ap-container">
          
          <div className="ap-filter-header">
            <div className="ap-filter-title-group">
              <h2 className="ap-explore-heading">
                {searchQuery.trim() ? `Search Results (${filteredArticles.length})` : "Explore All Articles"}
              </h2>
              <p className="ap-explore-sub">
                {searchQuery.trim()
                  ? `Showing articles matching "${searchQuery}"`
                  : "Browse by financial category or dive into our full library."}
              </p>
            </div>

            {/* Category Filter Toggles (White active toggle) */}
            <div className="ap-filter-nav" role="tablist">
              {CATEGORIES.map((cat) => {
                const count = categoryCounts[cat] || 0;
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    role="tab"
                    aria-selected={isActive}
                    className={`ap-filter-btn ${isActive ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    <span>{cat}</span>
                    <span className="ap-btn-count">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Column Editorial Grid */}
          {paginatedArticles.length > 0 ? (
            <>
              <div className="ap-articles-grid">
                {paginatedArticles.map((article, idx) => (
                  <RevealOnScroll key={article.id} delay={100 + (idx % 3) * 60}>
                    <article
                      className="ap-grid-card"
                      onClick={() => openArticle(article)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && openArticle(article)}
                    >
                      {/* 4:3 Aspect Ratio Image Wrap */}
                      <div className="ap-grid-img-wrap">
                        {article.image_url ? (
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="ap-grid-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="ap-grid-img-placeholder" />
                        )}
                        {article.tag && (
                          <span
                            className="ap-grid-card-tag"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/tags/${generateSlug(article.tag)}`);
                            }}
                          >
                            {article.tag.toUpperCase()}
                          </span>
                        )}
                      </div>

                      <div className="ap-grid-card-content">
                        {hasAiLens(article) && (
                          <div className="ap-grid-card-top-meta">
                            <span className="ap-lens-pill-mini">
                              <IoSparkles size={9} color="#FFB600" /> AI Lens
                            </span>
                          </div>
                        )}

                        <h3 className="ap-grid-title">{article.title}</h3>
                        <p className="ap-grid-excerpt">{article.description}</p>

                        {/* Footer: Date on left, Author & Reviewer right aligned */}
                        <div className="ap-grid-footer">
                          <span className="ap-card-date">
                            {formatDate(article.published_at || article.created_at)}
                          </span>

                          <div className="ap-grid-authors-col">
                            {article.authors ? (
                              <span
                                className="ap-author-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/authors/${article.authors.slug}`);
                                }}
                              >
                                By {article.authors.name}
                              </span>
                            ) : (
                              <span
                                className="ap-author-link"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/authors/shravan-mutha`);
                                }}
                              >
                                By {article.author || "Shravan Mutha"}
                              </span>
                            )}

                            {article.reviewer && (
                              <span
                                className="ap-reviewer-pill"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/authors/${article.reviewer.slug}`);
                                }}
                              >
                                <IoCheckmarkCircle size={12} color="#4100BC" />
                                <span>Reviewed by {article.reviewer.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </RevealOnScroll>
                ))}
              </div>

              {/* ── PAGINATION CONTROLS ── */}
              {totalPages > 1 && (
                <div className="ap-pagination-container">
                  <div className="ap-pagination-info">
                    Showing {(currentPage - 1) * ARTICLES_PER_PAGE + 1}–
                    {Math.min(currentPage * ARTICLES_PER_PAGE, filteredArticles.length)} of {filteredArticles.length} articles
                  </div>

                  <div className="ap-pagination-bar">
                    <button
                      className="ap-page-nav-btn"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      aria-label="Previous Page"
                    >
                      <IoArrowBack size={15} />
                      <span>Previous</span>
                    </button>

                    <div className="ap-page-numbers">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              className={`ap-page-btn ${pageNum === currentPage ? "active" : ""}`}
                              onClick={() => handlePageChange(pageNum)}
                              aria-current={pageNum === currentPage ? "page" : undefined}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="ap-page-ellipsis">…</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      className="ap-page-nav-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      aria-label="Next Page"
                    >
                      <span>Next</span>
                      <IoArrowForward size={15} />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="ap-empty-state">
              <div className="ap-empty-icon">🔍</div>
              <h3 className="ap-empty-title">No articles found</h3>
              <p className="ap-empty-desc">
                We couldn't find any articles matching "{searchQuery}" in {activeCategory}.
              </p>
              <button
                className="ap-reset-btn"
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
              >
                Reset Filters
              </button>
            </div>
          )}

          {fetchingArticle && (
            <div className="ap-loading-wrap">
              <span className="ap-loading-pulse" />
              <p className="ap-loading-text">Loading research & articles...</p>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}

export default ArticlesPage;
