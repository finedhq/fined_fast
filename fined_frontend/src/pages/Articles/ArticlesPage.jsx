import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const categories = ["All", "Personal Finance", "IPO", "Investing", "Deep Dives", "Economy"];
  const [articles, setArticles] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetchingArticle, setFetchingArticle] = useState(false);
  const [error, setError] = useState("");
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

  useEffect(() => {
    document.title = "Articles | FinEd";
    return () => {
      document.title = "FinEd";
    };
  }, []);

  const openArticle = (article) => {
    if (!article) return;
    navigate(`/articles/${generateSlug(article.title)}`);
  };

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
                        loading="eager"
                        onLoad={checkScroll}
                      />
                    ) : (
                      <div className="ap-featured-img-placeholder" />
                    )}

                  </div>
                  <div className="ap-featured-body">
                    <span
                      className="ap-grid-category"
                      style={{ marginBottom: '8px', cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (articles[0]?.tag) navigate(`/tags/${generateSlug(articles[0].tag)}`);
                      }}
                    >
                      {articles[0]?.tag?.toUpperCase()}
                    </span>
                    <h2 className="ap-featured-title">{articles[0]?.title || ""}</h2>
                    <p className="ap-featured-excerpt">
                      {articles[0]?.description || ""}
                    </p>
                    <p className="ap-featured-date" style={{ marginTop: '16px' }}>{formatDate(articles[0]?.created_at)}</p>
                    <p className="ap-featured-date" style={{ marginTop: '4px' }}>
                      By {articles[0]?.author || "Shravan Mutha"}
                    </p>

                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* SCROLLABLE LIST */}
            <div className="ap-side-wrap">

              {/* New Right-Side Title with Arrows */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
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
                    {articles.slice(1, 5).map((article, idx) => (
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
                            loading="lazy"
                          />
                        ) : (
                          <div className="ap-row-img-placeholder" />
                        )}

                        <div className="ap-row-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <p className="ap-row-date" style={{ margin: 0 }}>{formatDate(article.created_at)}</p>
                            <span
                              className="ap-grid-category"
                              style={{ margin: 0, fontSize: '11px', cursor: 'pointer' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (article.tag) navigate(`/tags/${generateSlug(article.tag)}`);
                              }}
                            >
                              {article.tag?.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="ap-row-title">{article.title}</h3>

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
              <h2 className="exp-ar-button" style={{
                fontSize: "34px", fontWeight: "bolder", marginLeft: "0px"
              }}>Explore Articles</h2>

              <p className="mobile-swipe-hint">Swipe to see more tags ➔</p>

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
                          loading="lazy"
                        />
                      ) : (
                        <div className="ap-grid-card-img-placeholder" />
                      )}
                    </div>

                    {/* Text Section */}
                    <div className="ap-grid-card-content">

                      {/* Category */}
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

                      {/* Title */}
                      <h3 className="ap-grid-title">{article.title}</h3>

                      {/* Excerpt */}
                      <p className="ap-grid-excerpt" style={{ flexGrow: 1 }}>
                        {article.description || ""}
                      </p>

                      {/* Date and Author */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
                        <span>{formatDate(article.created_at)}</span>
                        <span>By {article.author || "Shravan Mutha"}</span>
                      </div>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default ArticlesPage;
