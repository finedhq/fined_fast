import { useEffect, useRef, useState } from "react";
import ArticleReader from "../components/ArticleReader";
import { fetchArticles } from "../services/api";

const ARTICLES_PER_PAGE = 30;

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function ArticlesPage() {
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
      window.dispatchEvent(new CustomEvent("articleReaderOpen"));  // ← ADD THIS
      const idx = articles.findIndex((a) => a.id === selectedArticle.id);
      const isLast = idx === articles.length - 1;
      if (isLast && hasMore && !prefetching) {
        setPrefetching(true);
        loadArticles(offset, true).then?.(() => setPrefetching(false));
      }
    } else {
      document.body.style.overflow = "";
      window.dispatchEvent(new CustomEvent("articleReaderClose")); // ← ADD THIS
    }
    return () => { document.body.style.overflow = ""; };
  }, [selectedArticle]);

  useEffect(() => {
    if (pendingNext && !loadingRef.current) {
      const idx = articles.findIndex((a) => a.id === selectedArticle?.id);
      const next = articles[idx + 1];
      if (next) {
        setSelectedArticle(next);
        setPendingNext(false);
      }
    }
  }, [articles]);

  const selectedIndex = selectedArticle
    ? articles.findIndex((a) => a.id === selectedArticle.id)
    : -1;

  const openArticle = (article) => {
    if (!article) return;
    setSelectedArticle(article);
  };

  const scrollUp = () => {
    carouselRef.current?.scrollBy({ top: -300, behavior: "smooth" });
  };

  const scrollDown = () => {
    carouselRef.current?.scrollBy({ top: 300, behavior: "smooth" });
  };

  return (
    <div className="ap-root">

      {/* HERO STRIP */}
      <div className="ap-hero-strip">
        <span className="ap-eyebrow">FinEd Library</span>
        <h1 className="ap-headline">Articles</h1>
        <p className="ap-sub">Fresh financial explainers, backed by real research.</p>
      </div>

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
        <div className="ap-body">
          {/* FEATURED CARD */}
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
              <span className="ap-badge">Featured</span>
            </div>
            <div className="ap-featured-body">
              <h2 className="ap-featured-title">{articles[0]?.title || ""}</h2>
              <p className="ap-featured-excerpt">
                {articles[0]?.content?.slice(0, 160) || ""}
                <span className="ap-ellipsis"> [ . . . ]</span>
              </p>
              <p className="ap-featured-date">{formatDate(articles[0]?.created_at)}</p>
            </div>
          </div>

          {/* SCROLLABLE LIST */}
          <div className="ap-side-wrap">
            <div className="ap-scroll-arrows">
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
                    <p className="ap-row-date">{formatDate(article.created_at)}</p>
                    <h3 className="ap-row-title">{article.title}</h3>
                    <p className="ap-row-excerpt">
                      {article.content?.slice(0, 100) || ""}
                      <span className="ap-ellipsis"> [ . . . ]</span>
                    </p>
                  </div>
                </div>
              ))}

              <div ref={loaderRef} className="ap-sentinel" />

              {fetchingArticle && (
                <p className="ap-loading-more">Loading more articles...</p>
              )}
              {!hasMore && articles.length > 1 && (
                <p className="ap-all-caught">✔️ You&apos;re all caught up.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <ArticleReader
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          isLoadingMore={prefetching && selectedIndex === articles.length - 1}
          footer={
            <div className="ap-reader-footer">
              <button
                className={`ap-nav-btn ${selectedIndex <= 0 ? "" : "active"}`}
                onClick={() => {
                  if (selectedIndex > 0) setSelectedArticle(articles[selectedIndex - 1]);
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
                    setSelectedArticle(next);
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