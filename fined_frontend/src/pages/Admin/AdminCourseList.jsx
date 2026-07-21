import React, { useState, useEffect } from "react";
import instance from "../../lib/axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import SmartImage from "../../uiComponents/SmartImage";

const AdminCourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { user, isLoading, isAuthenticated } = useAuth0();

  const fetchCourses = async () => {
    try {
      const res = await instance.get("/courses/getall");
      setCourses(res.data);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;
    try {
      await instance.delete(`/courses/${id}`);
      setCourses(prev => prev.filter(course => course.id !== id));
    } catch (err) {
      console.error("Failed to delete course", err);
      alert("Failed to delete course.");
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please log in.</p>;

  return (
    <main className="min-h-screen bg-linear-to-r from-blue-50 to-indigo-50 p-4 sm:p-10">
      <section className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            All Courses
          </h1>
          <div className="flex gap-4 items-center">
            <Link to="/admin" className="text-lg font-semibold text-gray-700 hover:text-indigo-600">
              Dashboard
            </Link>
            <button
              onClick={() => navigate("/admin/courses/add")}
              className="inline-flex items-center bg-indigo-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition cursor-pointer"
            >
              <span className="mr-2 text-xl">+</span>
              Add New Course
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : courses.length === 0 ? (
          <p className="text-center text-gray-500 mt-24 text-lg font-medium">
            No courses available right now.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-xl bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                {course.thumbnail_url ? (
                  <SmartImage
                    src={course.thumbnail_url}
                    alt={course.title}
                    containerClassName="w-full h-48 rounded-t-xl"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-indigo-100 rounded-t-xl flex items-center justify-center text-indigo-400 font-semibold text-lg">
                    No Image
                  </div>
                )}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <h2 className="text-xl font-bold text-gray-900 truncate flex-grow">
                      {course.title}
                    </h2>
                    <button 
                      onClick={() => handleDeleteCourse(course.id)} 
                      className="text-red-500 text-sm hover:text-red-700 font-semibold cursor-pointer shrink-0"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="text-gray-700 mb-5 line-clamp-3 text-sm flex-grow">
                    {course.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500 font-semibold tracking-wide">
                    <span>Modules: {course.modules_count}</span>
                    <span>Duration: {course.duration} min</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/courses/${course.id}/modules`);
                      }}
                      className="w-1/2 text-center bg-indigo-100 hover:bg-indigo-200 text-indigo-700 py-2 rounded-lg font-medium transition cursor-pointer"
                    >
                      View Modules
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/courses/course/${course.id}`);
                      }}
                      className="w-1/2 text-center bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition cursor-pointer"
                    >
                      Preview
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default AdminCourseList;
