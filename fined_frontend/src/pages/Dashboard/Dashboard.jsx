import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import instance, { setAuthToken } from '../../lib/axios';
import Lenis from 'lenis';
import RevealOnScroll from '../../components/RevealOnScroll';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();

  const [userData, setUserData] = useState({});
  const [ongoingCourse, setOngoingCourse] = useState({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    getAccessTokenSilently().then(token => {
      setAuthToken(token);
      fetchData(user.email, user.sub);
    }).catch(err => {
      console.error("Error fetching access token", err);
      setError("Authentication error. Please log in again.");
      setLoadingData(false);
    });
  }, [isLoading, isAuthenticated, user, getAccessTokenSilently]);

  async function fetchData(userEmail, userId) {
    setLoadingData(true);
    try {
      const res = await instance.post("/home/getdata", { email: userEmail, userId });
      if (res.data?.userData) {
        setUserData(res.data.userData);
        setOngoingCourse(res.data.ongoingCourseData || {});
      }
    } catch (error) {
      setError("Failed to fetch your data.");
    } finally {
      setLoadingData(false);
    }
  }

  if (isLoading || loadingData) {
    return (
      <div className="dash-loading-container">
        <div className="dash-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-loading-container">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '0.5rem' }}>Oops! Something went wrong</h2>
          <p style={{ color: '#4b5563', marginBottom: '1.5rem' }}>{error}</p>
          <button 
            onClick={() => navigate('/')}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  // Derive level
  const level = Math.floor((userData?.fin_stars || 0) / 100) + 1;
  
  const getLevelTitle = (lvl) => {
    if (lvl <= 3) return "Beginner";
    if (lvl <= 6) return "Planner";
    if (lvl <= 9) return "Strategist";
    return "Master";
  };
  const levelTitle = getLevelTitle(level);

  const progressPercent = ongoingCourse?.modules_count 
    ? Math.floor((1 / ongoingCourse.modules_count) * 100) 
    : 57; // Dummy if not enough data

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        {/* TOP SECTION */}
        <div className="dash-top-section">
          
          {/* LEFT CARD (Welcome & Course) */}
          <RevealOnScroll delay={100}>
          <div className="dash-welcome-card">
            <div className="dash-welcome-content">
              <h1 className="dash-greeting">Good Morning, {user?.name?.split(" ")[0] || "User"}! 👋</h1>
              <p className="dash-subtitle">Let's continue your journey towards financial freedom.</p>
              
              <div className="dash-streak-pill">
                🔥 You're on a {userData?.streak_count || 0} day streak!
              </div>

              <div className="dash-course-module">
                <div className="dash-course-info">
                  <div className="dash-course-img-placeholder">
                    <span>🌱</span>
                  </div>
                  <div className="dash-course-details">
                    <span className="dash-course-label">Continue Learning</span>
                    <h3 className="dash-course-title">{ongoingCourse?.title || "Budgeting 101"}</h3>
                    <span className="dash-course-lesson">Lesson 4 of {ongoingCourse?.modules_count || 7}</span>
                    <div className="dash-progress-container">
                      <div className="dash-progress-bar">
                        <div className="dash-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                      <span className="dash-progress-text">{progressPercent}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="dash-actions">
                <button 
                  className="dash-btn-primary"
                  onClick={() => navigate(ongoingCourse?.id ? `/courses/course/${ongoingCourse.id}` : '/courses')}
                >
                  Continue Learning →
                </button>
                <button className="dash-btn-icon">
                  ▷
                </button>
              </div>
            </div>

            <div className="dash-fox-illustration">
              <div className="dash-speech-bubble">
                Great job<br/>staying consistent!<br/>Keep it up! 🎉
              </div>
              <img src="/fox-placeholder.png" alt="Fox Mascot" className="dash-fox-img" 
                onError={(e) => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div className="dash-fox-fallback" style={{ display: 'none' }}>🦊</div>
            </div>
          </div>
          </RevealOnScroll>

          {/* RIGHT CARD (Stats & FinScore) */}
          <RevealOnScroll delay={300}>
          <div className="dash-stats-card">
            <div className="dash-profile-section">
              <img src={user?.picture || "/profile.png"} alt="Profile" className="dash-profile-pic" />
              <div className="dash-profile-info">
                <h3 className="dash-profile-name">{user?.name || "User Name"}</h3>
                <p className="dash-profile-level">Level {level} • {levelTitle}</p>
              </div>
            </div>

            <div className="dash-stats-list">
              <div className="dash-stat-item">
                <div className="dash-stat-icon-wrapper icon-streak">
                  <span className="dash-stat-icon">🔥</span>
                </div>
                <div className="dash-stat-main">
                  <strong style={{fontSize: "19px"}}>{userData?.streak_count || 0}</strong> Days
                </div>
                <div className="dash-stat-label">STREAK</div>
              </div>
              
              <div className="dash-stat-item">
                <div className="dash-stat-icon-wrapper icon-finstars">
                  <span className="dash-stat-icon">⭐</span>
                </div>
                <div className="dash-stat-main">
                  <strong style={{fontSize: "19px"}}>{userData?.fin_stars || 0}</strong>
                </div>
                <div className="dash-stat-label">FINSTARS</div>
              </div>
              
              <div className="dash-stat-item">
                <div className="dash-stat-icon-wrapper icon-modules">
                  <span className="dash-stat-icon">✅</span>
                </div>
                <div className="dash-stat-main">
                  <strong style={{fontSize: "19px"}}>2</strong> Done
                </div>
                <div className="dash-stat-label">MODULES</div>
              </div>
            </div>

            <div className="dash-finscore-section">
              <div className="dash-finscore-header">
                <span className="dash-finscore-label">FinScore</span>
                <span className="dash-finscore-info">ⓘ</span>
              </div>
              <div className="dash-finscore-display">
                <div className="dash-finscore-value-group">
                  <span className="dash-finscore-value">{userData?.fin_score || 0}</span>
                  <span className="dash-finscore-trend">▲ 24</span>
                </div>
                <div className="dash-finscore-chart">
                  <div className="dash-bar dash-bar-1"></div>
                  <div className="dash-bar dash-bar-2"></div>
                  <div className="dash-bar dash-bar-3"></div>
                  <div className="dash-chart-flag">🚩</div>
                </div>
              </div>
            </div>
          </div>
          </RevealOnScroll>
          
        </div>

        {/* BOTTOM SECTION (Today's Challenge) */}
        <RevealOnScroll delay={200}>
        <div className="dash-challenge-card">
          <div className="dash-challenge-left">
            <div className="dash-challenge-illustration">
              <span className="dash-challenge-target">🎯</span>
            </div>
            <div className="dash-challenge-content">
              <div className="dash-challenge-header">
                <span className="dash-challenge-title">Today's Challenge</span>
                <span className="dash-challenge-badge">New</span>
              </div>
              <h3 className="dash-challenge-heading">Set a weekly food budget</h3>
              <p className="dash-challenge-desc">Plan your meals and stick to your budget for the week.</p>
            </div>
          </div>
          
          <div className="dash-challenge-right">
            <div className="dash-challenge-reward">
              <span className="dash-reward-label">Reward</span>
              <div className="dash-reward-value">
                <span className="dash-reward-icon">⭐</span>
                <div className="dash-reward-text-group">
                  <span className="dash-reward-amount">+25</span>
                  <span className="dash-reward-text">FinStars</span>
                </div>
              </div>
            </div>
            <button className="dash-btn-primary">
              Start Challenge →
            </button>
          </div>
        </div>
        </RevealOnScroll>

      </div>
    </div>
  );
};

export default Dashboard;
