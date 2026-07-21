import React, { useState } from "react";
import instance from "../../lib/axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

const AddModuleForm = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    order_index: '',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const { isLoading, isAuthenticated } = useAuth0();

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      await instance.post(`/modules/add/${courseId}`, {
        ...form,
        order_index: parseInt(form.order_index, 10)
      });
      setStatus("✅ Module added successfully!");
      setForm({
        title: '',
        description: '',
        order_index: '',
      });
    } catch (err) {
      console.error("❌ Error adding module:", err.response?.data || err.message);
      setStatus("Failed to add module. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (!isAuthenticated) return <p>Please log in.</p>;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-indigo-700">Add New Module</h2>
          <Link
            to={`/admin/courses/${courseId}/modules`}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Modules
          </Link>
        </div>

        <p className="text-gray-500 mb-6">
          Add module to the course (ID: <span className="font-semibold text-gray-700">{courseId}</span>).
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="title" className="block mb-1 font-medium text-gray-700">
              Module Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              required
              placeholder="e.g., Introduction to Investing"
              value={form.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label htmlFor="description" className="block mb-1 font-medium text-gray-700">
              Module Description
            </label>
            <textarea
              name="description"
              id="description"
              placeholder="Brief description of the module..."
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none resize-y"
            />
          </div>

          <div>
            <label htmlFor="order_index" className="block mb-1 font-medium text-gray-700">
              Module Order (1, 2, 3...) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="order_index"
              id="order_index"
              required
              placeholder="e.g., 1"
              min="1"
              value={form.order_index}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white font-medium transition duration-200 cursor-pointer ${
              loading ? "bg-indigo-400" : "bg-indigo-600 hover:bg-indigo-700"
            }`}
          >
            {loading ? "Posting..." : "Post Module"}
          </button>
        </form>
        
        {status && <p className={`mt-4 text-center font-medium ${status.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>{status}</p>}
      </div>
    </div>
  );
};

export default AddModuleForm;
