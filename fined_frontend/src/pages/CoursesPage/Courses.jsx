import React, { useEffect, useState, useMemo } from "react";
import instance from "../../lib/axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import {
  IoLayersOutline,
  IoArrowForward
} from "react-icons/io5";
import SmartImage from "../../uiComponents/SmartImage";
import RevealOnScroll from "../../components/RevealOnScroll";
import "./Courses.css";

export default function Courses() {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth0();
  const [email, setEmail] = useState("");
  const [courses, setCourses] = useState([]);
  const [ongoingCourse, setOngoingCourse] = useState({});
  const [isFetchingOngoing, setIsFetchingOngoing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 9;

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      setEmail(user.email || "guest@fined.com");
    } else {
      setEmail("guest@fined.com");
    }
  }, [isLoading, isAuthenticated, user]);

  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await instance.get("/courses/getall");
      if (res.data && res.data.length > 0) {
        setCourses(res.data);
      }
    } catch (err) {
      setError("Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchOngoingCourses() {
    if (!email) return;
    setIsFetchingOngoing(true);
    try {
      const res = await instance.post("/courses/getongoingcourse", { email });
      if (res.data?.title) {
        setOngoingCourse(res.data);
      }
    } catch (err) {
      console.warn("Could not fetch ongoing course:", err);
    } finally {
      setIsFetchingOngoing(false);
    }
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (email) {
      fetchOngoingCourses();
    }
  }, [email]);

  const targetCourse = ongoingCourse?.id
    ? ongoingCourse
    : courses.length > 0
    ? courses[0]
    : null;

  const totalPages = Math.ceil(courses.length / coursesPerPage) || 1;
  const currentCourses = useMemo(() => {
    return courses.slice(
      (currentPage - 1) * coursesPerPage,
      currentPage * coursesPerPage
    );
  }, [courses, currentPage, coursesPerPage]);

  return (
    <div className="courses-page-container">
      <main className="courses-main-wrapper">
        {/* ── HERO SECTION ── */}
        <RevealOnScroll>
          <section className="courses-hero-section">
            <h1 className="courses-hero-title">
              Master Finance in <span className="courses-hero-brand">15-Minute Lessons</span>
            </h1>

            <p className="courses-hero-subtitle">
              Visual, gamified, and practical courses on investing, market mechanics, budgeting, and wealth building designed for everyday investors.
            </p>

            {/* Highlights Trust Strip */}
            <div className="courses-highlights-strip">
              <div className="courses-highlight-item">
                <span className="courses-highlight-icon">⚡</span>
                <span>100% Free &amp; Interactive</span>
              </div>
              <div className="courses-highlight-dot">•</div>
              <div className="courses-highlight-item">
                <span className="courses-highlight-icon">🏆</span>
                <span>Gamified Scenarios</span>
              </div>
              <div className="courses-highlight-dot">•</div>
              <div className="courses-highlight-item">
                <span className="courses-highlight-icon">📜</span>
                <span>Earn Certificates</span>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {loading ? (
          /* SKELETON LOADING STATE */
          <div className="w-full flex flex-col gap-10">
            <div className="courses-resume-card animate-pulse">
              <div className="courses-skeleton-img" />
              <div className="flex flex-col gap-4">
                <div className="courses-skeleton-line h-6 w-1/3" />
                <div className="courses-skeleton-line h-8 w-3/4" />
                <div className="courses-skeleton-line h-4 w-full" />
                <div className="courses-skeleton-line h-11 w-40 mt-2" />
              </div>
            </div>

            <div className="courses-cards-grid">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="courses-skeleton-card animate-pulse">
                  <div className="courses-skeleton-img" />
                  <div className="courses-skeleton-body">
                    <div className="courses-skeleton-line h-4 w-1/3" />
                    <div className="courses-skeleton-line h-6 w-5/6" />
                    <div className="courses-skeleton-line h-4 w-full mt-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-14">
            {/* ── CONTINUE LEARNING RESUME CARD (When logged in or course active) ── */}
            {isAuthenticated && targetCourse && (
              <RevealOnScroll>
                <section className="courses-resume-section">
                  <div className="courses-resume-card">
                    <div className="courses-resume-image-wrap">
                      <SmartImage
                        src={targetCourse.thumbnail_url}
                        alt={targetCourse.title}
                        className="courses-resume-img"
                        containerClassName="w-full h-full"
                      />
                      <div className="courses-resume-badge">
                        <span className="courses-pulse-dot" />
                        <span>{ongoingCourse?.id ? "In Progress" : "Recommended for You"}</span>
                      </div>
                    </div>

                    <div className="courses-resume-content">
                      <div className="courses-resume-meta">
                        <span className="courses-meta-chip">
                          <IoLayersOutline /> {targetCourse.modules_count || 0} Modules
                        </span>
                      </div>

                      <h2 className="courses-resume-title">
                        {targetCourse.title}
                      </h2>

                      <p className="courses-resume-desc">
                        {targetCourse.description || "Pick up right where you left off and master the next interactive concept."}
                      </p>

                      <div className="courses-resume-actions">
                        <button
                          type="button"
                          onClick={() => navigate(`/courses/${targetCourse.slug || targetCourse.id}`)}
                          className="courses-primary-btn"
                        >
                          <span>{ongoingCourse?.id ? "Continue Course" : "Start Learning Now"}</span>
                          <IoArrowForward className="courses-btn-arrow" />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>
              </RevealOnScroll>
            )}

            {/* ── COURSES GRID SECTION ── */}
            <section className="courses-grid-section">
              <div className="courses-grid-header">
                <div>
                  <h2 className="courses-section-title">
                    Available Courses
                  </h2>
                  <p className="courses-section-subtitle">
                    {courses.length} {courses.length === 1 ? "course" : "interactive courses"} available
                  </p>
                </div>
              </div>

              {courses.length === 0 ? (
                /* EMPTY STATE */
                <div className="courses-empty-state">
                  <div className="courses-empty-icon">📚</div>
                  <h3 className="courses-empty-title">No courses available yet</h3>
                  <p className="courses-empty-desc">
                    New interactive finance modules are being crafted. Check back shortly!
                  </p>
                </div>
              ) : (
                /* COURSE CARDS GRID */
                <div className="courses-cards-grid">
                  {currentCourses.map((course, index) => (
                    <RevealOnScroll key={course.id || index} delay={(index % 3) * 100}>
                      <CourseCard
                        course={course}
                        navigate={navigate}
                      />
                    </RevealOnScroll>
                  ))}
                </div>
              )}

              {/* ── PAGINATION ── */}
              {totalPages > 1 && (
                <div className="courses-pagination">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => p - 1);
                      window.scrollTo({ top: 380, behavior: "smooth" });
                    }}
                    className="courses-page-nav-btn"
                  >
                    Previous
                  </button>

                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setCurrentPage(i + 1);
                        window.scrollTo({ top: 380, behavior: "smooth" });
                      }}
                      className={`courses-page-num-btn ${currentPage === i + 1 ? "active" : ""}`}
                    >
                      {i + 1}
                    </button>
                  ))}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => p + 1);
                      window.scrollTo({ top: 380, behavior: "smooth" });
                    }}
                    className="courses-page-nav-btn"
                  >
                    Next
                  </button>
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* ERROR MODAL */}
      {(warning || error) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-4 transform transition-all">
            <div className="flex items-center gap-3 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold font-['Nunito']">Notice</h3>
            </div>
            <p className="text-gray-700 font-medium">
              {warning || error}
            </p>
            <button
              onClick={() => {
                setWarning("");
                if (error) {
                  setError("");
                  navigate("/");
                }
              }}
              className="mt-2 bg-[#4100BC] hover:bg-[#2D007F] text-white font-bold py-2.5 px-4 rounded-xl transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, navigate }) {
  const courseSlug = course.slug || course.id;

  return (
    <div
      onClick={() => navigate(`/courses/${courseSlug}`)}
      className="course-card-modern group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && navigate(`/courses/${courseSlug}`)}
    >
      <div className="course-card-img-wrap">
        <SmartImage
          src={course.thumbnail_url}
          alt={course.title}
          className="course-card-img"
          containerClassName="w-full h-full"
        />
      </div>

      <div className="course-card-body">
        <div className="course-card-meta-row">
          <span className="course-card-modules-badge">
            <IoLayersOutline size={13} />
            <span>{course.modules_count || 0} Modules</span>
          </span>
          <span className="course-card-free-badge">
            Free
          </span>
        </div>

        <h3 className="course-card-title">
          {course.title}
        </h3>

        <p className="course-card-desc">
          {course.description || "Master core financial concepts through visual scenarios, bite-sized lessons, and interactive quiz cards."}
        </p>

        <div className="course-card-footer">
          <span className="course-card-cta-text">
            Start Learning
          </span>
          <span className="course-card-arrow-circle">
            <IoArrowForward size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
