import React, { useState } from 'react';
import FullLeaderboardModal from './FullLeaderboardModal';

// Mock learners fallback for week / month / all time
const SAMPLE_LEADERBOARD = {
  this_week: [
    { rank: 1, name: 'Aarav Mehta', fin_score: 1280 },
    { rank: 2, name: 'Diya Sharma', fin_score: 1150 },
    { rank: 3, name: 'Rohan Verma', fin_score: 980 },
    { rank: 4, name: 'Neha Singh', fin_score: 910 },
  ],
  this_month: [
    { rank: 1, name: 'Kabir Joshi', fin_score: 2840 },
    { rank: 2, name: 'Aarav Mehta', fin_score: 2610 },
    { rank: 3, name: 'Ananya Roy', fin_score: 2390 },
    { rank: 4, name: 'Diya Sharma', fin_score: 2150 },
  ],
  all_time: [
    { rank: 1, name: 'Vikram Patel', fin_score: 8940 },
    { rank: 2, name: 'Aarav Mehta', fin_score: 7820 },
    { rank: 3, name: 'Kabir Joshi', fin_score: 7210 },
    { rank: 4, name: 'Diya Sharma', fin_score: 6940 },
  ]
};

const LeaderboardSection = ({ 
  userData = {}, 
  apiLeaderboard = null,
  timeframe = 'all_time',
  onTimeframeChange = () => {},
  loadingLeaderboard = false
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const finScore = userData?.fin_score ?? 0;
  const userRank = userData?.rank ?? 1;

  // Use API leaderboard if provided, or fallback sample list
  const fullLeaderboard = (apiLeaderboard && apiLeaderboard.length > 0)
    ? apiLeaderboard
    : (SAMPLE_LEADERBOARD[timeframe] || []);

  const currentList = fullLeaderboard.slice(0, 4);

  // Find user's specific rank and score in current timeframe list if available
  const userEntryInList = fullLeaderboard.find(e => 
    (userData?.email && e.email === userData.email) || 
    (userData?.userId && e.user_sub === userData.userId)
  );
  const activeUserScore = userEntryInList 
    ? (userEntryInList.fin_score ?? userEntryInList.finScore ?? 0) 
    : (timeframe === 'all_time' ? finScore : 0);
  const activeUserRank = userEntryInList ? userEntryInList.rank : userRank;

  // Highest score in current list for relative bar width normalization
  const maxScore = Math.max(
    activeUserScore,
    currentList[0]?.fin_score || currentList[0]?.finScore || 1000
  );

  return (
    <section className="leaderboard-section" id="leaderboard-section">
      <div className="leaderboard-header-row">
        <h2 className="section-title">Leaderboard</h2>
        <button 
          className="view-full-btn"
          onClick={() => setIsModalOpen(true)}
          type="button"
        >
          View Full Leaderboard &rarr;
        </button>
      </div>

      {/* Timeframe selector tabs */}
      <div className="time-filter-tabs">
        <button
          className={`time-tab-btn ${timeframe === 'this_week' ? 'active' : ''}`}
          onClick={() => onTimeframeChange('this_week')}
          type="button"
        >
          This Week
        </button>
        <button
          className={`time-tab-btn ${timeframe === 'this_month' ? 'active' : ''}`}
          onClick={() => onTimeframeChange('this_month')}
          type="button"
        >
          This Month
        </button>
        <button
          className={`time-tab-btn ${timeframe === 'all_time' ? 'active' : ''}`}
          onClick={() => onTimeframeChange('all_time')}
          type="button"
        >
          All Time
        </button>
      </div>

      {/* Top Ranked Learners Rows */}
      <div className="leaderboard-rows-list">
        {currentList.map((entry, idx) => {
          const rank = entry.rank || idx + 1;
          const name = entry.name || entry.email?.split('@')[0] || `Learner #${rank}`;
          const score = entry.fin_score ?? entry.finScore ?? 0;
          const progressPercent = Math.min(100, Math.max(20, (score / maxScore) * 100));

          let rankBadge = <span className="rank-numeric-badge">{rank}</span>;
          if (rank === 1) rankBadge = <span role="img" aria-label="1st Place">🥇</span>;
          else if (rank === 2) rankBadge = <span role="img" aria-label="2nd Place">🥈</span>;
          else if (rank === 3) rankBadge = <span role="img" aria-label="3rd Place">🥉</span>;

          return (
            <div key={name + rank} className="leader-row">
              <div className="leader-rank-col">
                {rankBadge}
              </div>

              <div className="leader-user-col">
                <div className="leader-avatar">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="leader-name-group">
                  <span className="leader-name">{name}</span>
                </div>
              </div>

              <div className="leader-progress-col">
                <div className="leader-progress-bar-track">
                  <div 
                    className="leader-progress-bar-fill"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="leader-points-col">
                <span className="leader-score-val">{score}</span>
                <span className="leader-score-pts">pts</span>
              </div>
            </div>
          );
        })}

        {/* Highlighted 'You' Row */}
        <div className="leader-row user-highlight-row">
          <div className="leader-rank-col">
            <span className="user-rank-badge">#{activeUserRank}</span>
          </div>

          <div className="leader-user-col">
            <div className="leader-avatar user-avatar-highlight">
              👤
            </div>
            <div className="leader-name-group">
              <span className="leader-name">You</span>
            </div>
          </div>

          <div className="leader-progress-col">
            <div className="leader-progress-bar-track">
              <div 
                className="leader-progress-bar-fill"
                style={{ width: `${Math.min(100, Math.max(20, (activeUserScore / maxScore) * 100))}%` }}
              ></div>
            </div>
          </div>

          <div className="leader-points-col">
            <span className="leader-score-val">{activeUserScore}</span>
            <span className="leader-score-pts">pts</span>
          </div>
        </div>

      </div>

      {/* Full Leaderboard Modal */}
      <FullLeaderboardModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        timeframe={timeframe}
        leaderboard={fullLeaderboard}
        userEntry={{
          email: userData?.email || 'you@fined.com',
          name: 'You',
          fin_score: activeUserScore,
          rank: activeUserRank,
          isCurrentUser: true
        }}
      />
    </section>
  );
};

export default LeaderboardSection;
