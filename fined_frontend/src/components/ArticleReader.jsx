import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IoStarOutline, IoStar, IoSparkles } from "react-icons/io5";
import { RiShareForwardLine } from "react-icons/ri";
import { FiX } from "react-icons/fi";
import PersonalLensSidebar from "./PersonalLens/PersonalLensSidebar";
import ShareModal from "./ShareModal";
import { fetchRelatedArticles } from "../services/api";

/* ── text helpers ── */
const cleanText = (v = "") => v.replace(/\s+/g, " ").trim();

const renderTextWithLinks = (text) => {
  if (typeof text !== "string") return text;
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1];
    const url = match[2];
    const isExternal = /^https?:\/\//i.test(url);

    if (isExternal) {
      parts.push(
        <a
          key={match.index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ar-external-link"
        >
          {label}
        </a>
      );
    } else {
      parts.push(
        <Link key={match.index} to={url} className="ar-internal-link">
          {label}
        </Link>
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : text;
};

const getParagraphs = (content = "") =>
  content.split(/\r?\n+/).map((p) => p.trim()).filter(Boolean);

const createDescription = (content = "") => {
  const paragraphs = getParagraphs(content);
  if (paragraphs.length === 0) return "A clear, practical finance explainer from FinEd.";
  return paragraphs[0];
};

const slugifyHeading = (text = "", index = 0) => {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return base ? `section-${base}` : `article-section-${index}`;
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
  const description = useMemo(() => {
    return article?.meta_description || article?.description || createDescription(article?.content);
  }, [article?.meta_description, article?.description, article?.content]);

  const seoTitle = useMemo(() => {
    return article?.seo_title || article?.metadata?.seo_title || article?.title || "";
  }, [article?.seo_title, article?.metadata, article?.title]);

  const metaDescription = useMemo(() => {
    const raw = article?.meta_description || article?.metadata?.meta_description || article?.description || createDescription(article?.content);
    if (!raw) return "A clear, practical finance explainer from FinEd.";
    return raw.length > 158 ? `${raw.slice(0, 155).trim()}...` : raw;
  }, [article?.meta_description, article?.metadata, article?.description, article?.content]);

  const scrollRef = useRef(null);
  const [readingProgress, setReadingProgress] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [activeHeadingId, setActiveHeadingId] = useState("");
  const [indicatorStyle, setIndicatorStyle] = useState({ top: 0, height: 0 });
  const tocListRef = useRef(null);
  const tocNavRef = useRef(null);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState(false);
  const [isMobileLensOpen, setIsMobileLensOpen] = useState(false);
  const [relatedArticles, setRelatedArticles] = useState([]);

  // Fetch related articles based on category / tag
  useEffect(() => {
    const slug = article?.slug || (article?.title ? article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : "");
    if (!slug) return;
    let isMounted = true;
    fetchRelatedArticles(slug, 3)
      .then((data) => {
        if (isMounted) {
          setRelatedArticles(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        console.warn("Could not load related articles:", err);
      });
    return () => {
      isMounted = false;
    };
  }, [article?.slug, article?.title]);

  // Close mobile TOC when clicking outside
  useEffect(() => {
    if (!isMobileTocOpen) return;
    const handleClickOutside = (e) => {
      if (tocNavRef.current && !tocNavRef.current.contains(e.target)) {
        setIsMobileTocOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileTocOpen]);
  const [isScrollingUp, setIsScrollingUp] = useState(true);

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

        const id = slugifyHeading(text, i);

        return {
          id,
          text,
          isHeading,
          level,
        };
      });
    },
    [article?.content]
  );

  const tocItems = useMemo(() => {
    const headings = blocks.filter((b) => b.isHeading && b.level !== 3);
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

  /* title / meta / canonical / robots */
  useEffect(() => {
    if (!article?.title) return;
    const prevTitle = document.title;
    const ensureMeta = (sel, attrs) => {
      let tag = document.head.querySelector(sel);
      if (!tag) {
        tag = document.createElement("meta");
        Object.entries(attrs).forEach(([k, v]) => tag.setAttribute(k, v));
        document.head.appendChild(tag);
      }
      return tag;
    };

    const articleSlug = article.slug || (article.title ? article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : '');
    const canonicalUrl = `https://myfined.com/articles/${articleSlug}`;

    let canonicalTag = document.head.querySelector('link[rel="canonical"]');
    const createdCanonical = !canonicalTag;
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    const prevCanonical = canonicalTag.getAttribute("href");
    canonicalTag.setAttribute("href", canonicalUrl);

    const metaRobots = ensureMeta('meta[name="robots"]', { name: "robots" });
    const prevRobots = metaRobots.getAttribute("content");
    metaRobots.setAttribute("content", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");

    const metaDesc = ensureMeta('meta[name="description"]', { name: "description" });
    const ogTitle = ensureMeta('meta[property="og:title"]', { property: "og:title" });
    const ogDesc = ensureMeta('meta[property="og:description"]', { property: "og:description" });
    const ogImage = ensureMeta('meta[property="og:image"]', { property: "og:image" });
    const ogImageAlt = ensureMeta('meta[property="og:image:alt"]', { property: "og:image:alt" });
    const ogUrl = ensureMeta('meta[property="og:url"]', { property: "og:url" });
    const ogType = ensureMeta('meta[property="og:type"]', { property: "og:type" });
    const ogSite = ensureMeta('meta[property="og:site_name"]', { property: "og:site_name" });
    const twitterCard = ensureMeta('meta[name="twitter:card"]', { name: "twitter:card" });
    const twitterSite = ensureMeta('meta[name="twitter:site"]', { name: "twitter:site" });
    const twitterTitle = ensureMeta('meta[name="twitter:title"]', { name: "twitter:title" });
    const twitterDesc = ensureMeta('meta[name="twitter:description"]', { name: "twitter:description" });
    const twitterImage = ensureMeta('meta[name="twitter:image"]', { name: "twitter:image" });
    const twitterImageAlt = ensureMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt" });

    const prevDesc = metaDesc.getAttribute("content");
    const prevOgT = ogTitle.getAttribute("content");
    const prevOgD = ogDesc.getAttribute("content");
    const prevOgI = ogImage.getAttribute("content");
    const prevTwitterI = twitterImage.getAttribute("content");

    const fullTitle = `${seoTitle} | FinEd`;
    document.title = fullTitle;
    metaDesc.setAttribute("content", metaDescription);
    ogTitle.setAttribute("content", seoTitle);
    ogDesc.setAttribute("content", metaDescription);
    if (article.image_url) {
      ogImage.setAttribute("content", article.image_url);
      twitterImage.setAttribute("content", article.image_url);
    }
    ogImageAlt.setAttribute("content", article.title);
    twitterImageAlt.setAttribute("content", article.title);
    ogUrl.setAttribute("content", canonicalUrl);
    ogType.setAttribute("content", "article");
    ogSite.setAttribute("content", "FinEd");
    twitterCard.setAttribute("content", "summary_large_image");
    twitterSite.setAttribute("content", "@FinEd");
    twitterTitle.setAttribute("content", seoTitle);
    twitterDesc.setAttribute("content", metaDescription);

    return () => {
      document.title = prevTitle;
      if (prevDesc) metaDesc.setAttribute("content", prevDesc);
      if (prevOgT) ogTitle.setAttribute("content", prevOgT);
      if (prevOgD) ogDesc.setAttribute("content", prevOgD);
      if (prevOgI) ogImage.setAttribute("content", prevOgI);
      if (prevTwitterI) twitterImage.setAttribute("content", prevTwitterI);
      if (prevRobots) metaRobots.setAttribute("content", prevRobots);
      if (prevCanonical) {
        canonicalTag.setAttribute("href", prevCanonical);
      } else if (createdCanonical && canonicalTag.parentNode) {
        canonicalTag.parentNode.removeChild(canonicalTag);
      }
    };
  }, [article?.title, article?.slug, article?.image_url, seoTitle, metaDescription]);

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

    const el = document.getElementById(id);
    const container = scrollRef.current;

    if (el && container) {
      let collapseOffset = 0;
      // If the TOC is open on mobile, it will collapse and shift the document UP.
      // We must subtract its height from the target scroll position.
      if (isMobileTocOpen && window.innerWidth <= 900) {
        const tocContent = document.querySelector('.ar-toc-content-wrapper');
        if (tocContent) {
          collapseOffset = tocContent.offsetHeight;
        }
      }

      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      // Calculate absolute scroll position minus the layout shift minus 100px for breathing room
      const offset = elRect.top - containerRect.top + container.scrollTop - collapseOffset - 100;

      container.scrollTo({ top: offset, behavior: "smooth" });
    } else {
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    setIsMobileTocOpen(false);
  };

  const publishedDate = formatDate(article.published_at || article.created_at);
  const updatedDateFormatted = formatDate(article.updated_at);
  const articleTag = article.tag || "Finance";

  const tocFontSize = tocItems.length > 16 ? "13px" : tocItems.length > 11 ? "14px" : "16px";
  const tocLineHeight = tocItems.length > 16 ? "1.3" : tocItems.length > 11 ? "1.35" : "1.4";
  const tocRowPadding =
    tocItems.length > 16
      ? "0.15rem 1rem"
      : tocItems.length > 11
        ? "0.2rem 1rem"
        : "0.25rem 1rem";

  // Build full Schema.org graph (Article, BreadcrumbList, FAQPage)
  const structuredData = useMemo(() => {
    if (!article) return null;
    const articleSlug = article.slug || (article.title ? article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : "");
    const canonicalUrl = `https://myfined.com/articles/${articleSlug}`;
    const tag = article.tag || "Finance";
    const publishedIso = article.published_at || article.created_at || new Date().toISOString();
    const updatedIso = article.updated_at || publishedIso;
    const authorName = article.authors?.name || article.author || "Shravan Mutha";
    const authorSlug = article.authors?.slug || "shravan-mutha";

    const faqEntities = [];
    for (let i = 0; i < blocks.length; i++) {
      const b = blocks[i];
      if (b.isHeading && (b.text.endsWith("?") || /^(what|how|why|is|can|does|should|are)\b/i.test(b.text))) {
        let answerText = "";
        for (let j = i + 1; j < blocks.length; j++) {
          if (blocks[j].isHeading) break;
          if (blocks[j].text) {
            answerText = blocks[j].text;
            break;
          }
        }
        if (answerText) {
          faqEntities.push({
            "@type": "Question",
            name: b.text,
            acceptedAnswer: {
              "@type": "Answer",
              text: answerText,
            },
          });
        }
      }
    }

    const graph = [
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        isPartOf: { "@id": canonicalUrl },
        headline: article.title,
        description: metaDescription,
        image: article.image_url || "https://www.myfined.com/assets/images/fined_card_banner.png",
        datePublished: publishedIso,
        dateModified: updatedIso,
        mainEntityOfPage: canonicalUrl,
        author: {
          "@type": "Person",
          name: authorName,
          url: `https://myfined.com/authors/${authorSlug}`,
          ...(article.authors?.bio ? { description: article.authors.bio } : {}),
          ...(article.authors?.role ? { jobTitle: article.authors.role } : {})
        },
        publisher: {
          "@type": "Organization",
          name: "FinEd",
          url: "https://myfined.com",
          logo: {
            "@type": "ImageObject",
            url: "https://myfined.com/logo.ico",
          },
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://myfined.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Articles",
            item: "https://myfined.com/articles",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: tag,
            item: `https://myfined.com/tags/${tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
          },
          {
            "@type": "ListItem",
            position: 4,
            name: article.title,
            item: canonicalUrl,
          },
        ],
      },
    ];

    if (faqEntities.length > 0) {
      graph.push({
        "@type": "FAQPage",
        "@id": `${canonicalUrl}#faq`,
        mainEntity: faqEntities,
      });
    }

    return {
      "@context": "https://schema.org",
      "@graph": graph,
    };
  }, [article, metaDescription, blocks]);

  const schemaJson = structuredData ? serializeJsonLd(structuredData) : "";

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

        <div className="ar-main-content">
          <div className="ar-grid">
          {/* TOC */}
          <aside className={`ar-toc-aside ${isScrollingUp ? 'scroll-up' : ''}`}>
            <nav className="ar-toc-nav" aria-label="Article of contents" ref={tocNavRef}>
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
                        onClick={(event) => {
                          scrollToSection(event, item.id);
                          setIsMobileTocOpen(false);
                        }}
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
                  {/* Spacer to prevent bottom items from being cut off during scroll */}
                  <div style={{ height: "20px", flexShrink: 0, width: "100%" }} />
                </ul>
                <div className="ar-toc-rate-share">
                  <span style={{ fontSize: "16px", fontWeight: "600", color: "#4B5563" }}>
                    Rate & Share this article
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <div
                          key={star}
                          style={{
                            cursor: "pointer",
                            color: star <= (hoverRating || rating) ? "#F59E0B" : "#FCD34D",
                            fontSize: "22px",
                            display: "flex",
                            alignItems: "center",
                            transition: "color 0.2s"
                          }}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                        >
                          {star <= (hoverRating || rating) ? <IoStar /> : <IoStarOutline />}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#4B5563",
                        fontSize: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "4px"
                      }}
                      title="Share Article with Preview"
                      aria-label="Share article"
                    >
                      <RiShareForwardLine />
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          </aside>

          {/* ARTICLE BODY */}
          <article className="ar-article" itemScope itemType="https://schema.org/Article">
            <header className="ar-header">
              <div className="ar-meta">
                {publishedDate && <time dateTime={article.published_at || article.created_at}>{publishedDate}</time>}
                {updatedDateFormatted && updatedDateFormatted !== publishedDate && (
                  <>
                    <span aria-hidden="true">•</span>
                    <span className="ar-updated-date" style={{ color: "#059669", fontWeight: "600" }}>
                      Updated: {updatedDateFormatted}
                    </span>
                  </>
                )}
                <span aria-hidden="true">•</span>
                <span
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/tags/${articleTag.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                >
                  {articleTag}
                </span>
              </div>
              <h1 className="ar-title" itemProp="headline">{article.title}</h1>
              {article.authors ? (
                <p
                  className="ar-byline"
                  style={{ cursor: 'pointer', color: '#0ea5e9' }}
                  onClick={() => navigate(`/authors/${article.authors.slug}`)}
                >
                  By <span style={{ textDecoration: 'underline' }}>{article.authors.name}</span>
                </p>
              ) : (
                <p
                  className="ar-byline"
                  style={{ cursor: 'pointer', color: '#0ea5e9' }}
                  onClick={() => navigate(`/authors/shravan-mutha`)}
                >
                  By <span style={{ textDecoration: 'underline' }}>{article?.author || "Shravan Mutha"}</span>
                </p>
              )}
              <p className="ar-description" itemProp="description">{description}</p>
            </header>

            {article.image_url && (
              <div className="ar-image-wrap" style={{ minHeight: "240px", background: "#f1f5f9", borderRadius: "12px", overflow: "hidden" }}>
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="ar-image"
                  itemProp="image"
                  loading="eager"
                />
              </div>
            )}

            <div className="ar-divider" aria-hidden="true" />

            <div className="ar-body">
              {blocks.map((block, i) => {
                if (block.level === 2) {
                  return (
                    <h2 key={`${article.id || article.title}-${block.id}`} id={block.id} className="ar-h2" style={{ scrollMarginTop: '100px' }}>
                      {renderTextWithLinks(block.text)}
                    </h2>
                  );
                }
                if (block.level === 3) {
                  return (
                    <h3 key={`${article.id || article.title}-${block.id}`} id={block.id} className="ar-h3" style={{ scrollMarginTop: '100px' }}>
                      {renderTextWithLinks(block.text)}
                    </h3>
                  );
                }
                return (
                  <p
                    key={`${article.id || article.title}-${block.id}`}
                    id={block.id}
                    className="ar-p"
                    itemProp={i === 0 ? "articleBody" : undefined}
                  >
                    {renderTextWithLinks(block.text)}
                  </p>
                );
              })}
            </div>

            {/* E-E-A-T AUTHOR BIO & CREDENTIALS CARD */}
            <div className="ar-author-box">
              <div className="ar-author-box-avatar">
                {article.authors?.image_url ? (
                  <img
                    src={article.authors.image_url}
                    alt={article.authors.name}
                    className="ar-author-avatar-img"
                  />
                ) : (
                  <div className="ar-author-avatar-initial">
                    {(article.authors?.name || article.author || "S").charAt(0)}
                  </div>
                )}
              </div>
              <div className="ar-author-box-content">
                <div className="ar-author-box-header">
                  <div>
                    <h3 className="ar-author-box-name">
                      Written by{" "}
                      <span
                        className="ar-author-link"
                        onClick={() => navigate(`/authors/${article.authors?.slug || "shravan-mutha"}`)}
                        style={{ cursor: "pointer", color: "#4A3AFF", textDecoration: "underline" }}
                      >
                        {article.authors?.name || article.author || "Shravan Mutha"}
                      </span>
                    </h3>
                    <p className="ar-author-box-role">
                      {article.authors?.role || "FinEd Research & Editorial"}
                    </p>
                  </div>
                  {article.authors?.linkedin_url && (
                    <a
                      href={article.authors.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ar-author-social-link"
                      title="Connect on LinkedIn"
                      aria-label="LinkedIn Profile"
                    >
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="#0077b5">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  )}
                </div>
                <p className="ar-author-box-bio">
                  {article.authors?.bio || "Dedicated to breaking down complex financial systems, Indian regulatory frameworks, and market mechanisms into clear, actionable explainers."}
                </p>
                <div className="ar-editorial-shield">
                  <span>🛡️ Fact-Checked &amp; Independent FinEd Research</span>
                </div>
              </div>
            </div>

            {/* RATE & SHARE CARD AT END OF ARTICLE (Mobile / Tablet Only) */}
            <div className="ar-end-card">
              <div className="ar-end-card-header">
                <div className="ar-end-card-icon">
                  <IoSparkles />
                </div>
                <div>
                  <h3 className="ar-end-card-title">
                    {rating > 0 ? "Thanks for your feedback!" : "Enjoyed this article?"}
                  </h3>
                  <p className="ar-end-card-subtitle">
                    {rating > 0
                      ? `You rated this explainer ${rating} out of 5 stars.`
                      : "Rate this explainer and share it with friends."}
                  </p>
                </div>
              </div>

              <div className="ar-end-card-actions">
                <div className="ar-end-stars-wrap">
                  <span className="ar-end-stars-label">Your Rating:</span>
                  <div className="ar-end-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className="ar-star-btn"
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} stars`}
                      >
                        {star <= (hoverRating || rating) ? (
                          <IoStar className="ar-star-filled" />
                        ) : (
                          <IoStarOutline className="ar-star-empty" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="ar-end-share-btn"
                  onClick={() => setIsShareModalOpen(true)}
                  aria-label="Share this article"
                >
                  <RiShareForwardLine size={18} />
                  <span>Share Article</span>
                </button>
              </div>
            </div>
          </article>

          {/* PERSONAL LENS COMPANION (Desktop 3rd Column) */}
          <aside className="ar-lens-aside" data-lenis-prevent="true">
            <PersonalLensSidebar
              article={article}
              articleId={article?.slug || article?.id || "etf-101-guide"}
            />
          </aside>
        </div>

        {/* WIDE RELATED READS SECTION */}
        {relatedArticles && relatedArticles.length > 0 && (
          <section className="ar-related-section" aria-label="Related Reads">
            <div className="ar-related-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h3 className="ar-related-title">Related Reads</h3>
              </div>
              <button
                type="button"
                className="ar-related-badge"
                onClick={() => navigate(`/tags/${(articleTag || "finance").toLowerCase().replace(/[^a-z0-9]+/g, '-')}`)}
                aria-label={`View more articles in ${articleTag}`}
              >
                <span>More in {articleTag}</span>
                <span style={{ fontSize: "14px", marginLeft: "2px" }}>→</span>
              </button>
            </div>

            <div className="ar-related-grid">
              {relatedArticles.map((item) => {
                const itemSlug = item.slug || (item.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') : "");
                return (
                  <div
                    key={item.id || itemSlug}
                    className="ap-grid-card ar-related-card"
                    onClick={() => {
                      navigate(`/articles/${itemSlug}`);
                      if (scrollRef.current) {
                        scrollRef.current.scrollTop = 0;
                      }
                    }}
                  >
                    <div className="ap-grid-card-img-wrap">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="ap-grid-card-img"
                          loading="lazy"
                        />
                      ) : (
                        <div className="ap-grid-card-img-placeholder" />
                      )}
                    </div>
                    <div className="ap-grid-card-content">
                      <span
                        className="ap-grid-category"
                        onClick={(e) => {
                          e.stopPropagation();
                          const tagSlug = (item.tag || articleTag || "finance").toLowerCase().replace(/[^a-z0-9]+/g, '-');
                          navigate(`/tags/${tagSlug}`);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {item.tag || articleTag}
                      </span>
                      <h4 className="ap-grid-title" style={{ fontSize: "1.15rem", fontWeight: "800", marginBottom: "8px", color: "#111827", lineHeight: "1.35", WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {item.title}
                      </h4>
                      <p className="ap-grid-date" style={{ color: "#6b7280", fontSize: "13px", margin: "0 0 10px 0" }}>
                        {formatDate(item.published_at || item.created_at)} • By{" "}
                        <span
                          style={{ color: "#0ea5e9", textDecoration: "underline", cursor: "pointer" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/authors/${item.authors?.slug || "shravan-mutha"}`);
                          }}
                        >
                          {item.authors?.name || item.author || "Shravan Mutha"}
                        </span>
                      </p>
                      {item.description && (
                        <p className="ap-grid-excerpt" style={{ color: "#4b5563", fontSize: "0.95rem", lineHeight: "1.45", margin: 0, WebkitLineClamp: 2, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* FOOTER NAVIGATION */}
        {footer && (
          <div className="ar-footer-wrapper">
            {footer}
          </div>
        )}
      </div>

        {/* Floating Share Trigger for Mobile & Tablet (Left Side) */}
        <button
          type="button"
          className={`ar-mobile-share-trigger ${isScrollingUp ? "scroll-up" : "scroll-down"}`}
          onClick={() => setIsShareModalOpen(true)}
          aria-label="Share Article"
        >
          <RiShareForwardLine size={18} style={{ color: "#4A3AFF" }} />
          <span>Share</span>
        </button>

        {/* Floating Trigger for Mobile & Tablet (Right Side - Personal Lens) */}
        <button
          type="button"
          className="pl-mobile-trigger"
          onClick={() => setIsMobileLensOpen(true)}
          aria-label="Open Personal Lens"
        >
          <IoSparkles />
          <span>Personal Lens</span>
        </button>

        {/* Mobile & Tablet Drawer Modal */}
        {isMobileLensOpen && (
          <div
            className="pl-drawer-backdrop"
            onClick={() => setIsMobileLensOpen(false)}
          >
            <div
              className="pl-drawer-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 16px 0" }}>
                <button
                  type="button"
                  onClick={() => setIsMobileLensOpen(false)}
                  style={{
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "50%",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#475569"
                  }}
                  aria-label="Close Personal Lens"
                >
                  <FiX size={18} />
                </button>
              </div>
              <div style={{ padding: "0 16px 24px 16px" }}>
                <PersonalLensSidebar
                  article={article}
                  articleId={article?.slug || article?.id || "etf-101-guide"}
                  isMobileDrawer={true}
                  onCloseDrawer={() => setIsMobileLensOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        {isLoadingMore && (
          <div className="ar-loading-overlay">
            <p>Fetching more articles...</p>
          </div>
        )}
      </div>

      {/* Share Modal Dialog */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        article={article}
        description={description}
      />
    </div>
  );
}

export default ArticleReader;
