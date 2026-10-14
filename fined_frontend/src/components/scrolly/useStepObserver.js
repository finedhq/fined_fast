// Which story step is being read — a port of the prototype's
// _setupStepObserver (engine.js): one IntersectionObserver over every
// `.scrolly-step` on the page, the same trigger zones as the prototype
// (desktop vs ≤960 px), scroll direction for reversible figures, rebuilt on
// resize, and fully cleaned up when the page unmounts.
// `zone` (optional): a different trigger zone { rootMargin, threshold } — used
// by the experimental phone layouts in mock/ (pass it with a matching resetKey).
import { useEffect, useRef } from "react";

export default function useStepObserver(rootRef, onActivate, resetKey, zone) {
  const callback = useRef(onActivate);
  const zoneRef = useRef(zone);
  useEffect(() => {
    callback.current = onActivate;
    zoneRef.current = zone;
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const stepEls = Array.from(root.querySelectorAll(".scrolly-step"));
    if (!stepEls.length) return undefined;

    let lastIndex = -1;
    let observer = null;
    let resizeTimer = null;

    const create = () => {
      if (observer) observer.disconnect();
      const isMobile = window.innerWidth <= 960;
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = stepEls.indexOf(entry.target);
            const direction = index > lastIndex ? "down" : "up";
            lastIndex = index;
            callback.current({
              chapter: entry.target.dataset.chapter,
              step: Number(entry.target.dataset.step),
              direction,
            });
          });
        },
        zoneRef.current
          ? { root: null, ...zoneRef.current }
          : { root: null, rootMargin: isMobile ? "-38% 0px -25% 0px" : "-20% 0px -40% 0px", threshold: 0.2 }
      );
      stepEls.forEach((el) => observer.observe(el));
    };
    create();

    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(create, 200);
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (observer) observer.disconnect();
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, [rootRef, resetKey]);
}
