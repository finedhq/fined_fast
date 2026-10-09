import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import instance, { setAuthToken } from '../../lib/axios';
import Lenis from 'lenis';
import './DashboardHome.css';
import { fetchArticles, getLocalCachedArticles } from '../../services/api';
import { hasAiLens } from "../../utils/textFormatters";
import { getUserLevel } from "../../utils/level";
import { useUserProfile } from "../../context/UserProfileContext";
import {
  PiArrowRightBold,
  PiBookOpenTextBold,
  PiCaretRightBold,
  PiFireFill,
  PiInfoBold,
  PiSparkleFill,
  PiStarFill,
  PiTrophyFill,
  PiWarningCircleBold,
} from "react-icons/pi";

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

function Avatar({ src, name }) {
  const [broken, setBroken] = useState(false);
  if (src && !broken) {
    return <img src={src} alt="" className="dh-avatar" onError={() => setBroken(true)} />;
  }
  return <span className="dh-avatar dh-avatar--initial" aria-hidden="true">{(name || "U").charAt(0).toUpperCase()}</span>;
}

function ProgressRing({ percent }) {
  return (
    <svg className="dh-ring" viewBox="0 0 120 120" aria-hidden="true">
      <circle className="dh-ring-track" cx="60" cy="60" r="50" pathLength="100" />
      {percent > 0 && (
        <circle
          className="dh-ring-fill"
          cx="60"
          cy="60"
          r="50"
          pathLength="100"
          style={{ strokeDasharray: `${percent} 100` }}
        />
      )}
    </svg>
  );
}

function StatRow({ icon, tone, label, value, onClick, title }) {
  return (
    <li>
      <button type="button" className="dh-stat" onClick={onClick} title={title}>
        <span className={`dh-stat-icon dh-stat-icon--${tone}`} aria-hidden="true">{icon}</span>
        <span className="dh-stat-label">{label}</span>
        <span className="dh-stat-value">{value}</span>
        <PiCaretRightBold className="dh-stat-caret" aria-hidden="true" />
      </button>
    </li>
  );
}

function ArticleRow({ article, onAuthor }) {
  const authorName = article.authors?.name || article.author || "Shravan Mutha";
  const authorSlug = article.authors?.slug || "shravan-mutha";
  return (
    <li className="dh-read">
      <div className="dh-read-thumb">
        {article.image_url ? <img src={article.image_url} alt="" loading="lazy" /> : <PiBookOpenTextBold aria-hidden="true" />}
      </div>
      <div className="dh-read-body">
        <div className="dh-read-tags">
          <span className="dh-tag">{article.tag || "Finance"}</span>
          {hasAiLens(article) && (
            <span className="dh-tag dh-tag--ai"><PiSparkleFill aria-hidden="true" /> AI Lens</span>
          )}
        </div>
        <h3 className="dh-read-title">
          <Link to={`/articles/${article.slug || article.id}`} className="dh-stretch">{article.title}</Link>
        </h3>
        {article.description && <p className="dh-read-desc">{article.description}</p>}
        <p className="dh-read-meta">
          <span>{formatDate(article.published_at || article.created_at)}</span>
          <button type="button" className="dh-author" onClick={() => onAuthor(authorSlug)}>
            By {authorName}
          </button>
        </p>
      </div>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div className="dh-page" aria-busy="true" aria-label="Loading dashboard">
      <div className="dh-grid">
        <div className="dh-skel dh-area-greet dh-skel--greet" />
        <div className="dh-skel dh-area-card dh-skel--card" />
        <div className="dh-skel dh-area-continue dh-skel--block" />
        <div className="dh-skel dh-area-stats dh-skel--block" />
        <div className="dh-skel dh-area-course dh-skel--block" />
      </div>
    </div>
  );
}

const DASHBOARD_CACHE_PREFIX = "fined_dashboard_data_";
const LAST_DASHBOARD_KEY = "fined_dashboard_last_data";

function getCachedDashboard(email) {
  try {
    if (email) {
      const userRaw = localStorage.getItem(`${DASHBOARD_CACHE_PREFIX}${email}`) ||
                      sessionStorage.getItem(`${DASHBOARD_CACHE_PREFIX}${email}`);
      if (userRaw) return JSON.parse(userRaw);
    }
    const lastRaw = localStorage.getItem(LAST_DASHBOARD_KEY) ||
                    sessionStorage.getItem(LAST_DASHBOARD_KEY);
    if (lastRaw) return JSON.parse(lastRaw);
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

function setCachedDashboard(email, data) {
  try {
    const serialized = JSON.stringify(data);
    if (email) {
      localStorage.setItem(`${DASHBOARD_CACHE_PREFIX}${email}`, serialized);
      sessionStorage.setItem(`${DASHBOARD_CACHE_PREFIX}${email}`, serialized);
    }
    localStorage.setItem(LAST_DASHBOARD_KEY, serialized);
    sessionStorage.setItem(LAST_DASHBOARD_KEY, serialized);
  } catch {
    // Ignore storage quota errors
  }
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  const { refreshProfile } = useUserProfile();

  const [userData, setUserData] = useState(() => {
    const c = getCachedDashboard();
    return c?.userData || {};
  });
  const [ongoingCourse, setOngoingCourse] = useState(() => {
    const c = getCachedDashboard();
    return c?.ongoingCourse || {};
  });
  const [recommendedCourses, setRecommendedCourses] = useState(() => {
    const c = getCachedDashboard();
    return c?.recommendedCourses || [];
  });
  const [recommendedArticles, setRecommendedArticles] = useState(() => {
    const c = getCachedDashboard();
    if (c?.recommendedArticles && c.recommendedArticles.length > 0) {
      return c.recommendedArticles;
    }
    const local = getLocalCachedArticles();
    return Array.isArray(local) ? local.slice(0, 6) : [];
  });

  const [loadingData, setLoadingData] = useState(() => {
    const c = getCachedDashboard();
    return !c?.userData || c.userData.fin_score === undefined;
  });
  const [error, setError] = useState("");
  const [showScoreInfo, setShowScoreInfo] = useState(false);

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

  // When user profile loads from Auth0, hydrate user-specific cache if available
  useEffect(() => {
    if (!user?.email) return;
    const cached = getCachedDashboard(user.email);
    if (cached?.userData) {
      setUserData(cached.userData);
      if (cached.ongoingCourse) setOngoingCourse(cached.ongoingCourse);
      if (cached.recommendedCourses) setRecommendedCourses(cached.recommendedCourses);
      if (cached.recommendedArticles) setRecommendedArticles(cached.recommendedArticles);
      setLoadingData(false);
    }
  }, [user?.email]);

  async function fetchData(userEmail, userId) {
    const cached = getCachedDashboard(userEmail);
    const hasCache = Boolean(cached?.userData || (userData && userData.fin_score !== undefined));
    if (!hasCache) {
      setLoadingData(true);
    }
    try {
      // Fire /home/getdata and recommended articles in parallel!
      const [homeRes, articlesRes] = await Promise.all([
        instance.post("/home/getdata", { email: userEmail, userId }),
        fetchArticles({ limit: 6, offset: 0 }).catch(() => ({ articles: [] }))
      ]);

      let newUserData = null;
      let newOngoingCourse = null;
      let newRecommendedCourses = [];

      if (homeRes.data?.userData) {
        newUserData = homeRes.data.userData;
        if (user?.name && !newUserData.name) newUserData.name = user.name;
        if (user?.picture && !newUserData.picture) newUserData.picture = user.picture;

        newOngoingCourse = homeRes.data.ongoingCourseData || {};
        const courses = homeRes.data.recommendedCourses || [];
        newRecommendedCourses = courses.slice(0, 1);

        setUserData(newUserData);
        setOngoingCourse(newOngoingCourse);
        setRecommendedCourses(newRecommendedCourses);
      }

      const allArticles = Array.isArray(articlesRes) ? articlesRes : (articlesRes.articles || []);
      const sortedArticles = allArticles
        .sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));
      setRecommendedArticles(sortedArticles);

      if (newUserData) {
        setCachedDashboard(userEmail, {
          userData: newUserData,
          ongoingCourse: newOngoingCourse,
          recommendedCourses: newRecommendedCourses,
          recommendedArticles: sortedArticles
        });
      }
      setError("");
    } catch {
      if (!hasCache) {
        setError("Failed to fetch your data.");
      }
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user?.email) return;

    fetchData(user.email, user.sub);

    // Keep token in sync and refresh profile in background
    getAccessTokenSilently()
      .then(token => setAuthToken(token))
      .catch(() => {});
  }, [isLoading, isAuthenticated, user?.email, user?.sub, getAccessTokenSilently]);

  if (loadingData && (!userData || userData.fin_score === undefined)) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="dh-page dh-page--center">
        <div className="dh-error" role="alert">
          <PiWarningCircleBold className="dh-error-icon" aria-hidden="true" />
          <h2>Something went wrong</h2>
          <p>{error}</p>
          <button type="button" className="dh-btn" onClick={() => navigate('/')}>Return to Home</button>
        </div>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0] || userData?.name?.split(" ")[0] || "User";
  const finStars = userData?.fin_stars || 0;
  const finScore = userData?.fin_score || 0;
  const streak = userData?.streak_count || 0;
  const levelInfo = getUserLevel(userData);

  const hasCourse = Boolean(ongoingCourse?.title);
  const releasedLessons = ongoingCourse?.modules_count || 0;
  // A weekly-release course: measure against the whole planned course, not just what's out so far
  const totalLessons = Math.max(releasedLessons, ongoingCourse?.planned_modules || 0);
  const currentLesson = ongoingCourse?.current_lesson || 1;
  const completedLessons = ongoingCourse?.completed_modules || 0;
  const progressPercent = totalLessons
    ? Math.min(100, Math.floor((completedLessons / totalLessons) * 100))
    : 0;
  const courseLink = ongoingCourse?.id ? `/courses/${ongoingCourse.slug || ongoingCourse.id}` : '/courses';

  const goToRewards = () => navigate('/rewards');
  const course = recommendedCourses[0];

  return (
    <div className="dh-page">
      <div className="dh-grid">
        {/* Greeting */}
        <header className="dh-area-greet dh-greet">
          <div>
            <h1 className="dh-title">Welcome back, {firstName}</h1>
            <p className="dh-sub">Let's continue your journey towards financial freedom.</p>
          </div>
          <button type="button" className="dh-streak" onClick={goToRewards} title="View Rewards & Streaks">
            <PiFireFill aria-hidden="true" />
            {streak > 0 ? `You're on a ${streak} day streak!` : "Start your streak today"}
          </button>
        </header>

        {/* FinEd card: identity + FinScore */}
        <section className="dh-area-card dh-card" aria-label="Your FinEd card">
          <Link to="/rewards" className="dh-card-link" title="View FinScore details & Rewards">
            <span className="dh-sr-only">View FinScore details and rewards</span>
          </Link>
          <div className="dh-card-top">
            <span className="dh-card-logo"><img src="/logo.ico" alt="FinEd" /></span>
            <span className="dh-card-level">{levelInfo.label}</span>
          </div>

          <div className="dh-card-score">
            <span className="dh-card-score-label">
              FinScore
              <button
                type="button"
                className="dh-info-btn"
                aria-expanded={showScoreInfo}
                aria-controls="dh-score-info"
                onClick={() => setShowScoreInfo((v) => !v)}
                onBlur={() => setShowScoreInfo(false)}
              >
                <PiInfoBold aria-hidden="true" />
                <span className="dh-sr-only">What is FinScore?</span>
              </button>
            </span>
            <span className="dh-card-score-value">{finScore}</span>
            <span className="dh-card-next">
              {levelInfo.pointsToNext === null
                ? "Top level reached"
                : `${levelInfo.pointsToNext} points to ${levelInfo.nextName}`}
            </span>
          </div>

          <div className="dh-card-holder">
            <Avatar src={user?.picture || userData?.picture} name={user?.name || userData?.name} />
            <span className="dh-card-name">{user?.name || userData?.name || "User Name"}</span>
          </div>

          <p id="dh-score-info" role="tooltip" className={`dh-info-body${showScoreInfo ? " is-open" : ""}`}>
            FinScore is your overall engagement score! It grows as you complete Courses, read Articles and maintain your daily Consistency. Keep your daily streaks alive to earn bonuses and avoid inactivity penalties!
          </p>
        </section>

        {/* Continue learning */}
        <section className="dh-area-continue dh-panel dh-continue" aria-labelledby="dh-continue-title">
          {hasCourse && totalLessons > 0 ? (
            <div className="dh-continue-ring">
              <ProgressRing percent={progressPercent} />
              <span className="dh-continue-pct">{progressPercent}%</span>
            </div>
          ) : (
            <div className="dh-continue-ring dh-continue-ring--empty" aria-hidden="true">
              <PiBookOpenTextBold />
            </div>
          )}
          <div className="dh-continue-body">
            <span className="dh-kicker">Continue learning</span>
            <h2 id="dh-continue-title" className="dh-continue-title">
              {hasCourse ? ongoingCourse.title : "No course started yet"}
            </h2>
            {hasCourse && totalLessons > 0 && (
              <p className="dh-continue-lesson">Lesson {currentLesson} of {totalLessons}</p>
            )}
          </div>
          {/* Outside the text column so it can take the full card width on phones */}
          <button type="button" className="dh-btn dh-continue-btn" onClick={() => navigate(courseLink)}>
            {hasCourse ? "Continue learning" : "Browse courses"}
            <PiArrowRightBold aria-hidden="true" />
          </button>
        </section>

        {/* Stats */}
        <section className="dh-area-stats" aria-labelledby="dh-stats-heading">
          <h2 id="dh-stats-heading" className="dh-section-title">Your progress</h2>
          <ul className="dh-panel dh-stats">
            <StatRow
              icon={<PiFireFill />}
              tone="streak"
              label="Streak"
              value={`${streak} ${streak === 1 ? "day" : "days"}`}
              onClick={goToRewards}
              title="View Rewards & Streaks"
            />
            <StatRow
              icon={<PiStarFill />}
              tone="stars"
              label="FinStars"
              value={finStars}
              onClick={goToRewards}
              title="View Rewards & FinStars"
            />
            <StatRow
              icon={<PiTrophyFill />}
              tone="rank"
              label="Rank"
              value={userData?.rank ? `#${userData.rank}` : "-"}
              onClick={goToRewards}
              title="View Leaderboard & Rankings"
            />
          </ul>
        </section>

        {/* Recommended course */}
        <section className="dh-area-course" aria-labelledby="dh-course-heading">
          <h2 id="dh-course-heading" className="dh-section-title">Recommended course</h2>
          {course ? (
            <article className="dh-panel dh-course">
              <div className="dh-course-media">
                {course.thumbnail_url ? <img src={course.thumbnail_url} alt="" loading="lazy" /> : <PiBookOpenTextBold aria-hidden="true" />}
              </div>
              <div className="dh-course-body">
                <span className="dh-tag">{course.modules_count || 0} modules</span>
                <h3 className="dh-course-title">
                  <Link to={`/courses/${course.slug || course.id}`} className="dh-stretch">{course.title}</Link>
                </h3>
                {course.description && <p className="dh-course-desc">{course.description}</p>}
                <p className="dh-read-meta">
                  <span>{formatDate(course.created_at || course.published_at)}</span>
                  <span className="dh-by">By FinEd</span>
                </p>
              </div>
            </article>
          ) : (
            <p className="dh-empty">No courses available right now.</p>
          )}
        </section>

        {/* Recommended articles */}
        <section className="dh-area-articles" aria-labelledby="dh-articles-heading">
          <div className="dh-section-head">
            <h2 id="dh-articles-heading" className="dh-section-title">Recommended articles</h2>
            <Link to="/articles" className="dh-view-all">View all <PiArrowRightBold aria-hidden="true" /></Link>
          </div>
          {recommendedArticles.length > 0 ? (
            <ul className="dh-reads">
              {recommendedArticles.map(article => (
                <ArticleRow
                  key={article.id}
                  article={article}
                  onAuthor={(slug) => navigate(`/authors/${slug}`)}
                />
              ))}
            </ul>
          ) : (
            <p className="dh-empty">No articles available right now.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
