import React, { useEffect, useState, useRef } from "react";
import instance from "../../lib/axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";
import RevealOnScroll from "../../components/RevealOnScroll";
import CertificateGenerator from "../../components/Certificate/CertificateGenerator";
import "./CourseOverview.css";
import "../Dashboard/Dashboard.css";
import completedModuleLogo from '../../assets/completed_module_logo.png';
import currentModuleLogo from '../../assets/current_module_logo.png';
import lockedModuleLogo from '../../assets/locked_module_logo.png';
// SVG Icons for statuses
const CheckIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
const LockIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);
const PlayIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
  </svg>
);
const ArrowRightIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '16px', height: '16px' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
);
const PlantIcon = () => (
  <svg fill="currentColor" viewBox="0 0 24 24">
    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18s-.41-.06-.57-.18l-7.9-4.44A.991.991 0 0 1 3 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18s.41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9M12 4.15L5.46 7.82 12 11.5l6.54-3.68L12 4.15Z" />
  </svg>
);
const InfoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="dash-info-icon-svg">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function CourseOverview() {
  const navigate = useNavigate();
  const { courseSlug } = useParams();

  const { user, isLoading, isAuthenticated } = useAuth0();
  const [email, setEmail] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [course, setCourse] = useState([]);
  const [userData, setUserData] = useState({});
  const [showLockedAlert, setShowLockedAlert] = useState(false);
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const certificateRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    setEmail(user.email || '');
  }, [isLoading, isAuthenticated, user]);

  async function fetchData() {
    if (!email) return;
    setLoading(true);
    try {
      // Fetch both course data and user stats concurrently
      const [courseRes, userRes] = await Promise.all([
        instance.post(`/courses/course/${courseSlug}`, { email }),
        instance.post("/home/getdata", { email: email, userId: user?.sub })
      ]);

      setCourseTitle(courseRes.data.title);
      setCourse(courseRes.data.data || []);

      if (userRes.data?.userData) {
        setUserData(userRes.data.userData);
      }
    } catch (err) {
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
  const progressPercentage = totalModulesCount > 0 ? (completedModulesCount / totalModulesCount) * 100 : 0;
  const level = Math.floor((userData?.fin_score || 0) / 500) + 1;

  const handleDownloadCertificate = async () => {
    if (certificateRef.current) {
      setIsDownloading(true);
      await certificateRef.current.downloadPDF();
      setIsDownloading(false);
    }
  };

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
            {/* Hero Banner */}
            <RevealOnScroll>
              <div className="course-hero-banner">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <button onClick={() => navigate('/courses')} className="hero-back-btn-outside" style={{ flexShrink: 0 }}>
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: '18px', height: '18px', transform: 'translateX(-1px)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <h1 className="hero-title" style={{ marginBottom: 0 }}>{courseTitle}</h1>
                </div>

                <div className="hero-progress-section" style={{ marginTop: '1.5rem' }}>
                  <span className="hero-progress-label">Module Progress</span>
                  <div className="hero-progress-bar-container">
                    <div className="hero-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                  </div>
                  <span className="hero-progress-text">{completedModulesCount} / {totalModulesCount} Modules</span>
                </div>
              </div>
            </RevealOnScroll>

            {/* Modules Path */}
            <div className="course-path-container">
              {(() => {
                const xOffsets = isMobile ? [25, 75, 30, 70, 20, 80] : [12, 68, 22, 78, 8, 73, 18, 83];
                const getX = (index) => xOffsets[index % xOffsets.length];
                const rowHeight = 250;
                const topPadding = 75;
                const totalSvgHeight = course.length > 0 ? (course.length - 1) * rowHeight + 64 + topPadding : 0;

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
                              stroke="#c7d2fe"
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
                      const isClickable = isFirstModule || isPreviousCompleted;
                      const isOngoing = isClickable && !isCompleted;

                      let statusStr = "locked";
                      let StatusImage = lockedModuleLogo;

                      if (isCompleted) {
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
                        if (isClickable && cardToResume) {
                          sessionStorage.removeItem('quiz_score');
                          navigate(`/courses/${courseSlug}/${module.moduleSlug || module.moduleId}/${cardToResume.cardSlug || cardToResume.card_id}`);
                        } else if (!cardToResume) {
                          setWarning("This module has no cards yet!");
                        } else {
                          setShowLockedAlert(true);
                        }
                      };

                      return (
                        <RevealOnScroll key={i} delay={0}>
                          <div className="module-node-row">
                            <div className={`module-node ${alignmentClass}`} style={{ left: `${x1}%` }}>
                              <div className="module-base-label">
                                <div className="module-base-number">Module {i + 1}</div>
                                <div className="module-base-title">{module.moduleTitle}</div>
                                <div className={`module-base-badge badge-${statusStr}`}>
                                  {statusStr === 'ongoing' ? 'In Progress' : statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
                                </div>
                              </div>

                              <div
                                className={`module-circle ${statusStr}`}
                                onClick={handleLaunchModule}
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
                                  <p className="hc-desc">
                                    {module.cards.filter(c => c.status?.toLowerCase() === 'completed').length} / {module.cards.length} Cards Completed.
                                    {isCompleted ? " You've successfully finished this module." :
                                      isOngoing ? " Continue learning to finish this module." :
                                        " Complete previous modules to unlock."}
                                  </p>
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
          <div className="course-sidebar">
            {/* Certificate Button (Only if course is completed) */}
            {completedModulesCount > 0 && completedModulesCount === totalModulesCount && (
              <RevealOnScroll delay={50}>
                <div className="sidebar-card certificate-card" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', border: 'none' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '2.5rem' }}>🏆</span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Course Completed!</h3>
                    <p style={{ color: '#e0e7ff', fontSize: '0.875rem', marginBottom: '0.5rem' }}>You've mastered all modules in this course.</p>
                    <button 
                      onClick={handleDownloadCertificate}
                      disabled={isDownloading}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'white',
                        color: '#4338ca',
                        fontWeight: 'bold',
                        borderRadius: '0.75rem',
                        border: 'none',
                        cursor: isDownloading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      {isDownloading ? (
                        <>
                          <div style={{ width: '1.25rem', height: '1.25rem', border: '2px solid #4338ca', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: '1.25rem', height: '1.25rem' }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download Certificate
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </RevealOnScroll>
            )}

            {/* Dashboard Stats & FinScore */}
            <RevealOnScroll delay={100}>
              <div className="dash-stats-card">
                <div className="dash-stats-list">
                  <div className="dash-stat-item">
                    <div className="dash-stat-icon-wrapper icon-streak">
                      <img src="/dash-fire.png" alt="Streak Fire" className="dash-stat-img" />
                    </div>
                    <div className="dash-stat-main">
                      <strong>{userData?.streak_count || 0}</strong> Days
                    </div>
                    <div className="dash-stat-label">STREAK</div>
                  </div>

                  <div className="dash-stat-item">
                    <div className="dash-stat-icon-wrapper icon-finstars">
                      <img src="/dash-star.png" alt="FinStars" className="dash-stat-img" />
                    </div>
                    <div className="dash-stat-main">
                      <strong>{userData?.fin_stars || 0}</strong>
                    </div>
                    <div className="dash-stat-label">FINSTARS</div>
                  </div>

                  <div className="dash-stat-item">
                    <div className="dash-stat-icon-wrapper icon-modules">
                      <img src="/dash-rank.png" alt="Rank" className="dash-stat-img" />
                    </div>
                    <div className="dash-stat-main">
                      <strong>Level {level}</strong>
                    </div>
                    <div className="dash-stat-label">RANK</div>
                  </div>
                </div>

                <div className="dash-finscore-section">
                  <div className="dash-finscore-header">
                    <span className="dash-finscore-label">FinScore</span>
                    <div className="info-icon-container">
                      <span className="dash-finscore-info" style={{ marginLeft: 0 }}>
                        <InfoIcon />
                      </span>
                      <div className="info-tooltip">
                        FinScore is your overall engagement score! It grows as you complete Courses , read Articles and maintain your daily Consistency. Keep your daily streaks alive to earn bonuses and avoid inactivity penalties!
                      </div>
                    </div>
                  </div>
                  <div className="dash-finscore-display">
                    <div className="dash-finscore-value-group">
                      <span className="dash-finscore-value">{userData?.fin_score || 0}</span>
                    </div>
                    <div className="dash-finscore-chart-img-wrapper">
                      <img src="/dash-speedometer.png" alt="FinScore Speedometer" className="dash-speedometer-img" />
                    </div>
                  </div>
                </div>
              </div>
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

      <CertificateGenerator 
        ref={certificateRef} 
        userName={user?.name || user?.nickname || "Student"} 
        courseName={courseTitle} 
      />
    </div>
  );
}
