import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getLeaderboard } from "../../services/api";
import "./Leaderboard.css";

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        setError("Failed to fetch leaderboard. Please check back later.");
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  return (
    <div className="leaderboard-page">
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
          <li><Link to="/articles">Articles</Link></li>
          <li><Link to="/leaderboard" className="active">Leaderboard</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>
      </nav>

      {/* HEADER */}
      <header className="leaderboard-header">
        <div className="header-content">
          <h1>Top Learners</h1>
          <p>Compete with friends, earn points from courses and expenses, and secure a spot on the leaderboard!</p>
        </div>
      </header>

      {/* LEADERBOARD CONTAINER */}
      <main className="leaderboard-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Fetching rankings...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>User</th>
                  <th>FinScore</th>
                  <th>Course Score</th>
                  <th>Article Score</th>
                  <th>Expense Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const rank = entry.rank || idx + 1;
                  let rankClass = "";
                  let rankBadge = rank;
                  
                  if (rank === 1) {
                    rankClass = "rank-gold";
                    rankBadge = "🥇";
                  } else if (rank === 2) {
                    rankClass = "rank-silver";
                    rankBadge = "🥈";
                  } else if (rank === 3) {
                    rankClass = "rank-bronze";
                    rankBadge = "🥉";
                  }
                  
                  return (
                    <tr key={entry.email + "-" + rank} className={rankClass}>
                      <td className="cell-rank">{rankBadge}</td>
                      <td className="cell-user">
                        <span className="user-avatar">
                          {entry.email.charAt(0).toUpperCase()}
                        </span>
                        <span className="user-email">{entry.email}</span>
                      </td>
                      <td className="cell-score cell-bold">{entry.finScore || entry.fin_score || 0}</td>
                      <td className="cell-score">{entry.course_score || 0}</td>
                      <td className="cell-score">{entry.article_score || 0}</td>
                      <td className="cell-score">{entry.expense_score || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default Leaderboard;
