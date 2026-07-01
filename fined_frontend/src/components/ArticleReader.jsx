import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ── text helpers ── */
const cleanText = (v = "") => v.replace(/\s+/g, " ").trim();

const createDescription = (content = "") => {
  const text = cleanText(content);
  if (!text) return "A clear, practical finance explainer from FinEd.";
  const sentenceEnd = text.search(/[.!?]\s/);
  const source = sentenceEnd > 60 ? text.slice(0, sentenceEnd + 1) : text;
  return source.length <= 170 ? source : `${source.slice(0, 167).trim()}...`;
};

const getParagraphs = (content = "") =>
  content.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);

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

const trimLabel = (v = "", max = 42) => {
  const text = cleanText(v).replace(/[.,;:!?]+$/, "");
  if (text.length <= max) return text;
  let label = "";
  for (const word of text.split(" ")) {
    const next = label ? `${label} ${word}` : word;
    if (next.length > max) break;
    label = next;
  }
  return label || text.slice(0, max).trim();
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
  const m = v.match(
    /\b(?:about|on|for|into|toward|towards|through|with)\s+([a-zA-Z0-9][^.!?;,]{8,70})/i
  );
  if (m?.[1]) return trimLabel(titleCase(m[1]));
  const clause = v
    .split(/[.!?;:]/)[0]
    .replace(/^(this|that|these|those|it|they|we|you)\s+/i, "")
    .replace(/^(means|shows|explains|covers|looks at|talks about)\s+/i, "");
  return trimLabel(titleCase(clause));
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
  const [triangleTop, setTriangleTop] = useState(0);
  const tocListRef = useRef(null);


  const blocks = useMemo(
    () =>
      getParagraphs(article?.content).map((text, i) => ({
        id: `article-section-${i}`,
        text,
        isHeading: isLikelyHeading(text),
      })),
    [article?.content]
  );

  const tocItems = useMemo(() => {
    const headings = blocks
      .filter((b) => b.isHeading)
      .map((b) => ({ id: b.id, label: trimLabel(b.text, 42) }));
    if (headings.length > 0) return headings;
    return blocks.map((b, i) => ({ id: b.id, label: createTocLabel(b.text, i) }));
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

  // Calculate triangle position whenever active heading changes
  useEffect(() => {
    if (!activeHeadingId || !tocListRef.current) return;
    
    // Slight delay to ensure DOM has painted the updated active classes
    const timer = setTimeout(() => {
      const activeEl = tocListRef.current.querySelector(`[href="#${activeHeadingId}"]`);
      if (activeEl) {
        const ulRect = tocListRef.current.getBoundingClientRect();
        const elRect = activeEl.getBoundingClientRect();
        // Position it vertically in the center of the active link
        setTriangleTop((elRect.top - ulRect.top) + (elRect.height / 2));
        
        // Auto scroll TOC
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
        window.dispatchEvent(new CustomEvent("articleScrollDown"));
      } else {
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
          <aside className="ar-toc-aside">
            <nav className="ar-toc-nav" aria-label="Article of contents">
              <p className="ar-toc-heading">Table of Contents</p>
              
              <div style={{ position: "relative" }}>
                {/* --- THE MOVING TRIANGLE --- */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: `${triangleTop}px`,
                  transform: 'translateY(-50%)',
                  width: 0,
                  height: 0,
                  borderTop: '9px solid transparent',
                  borderBottom: '10px solid transparent',
                  borderLeft: '15px solid #4A3AFF',
                  transition: 'top 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: activeHeadingId && triangleTop > 0 ? 1 : 0,
                  pointerEvents: 'none',
                  zIndex: 10
                }} />

                <ul className="ar-toc-list" ref={tocListRef}>
                  {tocItems.map((item, i) => (
                    <li key={item.id} className="ar-toc-item">
                      <a
                        href={`#${item.id}`}
                        className={`ar-toc-link ${i === 0 ? "first" : ""} ${activeHeadingId === item.id ? "active" : ""}`}
                        onClick={(event) => scrollToSection(event, item.id)}
                        style={{
                          display: 'block',
                          fontSize: tocFontSize,
                          lineHeight: tocLineHeight,
                          padding: tocRowPadding,
                          paddingLeft: '1.25rem', // Make room for the triangle
                          fontWeight: activeHeadingId === item.id ? "600" : "400",
                          color: activeHeadingId === item.id ? "#111827" : "#6B7280",
                          transition: "color 0.2s ease"
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
              <p className="ar-byline">By - FinEd Editorial Team</p>
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
              {blocks.map((block, i) =>
                block.isHeading ? (
                  <h2
                    key={`${article.id || article.title}-${i}`}
                    id={block.id}
                    className="ar-h2"
                  >
                    {block.text}
                  </h2>
                ) : (
                  <p
                    key={`${article.id || article.title}-${i}`}
                    id={block.id}
                    className="ar-p"
                    itemProp={i === 0 ? "articleBody" : undefined}
                  >
                    {block.text}
                  </p>
                )
              )}
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
