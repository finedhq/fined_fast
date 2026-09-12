import { useState, useEffect } from "react";
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
      {/* HEADER */}
      <header className="leaderboard-header">
        <div className="header-content">
          <h1>Top Learners</h1>
          <p>Compete with friends, earn points from courses and expenses, and secure a spot on the leaderboard!</p>
        </div>
      </header>

      {/* LEADERBOARD CONTAINER */}
      <section className="leaderboard-container">
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
      </section>
    </div>
  );
}

export default Leaderboard;
