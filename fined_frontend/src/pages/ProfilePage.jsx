import React, { useState } from "react";
import { FiShare2, FiSettings, FiCheck } from "react-icons/fi";
import { useUserProfile } from "../context/UserProfileContext";

export default function ProfilePage() {
  const { profile, openEditModal } = useUserProfile();
  const [copied, setCopied] = useState(false);

  const displayName = profile?.display_name || "Rashi Karule";
  const username = profile?.username || "rashi";
  const userInitial = (displayName[0] || "R").toUpperCase();
  const streak = profile?.streak_count || 4;
  const rank = profile?.rank || 1;
  const finScore = profile?.fin_score || 500;
  const finStars = profile?.fin_stars ?? 0;
  const careerStage = profile?.career_stage || "Student";
  const financialLevel = profile?.financial_level || "Beginner (Level 1) - Starting with basics";
  const bio =
    profile?.bio ||
    "Engineering student building daily personal finance & investing discipline 10 minutes a day on FinEd.";

  const ongoingCourse = profile?.ongoing_course || {
    title: "Basics of Stock Market",
    current_lesson: 6,
    total_lessons: 12,
    progress_pct: 50,
  };

  // 28-day habit tracker array (4 rows x 7 cols)
  const consistencyGrid = profile?.consistency_grid || [
    0, 0, 3, 2, 0, 3, 1,
    3, 1, 0, 3, 3, 1, 0,
    2, 3, 1, 0, 3, 2, 3,
    3, 3, 3, 3, 3, 3, 3,
  ];

  // Helper for grid cell colors
  const getCellColor = (level) => {
    switch (level) {
      case 3:
        return "bg-[#0ca678]";
      case 2:
        return "bg-emerald-400";
      case 1:
        return "bg-emerald-200";
      default:
        return "bg-slate-100";
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fafbff] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-['Nunito',sans-serif]">
      <div className="max-w-5xl mx-auto">
        {/* Toast notification for share */}
        {copied && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-slate-900 text-white text-xs sm:text-sm font-bold px-4 py-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-2">
            <FiCheck className="text-emerald-400 text-base" />
            <span>Profile link copied to clipboard!</span>
          </div>
        )}

        {/* 1. Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 flex-1">
              {/* Avatar Navy Blue Box with Bold Initial */}
              <div className="w-22 h-22 sm:w-26 sm:h-26 rounded-2xl sm:rounded-3xl bg-[#0047AB] text-white flex items-center justify-center text-4xl sm:text-5xl font-black shadow-md flex-shrink-0 select-none">
                {userInitial}
              </div>

              {/* User Bio & Identity */}
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {displayName}
                  </h1>
                  <span className="text-sm sm:text-base font-semibold text-slate-500">
                    @{username}
                  </span>
                </div>

                <p className="text-sm sm:text-base text-slate-600 mt-2 leading-relaxed font-medium max-w-2xl">
                  {bio}
                </p>

                {/* Pills Strip */}
                <div className="flex flex-wrap items-center gap-2.5 mt-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f0f4ff] text-[#3b5998] border border-[#dbe4ff] rounded-full text-xs sm:text-sm font-bold shadow-2xs">
                    🎓 {careerStage}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6fcf5] text-[#0ca678] border border-[#c3fae8] rounded-full text-xs sm:text-sm font-bold shadow-2xs">
                    📊 Level 1: Beginner
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#fff4e6] text-[#d9480f] border border-[#ffe8cc] rounded-full text-xs sm:text-sm font-bold shadow-2xs">
                    🔥 {streak}-Day Streak
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f8f0fc] text-[#862e9c] border border-[#f3d9fa] rounded-full text-xs sm:text-sm font-bold shadow-2xs">
                    🏆 Rank #{rank}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Top Right */}
            <div className="flex items-center gap-2.5 self-stretch sm:self-start justify-end flex-shrink-0 pt-2 sm:pt-0">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs hover:border-slate-300 transition cursor-pointer"
                title="Share internal portfolio link"
              >
                <FiShare2 size={15} />
                <span>Share Portfolio</span>
              </button>

              <button
                type="button"
                onClick={openEditModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2 rounded-full bg-[#FA7516] hover:bg-[#EA580C] text-white text-xs sm:text-sm font-bold shadow-sm hover:shadow transition cursor-pointer"
              >
                <FiSettings size={15} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Three Proof-of-Work Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Card 1: Consistency Rating / FinScore */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 block">
                CONSISTENCY RATING
              </span>
              <h3 className="text-base font-black text-slate-800 mt-1">
                FinScore
              </h3>
            </div>

            <div className="my-5 text-center">
              <div className="text-5xl sm:text-6xl font-black text-[#0047AB] tracking-tight">
                {finScore}
              </div>
              <div className="mt-3">
                <span className="inline-block px-3.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-emerald-700 font-extrabold text-xs">
                  Top 15% Platform Consistency
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Reflects consistency across daily modules, article deep dives, and quizzes.
            </p>
          </div>

          {/* Card 2: Rewards & Badges / FinStars */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 block">
                REWARDS &amp; BADGES
              </span>
              <h3 className="text-base font-black text-slate-800 mt-1">
                FinStars
              </h3>
            </div>

            <div className="my-5 text-center">
              <div className="flex items-center justify-center gap-2 text-5xl sm:text-6xl font-black text-amber-500 tracking-tight">
                <span className="text-4xl sm:text-5xl text-amber-400">⭐</span>
                <span>{finStars}</span>
              </div>
              <p className="text-xs font-bold text-slate-600 mt-3">
                Earned through streak milestones
              </p>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Redeemable for verified FinEd course completion certificates.
            </p>
          </div>

          {/* Card 3: Learning Habit / Consistency Grid */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-extrabold tracking-wider uppercase text-slate-400 block">
                LEARNING HABIT
              </span>
              <h3 className="text-base font-black text-slate-800 mt-1">
                Consistency Grid
              </h3>
            </div>

            {/* 28-day habit tracker: 4 rows of 7 columns */}
            <div className="my-4 flex items-center justify-center">
              <div className="grid grid-cols-7 gap-2 w-fit">
                {consistencyGrid.map((level, idx) => (
                  <div
                    key={idx}
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-md shadow-2xs transition-colors duration-200 ${getCellColor(
                      level
                    )}`}
                    title={`Day ${idx + 1}: Activity Level ${level}`}
                  />
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              Target: 10 minutes a day of financial concepts.
            </p>
          </div>
        </div>

        {/* 3. Course Progress Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h3 className="text-lg font-black text-slate-900 mb-4 tracking-tight">
            Current Course Progress
          </h3>
          <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base sm:text-lg font-black text-slate-800">
                {ongoingCourse.title}
              </h4>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                Lesson {ongoingCourse.current_lesson} of {ongoingCourse.total_lessons} completed ({ongoingCourse.progress_pct}%)
              </p>
            </div>

            <div className="w-full sm:w-1/2">
              <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#FA7516] h-full rounded-full transition-all duration-500"
                  style={{ width: `${ongoingCourse.progress_pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
