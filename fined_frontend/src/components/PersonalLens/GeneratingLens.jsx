import React, { useEffect, useState } from "react";
import { FiCpu } from "react-icons/fi";
import { IoSparkles } from "react-icons/io5";

const MICROCOPY_STEPS = [
  "Connecting your background to this guide…",
  "Highlighting sections that matter to you…",
  "Filtering out textbook jargon…",
  "Structuring your personalized takeaways…",
  "Almost ready for your reading flow…"
];

export default function GeneratingLens({ answers = {} }) {
  const [phase, setPhase] = useState(1); // 1: Tags, 2: Merge Core, 3: Shimmer, 4: Microcopy
  const [microcopyIndex, setMicrocopyIndex] = useState(0);

  // Extract selected tags from answers
  const tags = Object.values(answers)
    .map((a) => a.tag || a.label)
    .filter(Boolean);

  useEffect(() => {
    // Phase 1: 0 - 1.8s
    const t1 = setTimeout(() => setPhase(2), 1800);
    // Phase 2: 1.8s - 2.9s
    const t2 = setTimeout(() => setPhase(3), 2900);
    // Phase 3 & 4: 4.0s+
    const t3 = setTimeout(() => setPhase(4), 4000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  // Microcopy rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setMicrocopyIndex((prev) => (prev + 1) % MICROCOPY_STEPS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pl-generating-wrap">
      {/* Phase 1: Tag Activation */}
      {phase === 1 && (
        <>
          <div className="pl-tags-container">
            {tags.map((tag, idx) => (
              <div key={idx} className="pl-active-chip">
                <IoSparkles size={12} />
                <span>{tag}</span>
              </div>
            ))}
          </div>
          <div className="pl-microcopy-text">
            Analyzing your reading profile…
          </div>
        </>
      )}

      {/* Phase 2: Tag Merging & Core Transformation */}
      {phase === 2 && (
        <>
          <div className="pl-merge-core">
            <FiCpu />
          </div>
          <div className="pl-microcopy-text">
            Synthesizing your personal lens…
          </div>
        </>
      )}

      {/* Phase 3 & 4: Shimmering Skeleton + Rotating Microcopy */}
      {(phase === 3 || phase === 4) && (
        <>
          <div className="pl-shimmer-card">
            <div className="pl-shimmer-bar w-60" />
            <div className="pl-shimmer-bar w-100" />
            <div className="pl-shimmer-bar w-80" />
          </div>
          <div className="pl-microcopy-text">
            {MICROCOPY_STEPS[microcopyIndex]}
          </div>
        </>
      )}
    </div>
  );
}
