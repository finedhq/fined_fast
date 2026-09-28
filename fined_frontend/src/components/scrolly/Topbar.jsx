// The prototype's fixed top bar (index.html #topbar + module1-app.js
// setupChapterNav / setupProgressAndFinStars): FinEd logo, module tag,
// chapter bar that fills as you read, FinStars pill, reading-progress line.
// The only addition is the back arrow to the course page (decision 7b).
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { scrollToElement } from "./scroll";

export default function Topbar({ rootRef, moduleNumber, title, chapters, stars, backTo }) {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chapterProgress, setChapterProgress] = useState(() => chapters.map(() => 0));
  const [pulses, setPulses] = useState(0);
  const lastStars = useRef(stars);

  // Pulse the FinStars pill whenever stars go up, like the prototype.
  useEffect(() => {
    if (stars > lastStars.current) setPulses((n) => n + 1);
    lastStars.current = stars;
  }, [stars]);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0);
      setScrolled(scrollTop > 20);

      // Each chapter bar fills with the reader's position inside that chapter;
      // a chapter runs from its heading to the next one's, so the check or
      // tool after it counts towards it.
      const root = rootRef.current;
      if (!root) return;
      const readLine = window.scrollY + window.innerHeight * 0.5;
      const top = (el) => el.getBoundingClientRect().top + window.scrollY;
      const sections = Array.from(root.querySelectorAll(".scrolly-section"));
      const starts = sections.map(top);
      const completion = root.querySelector(".completion-section");
      const end = completion ? top(completion) : document.documentElement.scrollHeight;
      setChapterProgress(
        starts.map((start, i) => {
          const stop = i + 1 < starts.length ? starts[i + 1] : end;
          return Math.min(1, Math.max(0, (readLine - start) / (stop - start)));
        })
      );
    };

    let queued = false;
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        update();
      });
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("load", schedule);
    // Page height changes as fonts load and figures expand — re-measure then too.
    const settle = setTimeout(schedule, 400);
    schedule();
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("load", schedule);
      clearTimeout(settle);
    };
  }, [rootRef, chapters.length]);

  const goTo = (e, selector) => {
    e.preventDefault();
    scrollToElement(rootRef.current?.querySelector(selector));
  };

  return (
    <header className={`nc-topbar${scrolled ? " scrolled" : ""}`}>
      <div className="nav-left">
        <Link to={backTo} className="nc-back" aria-label="Back to the course" title="Back to the course">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <a href="#hero" className="nc-logo" aria-label="FinEd home" onClick={(e) => goTo(e, ".nc-hero")}>
          Fin<span>Ed</span>
        </a>
        <span className="nc-nav-divider" aria-hidden="true"></span>
        <div className="module-tag">
          <span className="module-tag-num">Module {moduleNumber}</span>
          <span className="module-tag-title">{title}</span>
        </div>
      </div>

      <div className="chapter-nav" role="navigation" aria-label="Chapters">
        {chapters.map((c, i) => {
          const pct = chapterProgress[i] || 0;
          return (
            <a
              key={c.slug}
              href={`#section-${c.slug}`}
              className={`chapter-link${pct > 0 && pct < 1 ? " is-current" : ""}${pct >= 1 ? " is-done" : ""}`}
              data-section={c.slug}
              style={{ "--chapter-progress": pct.toFixed(3) }}
              onClick={(e) => goTo(e, `#section-${CSS.escape(c.slug)}`)}
            >
              <span className="chapter-link-bar"></span>
              <span className="chapter-link-text">
                <span className="chapter-link-num">{i + 1}</span>
                {c.title}
              </span>
            </a>
          );
        })}
      </div>

      <div className="nc-nav-right">
        <div
          key={pulses}
          className={`finstars-pill${pulses > 0 ? " pulse" : ""}`}
          title="Earn FinStars from quick checks and the hands-on tool"
        >
          <span className="nc-fs-display">{stars}</span>
          <span className="fs-label">FinStars</span>
        </div>
      </div>

      <div className="nc-progress-track">
        <div className="nc-reading-progress" style={{ width: `${progress}%` }}></div>
      </div>
    </header>
  );
}
