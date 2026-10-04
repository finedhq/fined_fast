import { useEffect, useState, useCallback } from 'react';
import { PiArrowRightBold, PiGiftFill, PiWarningCircleBold } from 'react-icons/pi';
import { useAuth0 } from '@auth0/auth0-react';
import instance, { setAuthToken } from '../../lib/axios';
import { getLeaderboard } from '../../services/api';
import StatsBanner from './components/StatsBanner';
import EarnFinStars from './components/EarnFinStars';
import RedeemSection from './components/RedeemSection';
import LeaderboardSection from './components/LeaderboardSection';
import './RewardsPage.css';

const RewardsPage = () => {
  const { user, isAuthenticated, isLoading, loginWithRedirect, getAccessTokenSilently } = useAuth0();
  
  const [userData, setUserData] = useState({
    fin_score: 0,
    fin_stars: 0,
    rank: 1,
    streak_count: 1,
    best_streak: 1,
  });
  
  const [timeframe, setTimeframe] = useState('all_time');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch Leaderboard for specific timeframe
  const fetchLeaderboardData = useCallback(async (selectedTimeframe) => {
    setLoadingLeaderboard(true);
    try {
      const data = await getLeaderboard(selectedTimeframe);
      if (data && Array.isArray(data)) {
        setLeaderboardData(data);
      }
    } catch (err) {
      console.warn('Leaderboard fetch error:', err);
    } finally {
      setLoadingLeaderboard(false);
    }
  }, []);

  // 1. Load User Stats once on auth ready
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) {
      setLoadingData(false);
      return;
    }

    async function loadUserData() {
      setLoadingData(true);
      setError('');
      try {
        try {
          const token = await getAccessTokenSilently();
          setAuthToken(token);
        } catch (tokenErr) {
          console.warn('Could not get silent auth token:', tokenErr);
        }

        // Fetch user dashboard data
        const res = await instance.post('/home/getdata', {
          email: user.email,
          userId: user.sub
        });

        if (res.data?.userData) {
          setUserData(prev => ({
            ...prev,
            ...res.data.userData,
            email: user.email,
            name: user.name || user.nickname || (user.email ? user.email.split('@')[0] : 'User')
          }));
        }
      } catch (err) {
        console.error('Failed to load user rewards data:', err);
        setError('Failed to fetch your rewards data. Please make sure the backend is running and try again.');
      } finally {
        setLoadingData(false);
      }
    }

    loadUserData();
  }, [isAuthenticated, user, isLoading, getAccessTokenSilently]);

  // 2. Fetch leaderboard whenever timeframe changes or on mount
  useEffect(() => {
    fetchLeaderboardData(timeframe);
  }, [timeframe, fetchLeaderboardData]);

  // 3. Listen for live finstars-updated events
  useEffect(() => {
    const handleStarsUpdated = (e) => {
      const added = e.detail?.added || 0;
      if (added > 0) {
        setUserData(prev => ({
          ...prev,
          fin_stars: (prev.fin_stars || 0) + added
        }));
      }
    };
    window.addEventListener('finstars-updated', handleStarsUpdated);
    return () => window.removeEventListener('finstars-updated', handleStarsUpdated);
  }, []);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    fetchLeaderboardData(newTimeframe);
  };

  const scrollToRedeem = () => {
    const el = document.getElementById('redeem-rewards-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToLeaderboard = () => {
    const el = document.getElementById('leaderboard-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // 1. Loading State
  if (isLoading || loadingData) {
    return (
      <div className="rw-page" aria-busy="true" aria-label="Loading your rewards and rankings">
        <div className="rw-container">
          <div className="rw-skel rw-skel--title" />
          <div className="rw-stats">
            <div className="rw-skel rw-skel--wallet" />
            <div className="rw-skel rw-skel--tiles" />
          </div>
          <div className="rw-skel rw-skel--block" />
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State: Show Login Prompt
  if (!isAuthenticated || !user) {
    return (
      <div className="rw-page rw-page--center">
        <div className="rw-panel rw-message">
          <span className="rw-message-icon" aria-hidden="true"><PiGiftFill /></span>
          <h2>Sign In to Access Rewards &amp; Leaderboard</h2>
          <p>
            Earn FinStars by taking courses, building streaks, and competing on the global leaderboard. Log in to track your score and unlock exclusive rewards.
          </p>
          <button
            className="rw-btn"
            onClick={() => loginWithRedirect({ appState: { returnTo: '/rewards' } })}
            type="button"
          >
            Log In / Sign Up <PiArrowRightBold aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Error State
  if (error) {
    return (
      <div className="rw-page rw-page--center">
        <div className="rw-panel rw-message" role="alert">
          <span className="rw-message-icon" aria-hidden="true"><PiWarningCircleBold /></span>
          <h2>Failed to Load Rewards</h2>
          <p>{error}</p>
          <button className="rw-btn" onClick={() => window.location.reload()} type="button">
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // 4. Authenticated Main View with Live Data
  return (
    <div className="rw-page">
      <div className="rw-container">
        <header className="rw-header">
          <h1 className="rw-title">Rewards</h1>
          <p className="rw-subtitle">Learn, earn and grow. Redeem FinStars for exciting rewards and offers.</p>
        </header>

        {/* 1. FinStars wallet + FinScore, rank and streak */}
        <StatsBanner
          userData={userData}
          onRedeemClick={scrollToRedeem}
          onLeaderboardClick={scrollToLeaderboard}
        />

        {/* 2 + 3. Ways to earn beside redeeming */}
        <div className="rw-split">
          <EarnFinStars userEmail={user?.email} />
          <RedeemSection
            userStars={userData?.fin_stars ?? 0}
            userEmail={user?.email}
          />
        </div>

        {/* 4. Leaderboard (time filters, podium, highlighted user) */}
        <LeaderboardSection
          userData={userData}
          apiLeaderboard={leaderboardData}
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          loadingLeaderboard={loadingLeaderboard}
        />
      </div>
    </div>
  );
};

export default RewardsPage;
