// "Everything you need to build a strong financial future": the ORIGINAL
// landing page's four-row section, ported as closely as possible (same
// markup, classes, styles, images and copy, and the same dashed path that
// draws itself between rows with a moving arrowhead). Two changes only: the
// path follows the scroll through Motion instead of a raw window scroll
// listener, and the styles live in FeaturesSection.css scoped to this section.
import React, { useEffect, useRef, useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import wfBiteSizeLessson from "../../../assets/wf-bite-size-lessons.webp";
import wfInteractiveLearning from "../../../assets/wf-interactivelearning.webp";
import wfPersonalRecommend from "../../../assets/wf-personalrecommend.webp";
import wfRewardnLeaderBoard from "../../../assets/wf-rewards&LeaderBoard.webp";
import "./FeaturesSection.css";

// The original page's reveal: fade + rise once 15% is on screen (CSS classes
// .reveal-on-scroll / .is-visible live in index.css).
function RevealOnScroll({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const child = React.Children.only(children);
  const existingClassName = child.props.className || "";
  const className = `${existingClassName} reveal-on-scroll ${isVisible ? "is-visible" : ""}`.trim();

  return React.cloneElement(child, {
    ref,
    className,
    style: { ...child.props.style, transitionDelay: `${delay}ms` },
  });
}

const TickItem = ({ children, delay = 0 }) => (
  <RevealOnScroll delay={delay}>
    <div className="wf-tick-item">
      <div className="wf-tick-icon">
        <svg width="12" height="9" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5L5 9L13 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="wf-tick-text">{children}</div>
    </div>
  </RevealOnScroll>
);

export default function FeaturesSection() {
  const whyFinedRef = useRef(null);
  const pathSvgRef = useRef(null);
  const wfRowRefs = useRef([]);
  const [svgPaths, setSvgPaths] = useState([]);
  const geometry = useRef(null);

  // Path data between consecutive rows, from image corner to image corner
  // (zig-zag), recalculated on resize — as on the original page.
  useEffect(() => {
    function calcPaths() {
      const container = whyFinedRef.current;
      if (!container || wfRowRefs.current.length < 2) return;
      const containerRect = container.querySelector(".wf-rows-container")?.getBoundingClientRect();
      if (!containerRect) return;
      const paths = [];
      for (let i = 0; i < wfRowRefs.current.length - 1; i++) {
        const currentRow = wfRowRefs.current[i];
        const nextRow = wfRowRefs.current[i + 1];
        if (!currentRow || !nextRow) continue;
        const currentRect = currentRow.getBoundingClientRect();
        const nextRect = nextRow.getBoundingClientRect();
        const currentImgRect = currentRow.querySelector(".wf-img-placeholder")?.getBoundingClientRect();
        const nextImgRect = nextRow.querySelector(".wf-img-placeholder")?.getBoundingClientRect();
        const isLeft = i % 2 === 0;
        let startX, startY, endX, endY;

        if (currentImgRect && nextImgRect) {
          const startCornerOffset = 130;
          const endCornerOffset = 130;
          const endYOffset = i === 2 ? 65 : 80;
          if (isLeft) {
            startX = currentImgRect.right - containerRect.left - startCornerOffset;
            startY = currentImgRect.bottom - containerRect.top - 60;
            endX = nextImgRect.left - containerRect.left + endCornerOffset;
            endY = nextImgRect.top - containerRect.top - endYOffset;
          } else {
            startX = currentImgRect.left - containerRect.left + startCornerOffset;
            startY = currentImgRect.bottom - containerRect.top - 60;
            endX = nextImgRect.right - containerRect.left - endCornerOffset;
            endY = nextImgRect.top - containerRect.top - endYOffset;
          }
        } else {
          startX = currentRect.left + currentRect.width / 2 - containerRect.left;
          startY = currentRect.bottom - containerRect.top;
          endX = nextRect.left + nextRect.width / 2 - containerRect.left;
          endY = nextRect.top - containerRect.top;
        }
        const midY = (startY + endY) / 2;
        paths.push(`M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);
      }
      setSvgPaths(paths);
      if (pathSvgRef.current) {
        pathSvgRef.current.style.width = containerRect.width + "px";
        pathSvgRef.current.style.height = containerRect.height + "px";
      }
    }
    calcPaths();
    window.addEventListener("resize", calcPaths);
    const timer = setTimeout(calcPaths, 500); // after images load
    const late = setTimeout(calcPaths, 1500);
    return () => {
      window.removeEventListener("resize", calcPaths);
      clearTimeout(timer);
      clearTimeout(late);
    };
  }, []);

  // Draw each path (and move its arrowhead + tail) as the next row comes up.
  const draw = () => {
    const maskPaths = pathSvgRef.current?.querySelectorAll(".wf-mask-path");
    if (!maskPaths || maskPaths.length === 0) return;
    if (!geometry.current || geometry.current.count !== maskPaths.length) {
      const lengths = Array.from(maskPaths).map((p) => p.getTotalLength());
      maskPaths.forEach((p, i) => {
        p.style.strokeDasharray = lengths[i];
        p.style.strokeDashoffset = lengths[i];
      });
      geometry.current = { count: maskPaths.length, lengths };
    }
    const { lengths } = geometry.current;
    const viewportH = window.innerHeight;
    const arrows = pathSvgRef.current.querySelectorAll(".wf-dynamic-arrow");
    const tails = pathSvgRef.current.querySelectorAll(".wf-dynamic-tail");

    lengths.forEach((len, i) => {
      const nextRow = wfRowRefs.current[i + 1];
      if (!nextRow) return;
      const nextRowTop = nextRow.getBoundingClientRect().top;
      const animStart = viewportH;
      const animEnd = viewportH * 0.4;
      const progress = 1 - (nextRowTop - animEnd) / (animStart - animEnd);
      const clamped = Math.max(0, Math.min(1, progress));
      const currentLength = len * clamped;
      maskPaths[i].style.strokeDashoffset = len - currentLength;

      const arrow = arrows[i];
      const tail = tails[i];
      if (!arrow) return;
      if (clamped > 0.01) {
        const pt = maskPaths[i].getPointAtLength(currentLength);
        let angle = 0;
        if (currentLength > 2) {
          const prevPt = maskPaths[i].getPointAtLength(currentLength - 2);
          angle = Math.atan2(pt.y - prevPt.y, pt.x - prevPt.x) * (180 / Math.PI);
        }
        arrow.setAttribute("transform", `translate(${pt.x}, ${pt.y}) rotate(${angle})`);
        arrow.style.opacity = 1;
        if (tail) {
          const phase = currentLength % 24;
          const tailLength = phase > 12 ? phase - 12 : 0;
          if (tailLength > 0.1) {
            tail.style.strokeDasharray = `${tailLength} 10000`;
            tail.style.strokeDashoffset = -(currentLength - tailLength);
            tail.style.opacity = 1;
          } else {
            tail.style.opacity = 0;
          }
        }
      } else {
        arrow.style.opacity = 0;
        if (tail) tail.style.opacity = 0;
      }
    });
  };

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", draw);
  useEffect(() => {
    geometry.current = null; // paths changed: re-measure
    draw();
  }, [svgPaths]);

  return (
    <section className="why-fined-section lp-wf" ref={whyFinedRef}>
      <RevealOnScroll>
        <div className="wf-header">
          <h2 className="wf-title">
            Everything you need to build a <br /> <span className="wf-highlight">strong financial future</span>
          </h2>
          <div className="wf-title-underline"></div>
          <p className="pc-subtitle">Practical paths . Real skills . Lifelong effect .</p>
        </div>
      </RevealOnScroll>

      <div className="wf-rows-container">
        <svg className="wf-path-svg" ref={pathSvgRef} aria-hidden="true">
          <defs>
            {svgPaths.map((d, i) => (
              <mask id={`path-mask-${i}`} key={`mask-${i}`}>
                <path className="wf-mask-path" d={d} fill="none" stroke="white" strokeWidth="10" strokeLinecap="butt" />
              </mask>
            ))}
          </defs>
          {svgPaths.map((d, i) => (
            <g key={`connector-group-${i}`}>
              <path className="wf-connector-path" d={d} mask={`url(#path-mask-${i})`} style={{ strokeDasharray: "12 12", strokeDashoffset: 0 }} />
              <path
                className="wf-dynamic-tail"
                d={d}
                fill="none"
                strokeWidth="3.5"
                strokeLinecap="round"
                style={{ stroke: "var(--lp-electric)", strokeDasharray: "16 10000", strokeDashoffset: 0, opacity: 0 }}
              />
              <polygon className="wf-dynamic-arrow" points="0,-8 18,0 0,8" style={{ fill: "var(--lp-electric)", opacity: 0, transition: "opacity 0.15s ease" }} />
            </g>
          ))}
        </svg>

        {/* 01 - image left, text right */}
        <div className="wf-row" id="wf-row-1" ref={(el) => (wfRowRefs.current[0] = el)}>
          <RevealOnScroll delay={0}>
            <div className="wf-img-placeholder">
              <img src={wfBiteSizeLessson} alt="Bite-sized lessons" className="wf-img" />
            </div>
          </RevealOnScroll>
          <div className="wf-content">
            <RevealOnScroll delay={150}>
              <div className="wf-step-header">
                <h3 className="wf-step-title">Bite-sized lessons</h3>
              </div>
            </RevealOnScroll>
            <div className="wf-tick-list">
              <TickItem delay={300}>Built for short attention spans (we get it)</TickItem>
              <TickItem delay={400}>One money topic at a time. No information overload</TickItem>
              <TickItem delay={500}>No boring 45-minute lectures or endless videos</TickItem>
              <TickItem delay={600}>From budgeting to SIPs, taxes and credit scores</TickItem>
            </div>
          </div>
        </div>

        {/* 02 - text left, image right */}
        <div className="wf-row" id="wf-row-2" ref={(el) => (wfRowRefs.current[1] = el)}>
          <div className="wf-content">
            <RevealOnScroll delay={150}>
              <div className="wf-step-header">
                <h3 className="wf-step-title">Interactive Learning</h3>
              </div>
            </RevealOnScroll>
            <div className="wf-tick-list">
              <TickItem delay={300}>Learn by doing, not just scrolling</TickItem>
              <TickItem delay={400}>Make money decisions without real-life consequences</TickItem>
              <TickItem delay={500}>Quick quizzes that keep things interesting</TickItem>
              <TickItem delay={600}>Feels more like a game than a finance class</TickItem>
            </div>
          </div>
          <RevealOnScroll delay={0}>
            <div className="wf-img-placeholder">
              <img src={wfInteractiveLearning} alt="Interactive learning" className="wf-img" />
            </div>
          </RevealOnScroll>
        </div>

        {/* 03 - image left, text right */}
        <div className="wf-row" id="wf-row-3" ref={(el) => (wfRowRefs.current[2] = el)}>
          <RevealOnScroll delay={0}>
            <div className="wf-img-placeholder">
              <img src={wfRewardnLeaderBoard} alt="Rewards & Leaderboards" className="wf-img" />
            </div>
          </RevealOnScroll>
          <div className="wf-content">
            <RevealOnScroll delay={150}>
              <div className="wf-step-header">
                <h3 className="wf-step-title">Rewards & Leaderboards</h3>
              </div>
            </RevealOnScroll>
            <div className="wf-tick-list">
              <TickItem delay={300}>Every lesson earns you rewards</TickItem>
              <TickItem delay={400}>Friendly competition keeps you motivated</TickItem>
              <TickItem delay={500}>Don't break the streak 👀</TickItem>
              <TickItem delay={600}>Build your FinScore by staying consistent</TickItem>
            </div>
          </div>
        </div>

        {/* 04 - text left, image right */}
        <div className="wf-row" id="wf-row-4" ref={(el) => (wfRowRefs.current[3] = el)}>
          <div className="wf-content">
            <RevealOnScroll delay={150}>
              <div className="wf-step-header">
                <h3 className="wf-step-title">Personalized Recommendations</h3>
              </div>
            </RevealOnScroll>
            <div className="wf-tick-list">
              <TickItem delay={300}>No one-size-fits-all money advice</TickItem>
              <TickItem delay={400}>We recommend what actually fits you</TickItem>
              <TickItem delay={500}>Zero spam, Zero random product pushes</TickItem>
              <TickItem delay={600}>The more you learn, the better we get</TickItem>
            </div>
          </div>
          <RevealOnScroll delay={0}>
            <div className="wf-img-placeholder">
              <img src={wfPersonalRecommend} alt="Personalized Recommendations" className="wf-img" />
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}
