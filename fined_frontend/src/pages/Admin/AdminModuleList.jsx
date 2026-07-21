import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import instance from '../../lib/axios';
import { useAuth0 } from '@auth0/auth0-react';

const AdminModuleList = () => {
  const { courseId } = useParams();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { isLoading, isAuthenticated } = useAuth0();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const res = await instance.get(`/modules/course/${courseId}`);
        setModules(res.data);
      } catch (err) {
        console.error('❌ Error fetching modules:', err);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchModules();
    }
  }, [courseId]);

  const handleDeleteModule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this module?")) return;
    try {
      await instance.delete(`/modules/${id}`);
      setModules(prev => prev.filter(module => module.id !== id));
    } catch (err) {
      console.error("Failed to delete module", err);
      alert("Failed to delete module.");
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please log in.</p>;

  return (
    <main className="min-h-screen px-4 sm:px-6 py-10 bg-linear-to-br from-white to-blue-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700 mb-1">Modules</h1>
            <p className="text-gray-500">Course ID: <span className="font-semibold text-gray-700">{courseId}</span></p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/admin/courses"
              className="text-sm px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition"
            >
              ← Back to Courses
            </Link>
            <button
              onClick={() => navigate(`/admin/courses/${courseId}/modules/add`)}
              className="bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 transition cursor-pointer"
            >
              + Add Module
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : modules.length === 0 ? (
          <div className="text-center mt-20">
            <p className="text-lg text-gray-500">No modules found for this course.</p>
            <button
              onClick={() => navigate(`/admin/courses/${courseId}/modules/add`)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition cursor-pointer"
            >
              Create Your First Module
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <div
                key={mod.id}
                className="bg-white shadow-md border border-gray-200 rounded-lg p-5 hover:shadow-lg transition flex flex-col"
              >
                <div className='flex justify-between items-start gap-2 mb-2'>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {mod.title}
                  </h3>
                  <button 
                    onClick={() => handleDeleteModule(mod.id)}
                    className="text-red-500 text-xs hover:text-red-700 font-semibold cursor-pointer shrink-0 mt-1"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-4 flex-grow">
                  {mod.description || <span className="italic text-gray-400">No description provided.</span>}
                </p>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs font-bold text-gray-400">Order: {mod.order_index}</span>
                  <button
                    onClick={() => navigate(`/admin/cards/add?moduleId=${mod.id}`)}
                    className="text-indigo-600 hover:underline text-sm font-medium cursor-pointer"
                  >
                    + Add Card to Module
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminModuleList;
