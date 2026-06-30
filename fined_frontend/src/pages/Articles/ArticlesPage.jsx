import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ArticleReader from "../../components/ArticleReader";
import { fetchArticles } from "../../services/api";

import RevealOnScroll from "../../components/RevealOnScroll";
import Lenis from 'lenis';

const ARTICLES_PER_PAGE = 30;

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


function ArticlesPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Finance", "IPO", "Economy", "Investing", "Banking", "Savings", "Stocks", "Markets", "Personal Finance", "Business"];
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingArticle, setFetchingArticle] = useState(false);
  const [error, setError] = useState("");
  const [pendingNext, setPendingNext] = useState(false);
  const [prefetching, setPrefetching] = useState(false);
  const carouselRef = useRef(null);
  const loaderRef = useRef(null);
  const loadingRef = useRef(false);

  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

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
      const limit = nextOffset === 0 ? 37 : ARTICLES_PER_PAGE;
      const data = await fetchArticles({ limit, offset: nextOffset });
      const incoming = Array.isArray(data) ? data : data.articles || [];
      setArticles((prev) => (append ? [...prev, ...incoming] : incoming));
      setOffset(nextOffset + incoming.length);
      setHasMore(incoming.length === limit);
    } catch (err) {
      setError(err.message || "Failed to load articles.");
    } finally {
      loadingRef.current = false;
      setFetchingArticle(false);
    }
  };

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    loadArticles(0, false);
  }, []);


  const checkScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 4);
    setCanScrollDown(el.scrollTop < el.scrollHeight - el.clientHeight - 4);
  };

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    checkScroll();
    return () => {
      el.removeEventListener("scroll", checkScroll);
      ro.disconnect();
    };
  }, [articles]);

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
  }, [articles, hasMore, offset]);

  // Lock body scroll when article open
  useEffect(() => {
    if (selectedArticle) {
      document.body.style.overflow = "hidden";
      document.title = `${selectedArticle.title} | FinEd`;
      window.dispatchEvent(new CustomEvent("articleReaderOpen"));
      const idx = articles.findIndex((a) => a.id === selectedArticle.id);
      const isLast = idx === articles.length - 1;
      if (isLast && hasMore && !prefetching) {
        setPrefetching(true);
        loadArticles(offset, true).then?.(() => setPrefetching(false));
      }
    } else {
      document.body.style.overflow = "";
      document.title = "Insights & Articles | FinEd";
      window.dispatchEvent(new CustomEvent("articleReaderClose"));
    }
    return () => { 
      document.body.style.overflow = ""; 
      document.title = "FinEd";
    };
  }, [selectedArticle]);

  useEffect(() => {
    if (pendingNext && !loadingRef.current) {
      const idx = articles.findIndex((a) => a.id === selectedArticle?.id);
      const next = articles[idx + 1];
      if (next) {
        openArticle(next);
        setPendingNext(false);
      }
    }
  }, [articles]);

  const selectedIndex = selectedArticle
    ? articles.findIndex((a) => a.id === selectedArticle.id)
    : -1;

  const openArticle = (article) => {
    if (!article) return;
    navigate(`/articles/${generateSlug(article.title)}`);
    setSelectedArticle(article);
  };

  const closeArticle = () => {
    setSelectedArticle(null);
    navigate(`/articles`);
  };

  // Sync URL path params with modal state for back button & deep linking support
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

  const scrollUp = () => {
    carouselRef.current?.scrollBy({ top: -300, behavior: "smooth" });
  };

  const scrollDown = () => {
    carouselRef.current?.scrollBy({ top: 300, behavior: "smooth" });
  };

  // Calculate filtered articles
  const exploreArticles = activeCategory === "All"
  ? articles
  : articles.filter(article => article.tag === activeCategory);

  return (
    <div className="ap-root">

      {/* HERO STRIP */}
      <RevealOnScroll>
        <div className="ap-hero-strip">
          <h1 className="ap-headline">Articles</h1>
          <p className="ap-sub">Fresh financial explainers, backed by real research.</p>
        </div>
      </RevealOnScroll>


      {error && <div className="ap-error">{error}</div>}

      {articles.length === 0 && fetchingArticle && (
        <div className="ap-skeleton-wrap">
          <div className="ap-skeleton-featured" />
          <div className="ap-skeleton-list">
            {[1, 2, 3, 4].map((i) => <div key={i} className="ap-skeleton-row" />)}
          </div>
        </div>
      )}

      {articles.length > 0 && (
        <>
          <div className="ap-body">
            {/* FEATURED CARD COLUMN */}
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
                Today's Article
              </h2>
              <RevealOnScroll delay={100}>
                <div
                  className="ap-featured"
                  onClick={() => openArticle(articles[0])}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && openArticle(articles[0])}
                >
                  <div className="ap-featured-img-wrap">
                    {articles[0]?.image_url ? (
                      <img
                        src={articles[0].image_url}
                        alt={articles[0].title}
                        className="ap-featured-img"
                        onLoad={checkScroll}
                      />
                    ) : (
                      <div className="ap-featured-img-placeholder" />
                    )}
                    
                  </div>
                  <div className="ap-featured-body">
                    <span className="ap-grid-category" style={{ marginBottom: '8px' }}>
                      {articles[0]?.tag?.toUpperCase()}
                    </span>
                    <h2 className="ap-featured-title">{articles[0]?.title || ""}</h2>
                    <p className="ap-featured-excerpt">
                      {articles[0]?.content?.slice(0, 160) || ""}
                      <span className="ap-ellipsis"> . . .</span>
                    </p>
                    <p className="ap-featured-date" style={{ marginTop: '16px' }}>{formatDate(articles[0]?.created_at)}</p>
                    <p className="ap-featured-date" style={{ marginTop: '4px' }}>
                      By {articles[0]?.author || "Unknown Author"}
                    </p>

                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* SCROLLABLE LIST */}
            <div className="ap-side-wrap">
              
              {/* New Right-Side Title with Arrows */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginLeft: "13px" }}>
                  Featured Articles
                </h2>
                
                {/* We override the absolute positioning of the arrows so they sit nicely next to the title */}
                <div className="ap-scroll-arrows" style={{ position: 'static' }}>
                  <button
                    className={`ap-arrow ${canScrollUp ? "active" : ""}`}
                    onClick={scrollUp}
                    disabled={!canScrollUp}
                    aria-label="Scroll up"
                  >❮</button>
                  <button
                    className={`ap-arrow ${canScrollDown ? "active" : ""}`}
                    onClick={scrollDown}
                    disabled={!canScrollDown}
                    aria-label="Scroll down"
                  >❯</button>
                </div>
              </div>

              {/* FIX: ADDED EXTRA <div> HERE SO REVEALONSCROLL DOESN'T STEAL CAROUSEL REF */}
              <RevealOnScroll delay={200}>
                <div>
                  <div className="ap-carousel" ref={carouselRef}>
                    {articles.slice(1).map((article, idx) => (
                      <div
                        key={article.id}
                        className="ap-row"
                        onClick={() => openArticle(article)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && openArticle(article)}
                      >
                        {article.image_url ? (
                          <img
                            src={article.image_url}
                            alt={article.title}
                            className="ap-row-img"
                          />
                        ) : (
                          <div className="ap-row-img-placeholder" />
                        )}
                        
                        <div className="ap-row-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <p className="ap-row-date" style={{ margin: 0 }}>{formatDate(article.created_at)}</p>
                            <span className="ap-grid-category" style={{ margin: 0, fontSize: '11px' }}>
                              {article.tag?.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="ap-row-title">{article.title}</h3>
                          <p className="ap-row-excerpt">
                            {article.content?.slice(0, 100) || ""}
                            <span className="ap-ellipsis"> . . .</span>
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </RevealOnScroll>

              <div ref={loaderRef} className="ap-sentinel" />

              {fetchingArticle && (
                <p className="ap-loading-more">Loading more articles...</p>
              )}
              
            </div>
          </div>

          {/* EXPLORE ARTICLES SECTION */}
          <div className="ap-explore-section">
            <div className="ap-explore-header">
              <h2 className="exp-ar-button" style={{fontSize: "34px",fontWeight: "bolder",marginLeft: "0px"
              }}>Explore Articles -&gt;</h2>
              <div className="ap-mini-navbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`ap-category-btn ${activeCategory === cat ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="ap-articles-grid">
              {exploreArticles.map((article, idx) => (
                <RevealOnScroll key={article.id} delay={100 + (idx % 4) * 50}>
                  <div
                    className="ap-grid-card"
                    onClick={() => openArticle(article)}
                  >
                    {/* Image Section */}
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

                    {/* Text Section */}
                    <div className="ap-grid-card-content">
                      
                      {/* Category */}
                      <span className="ap-grid-category">
                        {article.tag?.toUpperCase()}
                      </span>

                      {/* Title */}
                      <h3 className="ap-grid-title">{article.title}</h3>
                      
                      {/* Excerpt */}
                      <p className="ap-grid-excerpt" style={{ flexGrow: 1 }}>
                        {article.content?.slice(0, 100) || ""}...
                      </p>

                      {/* Date and Author */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
                        <span>{formatDate(article.created_at)}</span>
                        <span>By {article.author || "Unknown Author"}</span>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

          </div>
        </>
      )}

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <ArticleReader
          article={selectedArticle}
          onClose={closeArticle}
          isLoadingMore={prefetching && selectedIndex === articles.length - 1}
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
                    setPendingNext(true);
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

export default ArticlesPage;
