import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiSettings, FiShare2, FiCheck, FiTrendingUp, FiInfo } from "react-icons/fi";
import { useAuth0 } from "@auth0/auth0-react";
import { getUserProfile, updateUserProfile } from "../services/api";
import { useUserProfile } from "../context/UserProfileContext";
import EditProfileModal from "../components/EditProfileModal";
import MetricTooltip from "../components/MetricTooltip";

const COLOR_LEVELS = {
  0: "bg-slate-100",
  1: "bg-emerald-200",
  2: "bg-emerald-400",
  3: "bg-[#10B981]",
};

/**
 * Generate 52 weeks x 7 days of real activity data based on profile.activity_map
 * Iterates over the past 364 days (52 weeks x 7 days) ending today.
 * If a user is brand new with 0 logs, the grid is completely clean gray squares.
 */
function generateReal52WeekHeatmap(activityMap = {}) {
  const weeks = [];
  let total = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Align day of week: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
  const todayDayOfWeek = (today.getDay() + 6) % 7;

  // 52 weeks = 52 * 7 = 364 days total.
  // The start date is 51 full weeks prior to the start of this current week (Monday)
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (51 * 7 + todayDayOfWeek));

  let lastSeenMonth = -1;

  for (let w = 0; w < 52; w++) {
    const days = [];
    let weekMonthLabel = null;

    for (let d = 0; d < 7; d++) {
      const curDate = new Date(startDate);
      curDate.setDate(startDate.getDate() + (w * 7 + d));

      const yyyy = curDate.getFullYear();
      const mm = String(curDate.getMonth() + 1).padStart(2, "0");
      const dd = String(curDate.getDate()).padStart(2, "0");
      const dateKey = `${yyyy}-${mm}-${dd}`;

      const isFuture = curDate > today;
      const count = isFuture ? 0 : (activityMap[dateKey] || 0);
      total += count;

      const dateStr = curDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      // Show month label if new month begins on this week
      if (curDate.getMonth() !== lastSeenMonth && (d === 0 || curDate.getDate() <= 7)) {
        weekMonthLabel = curDate.toLocaleDateString("en-US", { month: "short" });
        lastSeenMonth = curDate.getMonth();
      }

      const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;

      days.push({
        date: dateStr,
        dateKey,
        count,
        level,
        colorClass: COLOR_LEVELS[level],
        isFuture,
      });
    }

    weeks.push({ weekIndex: w, monthLabel: weekMonthLabel, days });
  }

  return { weeks, total };
}

/**
 * Skeleton Loader Component matching the Profile Page structure
 */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#fafbff] py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-['Nunito',sans-serif]">
      <div className="max-w-5xl mx-auto animate-pulse">
        {/* 1. Header Card Skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-6 flex-1 w-full">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-200 flex-shrink-0" />
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-44 bg-slate-200 rounded-xl" />
                  <div className="h-5 w-20 bg-slate-100 rounded-full" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-slate-200 rounded-md" />
                  <div className="h-4 w-4 bg-slate-200 rounded-full" />
                  <div className="h-4 w-32 bg-slate-200 rounded-md" />
                </div>
                <div className="h-4 w-5/6 bg-slate-100 rounded-md" />
              </div>
            </div>
            <div className="flex items-center gap-2.5 self-start">
              <div className="h-10 w-28 bg-slate-200 rounded-full" />
            </div>
          </div>
        </div>

        {/* 2. Unified Metric Banner Skeleton */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-100">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-0 lg:px-6 first:lg:pl-0 last:lg:pr-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-4 w-24 bg-slate-200 rounded-md" />
                    <div className="h-4 w-4 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-8 w-20 bg-slate-200 rounded-lg mt-2 mb-2" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded-md mb-4" />
                </div>
                <div className="h-8 w-28 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Heatmap Skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex items-center justify-between pb-5 mb-4 border-b border-slate-100">
            <div>
              <div className="h-5 w-56 bg-slate-200 rounded-md mb-2" />
              <div className="h-3.5 w-40 bg-slate-100 rounded-md" />
            </div>
            <div className="h-4 w-32 bg-slate-100 rounded-md" />
          </div>
          <div className="h-32 w-full bg-slate-100 rounded-2xl" />
        </div>

        {/* 4. Course Card Skeleton */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="h-3 w-36 bg-slate-200 rounded-md mb-4" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-5 w-48 bg-slate-200 rounded-md" />
              <div className="h-4 w-32 bg-slate-100 rounded-md" />
            </div>
            <div className="w-full sm:w-1/2 h-3 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading, getAccessTokenSilently } = useAuth0();
  const context = useUserProfile();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [hoveredTooltip, setHoveredTooltip] = useState(null);

  const toggleTooltip = (key) => {
    setActiveTooltip((prev) => (prev === key ? null : key));
  };

  const isTooltipVisible = (key) => {
    return hoveredTooltip === key || activeTooltip === key;
  };

  useEffect(() => {
    const handleDocumentClick = () => {
      setActiveTooltip(null);
    };
    document.addEventListener("click", handleDocumentClick);
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  // Fetch dynamic user profile from backend on mount
  useEffect(() => {
    let isMounted = true;

    async function fetchProfileData() {
      if (authLoading) return;
      setLoading(true);
      try {
        let token = null;
        if (isAuthenticated) {
          try {
            token = await getAccessTokenSilently();
          } catch (tokErr) {
            console.warn("Could not retrieve Auth0 token silently:", tokErr);
          }
        }
        const data = await getUserProfile(token);
        if (isMounted && data) {
          setProfile(data);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, authLoading, getAccessTokenSilently]);

  // Handle immediate local state update upon profile modification
  const handleSaveProfile = async (payload) => {
    let token = null;
    if (isAuthenticated) {
      try {
        token = await getAccessTokenSilently();
      } catch (tokErr) {
        console.warn("Could not retrieve Auth0 token silently for save:", tokErr);
      }
    }
    const updated = await updateUserProfile(payload, token);
    const merged = {
      ...(profile || {}),
      ...(updated || {}),
      ...payload,
    };
    setProfile(merged);
    if (context?.saveProfile) {
      context.saveProfile(payload).catch(() => {});
    }
    return merged;
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/profile?u=${profile?.username || username || 'user'}`;
    const shareData = {
      title: `${displayName} on FinEd`,
      text: `Check out ${displayName}'s financial learning journey and FinScore on FinEd!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (clipErr) {
      console.error("Failed to copy profile link:", clipErr);
    }
  };

  // 52-week activity heatmap based on real activity map
  const { weeks, total: totalConcepts } = useMemo(
    () => generateReal52WeekHeatmap(profile?.activity_map || {}),
    [profile?.activity_map]
  );

  if (loading && !profile) {
    return <ProfileSkeleton />;
  }

  // Dynamic user fields with smart fallbacks
  const displayName =
    profile?.full_name ||
    profile?.display_name ||
    user?.name ||
    (user?.email ? user.email.split("@")[0].replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "User");

  const rawEmail = profile?.email || user?.email || "";
  const emailPrefix = rawEmail ? rawEmail.split("@")[0].replace(/\./g, "_") : "";
  const username =
    profile?.username ||
    user?.nickname ||
    user?.given_name ||
    (emailPrefix ? (emailPrefix.includes("rashi") ? "rashi" : emailPrefix.slice(0, 20)) : "user");

  const userInitial = (displayName[0] || "U").toUpperCase();

  const careerStage = profile?.career_stage || "Student";
  const financialLevel = profile?.financial_level || "Beginner (Level 1) - Starting with basics";
  const bio =
    profile?.bio ||
    "Building daily personal finance & investing discipline 10 minutes a day on FinEd.";

  // Real metrics directly from backend
  const finScore = profile?.fin_score ?? profile?.finscore ?? 0;
  const finStars = profile?.fin_stars ?? profile?.finstars ?? 0;
  const streak = profile?.streak_count ?? profile?.streak ?? 0;
  const rank = profile?.rank ?? 1;
  const personalBest = profile?.personal_best ?? profile?.best_streak ?? streak;

  // Real ongoing course (or null if none active)
  const ongoingCourse = profile?.ongoing_course || null;

  // Format financial level badge text
  const shortLevelDisplay = financialLevel.includes("Beginner")
    ? "Level 1 (Beginner)"
    : financialLevel.includes("Intermediate")
    ? "Level 2 (Intermediate)"
    : "Level 3 (Advanced)";

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
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-8 mb-5 sm:mb-6 relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex flex-row items-start gap-3.5 sm:gap-6 flex-1 w-full">
              {/* Avatar: Auth0 picture or deep navy initial box */}
              {user?.picture && !avatarError ? (
                <img
                  src={user.picture}
                  alt={displayName}
                  onError={() => setAvatarError(true)}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover shadow-md flex-shrink-0 border-2 border-slate-100"
                />
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-[#0047AB] text-white flex items-center justify-center text-3xl sm:text-5xl font-black shadow-md flex-shrink-0 select-none">
                  {userInitial}
                </div>
              )}

              {/* User Bio & Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  <h1 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight truncate">
                    {displayName}
                  </h1>
                  <span className="text-[11px] sm:text-sm font-semibold text-slate-500 bg-slate-100 px-2 sm:px-2.5 py-0.5 rounded-full">
                    @{username}
                  </span>
                </div>

                {/* Badges / Sub-meta */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 text-xs sm:text-sm font-bold text-slate-600">
                  <span className="flex items-center gap-1 text-slate-700">
                    🎓 {careerStage}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[#0047AB]">
                    {shortLevelDisplay}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500">
                    {profile?.location || "India"}
                  </span>
                </div>

                {/* Bio text */}
                <p className="text-xs sm:text-sm text-slate-600 mt-2 sm:mt-3 leading-relaxed font-medium max-w-2xl">
                  {bio}
                </p>
              </div>
            </div>

            {/* Action Buttons Top Right */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-start sm:self-start justify-end flex-shrink-0 mt-3 sm:mt-0">
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm shrink-0 transition cursor-pointer"
                title="Share profile link"
              >
                <FiShare2 size={14} />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-[#FA7516] hover:bg-[#e0650f] text-white shadow-sm shrink-0 transition cursor-pointer"
              >
                <FiSettings size={14} />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2. Unified Rewards Metric Banner (White Theme) */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-100">
            {/* Card 1: FinScore */}
            <div className="px-0 lg:px-6 first:lg:pl-0 last:lg:pr-0 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src="/dash-finscore.svg" alt="FinScore Icon" className="w-[18px] h-[18px] object-contain" />
                    <span>FinScore</span>
                  </div>
                  <MetricTooltip
                    metricKey="finscore"
                    position="col1"
                    activeKey={activeTooltip}
                    hoveredKey={hoveredTooltip}
                    onToggle={toggleTooltip}
                    onHover={setHoveredTooltip}
                  />
                </div>

                <div className="flex items-center gap-2 mt-3 mb-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{finScore}</span>
                  {finScore > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <FiTrendingUp size={12} /> +20
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-1 mb-4">
                  Overall financial knowledge &amp; consistency score.
                </p>
              </div>

              <div>
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Boost Score &rarr;
                </Link>
              </div>
            </div>

            {/* Card 2: FinStars Balance */}
            <div className="px-0 lg:px-6 first:lg:pl-0 last:lg:pr-0 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src="/dash-finstar.svg" alt="FinStar Icon" className="w-[18px] h-[18px] object-contain" />
                    <span>FinStars Balance</span>
                  </div>
                  <MetricTooltip
                    metricKey="finstars"
                    position="col2"
                    activeKey={activeTooltip}
                    hoveredKey={hoveredTooltip}
                    onToggle={toggleTooltip}
                    onHover={setHoveredTooltip}
                  />
                </div>

                <div className="mt-3 mb-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">{finStars}</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-1 mb-4">
                  Exchange your FinStars for rewards and coupons.
                </p>
              </div>

              <div>
                <Link
                  to="/rewards"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Redeem Now &rarr;
                </Link>
              </div>
            </div>

            {/* Card 3: Rank */}
            <div className="px-0 lg:px-6 first:lg:pl-0 last:lg:pr-0 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src="/dash-rank.png" alt="Rank Icon" className="w-[18px] h-[18px] object-contain" />
                    <span>Rank</span>
                  </div>
                  <MetricTooltip
                    metricKey="rank"
                    position="col3"
                    activeKey={activeTooltip}
                    hoveredKey={hoveredTooltip}
                    onToggle={toggleTooltip}
                    onHover={setHoveredTooltip}
                  />
                </div>

                <div className="mt-3 mb-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">#{rank}</span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-1 mb-4">
                  Your current standing among all active learners!
                </p>
              </div>

              <div>
                <Link
                  to="/leaderboard"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  View Leaderboard &rarr;
                </Link>
              </div>
            </div>

            {/* Card 4: Current Streak */}
            <div className="px-0 lg:px-6 first:lg:pl-0 last:lg:pr-0 flex flex-col justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <img src="/dash-fire.png" alt="Streak Icon" className="w-[18px] h-[18px] object-contain" />
                    <span>Current Streak</span>
                  </div>
                  <MetricTooltip
                    metricKey="streak"
                    position="col4"
                    activeKey={activeTooltip}
                    hoveredKey={hoveredTooltip}
                    onToggle={toggleTooltip}
                    onHover={setHoveredTooltip}
                  />
                </div>

                <div className="mt-3 mb-1">
                  <span className="text-3xl font-black text-slate-900 tracking-tight">
                    {streak} {streak === 1 ? 'Day' : 'Days'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mt-1 mb-4">
                  Personal Best: <strong className="font-bold text-slate-700">{personalBest || streak} Days</strong>. Keep learning daily!
                </p>
              </div>

              <div>
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-full text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Keep Streak &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Full-Width 52-Week Learning Activity & Consistency Heatmap */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 mb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Learning Activity &amp; Consistency
              </h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                {totalConcepts} concepts completed in the last year
              </p>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium select-none self-end sm:self-center">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-[2px] bg-slate-100 inline-block border border-slate-200/50" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-200 inline-block" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-emerald-400 inline-block" />
              <span className="w-2.5 h-2.5 rounded-[2px] bg-[#10B981] inline-block" />
              <span>More</span>
            </div>
          </div>

          {/* Heatmap Grid with Horizontal Scroll and Min-Width 780px */}
          <div className="overflow-x-auto pb-2 -mx-2 px-2">
            <div className="min-w-[780px]">
              {/* Month Labels Track */}
              <div className="flex items-center mb-1.5">
                {/* Spacer matching left day labels column */}
                <div className="w-7 flex-shrink-0" />

                {/* 52 Month Track Columns */}
                <div className="flex-1 flex gap-[3px]">
                  {weeks.map((week, wIdx) => (
                    <div
                      key={wIdx}
                      className="flex-1 text-[10px] text-slate-400 font-semibold select-none relative h-4"
                    >
                      {week.monthLabel && (
                        <span className="absolute left-0 top-0 whitespace-nowrap">
                          {week.monthLabel}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Day Labels and 52 Columns Grid */}
              <div className="flex items-stretch">
                {/* Day Labels on the Left: Mon, Wed, Fri */}
                <div className="w-7 flex-shrink-0 flex flex-col justify-between py-[1px] pr-2 text-[10px] text-slate-400 font-semibold select-none text-right">
                  <span className="leading-none">Mon</span>
                  <span className="leading-none">Wed</span>
                  <span className="leading-none">Fri</span>
                </div>

                {/* 52 Week Columns (7 days per column) */}
                <div className="flex-1 flex gap-[3px]">
                  {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex-1 flex flex-col gap-[3px]">
                      {week.days.map((day, dIdx) => (
                        <div
                          key={dIdx}
                          className={`aspect-square w-full rounded-[2px] hover:scale-125 transition-transform cursor-pointer ${day.colorClass}`}
                          title={`${day.date}: ${day.count} concepts completed`}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Ongoing Learning Track Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold tracking-wider uppercase text-slate-400">
              ONGOING LEARNING TRACK
            </span>
            {ongoingCourse && (
              <span className="text-sm font-bold text-[#FA7516]">
                {ongoingCourse.progress_pct ?? 0}% Completed
              </span>
            )}
          </div>

          {ongoingCourse ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-base sm:text-lg font-black text-slate-800">
                  {ongoingCourse.title}
                </h4>
                <p className="text-xs sm:text-sm font-semibold text-slate-400 mt-1">
                  Lesson {ongoingCourse.current_lesson ?? ongoingCourse.completed_modules ?? 0} of {ongoingCourse.total_lessons ?? ongoingCourse.total_modules ?? 0} completed
                </p>
              </div>

              <div className="w-full sm:w-1/2">
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-[#FA7516] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, ongoingCourse.progress_pct ?? 0))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-700">
                  No active courses yet.
                </h4>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-1">
                  Explore courses to start learning and tracking your financial journey!
                </p>
              </div>
              <Link
                to="/courses"
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[#FA7516] hover:bg-[#EA580C] text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer self-start sm:self-center"
              >
                Explore Courses →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSave={handleSaveProfile}
      />
    </div>
  );
}
