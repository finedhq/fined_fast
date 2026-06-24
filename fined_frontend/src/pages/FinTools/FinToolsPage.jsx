import React, { useState, useEffect } from "react";
import instance from "../../lib/axios";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import toast from "react-hot-toast";

const tools = [
  {
    name: "FinTracker",
    image: "/expense.png",
    description: "Track your monthly expenses, set budgets, and visualize your financial habits.",
    route: "/fin-tools/expensetracker",
    available: true
  }
];

export default function FinToolsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading } = useAuth0();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated && user?.email) {
      setEmail(user.email);
    }
  }, [isAuthenticated, user]);

  return (
    <div className="sm:pb-5 bg-gray-100 min-h-screen">
      <div className="px-4 sm:px-10 py-10">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">FinTools</h1>
        <div className="w-68 mx-auto sm:mx-0">
          {tools.map((tool, index) => (
            <div
              key={index}
              className={`rounded-2xl shadow-md overflow-hidden bg-white border ${
                tool.available ? "hover:shadow-xl cursor-pointer" : "opacity-60"
              } transition-all duration-300`}
              onClick={() => tool.available && navigate(tool.route)}
            >
              <div className="shrink-0 w-full h-48 relative">
                <img
                  src={tool.image}
                  alt={tool.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  {tool.name}
                </h2>
                <p className="text-gray-600">{tool.description}</p>
                {!tool.available && (
                  <span className="inline-block mt-3 text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
