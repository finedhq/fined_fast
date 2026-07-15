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
        let fetchedAuthor = data.author || {};
        if (String(slug).toLowerCase().includes('shravan') || String(fetchedAuthor?.name).toLowerCase().includes('shravan')) {
          fetchedAuthor = {
            ...fetchedAuthor,
            name: "Shravan Mutha",
            bio: "Co-founder @FinEd | VJTI '27",
            description: "About\nHey, I am Shravan Mutha, the co-founder of FinEd, a platform dedicated to making financial education free and accessible.\n\nI believe that understanding money should be simple and engaging for everyone. At FinEd, we transform complex financial concepts into interactive courses, quizzes, and articles that empower individuals to make informed decisions.\n\nI have a deep interest in startups and businesses in general. I enjoy exploring new ideas, understanding different business models, and learning from founders who are building innovative solutions. The process of turning an idea into a scalable venture excites me, and I’m always eager to discuss entrepreneurship, strategy, and growth.\n\nLet’s connect! I’d love to network with fellow entrepreneurs, innovators, and professionals passionate about fintech, startups, and financial education. Feel free to reach out!"
          };
        }
        setAuthor(fetchedAuthor);
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
        <div className="ap-hero-strip" style={{ display: 'flex', alignItems: 'center', textAlign: 'left', backgroundColor: '#d9e8ff', paddingTop: '140px', paddingBottom: '60px', color: '#000', width: '100vw', marginLeft: 'calc(-50vw + 50%)', marginBottom: '40px', marginTop: '-100px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '40px', width: 'min(1180px, calc(100% - 32px))', margin: '0 auto', paddingLeft: '10px' }}>
            {author?.image_url ? (
              <img 
                src={author.image_url} 
                alt={author?.name} 
                style={{ width: '180px', height: '140px', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '180px', height: '140px', backgroundColor: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', color: '#fff' }}>
                {author?.name?.charAt(0) || "A"}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', height: '140px', justifyContent: 'space-between', padding: '5px 0' }}>
              <h1 className="ap-headline" style={{ margin: '0', fontSize: '36px', fontWeight: 'bold', color: '#000', lineHeight: '1' }}>{author?.name || "Loading..."}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <a href={author?.linkedin_url || "https://www.linkedin.com/in/shravan-mutha-302247297/"} target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="#0077b5"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
                <a href="mailto:shravanmutha45@gmail.com" target="_blank" rel="noopener noreferrer" style={{ width: '36px', height: '36px', backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: '#333' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M0 3v18h24v-18h-24zm6.623 7.929l-4.623 5.712v-9.458l4.623 3.746zm-4.141-5.929h19.035l-9.517 7.713-9.518-7.713zm5.694 7.188l3.824 3.099 3.83-3.104 5.612 6.817h-18.779l5.513-6.812zm9.208-1.264l4.616-3.741v9.348l-4.616-5.607z"/></svg>
                </a>
              </div>
              <span style={{ fontSize: '18px', fontWeight: '500', color: '#000', margin: '0' }}>{author?.bio || "No bio available."}</span>
            </div>
          </div>
        </div>
      </RevealOnScroll>

      {author?.description && (
        <div style={{ backgroundColor: '#fff', color: '#000', padding: '40px', width: 'min(1180px, calc(100% - 32px))', margin: '0 auto 40px', textAlign: 'left', fontSize: '17px', lineHeight: '1.7', borderRadius: '8px' , paddingLeft: "10px" }}>
          {author.description.split('\n').map((line, i) => (
             line.trim() === 'About' ? <h2 key={i} style={{ marginBottom: '24px', fontSize: '36px', fontWeight: 'bold' }}>{line}</h2> :
             line.trim() ? <p key={i} style={{ marginBottom: '16px' }}>{line}</p> : null
          ))}
        </div>
      )}

      {error && <div className="ap-error">{error}</div>}

      <div className="ap-explore-section" style={{ marginTop: '20px' }}>
        <h2 style={{ color: '#000', marginBottom: '30px', fontSize: '36px', fontWeight: 'bold', width: 'min(1180px, calc(100% - 32px))', margin: '0 auto 30px', textAlign: 'left', paddingLeft: '0px' }}>
          Articles Written
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
