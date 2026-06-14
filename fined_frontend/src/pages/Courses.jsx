import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getCourses } from "../services/api";
import "./Courses.css";

function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      {/* NAVBAR */}
      <nav className="nav-secondary">
        <Link to="/" className="logo-link">
          <div className="logo">
            <div className="logo-icon-wrapper">
              <svg className="logo-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="#4A3AFF" />
                <path d="M8 20V12C8 10.8954 8.89543 10 10 10H16C17.1046 10 18 10.8954 18 12V20M8 20H18M8 20C8 21.1046 8.89543 22 10 22H18C19.1046 22 20 21.1046 20 20V14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="23" cy="11" r="3" fill="#F5A623" />
              </svg>
            </div>
            <div className="logo-wordmark">
              <span className="fin">Fin</span>
              <span className="ed">Ed</span>
            </div>
          </div>
        </Link>
        <ul className="nav-links">
          <li><Link to="/courses" className="active">Courses</Link></li>
          <li><Link to="/articles">Articles</Link></li>
          <li><Link to="/leaderboard">Leaderboard</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>
      </nav>

      {/* HEADER */}
      <header className="courses-header">
        <div className="header-content">
          <h1>Financial Pathways</h1>
          <p>Gain practical financial literacy with our bite-sized courses. Start learning today!</p>
        </div>
      </header>

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
          <div className="courses-grid">
            {courses.map((course) => (
              <div key={course.id || course.course_id} className="course-card">
                <div className="course-thumbnail-placeholder">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="thumbnail-img" />
                  ) : (
                    <div className="thumbnail-fallback">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                  )}
                  <span className="badge-duration">{course.duration} mins</span>
                </div>
                
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  
                  <div className="course-meta">
                    <span className="meta-modules">
                      <strong>{course.modules_count || 0}</strong> Modules
                    </span>
                    <button className="btn-start-course">Start Learning →</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Courses;
