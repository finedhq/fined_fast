import { useState } from 'react';
import { PiArrowRightBold } from 'react-icons/pi';
import FullLeaderboardModal from './FullLeaderboardModal';
import { getUserLevel } from '../../../utils/level';

const TIMEFRAMES = [['this_week', 'This Week'], ['this_month', 'This Month'], ['all_time', 'All Time']];

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

  // Podium (top 3) plus the next five learners
  const currentList = fullLeaderboard.slice(0, 8);

  // Find user's specific rank and score in current timeframe list if available
  const userEntryInList = fullLeaderboard.find(e => 
    (userData?.email && e.email === userData.email) || 
    (userData?.userId && e.user_sub === userData.userId)
  );
  const activeUserScore = userEntryInList 
    ? (userEntryInList.fin_score ?? userEntryInList.finScore ?? 0) 
    : (timeframe === 'all_time' ? finScore : 0);
  const activeUserRank = userEntryInList ? userEntryInList.rank : userRank;
  const levelInfo = getUserLevel(userData);


  const top3 = currentList.slice(0, 3);
  const rest = currentList.slice(3);
  const nameOf = (entry, rank) => entry.name || entry.email?.split('@')[0] || `Learner #${rank}`;
  const scoreOf = (entry) => entry.fin_score ?? entry.finScore ?? 0;
  const youName = userData?.name || 'You';

  return (
    <section className="rw-section rw-board" id="leaderboard-section" aria-labelledby="rw-board-title">
      <div className="rw-section-head">
        <h2 id="rw-board-title" className="rw-section-title">Leaderboard</h2>
        <div className="rw-tabs" role="tablist" aria-label="Leaderboard period">
          {TIMEFRAMES.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={timeframe === key}
              className={`rw-tab${timeframe === key ? ' is-active' : ''}`}
              onClick={() => onTimeframeChange(key)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`rw-panel rw-board-panel${loadingLeaderboard ? ' is-loading' : ''}`}>
        {/* Podium for the top three */}
        <ol className="rw-podium">
          {top3.map((entry, idx) => {
            const rank = entry.rank || idx + 1;
            const name = nameOf(entry, rank);
            return (
              <li key={name + rank} className={`rw-podium-spot rw-podium-spot--${rank}`}>
                <span className="rw-podium-avatar">
                  {name.charAt(0).toUpperCase()}
                  <span className="rw-podium-rank">{rank}</span>
                </span>
                <span className="rw-podium-name">{name}</span>
                <span className="rw-podium-score">{scoreOf(entry)} <small>pts</small></span>
              </li>
            );
          })}
        </ol>

        {rest.length > 0 && (
          <ol className="rw-rows" start={4}>
            {rest.map((entry, idx) => {
              const rank = entry.rank || idx + 4;
              const name = nameOf(entry, rank);
              return (
                <li key={name + rank} className="rw-row">
                  <span className="rw-row-rank">{rank}</span>
                  <span className="rw-row-avatar" aria-hidden="true">{name.charAt(0).toUpperCase()}</span>
                  <span className="rw-row-name">{name}</span>
                  <span className="rw-row-score">{scoreOf(entry)} <small>pts</small></span>
                </li>
              );
            })}
          </ol>
        )}

        {/* The current user's standing */}
        <div className="rw-row rw-row--you">
          <span className="rw-row-rank">#{activeUserRank}</span>
          <span className="rw-row-avatar" aria-hidden="true">{(youName || 'Y').charAt(0).toUpperCase()}</span>
          <span className="rw-row-name">You <small>{levelInfo.label}</small></span>
          <span className="rw-row-score">{activeUserScore} <small>pts</small></span>
        </div>

        <button className="rw-ghost rw-board-more" onClick={() => setIsModalOpen(true)} type="button">
          View Full Leaderboard <PiArrowRightBold aria-hidden="true" />
        </button>
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
