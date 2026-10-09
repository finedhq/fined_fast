import { useEffect, useState, useRef } from "react";
import instance from "../../lib/axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";
import RevealOnScroll from "../../components/RevealOnScroll";
import CertificateGenerator from "../../components/Certificate/CertificateGenerator";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import "./CourseOverview.css";
import "../Dashboard/Dashboard.css";
import "../Dashboard/DashboardHome.css";
import { getUserLevel } from "../../utils/level";
import {
  PiArrowLeftBold,
  PiCaretRightBold,
  PiCertificateBold,
  PiDesktopBold,
  PiDownloadSimpleBold,
  PiFireFill,
  PiInfoBold,
  PiLockSimpleBold,
  PiSparkleFill,
  PiStarFill,
  PiTrophyFill,
} from "react-icons/pi";
import completedModuleLogo from '../../assets/completed_module_logo.webp';
import currentModuleLogo from '../../assets/current_module_logo.webp';
import lockedModuleLogo from '../../assets/locked_module_logo.webp';
import NotFoundPage from '../NotFound/NotFoundPage';
// SVG Icons for statuses
const CalendarIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);
export default function CourseOverview() {
  const navigate = useNavigate();
  const { courseSlug } = useParams();

  const { user, isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const [email, setEmail] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

  useDocumentTitle(courseTitle ? `${courseTitle} | FinEd` : "Course Overview | FinEd");
  const [course, setCourse] = useState([]);
  const [plannedModules, setPlannedModules] = useState(null);
  const [userData, setUserData] = useState({});
  const [showLockedAlert, setShowLockedAlert] = useState(false);
  const [showSignInAlert, setShowSignInAlert] = useState(false);
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const certificateRef = useRef(null);
  const [, setHeroHeight] = useState('auto');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isMobileWidgetExpanded, setIsMobileWidgetExpanded] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);
  const [activeMobileModule, setActiveMobileModule] = useState(null);
  const [expandedDescModules, setExpandedDescModules] = useState({});
  const [widgetPos, setWidgetPos] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, offsetX: 0, offsetY: 0, hasMoved: false });
  useEffect(() => {
    let timeoutId;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsMobile(window.innerWidth < 1024);
      }, 150); // 150ms debounce ensures it only fires after the user stops resizing
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const updateHeight = () => {
      const bannerEl = document.getElementById('course-hero-banner-id');
      if (bannerEl && window.innerWidth >= 1024) {
        setHeroHeight(`${bannerEl.offsetHeight}px`);
      } else {
        setHeroHeight('auto');
      }
    };

    // Initial checks to catch any delayed layout shifts
    updateHeight();
    setTimeout(updateHeight, 100);
    setTimeout(updateHeight, 500);

    const bannerEl = document.getElementById('course-hero-banner-id');
    if (!bannerEl) return;
    
    const observer = new ResizeObserver(updateHeight);
    observer.observe(bannerEl);
    
    window.addEventListener('resize', updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [loading]);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      setEmail(user.email || 'guest@fined.com');
    } else {
      setEmail('guest@fined.com');
    }
  }, [isLoading, isAuthenticated, user]);

  async function fetchData() {
    if (!email) return;
    setLoading(true);
    try {
      const promises = [instance.post(`/courses/course/${courseSlug}`, { email })];
      if (email !== 'guest@fined.com') {
        promises.push(instance.post("/home/getdata", { email: email, userId: user?.sub || 'guest_sub' }));
      }

      const results = await Promise.all(promises);
      const courseRes = results[0];

      setCourseTitle(courseRes.data.title);
      setCourseDescription(courseRes.data.description || "");
      setCourse(courseRes.data.data || []);
      setPlannedModules(courseRes.data.planned_modules || null);

      if (results.length > 1 && results[1].data?.userData) {
        setUserData(results[1].data.userData);
      }
    } catch {
      setWarning("Failed to load course details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (email) {
      fetchData();
    }
  }, [email, courseSlug]);

  const completedModulesCount = course.filter(module =>
    module.cards.length > 0 && module.cards.every(c => c.status === "completed")
  ).length;

  const totalModulesCount = course.length;
  // A course released module by module (plan §0.2) lists only released modules;
  // its certificate needs every planned module done, not just the ones out so far.
  const certificateModulesCount = Math.max(totalModulesCount, plannedModules || 0);
  const levelInfo = getUserLevel(userData);
  // Header ring: progress through the whole planned course (not just the modules out so far)
  const coursePercent = certificateModulesCount > 0 ? Math.round((completedModulesCount / certificateModulesCount) * 100) : 0;

  const handleDownloadCertificate = async () => {
    if (certificateRef.current) {
      setIsDownloading(true);
      await certificateRef.current.downloadPDF();
      setIsDownloading(false);
    }
  };
  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - widgetPos.x,
      offsetY: e.clientY - widgetPos.y,
      hasMoved: false
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    
    if (Math.abs(e.clientX - dragRef.current.startX) > 5 || Math.abs(e.clientY - dragRef.current.startY) > 5) {
      dragRef.current.hasMoved = true;
    }

    if (dragRef.current.hasMoved) {
      if (e.cancelable) e.preventDefault();
      const newX = e.clientX - dragRef.current.offsetX;
      const newY = e.clientY - dragRef.current.offsetY;
      
      const maxX = window.innerWidth - 60;
      const maxY = window.innerHeight - 60;
      
      setWidgetPos({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  };

  const handlePointerUp = (e) => {
    e.target.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    if (!dragRef.current.hasMoved) {
      setIsMobileWidgetExpanded(true);
    }
  };

  // The API answers a missing (or draft, for non-admins) course with an empty title
  if (!loading && email && !warning && !courseTitle) {
    return <NotFoundPage />;
  }

  return (
    <div className="course-overview-page">
      {loading ? (
        <div className="flex flex-col gap-8 items-center justify-center my-40">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium text-lg">Loading Course...</p>
        </div>
      ) : (
        <div className="course-layout-container">

          <div className="course-main-content">
            {/* Hero Section */}
            <RevealOnScroll>
              <section id="course-hero-banner-id" className="dh-tokens dh-panel co-hero" aria-labelledby="co-hero-title">
                <button type="button" onClick={() => navigate('/courses')} className="co-hero-back">
                  <PiArrowLeftBold aria-hidden="true" /> All courses
                </button>

                <div className="co-hero-main">
                  <div className="co-hero-text">
                    <h1 id="co-hero-title" className="co-hero-title">{courseTitle}</h1>
                    {courseDescription && (
                      <p className="co-hero-desc">{courseDescription}</p>
                    )}
                    <div className="co-hero-tags">
                      <span className="dh-tag">{certificateModulesCount} modules</span>
                      {plannedModules > totalModulesCount && (
                        <span className="dh-tag dh-tag--ai"><PiSparkleFill aria-hidden="true" /> New module every Monday</span>
                      )}
                      <span className="dh-tag">By FinEd</span>
                    </div>

                    <div className="co-hero-progress">
                      <div className="co-hero-progress-row">
                        <span className="co-hero-progress-label">Course progress</span>
                        <span className="co-hero-progress-text">
                          {completedModulesCount} of {certificateModulesCount} modules · {coursePercent}%
                        </span>
                      </div>
                      <div className="co-cert-bar co-hero-bar" aria-hidden="true">
                        <span style={{ width: `${coursePercent}%` }}></span>
                      </div>
                    </div>

                    {email === 'guest@fined.com' && (
                      <div className="co-hero-alert">
                        <PiLockSimpleBold aria-hidden="true" /> Sign in to start the course
                      </div>
                    )}
                  </div>

                </div>
              </section>
            </RevealOnScroll>

            {/* Phones and tablets only (hidden on desktop by CSS) */}
            <div className="dh-tokens co-desktop-tip">
              <span className="co-desktop-tip-icon" aria-hidden="true"><PiDesktopBold /></span>
              <div>
                <div className="co-desktop-tip-title">Best on a laptop or desktop</div>
                <p className="co-desktop-tip-text">
                  The course works on your phone, but its interactive charts and tools are easier to use on a bigger screen.
                </p>
              </div>
            </div>

            {/* Modules Path */}
            <div className="course-path-container">
              {(() => {
                const xOffsets = isMobile ? [23, 77, 28, 72, 18, 82] : [12, 68, 22, 78, 8, 73, 18, 83];
                const getX = (index) => xOffsets[index % xOffsets.length];
                const rowHeight = 250;
                const topPadding = 75;

                const segments = [];
                if (course.length > 1) {
                  for (let i = 0; i < course.length - 1; i++) {
                    const currX = getX(i);
                    const currY = i * rowHeight + 32 + topPadding;
                    const nextX = getX(i + 1);

                    const localCurrY = 0;
                    const localNextY = rowHeight;
                    const curveModifier = isMobile ? 0.5 : 0.75;
                    const cp1Y = localCurrY + rowHeight * curveModifier;
                    const cp2Y = localNextY - rowHeight * curveModifier;

                    const d = `M ${currX} ${localCurrY} C ${currX} ${cp1Y}, ${nextX} ${cp2Y}, ${nextX} ${localNextY}`;
                    segments.push({ d, index: i, top: currY, height: rowHeight });
                  }
                }

                return (
                  <>
                    {segments.map((seg, i) => (
                      <RevealOnScroll key={i} delay={0} threshold={0.75} rootMargin="0px">
                        <svg
                          className="course-path-svg-segment"
                          style={{
                            position: 'absolute',
                            top: `${seg.top}px`,
                            left: 0,
                            width: '100%',
                            height: `${seg.height}px`,
                            pointerEvents: 'none',
                            overflow: 'visible',
                            zIndex: 1
                          }}
                          viewBox={`0 0 100 ${seg.height}`}
                          preserveAspectRatio="none"
                        >
                          <g className="path-segment-group">
                            <defs>
                              <mask id={`course-path-mask-${i}`} maskUnits="userSpaceOnUse">
                                <path
                                  d={seg.d}
                                  fill="none"
                                  stroke="white"
                                  strokeWidth="30"
                                  strokeLinecap="round"
                                  vectorEffect="non-scaling-stroke"
                                  className="segment-mask-line"
                                />
                              </mask>
                            </defs>
                            <path
                              d={seg.d}
                              fill="none"
                              stroke="#818cf8"
                              strokeWidth="5"
                              strokeDasharray="0 15"
                              strokeLinecap="round"
                              vectorEffect="non-scaling-stroke"
                              mask={`url(#course-path-mask-${i})`}
                            />
                          </g>
                        </svg>
                      </RevealOnScroll>
                    ))}

                    {course.map((module, i) => {
                      const isFirstModule = i === 0;
                      let isPreviousCompleted = true;

                      if (!isFirstModule) {
                        for (let j = 0; j < i; j++) {
                          const prevMod = course[j];
                          const isModCompleted = prevMod.cards?.length > 0 && prevMod.cards.every(c => c.status?.toLowerCase() === "completed");
                          if (!isModCompleted) {
                            isPreviousCompleted = false;
                            break;
                          }
                        }
                      }

                      const isCompleted = module.cards?.length > 0 && module.cards.every(c => c.status?.toLowerCase() === "completed");
                      const isGuest = email === 'guest@fined.com';
                      const isClickable = isGuest ? false : (isFirstModule || isPreviousCompleted);
                      const isOngoing = isClickable && !isCompleted;

                      let statusStr = "locked";
                      let StatusImage = lockedModuleLogo;

                      if (isGuest) {
                        statusStr = "locked";
                        StatusImage = lockedModuleLogo;
                      } else if (isCompleted) {
                        statusStr = "completed";
                        StatusImage = completedModuleLogo;
                      } else if (isOngoing) {
                        statusStr = "ongoing";
                        StatusImage = currentModuleLogo;
                      }

                      const cardToResume = module.cards?.find(c => c.status?.toLowerCase() !== "completed") || module.cards?.[0];
                      const x1 = getX(i);

                      const alignmentClass = isMobile
                        ? (i % 2 === 0 ? "pop-right" : "pop-left")
                        : (x1 < 50 ? "pop-right" : "pop-left");

                      const handleLaunchModule = () => {
                        if (isGuest) {
                          setShowSignInAlert(true);
                          return;
                        }
                        if (isClickable && cardToResume) {
                          sessionStorage.removeItem('quiz_score');
                          navigate(`/cards/${cardToResume.cardSlug || cardToResume.card_id}`);
                        } else if (!cardToResume) {
                          setWarning("This module has no cards yet!");
                        } else {
                          setShowLockedAlert(true);
                        }
                      };

                      return (
                        <RevealOnScroll key={i} delay={0}>
                          <div className="module-node-row">
                            <div className={`module-node ${alignmentClass} ${activeMobileModule === i ? 'active-mobile' : ''}`} style={{ left: `${x1}%` }}>
                              <div className="module-base-label">
                                <div className="module-base-number">Module {i + 1}</div>
                                <div className="module-base-title">{module.moduleTitle}</div>
                                <div className={`module-base-badge badge-${statusStr}`}>
                                  {statusStr === 'ongoing' ? 'In Progress' : statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
                                </div>
                              </div>

                              <div
                                className={`module-circle ${statusStr}`}
                                onClick={() => {
                                  if (isMobile) {
                                    if (activeMobileModule === i) {
                                      handleLaunchModule();
                                    } else {
                                      setActiveMobileModule(i);
                                    }
                                  } else {
                                    handleLaunchModule();
                                  }
                                }}
                                role="button"
                                tabIndex={0}
                                title={isClickable ? "Click to open module" : "Module Locked"}
                              >
                                <img src={StatusImage} alt={`${statusStr} module`} className="module-status-logo" />
                              </div>

                              <div className="module-hover-card">
                                <div className="hc-header">
                                  <div className={`hc-icon-placeholder ${statusStr}`}>
                                    <img src={StatusImage} alt={`${statusStr} module`} className="hc-status-logo" />
                                  </div>
                                  <button
                                    className="hc-arrow-btn"
                                    disabled={!isClickable}
                                    onClick={handleLaunchModule}
                                  >
                                    <ArrowRightIcon />
                                  </button>
                                </div>

                                <div className="hc-content">
                                  <div className="hc-module-num">Module {i + 1}</div>
                                  <div className="hc-title">{module.moduleTitle}</div>
                                  <div className={`hc-badge badge-${statusStr}`}>
                                    {statusStr === 'ongoing' ? 'In Progress' : statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
                                  </div>
                                  <div className="hc-desc-container">
                                    <p className={`hc-desc ${isMobile && !expandedDescModules[i] ? 'line-clamp-4' : ''}`}>
                                      {module.moduleDescription || "Explore the contents of this module to advance your knowledge."}
                                    </p>
                                    {isMobile && (
                                      <button 
                                        className="hc-read-more-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedDescModules(prev => ({ ...prev, [i]: !prev[i] }));
                                        }}
                                      >
                                        {expandedDescModules[i] ? "Show less" : "Read more"}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </RevealOnScroll>
                      );
                    })}
                  </>
                );
              })()}

              {/* Weekly releases: shown until every planned module is out */}
              {plannedModules > course.length && course.length > 0 && (
                <div className="course-upcoming">
                  <div className="course-upcoming-icon">
                    <CalendarIcon />
                  </div>
                  <div className="course-upcoming-body">
                    <div className="course-upcoming-label">Module {course.length + 1} · Coming soon</div>
                    <div className="course-upcoming-title">A new module every Monday</div>
                    <div className="course-upcoming-meter" aria-label={`${course.length} of ${plannedModules} modules released`}>
                      <div className="course-upcoming-segments" aria-hidden="true">
                        {Array.from({ length: plannedModules }, (_, k) => (
                          <span key={k} className={k < course.length ? 'is-out' : ''}></span>
                        ))}
                      </div>
                      <span className="course-upcoming-count">
                        {course.length} of {plannedModules} released
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {course.length === 0 && (
                <div className="no-modules">
                  <span className="text-4xl mb-4 block">🚧</span>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No modules found</h3>
                  <p className="text-gray-500">This course doesn't have any content yet.</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="course-sidebar dh-tokens">
            {/* Dashboard Stats & FinScore */}
            {email !== 'guest@fined.com' && (
              <div style={{ position: 'relative', zIndex: 10 }}>
                <RevealOnScroll delay={100}>
                  {isMobile && !isMobileWidgetExpanded ? (
                    <div 
                      className="dash-stats-mobile-widget"
                      style={{ left: `${widgetPos.x}px`, top: `${widgetPos.y}px`, touchAction: 'none' }}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                    >
                      <img src="/dash-finscore.svg" alt="FinScore" className="widget-icon" style={{ pointerEvents: 'none' }} />
                    </div>
                  ) : (
                    <div className={`co-stats${isMobile ? " dash-stats-card" : ""}`}>
                      {isMobile && (
                        <button
                          className="widget-close-btn"
                          onClick={() => setIsMobileWidgetExpanded(false)}
                          aria-label="Close widget"
                        >✕</button>
                      )}

                      {/* Same FinEd card as the dashboard */}
                      <section className="dh-card co-card" aria-label="Your FinEd card">
                        <button type="button" className="dh-card-link co-card-link" onClick={() => navigate('/rewards')} title="View FinScore details & Rewards">
                          <span className="dh-sr-only">View FinScore details and rewards</span>
                        </button>
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
                              aria-controls="co-score-info"
                              onClick={() => setShowScoreInfo((v) => !v)}
                              onBlur={() => setShowScoreInfo(false)}
                            >
                              <PiInfoBold aria-hidden="true" />
                              <span className="dh-sr-only">What is FinScore?</span>
                            </button>
                          </span>
                          <span className="dh-card-score-value">{userData?.fin_score || 0}</span>
                          <span className="dh-card-next">
                            {levelInfo.pointsToNext === null
                              ? "Top level reached"
                              : `${levelInfo.pointsToNext} points to ${levelInfo.nextName}`}
                          </span>
                        </div>
                        <div className="dh-card-holder">
                          {user?.picture
                            ? <img src={user.picture} alt="" className="dh-avatar" />
                            : <span className="dh-avatar dh-avatar--initial" aria-hidden="true">{(user?.name || "U").charAt(0).toUpperCase()}</span>}
                          <span className="dh-card-name">{user?.name || userData?.name || "Learner"}</span>
                        </div>
                        <p id="co-score-info" role="tooltip" className={`dh-info-body${showScoreInfo ? " is-open" : ""}`}>
                          FinScore is your overall engagement score! It grows as you complete Courses, read Articles and maintain your daily Consistency. Keep your daily streaks alive to earn bonuses and avoid inactivity penalties!
                        </p>
                      </section>

                      {/* Same progress list as the dashboard */}
                      <ul className="dh-panel dh-stats">
                        {[
                          { icon: <PiFireFill />, tone: "streak", label: "Streak", value: `${userData?.streak_count || 0} ${(userData?.streak_count || 0) === 1 ? "day" : "days"}`, title: "View Rewards & Streaks" },
                          { icon: <PiStarFill />, tone: "stars", label: "FinStars", value: userData?.fin_stars || 0, title: "View Rewards & FinStars" },
                          { icon: <PiTrophyFill />, tone: "rank", label: "Rank", value: `#${userData?.rank || '-'}`, title: "View Leaderboard & Rankings" },
                        ].map((row) => (
                          <li key={row.tone}>
                            <button type="button" className="dh-stat" onClick={() => navigate('/rewards')} title={row.title}>
                              <span className={`dh-stat-icon dh-stat-icon--${row.tone}`} aria-hidden="true">{row.icon}</span>
                              <span className="dh-stat-label">{row.label}</span>
                              <span className="dh-stat-value">{row.value}</span>
                              <PiCaretRightBold className="dh-stat-caret" aria-hidden="true" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </RevealOnScroll>
              </div>
            )}

            {/* Certificate Card */}
            <RevealOnScroll delay={50}>
              {(completedModulesCount > 0 && completedModulesCount === certificateModulesCount && email !== 'guest@fined.com') ? (
                <div className="co-cert co-cert--done">
                  <div className="co-cert-head">
                    <span className="co-cert-icon" aria-hidden="true"><PiCertificateBold /></span>
                    <span className="co-cert-pill co-cert-pill--done">Unlocked</span>
                  </div>
                  <h3 className="co-cert-title">Course completed</h3>
                  <p className="co-cert-text">You've finished every module in this course. Your certificate is ready.</p>
                  <button type="button" className="dh-btn co-cert-btn" onClick={handleDownloadCertificate} disabled={isDownloading}>
                    {isDownloading ? "Generating..." : <>Download certificate <PiDownloadSimpleBold aria-hidden="true" /></>}
                  </button>
                </div>
              ) : (
                <div className="dh-panel co-cert">
                  <div className="co-cert-head">
                    <span className="co-cert-icon" aria-hidden="true"><PiCertificateBold /></span>
                    <span className="co-cert-pill"><PiLockSimpleBold aria-hidden="true" /> Locked</span>
                  </div>
                  <h3 className="co-cert-title">Course certificate</h3>
                  <p className="co-cert-text">
                    {certificateModulesCount > totalModulesCount
                      ? `Finish all ${certificateModulesCount} modules to unlock it. A new module arrives every Monday.`
                      : 'Finish every module in this course to unlock it.'}
                  </p>
                  <div className="co-cert-meter">
                    <div className="co-cert-bar" aria-hidden="true">
                      <span style={{ width: `${certificateModulesCount ? (completedModulesCount / certificateModulesCount) * 100 : 0}%` }}></span>
                    </div>
                    <span className="co-cert-count">{completedModulesCount} of {certificateModulesCount} done</span>
                  </div>
                </div>
              )}
            </RevealOnScroll>
          </div>
        </div>
      )}




      {/* Alert Modals */}
      {warning && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 mb-6">{warning}</p>
            <button
              onClick={() => { setWarning(""); navigate("/dashboard"); }}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {showLockedAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔒</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Module Locked</h3>
            <p className="text-gray-600 mb-6 text-sm">Please complete the previous module to unlock this one.</p>
            <button
              onClick={() => setShowLockedAlert(false)}
              className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {showSignInAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-sm text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">👋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h3>
            <p className="text-gray-600 mb-6 text-sm">Please sign in or create an account to start learning and tracking your progress.</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowSignInAlert(false)}
                className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => loginWithRedirect()}
                className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}

      <CertificateGenerator 
        ref={certificateRef} 
        userName={user?.name || user?.nickname || "Student"} 
        courseName={courseTitle} 
      />
    </div>
  );
}
