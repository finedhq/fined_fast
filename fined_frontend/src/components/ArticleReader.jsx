import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── text helpers ── */
const cleanText = (v = "") => v.replace(/\s+/g, " ").trim();

const getParagraphs = (content = "") =>
  content.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);

const createDescription = (content = "") => {
  const paragraphs = getParagraphs(content);
  if (paragraphs.length === 0) return "A clear, practical finance explainer from FinEd.";
  return paragraphs[0];
};

const isLikelyHeading = (text = "") => {
  const v = cleanText(text);
  if (v.length < 4 || v.length > 95) return false;
  if (/[.!]$/.test(v)) return false;
  if (v.split(" ").length > 12) return false;
  const startsOk = /^(\d+\.|[A-Z][\w''-]+|FAQs?$)/.test(v);
  const titleLike =
    v === v.toUpperCase() ||
    v.split(" ").filter((w) => /^[A-Z0-9]/.test(w)).length >=
    Math.max(1, v.split(" ").length - 2);
  return startsOk && (titleLike || /[?:]$/.test(v));
};

const trimLabel = (v = "") => {
  return cleanText(v).replace(/[.,;:!?]+$/, "");
};

const titleCase = (v = "") =>
  v
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) =>
      /^(and|or|for|to|of|in|on|with|the|a|an|is|are)$/.test(w)
        ? w
        : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ")
    .replace(/^./, (c) => c.toUpperCase());

const createTocLabel = (text = "", index = 0) => {
  const v = cleanText(text);
  if (!v) return `Topic ${index + 1}`;
  return trimLabel(v);
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const serializeJsonLd = (data) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

/* ── component ── */
function ArticleReader({ article, onClose, children, footer, isLoadingMore = false }) {
  const navigate = useNavigate();
  const description = useMemo(() => createDescription(article?.content), [article?.content]);
  const scrollRef = useRef(null);
  const [readingProgress, setReadingProgress] = useState(0);

  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const tocListRef = useRef(null);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [isScrollingUp, setIsScrollingUp] = useState(false);


  const blocks = useMemo(
    () => {
      const paragraphs = getParagraphs(article?.content);
      // Skip the first paragraph since it is used as the description above the image
      const bodyParagraphs = paragraphs.slice(1);
      const hasExplicitHeadings = bodyParagraphs.some(p => p.startsWith("## ") || p.startsWith("### "));

      return bodyParagraphs.map((rawText, i) => {
        let text = rawText;
        let isHeading = false;
        let level = 0;

        if (text.startsWith("### ")) {
          text = text.substring(4).trim();
          isHeading = true;
          level = 3;
        } else if (text.startsWith("## ")) {
          text = text.substring(3).trim();
          isHeading = true;
          level = 2;
        } else if (!hasExplicitHeadings) {
          isHeading = isLikelyHeading(text);
          if (isHeading) level = 2;
        }

        return {
          id: `article-section-${i}`,
          text,
          isHeading,
          level,
        };
      });
    },
    [article?.content]
  );

  const tocItems = useMemo(() => {
    const headings = blocks.filter((b) => b.isHeading);
    if (headings.length > 0) {
      return headings.map((b) => ({ id: b.id, label: trimLabel(b.text), level: b.level }));
    }
    return blocks.map((b, i) => ({ id: b.id, label: createTocLabel(b.text, i), level: 2 }));
  }, [blocks]);

  // Set first heading active on load
  useEffect(() => {
    if (!tocItems.length) return;
    setActiveHeadingId(tocItems[0].id);
  }, [tocItems]);

  // Scroll to top when article changes
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      setTimeout(() => {
        el.scrollTop = 0;
      }, 10);
    }
  }, [article?.title]);

  // Calculate indicator position whenever active heading changes
  useEffect(() => {
    if (!activeHeadingId || !tocListRef.current) return;
    
    // Slight delay to ensure DOM has painted the updated active classes
    const timer = setTimeout(() => {
      const activeEl = tocListRef.current.querySelector(`[href="#${activeHeadingId}"]`)?.parentElement;
      if (activeEl) {
        setIndicatorStyle({
          top: activeEl.offsetTop,
          height: activeEl.offsetHeight
        });
        
        // Auto scroll TOC
        // We use scrollTo with 'auto' instead of scrollIntoView to prevent cancelling 
        // the main article's smooth scroll (a known issue in Chrome)
        const tocList = tocListRef.current;
        const scrollPos = activeEl.offsetTop - (tocList.clientHeight / 2) + (activeEl.offsetHeight / 2);
        tocList.scrollTo({ top: scrollPos, behavior: 'auto' });
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [activeHeadingId]);

  /* title / meta */
  useEffect(() => {
    if (!article?.title) return;
    const prevTitle = document.title;
    const ensure = (sel, attrs) => {
      let tag = document.head.querySelector(sel);
      if (!tag) {
        tag = document.createElement("meta");
        Object.entries(attrs).forEach(([k, v]) => tag.setAttribute(k, v));
        document.head.appendChild(tag);
      }
      return tag;
    };
    const metaDesc = ensure('meta[name="description"]', { name: "description" });
    const ogTitle = ensure('meta[property="og:title"]', { property: "og:title" });
    const ogDesc = ensure('meta[property="og:description"]', { property: "og:description" });
    const prevDesc = metaDesc.getAttribute("content");
    const prevOgT = ogTitle.getAttribute("content");
    const prevOgD = ogDesc.getAttribute("content");

    document.title = `${article.title} | FinEd Articles`;
    metaDesc.setAttribute("content", description);
    ogTitle.setAttribute("content", article.title);
    ogDesc.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (prevDesc) metaDesc.setAttribute("content", prevDesc);
      if (prevOgT) ogTitle.setAttribute("content", prevOgT);
      if (prevOgD) ogDesc.setAttribute("content", prevOgD);
    };
  }, [article?.title, description]);

  /* escape key */
  useEffect(() => {
    const handle = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [onClose]);

  /* scroll events */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let lastY = el.scrollTop;
    
    const onScroll = () => {
      const currentY = el.scrollTop;

      // Calculate the progress percentage
      const scrollHeight = el.scrollHeight - el.clientHeight;
      if (scrollHeight > 0) {
        setReadingProgress((currentY / scrollHeight) * 100);
      }

      // --- SCROLL SPY LOGIC ---
      const tocElements = tocItems.map(item => document.getElementById(item.id)).filter(Boolean);
      
      if (tocElements.length) {
        const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
        if (isAtBottom) {
          setActiveHeadingId(tocElements[tocElements.length - 1].id);
        } else {
          const scrollTopPos = el.getBoundingClientRect().top;
          const activationLine = scrollTopPos + Math.min(el.clientHeight * 0.35, 220);
          
          const activeHeading = tocElements.reduce((current, heading) => {
            const headingTop = heading.getBoundingClientRect().top;
            const currentTop = current.getBoundingClientRect().top;
            const headingHasPassedLine = headingTop <= activationLine;
            const headingIsCloserToLine = Math.abs(headingTop - activationLine) < Math.abs(currentTop - activationLine);

            if (headingHasPassedLine && (!current || currentTop > activationLine || headingTop > currentTop)) {
              return heading;
            }
            return !headingHasPassedLine && !current ? heading : headingIsCloserToLine && currentTop > activationLine ? heading : current;
          }, tocElements[0]);

          if (activeHeading?.id) setActiveHeadingId(activeHeading.id);
        }
      }

      if (currentY > lastY && currentY > 80) {
        setIsScrollingUp(false);
        window.dispatchEvent(new CustomEvent("articleScrollDown"));
      } else {
        setIsScrollingUp(true);
        window.dispatchEvent(new CustomEvent("articleScrollUp"));
      }
      lastY = currentY;
    };
    
    el.addEventListener("scroll", onScroll, { passive: true });
    // Call once to set initial state
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [tocItems]);

  if (!article) return null;

  const scrollToSection = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const publishedDate = formatDate(article.created_at);
  const articleTag = article.tag;

  const tocFontSize = tocItems.length > 16 ? "13px" : tocItems.length > 11 ? "14px" : "16px";
  const tocLineHeight = tocItems.length > 16 ? "1.25" : tocItems.length > 11 ? "1.3" : "1.35";
  const tocRowPadding =
    tocItems.length > 16
      ? "0.18rem 1rem"
      : tocItems.length > 11
        ? "0.25rem 1rem"
        : "0.4rem 1rem";

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description,
    image: article.image_url || undefined,
    datePublished: article.created_at || undefined,
    author: { "@type": "Organization", name: "FinEd" },
    publisher: { "@type": "Organization", name: "FinEd" },
  };
  const schemaJson = serializeJsonLd(schema);

  return (
    <div className="ar-overlay" role="dialog" aria-modal="true" aria-label="Article reader">
      {/* --- READING PROGRESS BAR --- */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '5px',
          backgroundColor: '#4A3AFF', // Nice vibrant blue
          width: `${readingProgress}%`,
          zIndex: 9999,
          transition: 'width 0.1s ease-out'
        }}
      />

      {children}

      {/* close */}


      <div className="ar-scroll-container" ref={scrollRef} data-lenis-prevent="true">
        {/* structured data */}
        <script type="application/ld+json">{schemaJson}</script>

        <div className="ar-grid">
          {/* TOC */}
          <aside className={`ar-toc-aside ${isScrollingUp ? 'scroll-up' : ''}`}>
            <nav className="ar-toc-nav" aria-label="Article of contents">
              <div 
                className={`ar-toc-header-wrapper ${isMobileTocOpen ? 'open' : ''}`}
                onClick={() => setIsMobileTocOpen(!isMobileTocOpen)}
              >
                <p className="ar-toc-heading">Table of Contents</p>
                <span className="ar-toc-icon">▼</span>
              </div>
              
              <div className={`ar-toc-content-wrapper ${isMobileTocOpen ? 'open' : ''}`} style={{ position: "relative" }}>
                <ul className="ar-toc-list" ref={tocListRef}>
                  {/* --- THE MOVING INDICATOR --- */}
                  <div style={{
                    position: 'absolute',
                    left: '-2px',
                    top: `${indicatorStyle.top}px`,
                    width: '2px',
                    height: `${indicatorStyle.height}px`,
                    backgroundColor: '#4A3AFF',
                    transition: 'top 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    opacity: activeHeadingId && indicatorStyle.height > 0 ? 1 : 0,
                    pointerEvents: 'none',
                    zIndex: 10
                  }} />

                  {tocItems.map((item, i) => (
                    <li key={item.id} className="ar-toc-item">
                      <a
                        href={`#${item.id}`}
                        className={`ar-toc-link ${activeHeadingId === item.id ? "active" : ""}`}
                        onClick={(event) => scrollToSection(event, item.id)}
                        style={{
                          display: 'block',
                          fontSize: item.level === 3 ? "13px" : tocFontSize,
                          lineHeight: tocLineHeight,
                          padding: tocRowPadding,
                          paddingLeft: item.level === 3 ? '2.25rem' : '1.25rem',
                          fontWeight: activeHeadingId === item.id ? "600" : (item.level === 3 ? "400" : "500"),
                          color: activeHeadingId === item.id ? "#4A3AFF" : "#6B7280",
                        }}
                      >
                        <span className="ar-toc-label">{item.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </aside>

          {/* ARTICLE BODY */}
          <article className="ar-article" itemScope itemType="https://schema.org/Article">
            <header className="ar-header">
              <div className="ar-meta">
                {publishedDate && <time dateTime={article.created_at}>{publishedDate}</time>}
                <span aria-hidden="true">•</span>
                <span 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tags/${articleTag.toLowerCase()}`)}
                >
                  {articleTag}
                </span>
              </div>
              <h1 className="ar-title" itemProp="headline">{article.title}</h1>
              <p className="ar-byline">By {article?.author || "Shravan Mutha"}</p>
              <p className="ar-description" itemProp="description">{description}</p>
            </header>

            {article.image_url && (
              <div className="ar-image-wrap">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="ar-image"
                  itemProp="image"
                />
              </div>
            )}

            <div className="ar-divider" aria-hidden="true" />

            <div className="ar-body">
              {blocks.map((block, i) => {
                if (block.level === 2) {
                  return (
                    <h2 key={`${article.id || article.title}-${i}`} id={block.id} className="ar-h2">
                      {block.text}
                    </h2>
                  );
                }
                if (block.level === 3) {
                  return (
                    <h3 key={`${article.id || article.title}-${i}`} id={block.id} className="ar-h3">
                      {block.text}
                    </h3>
                  );
                }
                return (
                  <p
                    key={`${article.id || article.title}-${i}`}
                    id={block.id}
                    className="ar-p"
                    itemProp={i === 0 ? "articleBody" : undefined}
                  >
                    {block.text}
                  </p>
                );
              })}
            </div>

            {footer}
          </article>
        </div>

        {isLoadingMore && (
          <div className="ar-loading-overlay">
            <p>Fetching more articles...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ArticleReader;
