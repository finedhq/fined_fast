import React, { useEffect, useState } from "react";
import { IoSparkles } from "react-icons/io5";

const MICROCOPY_STEPS = [
  "Connecting your background to this guide…",
  "Highlighting sections that matter to you…",
  "Filtering out textbook jargon…",
  "Structuring your personalized takeaways…",
  "Almost ready for your reading flow…"
];

export default function GeneratingLens({ answers = {} }) {
  const [microcopyIndex, setMicrocopyIndex] = useState(0);

  // Microcopy rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setMicrocopyIndex((prev) => (prev + 1) % MICROCOPY_STEPS.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pl-generating-wrap">
      <div className="pl-scanner-core">
        <div className="pl-scanner-pulse" />
        <div className="pl-scanner-pulse-2" />
        <div className="pl-scanner-icon">
          <IoSparkles />
        </div>
      </div>
      <div className="pl-microcopy-text" key={microcopyIndex}>
        {MICROCOPY_STEPS[microcopyIndex]}
      </div>
    </div>
  );
}
