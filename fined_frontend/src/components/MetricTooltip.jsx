import React, { useState, useEffect, useRef } from "react";
import { FiInfo } from "react-icons/fi";

export const METRIC_TOOLTIP_DATA = {
  finscore: {
    title: "FinScore Metric",
    tag: "Consistency & Skill",
    body: "Your overall financial discipline score (0–1000). Increases as you read articles, finish course modules, and maintain daily learning streaks.",
  },
  finstars: {
    title: "FinStars Balance",
    tag: "Reward Currency",
    body: "FinEd's reward tokens earned through quizzes and streaks. Redeem them on the Rewards page for coupons and real-world perks.",
  },
  streak: {
    title: "Learning Streak",
    tag: "Daily Habit",
    body: "Tracks consecutive days you've completed at least one lesson or quiz. Build longer streaks to earn multiplier bonuses.",
  },
  rank: {
    title: "Cohort Rank",
    tag: "Global Standing",
    body: "Your position on the community leaderboard among all active learners, updated live as you earn points.",
  },
};

const POSITION_STYLES = {
  col1: {
    container: "left-1/2 -translate-x-1/2 lg:left-0 lg:translate-x-0",
    caret: "left-1/2 -translate-x-1/2 lg:left-3 lg:translate-x-0",
  },
  col2: {
    container: "right-0 lg:left-0 lg:translate-x-0",
    caret: "right-3 lg:left-3 lg:right-auto lg:translate-x-0",
  },
  col3: {
    container: "left-1/2 -translate-x-1/2 lg:right-0 lg:left-auto lg:translate-x-0",
    caret: "left-1/2 -translate-x-1/2 lg:right-3 lg:left-auto lg:translate-x-0",
  },
  col4: {
    container: "right-0",
    caret: "right-3",
  },
  left: {
    container: "left-0",
    caret: "left-3",
  },
  right: {
    container: "right-0",
    caret: "right-3",
  },
};

/**
 * MetricTooltip
 * Clean, light brand-themed info tooltip for FinEd metric cards.
 * Replaces heavy AI-style dark tooltips with crisp, human-focused micro-copy.
 */
export default function MetricTooltip({
  metricKey,
  position = "col1",
  info: customInfo,
  activeKey,
  hoveredKey,
  onToggle,
  onHover,
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [internalHover, setInternalHover] = useState(false);
  const wrapperRef = useRef(null);

  const info = customInfo || METRIC_TOOLTIP_DATA[metricKey];
  if (!info) return null;

  // Determine visibility: controlled vs internal
  const isControlled = activeKey !== undefined && onToggle !== undefined;
  const isVisible = isControlled
    ? activeKey === metricKey || hoveredKey === metricKey
    : internalOpen || internalHover;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isControlled) {
      onToggle(metricKey);
    } else {
      setInternalOpen((prev) => !prev);
    }
  };

  const handleMouseEnter = () => {
    if (isControlled && onHover) {
      onHover(metricKey);
    } else {
      setInternalHover(true);
    }
  };

  const handleMouseLeave = () => {
    if (isControlled && onHover) {
      onHover(null);
    } else {
      setInternalHover(false);
    }
  };

  // Close on outside click for uncontrolled usage
  useEffect(() => {
    if (isControlled) return;
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setInternalOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isControlled]);

  const posStyle = POSITION_STYLES[position] || POSITION_STYLES.col1;

  return (
    <div
      ref={wrapperRef}
      className="relative inline-flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleToggle}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition cursor-pointer ${
          isVisible
            ? "bg-orange-50 text-[#FA7516] border border-orange-200/80 ring-2 ring-orange-100"
            : "bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 border border-transparent"
        }`}
        aria-label={`${info.title} Information`}
        aria-expanded={isVisible}
      >
        <FiInfo size={12} />
      </button>

      {isVisible && (
        <div
          role="tooltip"
          className={`absolute top-full mt-2.5 ${posStyle.container} bg-white text-slate-800 border border-slate-200/80 rounded-2xl p-4 shadow-xl shadow-slate-200/50 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] backdrop-blur-sm z-50 text-left pointer-events-auto`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Top Caret pointing directly to (i) button */}
          <div
            className={`absolute -top-1.5 ${posStyle.caret} w-3 h-3 bg-white border-t border-l border-slate-200/80 rotate-45 pointer-events-none`}
          />

          {/* Header Row: Title & Light Brand Pill Badge */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <span className="font-bold text-slate-900 text-sm">
              {info.title}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-[#FA7516] border border-orange-100 shrink-0">
              {info.tag}
            </span>
          </div>

          {/* Body Text */}
          <p className="text-xs text-slate-600 leading-relaxed mt-2">
            {info.body}
          </p>
        </div>
      )}
    </div>
  );
}
