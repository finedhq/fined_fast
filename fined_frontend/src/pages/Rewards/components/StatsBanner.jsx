import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PiArrowRightBold,
  PiFireFill,
  PiInfoBold,
  PiLightningFill,
  PiStarFill,
  PiTrendDownBold,
  PiTrendUpBold,
  PiTrophyFill,
} from 'react-icons/pi';
import { getUserLevel } from '../../../utils/level';

// Redemptions open at this balance (see RedeemSection)
export const REDEEM_MIN_STARS = 150;

const STAT_INFO = {
  finscore: {
    title: 'FinScore Metric',
    badge: 'Knowledge & Consistency',
    description: 'Your overall financial literacy, quiz accuracy, and daily learning consistency score (0 - 1000+).',
    bullets: [
      { label: 'How to increase', text: 'Read articles, complete modules, and score 100% on quizzes (+10 to +50 pts).' },
      { label: 'Consistency bonus', text: 'Maintained and multiplied by building daily learning streaks.' },
      { label: 'Why it matters', text: 'Higher FinScores boost your leaderboard tier and unlock exclusive perks.' }
    ],
    footer: 'Keep reading and testing your knowledge daily to maximize your FinScore!'
  },
  finstars: {
    title: 'FinStars Balance',
    badge: 'Reward Currency',
    description: 'The official reward currency of FinEd that you earn through active learning and engagement.',
    bullets: [
      { label: 'Daily Learning', text: 'Earn +10 to +50 FinStars for every article read and lesson completed.' },
      { label: 'Streak Milestones', text: 'Claim weekly milestone bonuses (+25 to +100 FinStars).' },
      { label: 'Invites & Shares', text: 'Get +100 FinStars for every friend who joins with your referral.' }
    ],
    footer: 'Click "Redeem Now" to exchange stars for real-world gift cards & coupons.'
  },
  rank: {
    title: 'Global Rank',
    badge: 'Community Standing',
    description: 'Your real-time rank on the FinEd leaderboard among all active financial learners.',
    bullets: [
      { label: 'Ranking Basis', text: 'Calculated dynamically from your cumulative FinScore & FinStars.' },
      { label: 'Leaderboards', text: 'Compete across All-Time, Monthly, and Weekly leaderboards.' },
      { label: 'Prizes', text: 'Top 3 learners each month receive verified badges and special perks!' }
    ],
    footer: 'Check the Leaderboard section below to see top learners and prize standings.'
  },
  streak: {
    title: 'Daily Streak',
    badge: 'Habit Builder',
    description: 'The number of consecutive days you have engaged in active financial learning on FinEd.',
    bullets: [
      { label: 'Daily Goal', text: 'Read at least 1 article or complete 1 module every 24 hours.' },
      { label: 'Multiplier', text: 'Longer streaks multiply your daily FinStars and score bonuses.' },
      { label: 'Streak Alert', text: 'Missing a 24h window resets your active streak back to 1 Day.' }
    ],
    footer: 'Build a 7+ day streak to unlock massive milestone rewards!'
  }
};

function StatInfo({ id, open, onToggle, onHover, align = 'left', tone = 'light' }) {
  const info = STAT_INFO[id];
  return (
    <span
      className="rw-info"
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
    >
      <button
        type="button"
        className={`rw-info-btn rw-info-btn--${tone}`}
        aria-label={`${info.title} information`}
        aria-expanded={open}
        onClick={() => onToggle(id)}
        onFocus={() => onHover(id)}
        onBlur={() => onHover(null)}
      >
        <PiInfoBold aria-hidden="true" />
      </button>
      {open && (
        <span role="tooltip" className={`rw-pop rw-pop--${align}`}>
          <span className="rw-pop-head">
            <strong>{info.title}</strong>
            <span className="rw-pop-badge">{info.badge}</span>
          </span>
          <span className="rw-pop-desc">{info.description}</span>
          <span className="rw-pop-list">
            {info.bullets.map((b) => (
              <span key={b.label}><strong>{b.label}:</strong> {b.text}</span>
            ))}
          </span>
          <span className="rw-pop-foot">{info.footer}</span>
        </span>
      )}
    </span>
  );
}

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
  const levelInfo = getUserLevel(userData);

  const starsToRedeem = Math.max(0, REDEEM_MIN_STARS - finStars);
  const redeemProgress = Math.min(100, (finStars / REDEEM_MIN_STARS) * 100);

  const infoProps = (id) => ({
    id,
    open: hoveredTooltip === id || activeTooltip === id,
    onToggle: (key) => setActiveTooltip(activeTooltip === key ? null : key),
    onHover: setHoveredTooltip,
  });

  return (
    <section className="rw-stats" aria-label="Your rewards summary">
      {/* FinStars wallet */}
      <div className="rw-wallet">
        <div className="rw-wallet-top">
          <span className="rw-wallet-label">
            <PiStarFill aria-hidden="true" /> FinStars balance
          </span>
          <StatInfo {...infoProps('finstars')} tone="dark" />
        </div>
        <span className="rw-wallet-value">{finStars}</span>
        <span className="rw-wallet-sub">Exchange your FinStars for rewards and coupons.</span>

        <div className="rw-wallet-meter">
          <div className="rw-wallet-track" aria-hidden="true">
            <span style={{ width: `${redeemProgress}%` }} />
          </div>
          <span className="rw-wallet-meter-text">
            {starsToRedeem > 0
              ? `${starsToRedeem} more to reach ${REDEEM_MIN_STARS}, where redemptions start`
              : `You have enough for rewards starting at ${REDEEM_MIN_STARS} FinStars`}
          </span>
        </div>

        <button type="button" className="rw-btn" onClick={onRedeemClick}>
          Redeem Now <PiArrowRightBold aria-hidden="true" />
        </button>
      </div>

      {/* FinScore, rank, streak */}
      <div className="rw-tiles">
        <div className="rw-tile">
          <div className="rw-tile-head">
            <span className="rw-tile-icon rw-tile-icon--score" aria-hidden="true"><PiLightningFill /></span>
            <span className="rw-tile-label">FinScore</span>
            <StatInfo {...infoProps('finscore')} />
          </div>
          <div className="rw-tile-value-row">
            <span className="rw-tile-value">{finScore}</span>
            {finScore > 0 && scoreDelta > 0 && (
              <span className="rw-delta rw-delta--up"><PiTrendUpBold aria-hidden="true" /> +{scoreDelta}</span>
            )}
            {finScore > 0 && scoreDelta < 0 && (
              <span className="rw-delta rw-delta--down"><PiTrendDownBold aria-hidden="true" /> {scoreDelta}</span>
            )}
          </div>
          <p className="rw-tile-sub">{levelInfo.label}. Overall financial knowledge &amp; consistency score.</p>
          <button type="button" className="rw-link" onClick={() => navigate('/courses')}>
            Boost Score <PiArrowRightBold aria-hidden="true" />
          </button>
        </div>

        <div className="rw-tile">
          <div className="rw-tile-head">
            <span className="rw-tile-icon rw-tile-icon--rank" aria-hidden="true"><PiTrophyFill /></span>
            <span className="rw-tile-label">Rank</span>
            <StatInfo {...infoProps('rank')} align="right" />
          </div>
          <div className="rw-tile-value-row">
            <span className="rw-tile-value">#{rank}</span>
          </div>
          <p className="rw-tile-sub">Your current standing among all active learners!</p>
          <button type="button" className="rw-link" onClick={onLeaderboardClick}>
            View Leaderboard <PiArrowRightBold aria-hidden="true" />
          </button>
        </div>

        <div className="rw-tile">
          <div className="rw-tile-head">
            <span className="rw-tile-icon rw-tile-icon--streak" aria-hidden="true"><PiFireFill /></span>
            <span className="rw-tile-label">Current streak</span>
            <StatInfo {...infoProps('streak')} align="right" />
          </div>
          <div className="rw-tile-value-row">
            <span className="rw-tile-value">{streak} <small>{streak === 1 ? 'day' : 'days'}</small></span>
          </div>
          <p className="rw-tile-sub">Personal best: <strong>{bestStreak} days</strong>. Keep learning daily!</p>
          <button type="button" className="rw-link" onClick={() => navigate('/courses')}>
            Keep Streak <PiArrowRightBold aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default StatsBanner;
