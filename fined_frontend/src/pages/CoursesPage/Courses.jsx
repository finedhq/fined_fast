import React, { useEffect, useState, useRef } from "react";
import instance from "../../lib/axios";
import toast from "react-hot-toast";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import SmartImage from "../../uiComponents/SmartImage";
import RevealOnScroll from "../../components/RevealOnScroll";


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
  const coursesPerPage = 8;
  const currentCourses = courses.slice(
    (currentPage - 1) * coursesPerPage,
    currentPage * coursesPerPage
  );
  const totalPages = Math.ceil(courses.length / coursesPerPage);

  const carouselRef = useRef(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    setEmail(user.email || "");
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
      setWarning("Failed to load ongoing course.");
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
    : courses[courses.length - 1];

  const courseRows = [];
  for (let i = 0; i < currentCourses.length; i += 3) {
    courseRows.push(currentCourses.slice(i, i + 3));
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans w-full flex flex-col items-center">
      <main className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 flex-1 flex flex-col">
        {loading ? (
          <div className="w-full space-y-12 animate-pulse">
            <div>
              <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
              <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 w-full max-w-3xl h-48 flex gap-6 shadow-sm">
                <div className="w-1/3 bg-gray-200 rounded-xl h-full"></div>
                <div className="w-2/3 flex flex-col justify-center space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-10 bg-gray-200 rounded-full w-32 mt-4"></div>
                </div>
              </div>
            </div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 h-80 flex flex-col overflow-hidden shadow-sm">
                    <div className="h-44 bg-gray-200 w-full"></div>
                    <div className="p-5 flex flex-col gap-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-200 rounded w-full mt-auto"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-16">
            {isAuthenticated && (
              <section className="w-full flex flex-col gap-6">
                <RevealOnScroll>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                    Continue Learning
                  </h2>
                </RevealOnScroll>
                
                {isFetchingOngoing ? (
                  <RevealOnScroll>
                    <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 w-full max-w-3xl h-48 flex gap-6 shadow-sm animate-pulse">
                      <div className="w-1/3 bg-gray-200 rounded-xl h-full"></div>
                      <div className="w-2/3 flex flex-col justify-center space-y-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  </RevealOnScroll>
                ) : targetCourse ? (
                  <RevealOnScroll>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-4 sm:p-5 w-full max-w-4xl flex flex-col sm:flex-row gap-5 sm:gap-8 items-center">
                      <div className="w-full sm:w-2/5 aspect-video rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        <SmartImage
                          src={targetCourse.thumbnail_url}
                          alt={targetCourse.title}
                          className="w-full h-full object-cover"
                          containerClassName="w-full h-full"
                        />
                      </div>
                      <div className="w-full sm:w-3/5 flex flex-col justify-center py-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mb-2">
                          <span>{targetCourse.modules_count} Modules</span>
                          <span>&bull;</span>
                          <span>{targetCourse.duration} mins</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 leading-tight line-clamp-2">
                          {targetCourse.title}
                        </h3>
                        <p className="text-gray-600 mb-6 line-clamp-2 text-sm sm:text-base leading-relaxed">
                          {targetCourse.description}
                        </p>
                        <button
                          onClick={() => navigate(`/courses/${targetCourse.slug || targetCourse.id}`)}
                          className="self-start bg-amber-400 hover:bg-amber-500 text-white font-semibold py-2.5 px-6 rounded-full transition-colors active:scale-95"
                        >
                          {ongoingCourse?.id ? "Continue Course" : "Start Now"}
                        </button>
                      </div>
                    </div>
                  </RevealOnScroll>
                ) : (
                  <RevealOnScroll>
                    <div className="text-gray-500 italic">No courses available.</div>
                  </RevealOnScroll>
                )}
              </section>
            )}

            <section className="w-full flex flex-col gap-8">
              <RevealOnScroll>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                  Recommended Courses
                </h2>
              </RevealOnScroll>
              
              <div ref={carouselRef} className="w-full flex flex-col gap-8 sm:gap-10">
                {courseRows.map((row, rowIndex) => (
                  <RevealOnScroll key={rowIndex}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
                      {row.map((course) => (
                        <div key={course.id} className="h-full flex flex-col">
                          <CourseCard
                            course={course}
                            isAuthenticated={isAuthenticated}
                            navigate={navigate}
                          />
                        </div>
                      ))}
                    </div>
                  </RevealOnScroll>
                ))}
              </div>

              
              {totalPages > 1 && (
                <RevealOnScroll>
                  <div className="flex justify-center items-center gap-3 mt-10">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      Previous
                    </button>
                    <div className="flex gap-2 hidden sm:flex">
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`w-10 h-10 rounded-xl font-bold transition-colors ${
                            currentPage === i + 1
                              ? "bg-amber-400 text-white shadow-sm"
                              : "border border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                    <span className="sm:hidden font-medium text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </RevealOnScroll>
              )}
            </section>

          </div>
        )}
      </main>

      {/* MODALS */}
      {(warning || error) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl w-full max-w-sm flex flex-col gap-4 transform transition-all">
            <div className="flex items-center gap-3 text-red-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-xl font-bold">Alert</h3>
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
              className="mt-2 bg-amber-400 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-xl transition-colors w-full"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CourseCard({ course, isAuthenticated, navigate }) {
  return (
    <div
      onClick={() => {
        if (isAuthenticated) {
          navigate(`/courses/${course.slug || course.id}`);
        } else {
          toast.error("Please sign in to view this course");
        }
      }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 w-full h-full cursor-pointer flex flex-col overflow-hidden group"
    >
      <div className="w-full aspect-[4/3] bg-gray-100 relative overflow-hidden shrink-0">
        <SmartImage
          src={course.thumbnail_url}
          alt={course.title}
          className="w-full h-full object-fill group-hover:scale-105 transition-transform duration-500"
          containerClassName="w-full h-full"
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-300"></div>
      </div>
      <div className="p-6 flex flex-col flex-1 bg-white justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            <span>{course.modules_count || 0} Modules</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
            <span>{course.duration || 0} mins</span>
          </div>
          <h3 className="font-bold text-gray-900 text-xl leading-snug mb-3 line-clamp-2 min-h-[3.25rem] group-hover:text-amber-500 transition-colors">
            {course.title}
          </h3>
        </div>
        <p className="text-sm sm:text-base text-gray-500 line-clamp-2 leading-relaxed min-h-[2.5rem] mt-auto">
          {course.description || "No description provided."}
        </p>
      </div>
    </div>
  );
}

