import React, { useEffect, useState, useRef } from 'react';
import instance, { setAuthToken } from '../../lib/axios';
import FinScoreChart from '../../uiComponents/FinScoreChart';
import { IoIosInformationCircleOutline } from "react-icons/io";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import SmartImage from '../../uiComponents/SmartImage';

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user, isAuthenticated, isLoading, getAccessTokenSilently } = useAuth0();
  
  const [email, setEmail] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [featuredArticle, setFeaturedArticle] = useState({});
  const [recommendedCourses, setRecommendedCourses] = useState([]);
  const [ongoingCourse, setOngoingCourse] = useState({});
  const [recommendedSchemes, setRecommendedSchemes] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  
  const carouselRef1 = useRef(null);
  const [canScrollLeft1, setCanScrollLeft1] = useState(false);
  const [canScrollRight1, setCanScrollRight1] = useState(false);
  
  const [userData, setUserData] = useState({});
  const [showLeaderBoard, setShowLeaderBoard] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [finScoreLog, setFinScoreLog] = useState([]);
  const [showFinScoreLog, setShowFinScoreLog] = useState(false);
  const [isFetchingLog, setIsFechingLog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [course_id, setCourseId] = useState("");

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    
    setEmail(user.email || '');

    getAccessTokenSilently().then(token => {
      setAuthToken(token);
      fetchData(user.email, user.sub);
    }).catch(err => {
      console.error("Error fetching access token", err);
      setError("Authentication error. Please log in again.");
    });
  }, [isLoading, isAuthenticated, user, getAccessTokenSilently]);

  const checkScroll = (el, setLeft, setRight) => {
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScrollLeft = el.scrollWidth - el.clientWidth;
    setLeft(scrollLeft > 0);
    setRight(scrollLeft < maxScrollLeft - 2);
  };

  const scrollLeft = (ref) => {
    const el = ref.current;
    if (el) {
      const scrollAmount = window.innerWidth <= 768 ? 310 : window.innerWidth >= 1400 ? 930 : 620;
      el.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollRight = (ref) => {
    const el = ref.current;
    if (el) {
      const scrollAmount = window.innerWidth <= 768 ? 310 : window.innerWidth >= 1400 ? 930 : 620;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const el1 = carouselRef1.current;
    const handler1 = () => checkScroll(el1, setCanScrollLeft1, setCanScrollRight1);
    if (el1) {
      el1.addEventListener('scroll', handler1);
      checkScroll(el1, setCanScrollLeft1, setCanScrollRight1);
    }
    return () => {
      if (el1) el1.removeEventListener('scroll', handler1);
    };
  }, [recommendedCourses]);

  async function fetchData(userEmail, userId) {
    setLoading(true);
    try {
      const res = await instance.post("/home/getdata", { email: userEmail, userId });
      if (res.data?.userData) {
        setUserData(res.data.userData);
        setFeaturedArticle(res.data.featuredArticle);
        setRecommendedCourses(res.data.recommendedCourses);
        setOngoingCourse(res.data.ongoingCourseData);
        setFinScoreLog(res.data.logData);
        setTimeout(() => {
          setShowFeedback(res.data.showFeedback);
        }, 2000);
      }
    } catch (error) {
      setError("Failed to fetch your data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const idFromQuery = searchParams.get("courseId");
    if (idFromQuery) {
      setCourseId(idFromQuery);
    }
  }, [searchParams]);

  const fetchRecommendations = async () => {
    try {
      const res = await instance.post("/home/recommendations", { email, course_id });
      setRecommendedSchemes(res.data?.recommendations || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (email) {
      fetchRecommendations();
    }
  }, [email, course_id]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await instance.get("/home/leaderboard");
      setLeaderboard(res.data || []);
    } catch (err) {
      console.error("Failed to load leaderboard", err);
      setShowLeaderBoard(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchFinScoreLog = async () => {
    setIsFechingLog(true);
    try {
      const res = await instance.post("/home/finscorelog", { email });
      setFinScoreLog(res.data || []);
    } catch (err) {
      console.error("Failed to load fin score history", err);
      setShowFinScoreLog(false);
    } finally {
      setIsFechingLog(false);
    }
  };

  useEffect(() => {
    if (showLeaderBoard) fetchLeaderboard();
    if (showFinScoreLog) fetchFinScoreLog();
  }, [showLeaderBoard, showFinScoreLog]);

  if (isLoading || loading && !showLeaderBoard && Object.keys(userData).length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg text-gray-800 font-semibold">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 font-inter text-[#1e1e1e] pb-5 2xl:max-w-[1500px] 2xl:mx-auto">
      <div className="pt-5 px-4 sm:px-10 max-w-7xl 2xl:max-w-[1200px] mx-auto">
        {user?.email === "gauravexpert456@gmail.com" && (
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => navigate('/admin')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl shadow-md font-bold transition-all duration-200"
            >
              Go to Admin Dashboard ⚙️
            </button>
          </div>
        )}
        <main className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start bg-gray-100 mb-8">
          <div className="col-span-1 flex flex-col gap-4">
            <section className="bg-[#4E00E3] p-6 h-64 rounded-2xl text-white text-center flex flex-col justify-center items-center shadow-lg">
              <div className="relative w-20 h-20 mx-auto mb-3">
                <SmartImage
                  src={user?.picture || "/profile.png"}
                  width={80}
                  height={80}
                  alt="Profile"
                  className='object-cover'
                  containerClassName="w-20 h-20 mx-auto rounded-full border-[3px] border-white/40 shadow-sm"
                />
              </div>
              <h3 className="text-lg font-bold text-white text-center tracking-wide">{user?.name}</h3>
              
              <div className="flex justify-center gap-4 sm:gap-6 mt-4">
                <div title="FinStars" className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-2 rounded-xl flex flex-col items-center justify-center font-bold shadow-inner border border-white/20 text-white min-w-[70px]">
                  <span className="text-xl mb-1 drop-shadow-md">⭐</span>
                  <p className="leading-none">{userData?.fin_stars || 0}</p>
                </div>
                <div title="Current Streak" className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-2 rounded-xl flex flex-col items-center justify-center font-bold shadow-inner border border-white/20 text-white min-w-[70px]">
                  <span className="text-xl mb-1 drop-shadow-md">🔥</span>
                  <p className="leading-none">{userData?.streak_count || 0}</p>
                </div>
                <div title="Your Rank" onClick={() => setShowLeaderBoard(true)} className="bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm px-4 py-2 rounded-xl flex flex-col items-center justify-center font-bold shadow-inner border border-white/20 text-white min-w-[70px] cursor-pointer">
                  <span className="text-xl mb-1 drop-shadow-md">🏅</span>
                  <p className="leading-none">{userData?.rank || 'N/A'}</p>
                </div>
              </div>
            </section>

            <section className="flex items-center bg-white rounded-2xl p-3 gap-4 border border-gray-200 shadow-sm transition-shadow hover:shadow-md h-[110px]">
              <div className="relative w-32 h-full shrink-0">
                <SmartImage
                  src={ongoingCourse?.thumbnail_url || (recommendedCourses[0] && recommendedCourses[0]?.thumbnail_url) || "/placeholder.png"}
                  alt="Course"
                  className="object-cover"
                  containerClassName="rounded-xl w-full h-full"
                />
              </div>
              <div className="flex flex-col justify-center grow gap-2 pr-2">
                <h3 className="text-sm font-bold line-clamp-2 text-gray-800 leading-tight">
                  {ongoingCourse?.title || (recommendedCourses[0] && recommendedCourses[0]?.title)}
                </h3>
                <button
                  onClick={() => navigate(`/courses/course/${ongoingCourse?.id || (recommendedCourses[0] && recommendedCourses[0]?.id)}`)}
                  className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold px-4 py-1.5 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1 text-sm w-full"
                >
                  <span>{ongoingCourse?.title ? "Continue" : "Start"}</span>
                  <span>→</span>
                </button>
              </div>
            </section>
          </div>

          <section onClick={() => navigate("/articles")} className="bg-white px-5 py-5 rounded-2xl font-sans flex flex-col justify-between w-full h-[386px] border border-gray-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-800">Featured Article</h3>
              <div className="flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                <span className="text-sm">View More</span>
                <span className="text-lg">→</span>
              </div>
            </div>
            <div className="grow flex flex-col justify-start items-center gap-4">
              <div className="relative w-full h-56 shrink-0 overflow-hidden rounded-xl">
                <SmartImage
                  src={featuredArticle?.image_url || "/placeholder.png"}
                  alt="Featured"
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  containerClassName="w-full h-full"
                />
              </div>
              <p className="text-md font-bold text-gray-800 leading-snug line-clamp-2 text-center px-2">{featuredArticle?.title}</p>
            </div>
          </section>

          <section
            onClick={() => setShowFinScoreLog(true)}
            className="bg-white rounded-2xl p-5 text-center flex flex-col justify-between h-[386px] border border-gray-200 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-lg cursor-pointer overflow-hidden relative"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-gray-800">Your FinScore</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDescription(true); }} 
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <IoIosInformationCircleOutline className="text-2xl text-gray-500" />
              </button>
            </div>
            <div className="flex justify-center items-center grow mt-4">
              <FinScoreChart score={userData?.fin_score || 0} />
            </div>
            <div className="bg-indigo-50/50 p-4 rounded-xl mt-4">
              <p className="text-[15px] text-gray-600 font-medium leading-relaxed">
                Every expert was once a <span className="font-bold text-indigo-700">beginner</span>.
                <br />
                Keep Going!
              </p>
            </div>
          </section>
        </main>

        <div className="flex flex-col xl:flex-row gap-6 pb-12 bg-gray-100">
          <div className="w-full xl:w-2/3">
            <div className="flex justify-between items-center mb-5 px-1">
              <h2 className="text-2xl font-bold text-gray-800">Recommended Courses</h2>
              <div className="flex gap-2">
                <button
                  className={`w-10 h-10 rounded-full text-lg flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm ${canScrollLeft1 ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' : 'bg-white text-gray-300 border border-gray-200'}`}
                  onClick={() => scrollLeft(carouselRef1)}
                  disabled={!canScrollLeft1}
                >
                  ❮
                </button>
                <button
                  className={`w-10 h-10 rounded-full text-lg flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm ${canScrollRight1 ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md' : 'bg-white text-gray-300 border border-gray-200'}`}
                  onClick={() => scrollRight(carouselRef1)}
                  disabled={!canScrollRight1}
                >
                  ❯
                </button>
              </div>
            </div>
            
            <div
              ref={carouselRef1}
              style={{ scrollbarWidth: 'none' }}
              className="carousel-track bg-white/50 py-4 flex overflow-x-auto snap-x snap-mandatory gap-5"
            >
              {recommendedCourses.length > 0 ? recommendedCourses.map((course, index) => (
                <div
                  onClick={() => navigate(`/courses/course/${course.id}`)}
                  className="bg-white rounded-2xl p-4 w-[280px] shrink-0 flex flex-col h-auto cursor-pointer snap-start shadow-sm border border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  key={index}
                >
                  <div className="relative w-full h-40 shrink-0 mb-4 overflow-hidden rounded-xl">
                    <SmartImage
                      src={course.thumbnail_url}
                      alt="Course"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      containerClassName="w-full h-full"
                    />
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="bg-purple-100 text-purple-800 rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">Course</span>
                    <span className="font-semibold text-xs text-gray-500">{course.modules_count} modules • {course.duration} mins</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-base line-clamp-2 mb-2 leading-snug">{course.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mt-auto">{course.description}</p>
                </div>
              )) : (
                <div className="w-full text-center text-gray-500 py-12 bg-white rounded-2xl border border-gray-200">
                  <p className="text-lg font-semibold">No recommended courses right now.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full xl:w-1/3">
            <div className="flex justify-between items-center mb-5 px-1">
              <h2 className="text-2xl font-bold text-gray-800">Recommendations</h2>
            </div>
            <section className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col w-full h-[360px] overflow-hidden group">
              <div className="relative w-full h-36 shrink-0 bg-indigo-50 border-b border-gray-100 p-6 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10"></div>
                <h3 className="text-xl font-bold text-indigo-900 relative z-10 text-center">Banking Schemes</h3>
              </div>

              <div className="flex-grow overflow-y-auto px-4 py-2 custom-scrollbar">
                {recommendedSchemes?.length > 0 ? (
                  <div className="space-y-1">
                    {recommendedSchemes.map((scheme, index) => (
                      <div key={index} className="flex gap-4 items-center p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className='relative h-12 w-12 shrink-0 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-xl' >
                           🏛️
                        </div>
                        <div>
                          <p className="text-[15px] font-bold text-gray-800 leading-tight">{scheme?.bank_name}</p>
                          <p className="text-[13px] font-medium text-gray-500 mt-0.5">{scheme?.scheme_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100">
                      <span className="block text-2xl mb-2">🎯</span>
                      <p className="text-sm font-bold">Complete a course to see tailored recommendations!</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                <button
                  onClick={() => {
                    if (course_id) {
                      navigate(`/policies?courseId=${course_id}`);
                    } else {
                      navigate("/policies");
                    }
                  }}
                  className="w-full bg-white border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Explore All Policies</span>
                  <span>→</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Modals remain exactly the same functionally, with updated beautiful Tailwind styling */}
      {error && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center transform scale-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Oops!</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => { setError(""); }}
              className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showLeaderBoard && (
        <div onClick={() => setShowLeaderBoard(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-0 relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white relative">
              <h2 className="text-2xl font-bold text-center flex items-center justify-center gap-3">
                <span className="text-3xl">🏆</span> FinScore Leaderboard
              </h2>
              <button onClick={() => setShowLeaderBoard(false)} className="absolute top-4 right-5 text-white/70 hover:text-white text-3xl transition-colors">&times;</button>
            </div>
            
            <div className="overflow-y-auto p-4 custom-scrollbar">
              {(() => {
                const leaderboardWithRanks = [];
                let rank = 1;
                let lastStars = null;
                let skip = 0;
                const sortedLeaderboard = [...leaderboard].sort((a, b) => b.finScore - a.finScore);
                for (let i = 0; i < sortedLeaderboard.length; i++) {
                  const current = sortedLeaderboard[i];
                  if (current.finScore === lastStars) {
                    skip++;
                  } else {
                    rank += skip;
                    skip = 1;
                    lastStars = current.finScore;
                  }
                  leaderboardWithRanks.push({ ...current, rank });
                }
                return (
                  <div className="space-y-2">
                    {leaderboardWithRanks.map((entry, index) => {
                      const isCurrentUser = user?.email === entry.email;
                      const name = entry.email?.split("@")[0] || "User";
                      const rankEmoji = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : `#${entry.rank}`;
                      return (
                        <div
                          key={entry.user_sub || index}
                          className={`flex justify-between items-center p-4 rounded-2xl transition-colors border ${isCurrentUser ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-white border-gray-100 hover:bg-gray-50"}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${entry.rank <= 3 ? 'bg-gray-100 text-xl' : 'bg-gray-100 text-gray-500'}`}>
                              {rankEmoji}
                            </div>
                            <span className={`font-bold text-[15px] ${isCurrentUser ? "text-amber-900" : "text-gray-800"}`}>{name}</span>
                          </div>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-4 py-1.5 rounded-full flex items-center gap-1">
                            {entry.finScore} <span className="text-xs">⭐</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {showFinScoreLog && (
        <div onClick={() => setShowFinScoreLog(false)} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh] overflow-hidden relative">
            <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">📈</span> Score History
              </h2>
              <button onClick={() => setShowFinScoreLog(false)} className="text-gray-400 hover:text-gray-900 text-3xl font-light transition-colors">&times;</button>
            </div>
            
            <div className="overflow-y-auto p-5 bg-white custom-scrollbar flex-grow">
              {isFetchingLog ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                   <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                   <p className="text-gray-500 font-medium">Loading history...</p>
                </div>
              ) : finScoreLog && finScoreLog.length > 0 ? (
                <ul className="space-y-3">
                  {finScoreLog.map((log, index) => (
                    <li key={index} className="bg-white border border-gray-100 hover:border-gray-200 p-4 rounded-2xl shadow-sm transition-colors flex gap-4 items-center">
                      <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${log.change > 0 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                        {log.change > 0 ? '↑' : '↓'}
                      </div>
                      <div className="flex-grow">
                        <p className="text-[15px] text-gray-800 font-bold mb-1">{log.description}</p>
                        <span className="text-[12px] text-gray-400 font-medium uppercase tracking-wide">{new Date(log.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className={`shrink-0 font-black text-lg ${log.change > 0 ? "text-green-500" : "text-red-500"}`}>
                        {log.change > 0 ? `+${log.change}` : log.change}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">👻</div>
                  <p className="text-gray-500 font-semibold">No score changes yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDescription && (
        <div onClick={() => setShowDescription(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div onClick={e => e.stopPropagation()} className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 overflow-y-auto custom-scrollbar relative">
              <button onClick={() => setShowDescription(false)} className="absolute top-6 right-6 w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold text-xl transition-colors">&times;</button>

              <h2 className="text-3xl font-black mb-2 text-gray-900">What is FinScore?</h2>
              <p className="text-indigo-600 font-bold mb-8 tracking-wide uppercase text-sm">Your Financial Growth Metric</p>
              
              <div className="prose prose-indigo max-w-none text-gray-600">
                <p className="text-lg leading-relaxed mb-8">
                  <strong>FinScore</strong> is your ultimate financial growth score on FinEd. It actively reflects how well you learn, budget, and track your money. The higher your score, the better your financial habits!
                </p>

                <div className="grid sm:grid-cols-2 gap-6 mb-8">
                  <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                    <h3 className="text-lg font-bold text-indigo-900 mb-3 flex items-center gap-2"><span className="text-2xl">🎯</span> Why it Matters</h3>
                    <ul className="space-y-2 text-indigo-800/80 font-medium">
                      <li>• Unlock exclusive badges</li>
                      <li>• Compete on the leaderboard</li>
                      <li>• Visible proof of your progress</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                    <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2"><span className="text-2xl">⚡</span> How to Earn</h3>
                    <ul className="space-y-2 text-amber-800/80 font-medium">
                      <li>• Complete learning modules</li>
                      <li>• Maintain daily streaks</li>
                      <li>• Set & stick to budgets</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-3">Action Rewards</h3>
                  <div className="space-y-3">
                    {[
                      ["Complete a learning card", "+5 to +10 pts", "text-green-600"],
                      ["Finish an entire module", "+15 pts", "text-green-600"],
                      ["Set a monthly budget", "+10 pts", "text-blue-600"],
                      ["Hit a 7-day login streak", "+10 bonus", "text-amber-500"],
                    ].map(([action, score, color], i) => (
                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <span className="font-medium text-gray-700">{action}</span>
                        <span className={`font-black ${color}`}>{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
