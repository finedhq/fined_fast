import { useState, useEffect } from "react";
import RevealOnScroll from "../../components/RevealOnScroll";
import Lenis from 'lenis';
import { Link, useNavigate } from "react-router-dom";
import { getCourses, getCourseDetails } from "../../services/api";
import "./Courses.css";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [fetchingCourseId, setFetchingCourseId] = useState(null);

  const handleCourseClick = async (courseId) => {
    if (fetchingCourseId) return;
    setFetchingCourseId(courseId);
    try {
      const details = await getCourseDetails(courseId);
      
      let targetModuleId = null;
      let targetCardId = null;

      if (details.data && details.data.length > 0) {
        // Find the first incompleted card to resume
        for (const mod of details.data) {
          const cards = mod.cards || [];
          for (const c of cards) {
            if (c.status !== "completed") {
              targetModuleId = mod.moduleId;
              targetCardId = c.card_id;
              break;
            }
          }
          if (targetCardId) break;
        }

        // If all are completed or no incompleted found, default to the very first card
        if (!targetCardId) {
          const firstMod = details.data[0];
          if (firstMod.cards && firstMod.cards.length > 0) {
            targetModuleId = firstMod.moduleId;
            targetCardId = firstMod.cards[0].card_id;
          }
        }
      }

      if (targetModuleId && targetCardId) {
        navigate(`/courses/${courseId}/module/${targetModuleId}/card/${targetCardId}`);
      } else {
        alert("This course doesn't have any modules yet.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch course details from Supabase.");
    } finally {
      setFetchingCourseId(null);
    }
  };

  useEffect(() => {
    const lenis = new Lenis()
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => {
      lenis.destroy()
    }
  }, [])

  useEffect(() => {
    async function loadCourses() {
      try {
        const data = await getCourses();
        setCourses(data);
      } catch (err) {
        setError("Failed to load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <div className="courses-page">


      {/* HERO STRIP */}
      <div className="ap-hero-strip">
        <h1 className="ap-headline">Courses</h1>
        <p className="ap-sub">Gain practical financial literacy with our bite-sized courses. Start learning today!</p>
      </div>

      {/* COURSE LIST CONTAINER */}
      <main className="courses-container">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Fetching pathways...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <div className="recommended-section">
            <h2 className="recommended-title" >Recommended Courses</h2>
            <div className="ap-articles-grid">
              {courses.map((course, idx) => (
                <RevealOnScroll key={course.id || course.course_id} delay={100 + (idx % 4) * 50}>
                  <div 
                    className="ap-grid-card" 
                    onClick={() => handleCourseClick(course.id || course.course_id)}
                    style={{ opacity: fetchingCourseId === (course.id || course.course_id) ? 0.5 : 1, pointerEvents: fetchingCourseId === (course.id || course.course_id) ? 'none' : 'auto' }}
                  >
                    <div className="ap-grid-card-img-wrap" style={{ position: 'relative' }}>
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="ap-grid-card-img" />
                      ) : (
                        <div className="ap-grid-card-img-placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%' }}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                          </svg>
                        </div>
                      )}
                      <span className="badge-duration" style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{course.duration} mins</span>
                      {fetchingCourseId === (course.id || course.course_id) && (
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)' }}>
                          <div className="spinner" style={{ width: '24px', height: '24px', borderTopColor: '#0284c7' }}></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="ap-grid-card-content">
                      <span className="ap-grid-category">
                        {course.modules_count || 0} MODULES
                      </span>
                      <h3 className="ap-grid-title">{course.title}</h3>
                      <p className="ap-grid-excerpt">
                        {course.description?.slice(0, 100) || ""}
                        {course.description?.length > 100 ? "..." : ""}
                      </p>
                    </div>
                  </div>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Courses;
