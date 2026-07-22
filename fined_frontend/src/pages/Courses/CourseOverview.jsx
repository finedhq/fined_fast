import React, { useEffect, useState } from "react";
import instance from "../../lib/axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";
import "./CourseOverview.css";

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
            <div className="course-hero-banner">
              <button onClick={() => navigate('/courses')} className="hero-back-btn">
                ←
              </button>
              <div className="hero-header">
                <span className="hero-tag">{courseTitle}</span>
              </div>
              <h1 className="hero-title">Building Your Money Mindset</h1>
              <p className="hero-desc">
                Learn the essential money habits and foundations that set you up for financial success.
              </p>
              
              <div className="hero-progress-section">
                <span className="hero-progress-label">Module Progress</span>
                <div className="hero-progress-bar-container">
                  <div className="hero-progress-fill" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <span className="hero-progress-text">{completedModulesCount} / {totalModulesCount} Modules</span>
              </div>
            </div>

            {/* Modules Path */}
            <div className="course-path-container">
              {course.map((module, i) => {
                // Determine module status based on cards
                const isFirstModule = i === 0;
                let isPreviousCompleted = true;

                if (!isFirstModule) {
                  // Ensure all previous modules are completed
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

                // Status mapping
                let statusStr = "locked";
                let StatusIcon = LockIcon;
                
                if (isCompleted) {
                  statusStr = "completed";
                  StatusIcon = CheckIcon;
                } else if (isOngoing) {
                  statusStr = "ongoing";
                  StatusIcon = PlantIcon;
                }

                const cardToResume = module.cards.find(c => c.status !== "completed") || module.cards[0];
                
                // Path curve generation
                const xOffsets = [15, 60, 25, 65, 10, 55, 20];
                const getX = (index) => xOffsets[index % xOffsets.length];
                const x1 = getX(i);
                const x2 = getX(i + 1);
                
                // Card alignment: if node is on the left, card pops right, and vice versa
                const alignmentClass = x1 < 50 ? "card-right" : "card-left";

                return (
                  <React.Fragment key={i}>
                    {/* Node Row */}
                    <div className="module-node-row">
                      <div className={`module-node ${alignmentClass}`} style={{ left: `${x1}%` }}>
                        <div className="module-base-label">
                          <div className="module-base-number">Module {i + 1}</div>
                          <div className="module-base-title">{module.moduleTitle}</div>
                          <div className={`module-base-badge badge-${statusStr}`}>
                            {statusStr === 'ongoing' ? 'In Progress' : statusStr.charAt(0).toUpperCase() + statusStr.slice(1)}
                          </div>
                        </div>

                        <div className={`module-circle ${statusStr}`}>
                          <StatusIcon />
                        </div>

                        {/* Hover Popover Card */}
                        <div className="module-hover-card">
                          <div className="hc-header">
                            <div className={`hc-icon-placeholder ${statusStr}`}>
                              <StatusIcon />
                            </div>
                            <button 
                              className="hc-arrow-btn"
                              disabled={!isClickable}
                              onClick={() => {
                                if (isClickable && cardToResume) {
                                  sessionStorage.removeItem('quiz_score');
                                  navigate(`/courses/${courseSlug}/${module.moduleSlug || module.moduleId}/${cardToResume.cardSlug || cardToResume.card_id}`);
                                } else if (!cardToResume) {
                                  setWarning("This module has no cards yet!");
                                } else {
                                  setShowLockedAlert(true);
                                }
                              }}
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

                    {/* SVG Connector to Next Node */}
                    {i < course.length - 1 && (
                      <div style={{ height: '60px', width: '100%', position: 'relative' }}>
                        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <path
                            d={`M ${x1} 0 C ${x1} 50, ${x2} 50, ${x2} 100`}
                            fill="none"
                            stroke="#c7d2fe"
                            strokeWidth="4"
                            strokeDasharray="10 10"
                            strokeLinecap="round"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

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
            {/* FinScore Card */}
            <div className="sidebar-card">
              <div className="sidebar-card-header">
                FinScore <span className="info-icon">ⓘ</span>
              </div>
              <div className="finscore-value-row">
                <span className="finscore-number">{userData?.fin_score || 0}</span>
                <span className="finscore-trend">▲ 24</span>
              </div>
              <div className="finscore-chart-mock">
                <div className="bar-mock"></div>
                <div className="bar-mock"></div>
                <div className="bar-mock"></div>
                <div className="bar-mock"></div>
                <div className="bar-mock"></div>
                <div className="bar-mock"></div>
              </div>
              <p className="finscore-msg">
                Great progress! Keep learning consistently.
              </p>
            </div>

            {/* Stats Box (Points, Rank, Streak) */}
            <div className="sidebar-card">
              <div className="stats-box-container">
                <div className="stat-column">
                  <span className="stat-icon-top" style={{ color: '#fbbf24' }}>⭐</span>
                  <span className="stat-value-large">{userData?.fin_stars || 0}</span>
                  <span className="stat-label-small">POINTS</span>
                </div>
                <div className="stat-column">
                  <span className="stat-icon-top" style={{ color: '#818cf8' }}>🎖️</span>
                  <span className="stat-value-large">Top 10%</span>
                  <span className="stat-label-small">YOUR RANK</span>
                </div>
                <div className="stat-column">
                  <span className="stat-icon-top" style={{ color: '#ef4444' }}>🔥</span>
                  <span className="stat-value-large">{userData?.streak_count || 0} Days</span>
                  <span className="stat-label-small">STREAK</span>
                </div>
              </div>
            </div>
            
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
    </div>
  );
}
