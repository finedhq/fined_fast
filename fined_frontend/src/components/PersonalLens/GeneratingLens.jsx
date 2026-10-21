import { useEffect, useState } from "react";

const MICROCOPY_STEPS = [
  "Reading your answers…",
  "Picking the sections that fit you…",
  "Writing your takeaway in plain words…",
  "Almost ready…",
];

// While the lens is being made: a plain status line plus placeholder lines
// shaped like the result, so the wait shows what's coming.
export default function GeneratingLens() {
  const [microcopyIndex, setMicrocopyIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMicrocopyIndex((prev) => Math.min(prev + 1, MICROCOPY_STEPS.length - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="pl-generating-wrap" role="status" aria-live="polite">
      <h3 className="pl-gen-title">Tailoring this article to you</h3>
      <p className="pl-microcopy-text" key={microcopyIndex}>
        {MICROCOPY_STEPS[microcopyIndex]}
      </p>
      <div className="pl-skel is-label" />
      <div className="pl-skel" />
      <div className="pl-skel is-short" />
      <div className="pl-skel is-label" />
      <div className="pl-skel is-block" />
      <div className="pl-skel is-label" />
      <div className="pl-skel" />
      <div className="pl-skel is-short" />
    </div>
  );
}
