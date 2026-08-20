import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchArticles } from "../../services/api";
import RevealOnScroll from "../../components/RevealOnScroll";
import Lenis from 'lenis';
import { ETF_DEMO_ARTICLE } from "../../lib/demoArticle";
import { IoSparkles } from "react-icons/io5";
import { hasAiLens } from "../../utils/textFormatters";

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
  const categories = ["All", "Deep Dives", "Personal Finance", "IPO", "Economy", "Investing"];
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
      let incoming = [];
      try {
        const data = await fetchArticles({ limit, offset: nextOffset });
        incoming = Array.isArray(data) ? data : data.articles || [];
      } catch (err) {
        console.warn("Could not fetch articles from server, using local fallback", err);
      }

      // Ensure ETF demo article is available as fallback or appended
      if (!append && incoming.length === 0) {
        incoming = [ETF_DEMO_ARTICLE];
      } else if (!append && !incoming.some((a) => (a.slug || "").includes("etf") || (a.title || "").toLowerCase().includes("etf"))) {
        incoming = [...incoming, ETF_DEMO_ARTICLE];
      }

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
    const targetSlug = article.slug || generateSlug(article.title);
    navigate(`/articles/${targetSlug}`);
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

  const latestArticle = articles[0] || ETF_DEMO_ARTICLE;

  return (
    <div className="ap-root">

      {/* HERO STRIP */}
      <RevealOnScroll>
        <div className="ap-hero-strip">
          <h1 className="ap-headline">Articles</h1>
          <p className="ap-sub">Fresh financial explainers, backed by real research.</p>
        </div>
      </RevealOnScroll>

      {/* PERSONAL LENS SPOTLIGHT BANNER */}
      <RevealOnScroll>
        <div
          style={{
            background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
            borderRadius: "20px",
            padding: "24px 28px",
            margin: "0 auto 36px auto",
            maxWidth: "1280px",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
            boxShadow: "0 10px 30px -5px rgba(79, 70, 229, 0.3)",
            position: "relative",
            overflow: "hidden"
          }}
        >
          <div style={{ maxWidth: "720px", zIndex: 2 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "999px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
              <IoSparkles size={12} />
              <span>Personal Lens AI</span>
            </div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 6px 0", color: "#ffffff" }}>
              FinEd Personal Lens - Your AI Pre-Reading Coach
            </h2>
            <p style={{ fontSize: "14px", opacity: "0.9", margin: "0", lineHeight: "1.5" }}>
              Answer 4 quick questions (~20s) inside any article to get personalized analogies, priority sections, and plain-English takeaways tailored to your exact experience level.
            </p>
          </div>
          <button
            onClick={() => openArticle(latestArticle)}
            style={{
              background: "#ffffff",
              color: "#4f46e5",
              border: "none",
              borderRadius: "12px",
              padding: "12px 22px",
              fontSize: "14px",
              fontWeight: "700",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
              zIndex: 2,
              transition: "transform 0.2s"
            }}
          >
            <span>Try on Latest Article</span>
            <span>→</span>
          </button>
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
              <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold' }}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span
                        className="ap-grid-category"
                        style={{ margin: 0, cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (articles[0]?.tag) navigate(`/tags/${generateSlug(articles[0].tag)}`);
                        }}
                      >
                        {articles[0]?.tag?.toUpperCase()}
                      </span>
                      {hasAiLens(articles[0]) && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                          <IoSparkles size={10} /> AI Lens Ready
                        </span>
                      )}
                    </div>
                    <h2 className="ap-featured-title">{articles[0]?.title || ""}</h2>
                    <p className="ap-featured-excerpt">
                      {articles[0]?.description || ""}
                    </p>
                    <p className="ap-featured-date" style={{ marginTop: '16px' }}>{formatDate(articles[0]?.published_at || articles[0]?.created_at)}</p>
                    {articles[0]?.authors ? (
                      <p
                        className="ap-featured-date"
                        style={{ marginTop: '4px', cursor: 'pointer', color: '#0ea5e9' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/authors/${articles[0].authors.slug}`); }}
                      >
                        By <span style={{ textDecoration: 'underline' }}>{articles[0].authors.name}</span>
                      </p>
                    ) : (
                      <p
                        className="ap-featured-date"
                        style={{ marginTop: '4px', cursor: 'pointer', color: '#0ea5e9' }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/authors/shravan-mutha`); }}
                      >
                        By <span style={{ textDecoration: 'underline' }}>{articles[0]?.author || "Shravan Mutha"}</span>
                      </p>
                    )}

                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* SCROLLABLE LIST */}
            <div className="ap-side-wrap">

              {/* New Right-Side Title with Arrows */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 'bold', marginLeft: "16px" }}>
                  Featured Articles
                </h2>

                {/* We override the absolute positioning of the arrows so they sit nicely next to the title */}
                {/* <div className="ap-scroll-arrows" style={{ position: 'static' }}>
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
                </div> */}
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
                            <p className="ap-row-date" style={{ margin: 0, fontSize: '12px' }}>{formatDate(article.published_at || article.created_at)}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                              {hasAiLens(article) && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#eef2ff', color: '#4f46e5', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                                  <IoSparkles size={9} /> Lens
                                </span>
                              )}
                            </div>
                          </div>
                          <h3 className="ap-row-title" style={{ fontSize: '18px', WebkitLineClamp: 2, margin: '4px 0' }}>{article.title}</h3>
                          {article.description && (
                            <p className="ap-row-excerpt" style={{ fontSize: '13px', color: '#6b7280', WebkitLineClamp: 2, marginTop: '2px', lineHeight: 1.2 }}>
                              {article.description}
                            </p>
                          )}
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
          <div className="ap-explore-section" style={{ width: 'min(1180px, calc(100% - 32px))', margin: '0 auto' }}>
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

                      {/* Category & Lens Tag */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <span
                          className="ap-grid-category"
                          style={{ margin: 0, cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (article.tag) navigate(`/tags/${generateSlug(article.tag)}`);
                          }}
                        >
                          {article.tag?.toUpperCase()}
                        </span>
                        {hasAiLens(article) && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#eef2ff', color: '#4f46e5', padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '700' }}>
                            <IoSparkles size={9} /> AI Lens
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="ap-grid-title">{article.title}</h3>

                      {/* Excerpt */}
                      <p className="ap-grid-excerpt" style={{ flexGrow: 1 }}>
                        {article.description || ""}
                      </p>

                      {/* Date and Author */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', fontSize: '13px', color: '#6b7280' }}>
                        <span>{formatDate(article.published_at || article.created_at)}</span>
                        {article.authors ? (
                          <span
                            style={{ cursor: 'pointer', color: '#0ea5e9' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/authors/${article.authors.slug}`); }}
                          >
                            By <span style={{ textDecoration: 'underline' }}>{article.authors.name}</span>
                          </span>
                        ) : (
                          <span
                            style={{ cursor: 'pointer', color: '#0ea5e9' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/authors/shravan-mutha`); }}
                          >
                            By <span style={{ textDecoration: 'underline' }}>{article.author || "Shravan Mutha"}</span>
                          </span>
                        )}
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
