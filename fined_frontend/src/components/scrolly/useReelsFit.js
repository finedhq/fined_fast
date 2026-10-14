// Reels (the phone layout, scrolly-reels.css) sizes the pinned figure for
// each step instead of a fixed half-and-half split. For the step being read it
// measures how tall the figure and the text want to be, then:
//   - both fit on one screen  -> the figure gets what it needs plus up to
//                                BREATHING_ROOM of the spare space (its
//                                drawing sits centred in the box), and the
//                                text gets the rest;
//   - they nearly fit         -> the figure is drawn a little smaller (down to
//                                NEAR_MISS_ZOOM) so the step fits one screen;
//   - they don't fit          -> the figure still gets what it needs (its
//                                controls must stay visible) but leaves at
//                                least MIN_TEXT for the text; the step card
//                                then grows and is read by scrolling on, under
//                                the pinned figure;
//   - the figure alone is too tall -> its drawing is scaled down (a CSS
//                                transform, never below MIN_ZOOM) to fit.
// Results go into CSS variables: --reel-fig / --reel-zoom on the chapter (the
// figure's size) and --step-fig on that one step (where its text starts).
// Each step keeps its own --step-fig, so resizing the figure for the step
// being read never changes the height of the steps above it — which would
// push the page and slide the text under the figure.
import { useLayoutEffect } from "react";

const MIN_TEXT = 170; // px of text always left below the figure (title + ~3 lines)
const MIN_ZOOM = 0.72;
const NEAR_MISS_ZOOM = 0.9;
const BREATHING_ROOM = 56; // spare px a figure may take so it isn't drawn edge to edge

function headerHeight(root) {
  return parseFloat(getComputedStyle(root).getPropertyValue("--header-height")) || 64;
}

// Room the step's text needs under the figure: the 16px gap, the text itself
// and a small margin. (The swipe arrow under it may sit below the screen.)
function textHeight(stepEl) {
  const kids = Array.from(stepEl.children);
  if (!kids.length) return 0;
  const top = kids[0].getBoundingClientRect().top;
  const bottom = kids[kids.length - 1].getBoundingClientRect().bottom;
  return 16 + (bottom - top) + 8;
}

export default function useReelsFit(sectionRef, enabled, activeStep) {
  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!enabled || !section) return undefined;
    const figure = section.querySelector(".scrolly-figure");
    const viz = section.querySelector(".viz-content");
    if (!figure || !viz) return undefined;

    let last = "";
    let frame = 0;
    const fit = () => {
      const steps = section.querySelectorAll(".scrolly-step");
      const stepEl = steps[activeStep ?? 0];
      if (!stepEl) return;
      const available = Math.min(window.innerHeight, document.documentElement.clientHeight) - headerHeight(section);

      // Natural figure height, measured on a hidden copy so the real figure's
      // height transition is never interrupted. Form fields lose their names
      // first, so a copied radio button can't untick the real one.
      const probe = figure.cloneNode(true);
      probe.querySelectorAll("[name]").forEach((el) => el.removeAttribute("name"));
      probe.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      probe.classList.add("is-measuring");
      probe.setAttribute("aria-hidden", "true");
      probe.style.width = `${figure.getBoundingClientRect().width}px`;
      figure.parentElement.appendChild(probe);
      const figNeed = Math.ceil(probe.getBoundingClientRect().height) + 4; // + a hair, so borders never clip
      const vizNeed = probe.querySelector(".viz-content").getBoundingClientRect().height;
      probe.remove();
      const chrome = figNeed - vizNeed; // padding + title row

      const textNeed = textHeight(stepEl);
      let figH;
      let zoom = 1;
      if (figNeed + textNeed <= available) {
        figH = figNeed + Math.max(0, Math.min(BREATHING_ROOM, available - figNeed - textNeed - 12)); // 12px spare so rounding never tips the text over
      } else {
        // A near miss: if drawing the figure at 90% or more makes the whole
        // step fit one screen, do that rather than make the reader scroll.
        const snug = available - textNeed;
        figH = (snug - chrome) / vizNeed >= NEAR_MISS_ZOOM ? snug : Math.min(figNeed, available - MIN_TEXT);
        if (figNeed > figH) zoom = Math.max(MIN_ZOOM, (figH - chrome) / vizNeed);
      }
      const key = `${Math.round(figH)}|${zoom.toFixed(3)}`;
      if (key === last) return;
      last = key;
      section.style.setProperty("--reel-fig", `${Math.round(figH)}px`);
      stepEl.style.setProperty("--step-fig", `${Math.round(figH)}px`);
      section.style.setProperty("--reel-zoom", zoom.toFixed(3));
    };

    fit();
    // Figures load lazily and some animate into a new size, so fit again
    // when the figure or the step's text changes size, after transitions
    // settle, and on resize.
    const fitSoon = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    };
    const ro = new ResizeObserver(fitSoon);
    Array.from(viz.children).forEach((c) => ro.observe(c));
    // The step's text can grow too (e.g. a "You guessed ₹…" line appears).
    const stepEl = section.querySelectorAll(".scrolly-step")[activeStep ?? 0];
    if (stepEl) Array.from(stepEl.children).forEach((c) => ro.observe(c));
    const mo = new MutationObserver(() => {
      Array.from(viz.children).forEach((c) => ro.observe(c));
      fitSoon();
    });
    mo.observe(viz, { childList: true });
    const settle = setTimeout(fit, 500);
    window.addEventListener("resize", fit);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mo.disconnect();
      clearTimeout(settle);
      window.removeEventListener("resize", fit);
    };
  }, [sectionRef, enabled, activeStep]);
}
