// Smooth scroll to a part of the module page (instant with reduced motion).
// Sections carry the prototype's scroll-margin-top, so they land below the top bar.
export function scrollToElement(el) {
  if (!el) return;
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
