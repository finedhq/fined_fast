import React, { useEffect, useState } from "react";
import instance from "../../lib/axios";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate, useParams } from "react-router-dom";
import SmartImage from "../../uiComponents/SmartImage";

const imageAssets = {
  completed: "/FcomplitedModule.png",
  incompleted: "/start.png",
  locked: "/locked.png",
  pathLeftToRight: "/FpathLtoR.png",
  pathRightToLeft: "/FpathRtoL.png",
};

export default function CourseOverview() {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const { user, isLoading, isAuthenticated } = useAuth0();
  const [email, setEmail] = useState("");
  const [courseTitle, setCourseTitle] = useState("");
  const [course, setCourse] = useState([]);
  const [showLockedAlert, setShowLockedAlert] = useState(false);
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    setEmail(user.email || '');
  }, [isLoading, isAuthenticated, user]);

  async function fetchCourse() {
    if (!email) return;
    setLoading(true);
    try {
      const res = await instance.post(`/courses/course/${courseId}`, { email });
      setCourseTitle(res.data.title);
      setCourse(res.data.data || []);
    } catch (err) {
      setWarning("Failed to load course.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (email) {
      fetchCourse();
    }
  }, [email, courseId]);

  return (
    <div className="min-h-screen pb-5 bg-gray-100 overflow-x-hidden font-inter text-[#1e1e1e]">
      {loading ? (
        <div className="flex flex-col gap-8 items-center my-20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-[50%] h-24 bg-gray-300 rounded-2xl animate-pulse shadow-sm" />
          ))}
        </div>
      ) : (
        <div className="py-5 px-4 sm:py-10 bg-gray-100 min-h-screen">
          <div className="bg-indigo-700 text-white rounded-2xl overflow-hidden mb-12 w-full sm:max-w-3xl sm:mx-auto shadow-md">
            <div className="flex items-center px-6 py-4">
              <button onClick={() => navigate('/dashboard')} className="text-xl sm:text-2xl mr-4 hover:scale-110 transition-transform cursor-pointer">←</button>
              <h2 className="text-lg sm:text-xl font-bold tracking-wide">{courseTitle}</h2>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-2 px-4 sm:px-0 max-w-3xl mx-auto relative">
            {course.map((module, i) => {
              // Calculate if previous module is completed
              const isFirstModule = i === 0;
              let isPreviousCompleted = true;

              if (!isFirstModule) {
                const prevModule = course[i - 1];
                isPreviousCompleted = prevModule.cards.length > 0 && prevModule.cards.every(c => c.status === "completed");
              }

              const isCompleted = module.cards.length > 0 && module.cards.every(c => c.status === "completed");
              const isClickable = isFirstModule || isPreviousCompleted;
              const isOngoing = isClickable && !isCompleted;

              // Find where to resume
              const cardToResume = module.cards.find(c => c.status !== "completed") || module.cards[0];

              return (
                <div key={i} className={`w-full flex flex-col ${i % 2 === 0 ? "items-start" : "items-end"}`}>
                  <div className={`flex flex-col items-center w-1/4 sm:w-1/6 ${i % 2 === 0 ? 'ml-4 sm:ml-[165px]' : 'mr-4 sm:mr-[165px]'} relative z-10`}>
                    <button
                      onClick={() => {
                        if (isClickable && cardToResume) {
                          sessionStorage.removeItem('quiz_score');
                          navigate(`/courses/course/${courseId}/module/${module.moduleId}/card/${cardToResume.card_id}`);
                        } else if (!cardToResume) {
                          setWarning("This module has no cards yet!");
                        } else {
                          setShowLockedAlert(true);
                        }
                      }}
                      className={`transition-all duration-300 ${isClickable ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-not-allowed opacity-90'} drop-shadow-md`}
                    >
                      <SmartImage
                        src={imageAssets[
                          isCompleted
                            ? "completed"
                            : isOngoing
                              ? "incompleted"
                              : "locked"
                        ]}
                        alt="status icon"
                        containerClassName="w-20 h-20 sm:w-24 sm:h-24"
                        className="object-contain"
                      />
                    </button>
                    <p className="text-center w-40 sm:w-64 mt-3 font-bold text-[12px] sm:text-[15px] text-gray-800 leading-tight bg-white/70 px-2 py-1 rounded-md shadow-sm border border-gray-200">
                      Module {i + 1}: {module.moduleTitle}
                    </p>
                    <p className="text-[10px] sm:text-[12px] font-medium text-gray-500 mt-1">
                      {module.cards.filter(c => c.status === 'completed').length} / {module.cards.length} Cards Completed
                    </p>
                  </div>

                  {i !== course.length - 1 && (
                    <div className={`w-[85%] sm:w-[55%] h-16 sm:h-20 -mt-2 mx-auto ${i % 2 === 0 ? 'ml-auto' : 'mr-auto'}`}>
                      <SmartImage
                        src={i % 2 === 0 ? imageAssets.pathLeftToRight : imageAssets.pathRightToLeft}
                        alt="path"
                        containerClassName="w-full h-full opacity-60"
                        className="object-contain"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {course.length === 0 && !loading && (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200 max-w-3xl mx-auto mt-8">
              <span className="text-4xl mb-4 block">🚧</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No modules found</h3>
              <p className="text-gray-500">This course doesn't have any content yet.</p>
            </div>
          )}
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Card Locked</h3>
            <p className="text-gray-600 mb-6 text-sm">Please complete the previous card to unlock this one.</p>
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
