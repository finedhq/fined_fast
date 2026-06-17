import "./Hero.css";
import bgImage from "../../assets/landingpage-bg.png";
import budgetingBasicsImg from "../../assets/budgeting-basics.png";
import biteSizeLessonsImg from "../../assets/bite-size-lessons.png";
import interactiveLearningImg from "../../assets/interactive-learning.png";
import retirementIncomePlanning1Img from "../../assets/retirement-income-planning-1.png";
import retirementIncomePlanning2Img from "../../assets/retirement-income-planning-2.png";
import featuredImg from "../../assets/featured-img.png";
import savingRuleImg from "../../assets/500dollarsaving.png";
import footerImg from "../../assets/footer-img.png";
import React, { useRef, useEffect, useState } from "react";

const SMALL_COURSES = [
  {
    id: 1,
    title: "Saving Habits",
    lessons: 5,
    level: "Beginner",
  },
  {
    id: 2,
    title: "Saving Habits",
    lessons: 5,
    level: "Beginner",
  },
  {
    id: 3,
    title: "Saving Habits",
    lessons: 5,
    level: "Beginner",
  },
  {
    id: 4,
    title: "Saving Habits",
    lessons: 5,
    level: "Beginner",
  },
];

function PiggyIcon() {
  return (
    <svg width="68" height="68" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="30" cy="36" rx="20" ry="16" fill="#A5B4FC" />
      <ellipse cx="30" cy="34" rx="18" ry="14" fill="#C7D2FE" />
      <circle cx="22" cy="30" r="2" fill="#4F46E5" />
      <ellipse cx="12" cy="34" rx="5" ry="4" fill="#A5B4FC" />
      <rect x="20" y="48" width="5" height="8" rx="2.5" fill="#A5B4FC" />
      <rect x="28" y="48" width="5" height="8" rx="2.5" fill="#A5B4FC" />
      <rect x="36" y="48" width="5" height="8" rx="2.5" fill="#A5B4FC" />
      <path d="M38 22 Q42 16 48 20" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <rect x="27" y="20" width="8" height="4" rx="2" fill="#6366F1" />
    </svg>
  );
}

const SmallCourseCard = React.forwardRef(({ course, className, style }, ref) => {
  return (
    <div ref={ref} className={`small-course-card ${className || ""}`} style={style}>
      <div className="scc-icon">
        <PiggyIcon />
      </div>
      <div className="scc-info">
        <div className="scc-title">{course.title}</div>
        <div className="scc-meta">{course.lessons} Lessons</div>
        <span className="scc-badge">{course.level}</span>
      </div>
      <button className="scc-arrow" aria-label="View course">→</button>
    </div>
  );
});

const TestimonialsCarousel = React.forwardRef(({ className, style }, ref) => {
  const cardRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const trackRef = useRef(null);
  const [dots, setDots] = useState([]);

  useEffect(() => {
    function calcDots() {
      if (!trackRef.current) return;
      const trackRect = trackRef.current.getBoundingClientRect();
      const positions = cardRefs.map((ref) => {
        if (!ref.current) return null;
        const r = ref.current.getBoundingClientRect();
        return { x: r.left - trackRect.left + r.width / 2 };
      });
      setDots(positions.filter(Boolean));
    }
    calcDots();
    window.addEventListener("resize", calcDots);
    return () => window.removeEventListener("resize", calcDots);
  }, []);

  const svgHeight = 100;
  const dotY = [65, 55, 55, 65];

  const pathD = dots.length === 4
    ? `M ${dots[0].x} ${dotY[0]}
     C ${dots[0].x + 120} ${dotY[0] - 50}, ${dots[1].x - 120} ${dotY[1] - 50}, ${dots[1].x} ${dotY[1]}
     C ${dots[1].x + 120} ${dotY[1] + 50}, ${dots[2].x - 120} ${dotY[2] + 50}, ${dots[2].x} ${dotY[2]}
     C ${dots[2].x + 120} ${dotY[2] - 50}, ${dots[3].x - 120} ${dotY[3] - 50}, ${dots[3].x} ${dotY[3]}`
    : "";

  return (
    <div ref={ref} className={`testimonials-carousel-wrapper ${className || ""}`} style={style}>
      <button className="carousel-arrow carousel-arrow-left">‹</button>

      <div className="testimonials-track-wrapper">
        <div className="testimonials-track" ref={trackRef}>
          {[1, 2, 3, 4].map((i, idx) => (
            <div className="testimonial-card" key={i} ref={cardRefs[idx]}>
              <p className="testimonial-quote">
                " I <span className="tq-highlight">saved my first $10,000</span> and built my emergency fund."
              </p>
              <p className="testimonial-author">-Aarav , 22 years</p>
            </div>
          ))}
        </div>

        {dots.length === 4 && (
          <svg
            style={{ width: "100%", height: svgHeight, display: "block", overflow: "visible" }}
            xmlns="http://www.w3.org/2000/svg"
          >
            {dots.map((d, i) => (
              <line key={i} x1={d.x} y1={0} x2={d.x} y2={dotY[i]} stroke="#c7d2fe" strokeWidth="1.5" />
            ))}
            <path d={pathD} stroke="#4A3AFF" strokeWidth="2.5" strokeDasharray="10 6" fill="none" strokeLinecap="round" />
            {dots.map((d, i) => (
              <g key={i}>
                <circle cx={d.x} cy={dotY[i]} r="10" fill="#4A3AFF" />
                <circle cx={d.x} cy={dotY[i]} r="5" fill="white" />
              </g>
            ))}
          </svg>
        )}
      </div>

      <button className="carousel-arrow carousel-arrow-right">›</button>
    </div>
  );
});

function RevealOnScroll({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.15,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const child = React.Children.only(children);
  const existingClassName = child.props.className || "";
  const className = `${existingClassName} reveal-on-scroll ${isVisible ? "is-visible" : ""}`.trim();
  
  return React.cloneElement(child, {
    ref,
    className,
    style: { ...child.props.style, transitionDelay: `${delay}ms` }
  });
}

function Hero() {
  const whyFinedRef = useRef(null);
  const pathSvgRef = useRef(null);
  const wfRowRefs = useRef([]);
  const [svgPaths, setSvgPaths] = useState([]);
  const [pathOffsets, setPathOffsets] = useState([]);
  const [pathProgresses, setPathProgresses] = useState([]);
  // Calculate SVG path data between consecutive wf-rows
  useEffect(() => {
    function calcPaths() {
      const container = whyFinedRef.current;
      if (!container || wfRowRefs.current.length < 2) return;
      const containerRect = container.querySelector('.wf-rows-container')?.getBoundingClientRect();
      if (!containerRect) return;
      const paths = [];
      for (let i = 0; i < wfRowRefs.current.length - 1; i++) {
        const currentRow = wfRowRefs.current[i];
        const nextRow = wfRowRefs.current[i + 1];
        if (!currentRow || !nextRow) continue;
        const currentRect = currentRow.getBoundingClientRect();
        const nextRect = nextRow.getBoundingClientRect();
        // Current row: find the image
        const currentImg = currentRow.querySelector('.wf-img-placeholder');
        const currentImgRect = currentImg?.getBoundingClientRect();

        // Next row: find the image
        const nextImg = nextRow.querySelector('.wf-img-placeholder');
        const nextImgRect = nextImg?.getBoundingClientRect();

        // Calculate connection points based on image position (zig-zag pattern)
        const isLeft = i % 2 === 0;
        let startX, startY, endX, endY;

        if (currentImgRect && nextImgRect) {
          const cornerOffset = 80; // Inset further horizontally (inside)
          if (isLeft) {
            startX = currentImgRect.right - containerRect.left - cornerOffset;
            startY = currentImgRect.bottom - containerRect.top; // Touch exactly
            endX = nextImgRect.left - containerRect.left + cornerOffset;
            endY = nextImgRect.top - containerRect.top - 18; // Offset by 18px for the new arrowhead tip
          } else {
            startX = currentImgRect.left - containerRect.left + cornerOffset;
            startY = currentImgRect.bottom - containerRect.top;
            endX = nextImgRect.right - containerRect.left - cornerOffset;
            endY = nextImgRect.top - containerRect.top - 18; // Offset by 18px for the new arrowhead tip
          }
        } else {
          // Fallback if images aren't found
          startX = currentRect.left + currentRect.width / 2 - containerRect.left;
          startY = currentRect.bottom - containerRect.top;
          endX = nextRect.left + nextRect.width / 2 - containerRect.left;
          endY = nextRect.top - containerRect.top;
        }
        // Mid point for the S-curve
        const midY = (startY + endY) / 2;
        // Create a smooth S-curve path
        const d = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;
        paths.push(d);
      }
      setSvgPaths(paths);
      // Set SVG dimensions to match container
      if (pathSvgRef.current) {
        pathSvgRef.current.style.width = containerRect.width + 'px';
        pathSvgRef.current.style.height = containerRect.height + 'px';
      }
    }
    calcPaths();
    window.addEventListener('resize', calcPaths);
    // Recalc after images load
    const timer = setTimeout(calcPaths, 500);
    return () => {
      window.removeEventListener('resize', calcPaths);
      clearTimeout(timer);
    };
  }, []);
  // Scroll-driven animation: draw paths as user scrolls
  useEffect(() => {
    if (svgPaths.length === 0) return;
    // Get all mask paths for drawing animation
    const maskPaths = pathSvgRef.current?.querySelectorAll('.wf-mask-path');
    if (!maskPaths || maskPaths.length === 0) return;

    const pathLengths = Array.from(maskPaths).map(p => p.getTotalLength());

    // Set initial dasharray/dashoffset on the MASK
    maskPaths.forEach((p, i) => {
      p.style.strokeDasharray = pathLengths[i];
      p.style.strokeDashoffset = pathLengths[i];
    });

    function onScroll() {
      const container = whyFinedRef.current?.querySelector('.wf-rows-container');
      if (!container) return;
      const viewportH = window.innerHeight;
      const newProgresses = [];

      pathLengths.forEach((len, i) => {
        const row = wfRowRefs.current[i];
        const nextRow = wfRowRefs.current[i + 1];
        if (!row || !nextRow) {
          newProgresses.push(0);
          return;
        }

        const nextRowTop = nextRow.getBoundingClientRect().top;
        const animStart = viewportH; // row bottom at viewport bottom
        const animEnd = viewportH * 0.4; // next row top near viewport center

        // Progress based on where next row's top is in the viewport
        const progress = 1 - (nextRowTop - animEnd) / (animStart - animEnd);
        const clamped = Math.max(0, Math.min(1, progress));

        // Directly update the mask offset
        const currentLength = len * clamped;
        maskPaths[i].style.strokeDashoffset = len - currentLength;

        // Update dynamic arrow
        const dynamicArrows = pathSvgRef.current?.querySelectorAll('.wf-dynamic-arrow');
        if (dynamicArrows && dynamicArrows[i]) {
          const arrow = dynamicArrows[i];
          if (clamped > 0.01) {
            const pt = maskPaths[i].getPointAtLength(currentLength);

            // Calculate angle
            let angle = 0;
            if (currentLength > 2) {
              const prevPt = maskPaths[i].getPointAtLength(currentLength - 2);
              angle = Math.atan2(pt.y - prevPt.y, pt.x - prevPt.x) * (180 / Math.PI);
            }

            arrow.setAttribute('transform', `translate(${pt.x}, ${pt.y}) rotate(${angle})`);
            arrow.style.opacity = 1;
          } else {
            arrow.style.opacity = 0;
          }
        }

        newProgresses.push(clamped);
      });

      setPathProgresses(newProgresses);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // initial check
    return () => window.removeEventListener('scroll', onScroll);
  }, [svgPaths]);



  return (
    <>
      {/* HERO */}
      <section
        className="hero-section"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="hero-content">
          <h1 className="hero-title">
            Learn money skills in
            <br />
            <span className="highlight">10 minutes</span>{" "}
            a day
          </h1>

          <p className="hero-sub">
            Bite-sized interactive personal finance courses built
            <br />
            for 15–35 year olds.
            <br />
            No jargon, no fees, no excuses.
          </p>

          <div className="hero-buttons">
            <button className="btn-hero-primary">Register now →</button>
            <button className="btn-hero-secondary">Explore a course →</button>
          </div>

          <div className="learners-row">
            <div className="avatars">
              <div className="avatar a1">A</div>
              <div className="avatar a2">B</div>
              <div className="avatar a3">C</div>
              <div className="avatar-count">2k+</div>
            </div>
            <span>
              Join 2000+ learners building
              <br />
              their financial future
            </span>
          </div>
        </div>
      </section>

      {/* FEATURES STRIP */}
      <div className="features-strip">

        <RevealOnScroll delay={0}>
        <div className="feature-item">
          <div className="feature-item-inner">
            <div className="feature-icon-box fi-blue-soft"></div>
            <div>
              <div className="feature-title">Bite sized lessons</div>
              <div className="feature-desc">Short, focused & easy to understand</div>
            </div>
          </div>
        </div>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
        <div className="feature-item">
          <div className="feature-item-inner">
            <div className="feature-icon-box fi-yellow-soft">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="#F5A623" strokeWidth="2" />
                <path d="M9 12l2 2 4-4" stroke="#F5A623" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="feature-title">Interactive Learning</div>
              <div className="feature-desc">Short, focused & easy to understand</div>
            </div>
          </div>
        </div>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
        <div className="feature-item">
          <div className="feature-item-inner">
            <div className="feature-icon-box fi-blue-soft">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" stroke="#4A3AFF" strokeWidth="2" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="feature-title">Real Rewards</div>
              <div className="feature-desc">Short, focused & easy to understand</div>
            </div>
          </div>
        </div>
        </RevealOnScroll>

        <RevealOnScroll delay={300}>
        <div className="feature-item">
          <div className="feature-item-inner">
            <div className="feature-icon-box fi-yellow-soft">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="8" width="6" height="13" rx="1" stroke="#F5A623" strokeWidth="2" />
                <rect x="9" y="5" width="6" height="16" rx="1" stroke="#F5A623" strokeWidth="2" />
                <rect x="16" y="2" width="6" height="19" rx="1" stroke="#F5A623" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <div className="feature-title">Leaderboards</div>
              <div className="feature-desc">Short, focused & easy to understand</div>
            </div>
          </div>
        </div>
        </RevealOnScroll>

      </div>

      {/* POPULAR COURSES SECTION */}
      < section className="popular-courses-section" >
        <RevealOnScroll>
        <div className="pc-header">
          <span className="pc-eyebrow">Popular Courses</span>
          <h2 className="pc-title">Start with the right course</h2>
          <p className="pc-subtitle">Practical paths . Real skills . Lifelong effect .</p>
        </div>
        </RevealOnScroll>

        <div className="pc-grid">
          {/* Featured Card */}
          <RevealOnScroll delay={100}>
          <div className="featured-card">
            <img
              src={budgetingBasicsImg}
              alt="Budgeting Basics"
              className="featured-card-img"
            />
          </div>
          </RevealOnScroll>

          {/* 2x2 Small Cards Grid */}
          <div className="small-cards-grid">
            {SMALL_COURSES.map((course, idx) => (
              <RevealOnScroll key={course.id} delay={100 + (idx * 100)}>
                <SmallCourseCard course={course} />
              </RevealOnScroll>
            ))}
          </div>
        </div>

        <RevealOnScroll delay={100}>
        <div className="pc-view-all">
          <a href="/courses" className="view-all-link">View all courses →</a>
        </div>
        </RevealOnScroll>
      </section >
      {/* WHY FINED SECTION */}
      {/* WHY FINED SECTION */}
      <section className="why-fined-section" ref={whyFinedRef}>
        <RevealOnScroll>
        <div className="wf-header">
          <span className="pc-eyebrow">Popular Courses</span>
          <h2 className="wf-title">Everything you need to build a <br /> strong financial future</h2>
          <div className="wf-title-underline"></div>
          <p className="pc-subtitle">Practical paths . Real skills . Lifelong effect .</p>
        </div>
        </RevealOnScroll>

        <div className="wf-rows-container">
          {/* SVG overlay for connecting paths */}
          <svg className="wf-path-svg" ref={pathSvgRef} aria-hidden="true">
            <defs>
              {svgPaths.map((d, i) => (
                <mask id={`path-mask-${i}`} key={`mask-${i}`}>
                  <path
                    className="wf-mask-path"
                    d={d}
                    fill="none"
                    stroke="white"
                    strokeWidth="10"
                    strokeLinecap="butt"
                  />
                </mask>
              ))}
            </defs>
            {svgPaths.map((d, i) => (
              <g key={`connector-group-${i}`}>
                <path
                  className="wf-connector-path"
                  d={d}
                  mask={`url(#path-mask-${i})`}
                  style={{ strokeDasharray: '12 12', strokeDashoffset: 0 }}
                />
                <polygon
                  className="wf-dynamic-arrow"
                  points="0,-8 18,0 0,8"
                  fill="#4A3AFF"
                  style={{ opacity: 0, transition: 'opacity 0.15s ease' }}
                />
              </g>
            ))}
          </svg>

          {/* 01 - image left, text right */}
          <div className="wf-row" ref={el => wfRowRefs.current[0] = el}>
            <div className="wf-img-placeholder"><img src={biteSizeLessonsImg} alt="Bite size lessons" className="wf-img" /></div>
            <div className="wf-content">Most people never really learned about money. Not in school, not at home.<br />
              Someone just handed you a salary one day and said good luck.<br />
              FinEd fixes that, but without making it feel like homework.<br />
              Every lesson is short enough to finish on a lunch break. We take one money concept, explain it simply, and move on. No filler, no 45 minute videos you'll never actually sit through.<br />
              Topics range from budgeting basics to SIPs, credit scores, taxes and more.</div>
          </div>

          {/* 02 - text left, image right */}
          <div className="wf-row" ref={el => wfRowRefs.current[1] = el}>
            <div className="wf-content">Reading about money and actually understanding it are two very different things. That's why we don't just show you text and call it a day.<br />
              You'll tap through real life scenarios, make decisions, answer quick questions and see what happens. It feels a lot more like a game than a class.<br />
              And honestly, that's kind of the point because things you interact with are things you remember.</div>
            <div className="wf-img-placeholder"><img src={interactiveLearningImg} alt="Interactive learning" className="wf-img" /></div>
          </div>

          {/* 03 - image left, text right */}
          <div className="wf-row" ref={el => wfRowRefs.current[2] = el}>
            <div className="wf-img-placeholder"><img src={retirementIncomePlanning1Img} alt="Retirement income planning" className="wf-img" /></div>
            <div className="wf-content">This is description of retirement income planning. This is just for dummy right now more content will be added soon.</div>
          </div>

          {/* 04 - text left, image right */}
          <div className="wf-row" ref={el => wfRowRefs.current[3] = el}>
            <div className="wf-content">This is description of retirement income planning. This is just for dummy right now more content will be added soon.</div>
            <div className="wf-img-placeholder"><img src={retirementIncomePlanning2Img} alt="Retirement income planning" className="wf-img" /></div>
          </div>
        </div>
      </section>

      {/* ARTICLES SECTION */}
      {/* ARTICLES SECTION */}
      {/* ARTICLES SECTION */}
      <section className="articles-section">
        <RevealOnScroll>
        <div className="articles-header">
          <span className="pc-eyebrow-1">From our articles</span>
          <h2 className="articles-title">Insights to grow your money</h2>
          <p className="pc-subtitle">Short reads . Big takeaways .</p>
        </div>
        </RevealOnScroll>

        <div className="articles-grid">
          {/* Featured Article - Left */}
          <RevealOnScroll delay={100}>
          <div className="article-featured-card">
            <img src={featuredImg} alt="Why nobody teaches money in school" className="article-featured-img" />
          </div>
          </RevealOnScroll>

          {/* Side Articles - Right (MUST be inside articles-grid) */}
          <div className="articles-side">
            <RevealOnScroll delay={200}>
            <div className="article-side-card">
              <img src={savingRuleImg} alt="The $500 saving rule" className="article-side-img" />
              <div className="article-side-info">
                <h4 className="article-side-title">The $500 saving rule students should know</h4>
                <p className="article-side-desc">The saving rule that will change your financial future.</p>
                <span className="article-read-time">4 min read</span>
              </div>
              <span className="article-bookmark">🔖</span>
            </div>
            </RevealOnScroll>

            <RevealOnScroll delay={300}>
            <div className="article-side-card">
              <img src={savingRuleImg} alt="The $500 saving rule" className="article-side-img" />
              <div className="article-side-info">
                <h4 className="article-side-title">The $500 saving rule students should know</h4>
                <p className="article-side-desc">The saving rule that will change your financial future.</p>
                <span className="article-read-time">4 min read</span>
              </div>
              <span className="article-bookmark">🔖</span>
            </div>
            </RevealOnScroll>
          </div>

        </div>{/* END articles-grid */}

        <RevealOnScroll delay={100}>
        <div className="pc-view-all">
          <a href="/articles" className="view-all-articles">View all articles →</a>
        </div>
        </RevealOnScroll>
      </section>
      {/* TESTIMONIALS SECTION */}
      {/* TESTIMONIALS SECTION */}
      <section className="testimonials-section">
        <RevealOnScroll>
        <div className="testimonials-header">
          <span className="pc-eyebrow">What learners have to say</span>
          <h2 className="testimonials-title">
            Every path leads <span className="testimonials-highlight">somewhere</span>
          </h2>
          <p className="pc-subtitle">See what learners achieved after taking their first step.</p>
        </div>
        </RevealOnScroll>
        <RevealOnScroll delay={100}>
          <TestimonialsCarousel />
        </RevealOnScroll>
      </section>

      {/* FOOTER CTA SECTION */}
      <section
        className="footer-cta-section"
        style={{ backgroundImage: `url(${footerImg})` }}
      >
        <RevealOnScroll delay={100}>
        <div className="footer-cta-content">
          <h2 className="footer-cta-title">Your financial journey<br />starts here.</h2>
          <p className="footer-cta-sub">Small steps today. Bigger opportunities tomorrow.</p>
          <button className="btn-footer-cta">Register now →</button>
        </div>
        </RevealOnScroll>
      </section>
    </>
  );
}

export default Hero;
