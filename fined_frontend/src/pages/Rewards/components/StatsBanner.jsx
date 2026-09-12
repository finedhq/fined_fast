import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiInfo, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const STAT_INFO = {
  finscore: {
    title: 'FinScore Metric',
    badge: 'Knowledge & Consistency',
    icon: '⚡',
    description: 'Your overall financial literacy, quiz accuracy, and daily learning consistency score (0 - 1000+).',
    bullets: [
      { label: 'How to increase', text: 'Read articles, complete modules, and score 100% on quizzes (+10 to +50 pts).' },
      { label: 'Consistency bonus', text: 'Maintained and multiplied by building daily learning streaks.' },
      { label: 'Why it matters', text: 'Higher FinScores boost your leaderboard tier and unlock exclusive perks.' }
    ],
    footer: '💡 Keep reading and testing your knowledge daily to maximize your FinScore!'
  },
  finstars: {
    title: 'FinStars Balance',
    badge: 'Reward Currency',
    icon: '⭐',
    description: 'The official reward currency of FinEd that you earn through active learning and engagement.',
    bullets: [
      { label: 'Daily Learning', text: 'Earn +10 to +50 FinStars for every article read and lesson completed.' },
      { label: 'Streak Milestones', text: 'Claim weekly milestone bonuses (+25 to +100 FinStars).' },
      { label: 'Invites & Shares', text: 'Get +100 FinStars for every friend who joins with your referral.' }
    ],
    footer: '🎁 Click "Redeem Now" below to exchange stars for real-world gift cards & coupons.'
  },
  rank: {
    title: 'Global Rank',
    badge: 'Community Standing',
    icon: '🏆',
    description: 'Your real-time rank on the FinEd leaderboard among all active financial learners.',
    bullets: [
      { label: 'Ranking Basis', text: 'Calculated dynamically from your cumulative FinScore & FinStars.' },
      { label: 'Leaderboards', text: 'Compete across All-Time, Monthly, and Weekly leaderboards.' },
      { label: 'Prizes', text: 'Top 3 learners each month receive verified badges and special perks!' }
    ],
    footer: '🚀 Check the Leaderboard section below to see top learners and prize standings.'
  },
  streak: {
    title: 'Daily Streak',
    badge: 'Habit Builder',
    icon: '🔥',
    description: 'The number of consecutive days you have engaged in active financial learning on FinEd.',
    bullets: [
      { label: 'Daily Goal', text: 'Read at least 1 article or complete 1 module every 24 hours.' },
      { label: 'Multiplier', text: 'Longer streaks multiply your daily FinStars and score bonuses.' },
      { label: 'Streak Alert', text: 'Missing a 24h window resets your active streak back to 1 Day.' }
    ],
    footer: '🔥 Build a 7+ day streak to unlock massive milestone rewards!'
  }
};

const StatsBanner = ({ userData = {}, onRedeemClick, onLeaderboardClick }) => {
  const navigate = useNavigate();
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const finScore = userData?.fin_score ?? 0;
  const scoreDelta = userData?.score_delta ?? 0;
  const finStars = userData?.fin_stars ?? 0;
  const rank = userData?.rank ?? 1;
  const streak = userData?.streak_count ?? 1;
  const bestStreak = Math.max(streak, userData?.best_streak ?? 1);

  const toggleTooltip = (key) => {
    setActiveTooltip(activeTooltip === key ? null : key);
  };

  const isTooltipVisible = (key) => {
    return hoveredTooltip === key || activeTooltip === key;
  };

  return (
    <div className="stats-banner-card">
      <div className="stats-banner-grid">
        
        {/* 1. FinScore Card */}
        <div className="stat-item">
          <div className="stat-item-header">
            <div className="stat-header-icon-group">
              <img src="/dash-finscore.svg" alt="FinScore Icon" className="stat-header-badge-icon" />
              <span>FinScore</span>
            </div>
            
            <div 
              className="stat-info-wrapper"
              onMouseEnter={() => setHoveredTooltip('finscore')}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              <button 
                className={`stat-info-btn ${isTooltipVisible('finscore') ? 'active' : ''}`}
                onClick={() => toggleTooltip('finscore')}
                onFocus={() => setHoveredTooltip('finscore')}
                onBlur={() => setHoveredTooltip(null)}
                aria-label="FinScore Information"
                type="button"
              >
                <FiInfo size={14} />
              </button>

              {isTooltipVisible('finscore') && (
                <div 
                  className="stat-tooltip-popover stat-tooltip-left"
                  onMouseEnter={() => setHoveredTooltip('finscore')}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <div className="stat-tooltip-header">
                    <span className="stat-tooltip-title">
                      {STAT_INFO.finscore.icon} {STAT_INFO.finscore.title}
                    </span>
                    <span className="stat-tooltip-badge">{STAT_INFO.finscore.badge}</span>
                  </div>
                  <p className="stat-tooltip-desc">{STAT_INFO.finscore.description}</p>
                  <ul className="stat-tooltip-list">
                    {STAT_INFO.finscore.bullets.map((b, i) => (
                      <li key={i}>
                        <strong>{b.label}:</strong> {b.text}
                      </li>
                    ))}
                  </ul>
                  <div className="stat-tooltip-footer">
                    {STAT_INFO.finscore.footer}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="stat-main-value-row">
            <span className="stat-number">{finScore}</span>
            {finScore > 0 && scoreDelta > 0 && (
              <span className="stat-delta-badge">
                <FiTrendingUp size={14} /> +{scoreDelta}
              </span>
            )}
            {finScore > 0 && scoreDelta < 0 && (
              <span className="stat-delta-badge negative" style={{ color: '#f87171' }}>
                <FiTrendingDown size={14} /> {scoreDelta}
              </span>
            )}
          </div>

          <div className="stat-subtext">
            Overall financial knowledge & consistency score.
          </div>

          <button 
            className="stat-btn-pill"
            onClick={() => navigate('/courses')}
            type="button"
          >
            Boost Score &rarr;
          </button>
        </div>

        {/* 2. FinStars Balance Card */}
        <div className="stat-item">
          <div className="stat-item-header">
            <div className="stat-header-icon-group">
              <img src="/dash-finstar.svg" alt="FinStar Icon" className="stat-header-badge-icon" />
              <span>FinStars Balance</span>
            </div>

            <div 
              className="stat-info-wrapper"
              onMouseEnter={() => setHoveredTooltip('finstars')}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              <button 
                className={`stat-info-btn ${isTooltipVisible('finstars') ? 'active' : ''}`}
                onClick={() => toggleTooltip('finstars')}
                onFocus={() => setHoveredTooltip('finstars')}
                onBlur={() => setHoveredTooltip(null)}
                aria-label="FinStars Information"
                type="button"
              >
                <FiInfo size={14} />
              </button>

              {isTooltipVisible('finstars') && (
                <div 
                  className="stat-tooltip-popover stat-tooltip-left"
                  onMouseEnter={() => setHoveredTooltip('finstars')}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <div className="stat-tooltip-header">
                    <span className="stat-tooltip-title">
                      {STAT_INFO.finstars.icon} {STAT_INFO.finstars.title}
                    </span>
                    <span className="stat-tooltip-badge">{STAT_INFO.finstars.badge}</span>
                  </div>
                  <p className="stat-tooltip-desc">{STAT_INFO.finstars.description}</p>
                  <ul className="stat-tooltip-list">
                    {STAT_INFO.finstars.bullets.map((b, i) => (
                      <li key={i}>
                        <strong>{b.label}:</strong> {b.text}
                      </li>
                    ))}
                  </ul>
                  <div className="stat-tooltip-footer">
                    {STAT_INFO.finstars.footer}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="stat-main-value-row">
            <span className="stat-number">{finStars}</span>
          </div>

          <div className="stat-subtext">
            Exchange your FinStars for rewards and coupons.
          </div>

          <button 
            className="stat-btn-pill"
            onClick={onRedeemClick}
            type="button"
          >
            Redeem Now &rarr;
          </button>
        </div>

        {/* 3. Rank Card */}
        <div className="stat-item">
          <div className="stat-item-header">
            <div className="stat-header-icon-group">
              <img src="/dash-rank.png" alt="Rank Icon" className="stat-header-badge-icon" />
              <span>Rank</span>
            </div>

            <div 
              className="stat-info-wrapper"
              onMouseEnter={() => setHoveredTooltip('rank')}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              <button 
                className={`stat-info-btn ${isTooltipVisible('rank') ? 'active' : ''}`}
                onClick={() => toggleTooltip('rank')}
                onFocus={() => setHoveredTooltip('rank')}
                onBlur={() => setHoveredTooltip(null)}
                aria-label="Leaderboard Rank Information"
                type="button"
              >
                <FiInfo size={14} />
              </button>

              {isTooltipVisible('rank') && (
                <div 
                  className="stat-tooltip-popover stat-tooltip-right"
                  onMouseEnter={() => setHoveredTooltip('rank')}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <div className="stat-tooltip-header">
                    <span className="stat-tooltip-title">
                      {STAT_INFO.rank.icon} {STAT_INFO.rank.title}
                    </span>
                    <span className="stat-tooltip-badge">{STAT_INFO.rank.badge}</span>
                  </div>
                  <p className="stat-tooltip-desc">{STAT_INFO.rank.description}</p>
                  <ul className="stat-tooltip-list">
                    {STAT_INFO.rank.bullets.map((b, i) => (
                      <li key={i}>
                        <strong>{b.label}:</strong> {b.text}
                      </li>
                    ))}
                  </ul>
                  <div className="stat-tooltip-footer">
                    {STAT_INFO.rank.footer}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="stat-main-value-row">
            <span className="stat-number">#{rank}</span>
          </div>

          <div className="stat-subtext">
            Your current standing among all active learners!
          </div>

          <button 
            className="stat-btn-pill"
            onClick={onLeaderboardClick}
            type="button"
          >
            View Leaderboard &rarr;
          </button>
        </div>

        {/* 4. Current Streak Card */}
        <div className="stat-item">
          <div className="stat-item-header">
            <div className="stat-header-icon-group">
              <img src="/dash-fire.png" alt="Streak Icon" className="stat-header-badge-icon" />
              <span>Current Streak</span>
            </div>

            <div 
              className="stat-info-wrapper"
              onMouseEnter={() => setHoveredTooltip('streak')}
              onMouseLeave={() => setHoveredTooltip(null)}
            >
              <button 
                className={`stat-info-btn ${isTooltipVisible('streak') ? 'active' : ''}`}
                onClick={() => toggleTooltip('streak')}
                onFocus={() => setHoveredTooltip('streak')}
                onBlur={() => setHoveredTooltip(null)}
                aria-label="Daily Streak Information"
                type="button"
              >
                <FiInfo size={14} />
              </button>

              {isTooltipVisible('streak') && (
                <div 
                  className="stat-tooltip-popover stat-tooltip-right"
                  onMouseEnter={() => setHoveredTooltip('streak')}
                  onMouseLeave={() => setHoveredTooltip(null)}
                >
                  <div className="stat-tooltip-header">
                    <span className="stat-tooltip-title">
                      {STAT_INFO.streak.icon} {STAT_INFO.streak.title}
                    </span>
                    <span className="stat-tooltip-badge">{STAT_INFO.streak.badge}</span>
                  </div>
                  <p className="stat-tooltip-desc">{STAT_INFO.streak.description}</p>
                  <ul className="stat-tooltip-list">
                    {STAT_INFO.streak.bullets.map((b, i) => (
                      <li key={i}>
                        <strong>{b.label}:</strong> {b.text}
                      </li>
                    ))}
                  </ul>
                  <div className="stat-tooltip-footer">
                    {STAT_INFO.streak.footer}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="stat-main-value-row">
            <span className="stat-number">{streak} Days</span>
          </div>

          <div className="stat-subtext">
            Personal Best: <strong>{bestStreak} Days</strong>. Keep learning daily!
          </div>

          <button 
            className="stat-btn-pill"
            onClick={() => navigate('/courses')}
            type="button"
          >
            Keep Streak &rarr;
          </button>
        </div>

      </div>
    </div>
  );
};

export default StatsBanner;
