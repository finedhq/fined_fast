import { useEffect, useMemo, useRef } from "react";

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

const inferTag = (article = {}) => {
  const src = `${article.title || ""} ${article.content || ""}`.toLowerCase();
  const tags = [
    ["IPO", /\bipo\b|listing|gmp|grey market|public issue/],
    ["Economy", /economy|pipeline|trade|inflation|gdp|rupee|policy|market/],
    ["Investing", /invest|stock|share|profit|revenue|valuation|portfolio/],
    ["Banking", /bank|loan|credit|deposit|interest rate|rbi/],
    ["Savings", /saving|emergency fund|retirement|college|budget/],
    ["Energy", /energy|renewable|solar|wind|oil|gas|power/],
    ["Business", /company|brand|consumer|industry|business|clients/],
  ];
  return tags.find(([, re]) => re.test(src))?.[0] || "Finance";
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
  const description = useMemo(() => createDescription(article?.content), [article?.content]);
  const scrollRef = useRef(null);
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
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let lastY = el.scrollTop;
    const onScroll = () => {
      const currentY = el.scrollTop;
      if (currentY > lastY && currentY > 80) {
        window.dispatchEvent(new CustomEvent("articleScrollDown"));
      } else {
        window.dispatchEvent(new CustomEvent("articleScrollUp"));
      }
      lastY = currentY;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (!article) return null;

  const scrollToSection = (event, id) => {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const publishedDate = formatDate(article.created_at);
  const articleTag = inferTag(article);

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
      {children}

      {/* close */}


      <div className="ar-scroll-container" ref={scrollRef} data-lenis-prevent="true">
        {/* structured data */}
        <script type="application/ld+json">{schemaJson}</script>

        <div className="ar-grid">
          {/* TOC */}
          <aside className="ar-toc-aside">
            <nav className="ar-toc-nav" aria-label="Article 
             of contents">
              <p className="ar-toc-heading">Table of Contents</p>
              <ul className="ar-toc-list">
                {tocItems.map((item, i) => (
                  <li key={item.id} className="ar-toc-item">
                    <a
                      href={`#${item.id}`}
                      className={`ar-toc-link ${i === 0 ? "first" : ""}`}
                      onClick={(event) => scrollToSection(event, item.id)}
                      style={{
                        fontSize: tocFontSize,
                        lineHeight: tocLineHeight,
                        padding: tocRowPadding,
                      }}
                    >
                      {i === 0 && <span className="ar-toc-arrow" />}
                      <span className="ar-toc-label">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          {/* ARTICLE BODY */}
          <article className="ar-article" itemScope itemType="https://schema.org/Article">
            <header className="ar-header">
              <div className="ar-meta">
                {publishedDate && <time dateTime={article.created_at}>{publishedDate}</time>}
                <span aria-hidden="true">•</span>
                <span>{articleTag}</span>
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
