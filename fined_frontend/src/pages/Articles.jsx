import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getArticles } from "../services/api";
import "./Articles.css";

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadArticles() {
      try {
        const data = await getArticles();
        setArticles(data);
      } catch (err) {
        setError("Failed to fetch articles. Please check back later.");
      } finally {
        setLoading(false);
      }
    }
    loadArticles();
  }, []);

  return (
    <div className="articles-page">
      {/* NAVBAR */}
      <nav className="nav-secondary">
        <Link to="/" className="logo-link">
          <div className="logo">
            <div className="logo-icon-wrapper">
              <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#4A3AFF" />
                <path d="M8 20V12C8 10.8954 8.89543 10 10 10H16C17.1046 10 18 10.8954 18 12V20M8 20H18M8 20C8 21.1046 8.89543 22 10 22H18C19.1046 22 20 21.1046 20 20V14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="23" cy="11" r="3" fill="#F5A623" />
              </svg>
            </div>
            <div className="logo-wordmark">
              <span className="fin">Fin</span>
              <span className="ed">Ed</span>
            </div>
          </div>
        </Link>
        <ul className="nav-links">
          <li><Link to="/courses">Courses</Link></li>
          <li><Link to="/articles" className="active">Articles</Link></li>
          <li><Link to="/leaderboard">Leaderboard</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>
      </nav>

      {/* HEADER */}
      <header className="articles-header">
        <div className="header-content">
          <h1>Financial Insights & Guides</h1>
          <p>Read quick articles on budgeting, trading, investment, and smart banking options.</p>
        </div>
      </header>

      {/* ARTICLES CONTAINER */}
      <main className="articles-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Fetching resources...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <div className="articles-grid">
            {articles.map((article) => (
              <article key={article.id || article.article_id} className="article-card">
                <div className="article-image-placeholder">
                  {article.image_url ? (
                    <img src={article.image_url} alt={article.title} className="article-img" />
                  ) : (
                    <div className="article-img-fallback">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v3.75m-18 0A2.25 2.25 0 005.25 12h13.5A2.25 2.25 0 0021 9.75m-18 0V3a1.5 1.5 0 011.5-1.5h13.5A1.5 1.5 0 0119.5 3v6.75" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="article-info">
                  <h3>{article.title}</h3>
                  <p className="article-snippet">
                    {article.content ? article.content.substring(0, 140) + "..." : "No description available."}
                  </p>
                  
                  <div className="article-footer">
                    <span className="read-time">3 min read</span>
                    <button className="btn-read-more">Read More →</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Articles;
