import "./Hero.css";
import bgImage from "../../assets/landingpage-bg.png";
import budgetingBasicsImg from "../../assets/budgeting-basics.png";
import biteSizeLessonsImg from "../../assets/bite-size-lessons.png";
import interactiveLearningImg from "../../assets/interactive-learning.png";
import retirementIncomePlanning1Img from "../../assets/retirement-income-planning-1.png";
import retirementIncomePlanning2Img from "../../assets/retirement-income-planning-2.png";
import featuredImg from "../../assets/featured-img.png";
import savingRuleImg from "../../assets/500dollarsaving.png";
import footerImg from "../../assets/new-footer-bg.png";
import imgBiteSized from "../../assets/bite-sized-learning-abt-us.png";
import imgInteractive from "../../assets/interactivelearning-abt-us.png";
import imgRewards from "../../assets/realrewards-abtus.png";
import imgLeaderboards from "../../assets/leaderboards-abtus.png";
import React, { useRef, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import Lenis from 'lenis';
import { useNavigate } from "react-router-dom";
import investingImg from "../../assets/investing-img.png";
import wfBiteSizeLessson from "../../assets/wf-bite-size-lessons.png";
import wfInteractiveLearning from "../../assets/wf-interactivelearning.png";
import wfPersonalRecommend from "../../assets/wf-personalrecommend.png";
import wfRewardnLeaderBoard from "../../assets/wf-rewards&LeaderBoard.png";
import satvikImg from "../../assets/satvik-img.png"
import { fetchArticles, joinWaitlist } from "../../services/api";
import newLandingpagebgm from "../../assets/newlandingpagebg.png";
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination, Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import planeImg1 from "../../assets/image 27.png";
import planeImg2 from "../../assets/image 28.png";
import newfooterImg from "../../assets/file_000000008f747208b046fb7821caefc9.png"
import newBgImg from "../../assets/newnewbg-imgofhomepg.png";
import newPlaneImg from "../../assets/newnewplane.png";
import test1 from "../../assets/testbgimg1.png";
import test2 from "../../assets/testbgimg2.png"
const generateSlug = (title) => {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

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

const TESTIMONIAL_DATA = [
  {
    quote: "The articles explain complex financial topics in a way that's actually easy to understand. I finally feel confident reading about investing.",
    author: " Gaurav, 20"
  },
  {
    quote: "I wish I had access to content like this when I started college. It's practical and doesn't overwhelm beginners.",
    author: " Rahul, 25"
  },
  {
    quote: "FinEd's mission of making financial education free and accessible is something I genuinely support. Financial literacy shouldn't be a privilege.",
    author: " Priya, 24"
  },
  {
    quote: "The content is concise, engaging, and easy to revisit whenever I need a quick refresher.",
    author: " Ananya, 19"
  }
];

const TestimonialsCarousel = React.forwardRef(({ className, style }, ref) => {
  const desktopPrevRef = useRef(null);
  const desktopNextRef = useRef(null);

  return (
    <div ref={ref} className={className} style={style}>
      <div className="testimonials-carousel-wrapper desktop-testimonials">
        <button className="carousel-arrow carousel-arrow-left" ref={desktopPrevRef} aria-label="Previous testimonial">‹</button>

        <div className="testimonials-track-wrapper">
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView={4}
            loop={true}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            navigation={{
              prevEl: desktopPrevRef.current,
              nextEl: desktopNextRef.current,
            }}
            onBeforeInit={(swiper) => {
              swiper.params.navigation.prevEl = desktopPrevRef.current;
              swiper.params.navigation.nextEl = desktopNextRef.current;
            }}
            breakpoints={{
              0: { slidesPerView: 1 },
              900: { slidesPerView: 4 },
            }}
            className="testimonials-swiper"
          >
            {TESTIMONIAL_DATA.map((item, idx) => (
              <SwiperSlide key={`${item.author}-${idx}`}>
                <div className="testimonial-card">
                  <p className="testimonial-quote">{item.quote}</p>
                  <p className="testimonial-author">-{item.author}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <button className="carousel-arrow carousel-arrow-right" ref={desktopNextRef} aria-label="Next testimonial">›</button>
      </div>

      <div className="mobile-testimonials">
        <div className="mobile-testimonials-container">
          <div className="swiper-custom-prev-mobile">❮</div>
          <div className="swiper-custom-next-mobile">❯</div>
          <Swiper
            modules={[Pagination, Autoplay, Navigation]}
            spaceBetween={20}
            slidesPerView={1}
            loop={true}
            pagination={{ clickable: true }}
            navigation={{
              prevEl: '.swiper-custom-prev-mobile',
              nextEl: '.swiper-custom-next-mobile'
            }}
            autoplay={{ delay: 3000, disableOnInteraction: false }}
            style={{ paddingBottom: "40px" }}
          >
            {TESTIMONIAL_DATA.map((item, idx) => (
              <SwiperSlide key={`${item.author}-${idx}`}>
                <div className="testimonial-card" style={{ margin: '0 auto', maxWidth: '300px' }}>
                  <p className="testimonial-quote">{item.quote}</p>
                  <p className="testimonial-author">-{item.author}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
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

const TickItem = ({ children, delay = 0 }) => (
  <RevealOnScroll delay={delay}>
    <div className="wf-tick-item">
      <div className="wf-tick-icon">
        <svg width="12" height="9" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 5L5 9L13 1" stroke="#A855F7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="wf-tick-text">{children}</div>
    </div>
  </RevealOnScroll>
);


function Hero() {
  const navigate = useNavigate();
  useEffect(() => {
    const lenis = new Lenis();
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    return () => {
      lenis.destroy();
    };
  }, []);
  const { loginWithRedirect } = useAuth0();
  const whyFinedRef = useRef(null);
  const pathSvgRef = useRef(null);
  const wfRowRefs = useRef([]);
  const [svgPaths, setSvgPaths] = useState([]);
  const [pathOffsets, setPathOffsets] = useState([]);
  const [pathProgresses, setPathProgresses] = useState([]);
  const [articles, setArticles] = useState([]);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistMessage, setWaitlistMessage] = useState({ text: "", type: "" });

  const [showWaitlistForm, setShowWaitlistForm] = useState(false);

  const handleWaitlistSubmit = async (e) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistLoading(true);
    setWaitlistMessage({ text: "", type: "" });
    try {
      await joinWaitlist(waitlistEmail);
      setWaitlistMessage({ text: "Thanks for joining the waitlist!", type: "success" });
      setWaitlistEmail("");
      setShowWaitlistForm(false); // Hide the input form immediately to show the success button
    } catch (error) {
      setWaitlistMessage({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setWaitlistLoading(false);
    }
  };

  useEffect(() => {
    async function getHeroArticles() {
      try {
        const data = await fetchArticles({ limit: 10, offset: 0 });
        if (data && data.length > 0) {
          setArticles(data);
        }
      } catch (err) {
        console.error("Failed to fetch articles", err);
      }
    }
    getHeroArticles();
  }, []);
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
          const startCornerOffset = 130; // Tail inwards
          const endCornerOffset = 130; // Head rightwards/inwards

          let endYOffset = 80;
          if (i === 2) endYOffset = 65;

          if (isLeft) {
            startX = currentImgRect.right - containerRect.left - startCornerOffset;
            startY = currentImgRect.bottom - containerRect.top - 60; // Offset up to touch visual image
            endX = nextImgRect.left - containerRect.left + endCornerOffset;
            endY = nextImgRect.top - containerRect.top - endYOffset;
          } else {
            startX = currentImgRect.left - containerRect.left + startCornerOffset;
            startY = currentImgRect.bottom - containerRect.top - 60;
            endX = nextImgRect.right - containerRect.left - endCornerOffset;
            endY = nextImgRect.top - containerRect.top - endYOffset;
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

        // Update dynamic arrow and tail
        const dynamicArrows = pathSvgRef.current?.querySelectorAll('.wf-dynamic-arrow');
        const dynamicTails = pathSvgRef.current?.querySelectorAll('.wf-dynamic-tail');
        if (dynamicArrows && dynamicArrows[i]) {
          const arrow = dynamicArrows[i];
          const tail = dynamicTails ? dynamicTails[i] : null;

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
        style={{ backgroundImage: `url(${newBgImg})`, zIndex: 100 }}
      >
        <div className="hero-plane-container">
          <svg className="hero-plane-path-svg" viewBox="0 0 300 200">
            <mask id="plane-path-mask">
              <path
                className="hero-path-mask-line"
                d="M 280,180 C 200,150 150,150 140,100 C 130,40 210,40 210,100 C 210,150 130,140 80,100 C 50,70 30,40 10,20"
                fill="none"
                stroke="white"
                strokeWidth="5"
              />
            </mask>
            <path
              d="M 280,180 C 200,150 150,150 140,100 C 130,40 210,40 210,100 C 210,150 130,140 80,100 C 50,70 30,40 10,20"
              fill="none"
              stroke="#00b4d8"
              strokeWidth="4"
              strokeDasharray="8 8"
              mask="url(#plane-path-mask)"
            />
          </svg>
          <img src={newPlaneImg} alt="plane" className="hero-plane-img" />
        </div>
        <div className="hero-content">
          <RevealOnScroll delay={0}>
            <h1 className="hero-title">
              <span style={{ whiteSpace: 'nowrap' }}>Learn money skills in</span>
              <br />
              <span className="highlight">10 minutes</span>{" "}
              a day
            </h1>
          </RevealOnScroll>

          <RevealOnScroll delay={100}>
            <p className="hero-sub">
              Bite-sized interactive personal finance courses built
              <br />
              for the youth.
              <br />
              No jargon, no fees, no excuses.
            </p>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
          <div className="hero-buttons" style={{ flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', justifyContent: 'center' }}>
              {!showWaitlistForm ? (
                <button 
                  className="btn-hero-primary" 
                  onClick={() => {
                    // Only allow clicking if not already joined
                    if (waitlistMessage.type !== 'success') {
                      setShowWaitlistForm(true);
                    }
                  }}
                  style={{
                    backgroundColor: waitlistMessage.type === 'success' ? '#10b981' : undefined,
                    cursor: waitlistMessage.type === 'success' ? 'default' : 'pointer',
                  }}
                >
                  {waitlistMessage.type === 'success' ? "Joined the waitlist! 🎉" : "Join WaitList"}
                </button>
              ) : (
                <form onSubmit={handleWaitlistSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center', animation: 'fadeIn 0.3s ease-in-out' }}>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    className="waitlist-email-input"
                    style={{ padding: '0 12px', borderRadius: '999px', border: '1px solid #ddd', outline: 'none', fontSize: '18px', textAlign: 'center' }}
                    disabled={waitlistLoading}
                    required
                    autoFocus
                  />
                  <button type="submit" className="btn-hero-primary" disabled={waitlistLoading}>
                    {waitlistLoading ? "Joining..." : "Submit"}
                  </button>
                </form>
              )}
              <button className="btn-hero-secondary-blue" onClick={() => navigate("/articles")}>Explore Articles</button>
            </div>
            {waitlistMessage.type === 'error' && (
              <p style={{ marginTop: '12px', fontSize: '14px', color: '#ef4444' }}>
                {waitlistMessage.text}
              </p>
            )}
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={300}>
          <div className="learners-row">
            <div className="avatars">
              <div className="avatar a1">A</div>
              <div className="avatar a2">B</div>
              <div className="avatar a3">C</div>
              <div className="avatar-count">2k+</div>
            </div>
            <span className="in-learners-row">
              Join 2000+ learners building
              <br />
              their financial future
            </span>
          </div>
        </RevealOnScroll>
      </div>
    </section >

      {/* FEATURES STRIP */ }
      < div className = "features-strip" >
        <RevealOnScroll delay={0}>
          <div className="feature-item" onClick={() => document.getElementById('wf-row-1').scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <div className="feature-item-inner">
              <img src={imgBiteSized} alt="Bite-sized learning" className="feature-icon-img" />
              <div>
                <div className="feature-title">Bite sized lessons</div>
                <div className="feature-desc">Made for people with a busy schedule.</div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={100}>
          <div className="feature-item" onClick={() => document.getElementById('wf-row-2').scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <div className="feature-item-inner">
              <img src={imgInteractive} alt="Interactive Learning" className="feature-icon-img" />
              <div>
                <div className="feature-title">Interactive Learning</div>
                <div className="feature-desc">No boring lectures or monotonous content</div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={200}>
          <div className="feature-item"
            onClick={() => document.getElementById('wf-row-3').scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <div className="feature-item-inner">
              <img src={imgRewards} alt="Rewards & Leaderboard" className="feature-icon-img" />
              <div>
                <div className="feature-title">Rewards & Leaderboard</div>
                <div className="feature-desc">Exciting rewards for the most engaged learners</div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={300}>
          <div className="feature-item"
            onClick={() => document.getElementById('wf-row-4').scrollIntoView({ behavior: 'smooth', block: 'center' })}>
            <div className="feature-item-inner">
              <img src={imgLeaderboards} alt="Personalized Recommendations" className="feature-icon-img" />
              <div>
                <div className="feature-title-4">Personalized Recommendations</div>
                <div className="feature-desc">Coming Soon!</div>
              </div>
            </div>
          </div>
        </RevealOnScroll>

      </div >

    {/* POPULAR COURSES SECTION
      <section className="popular-courses-section">
        <RevealOnScroll>
          <div className="pc-header">
            <span className="pc-eyebrow">Popular Courses</span>
            <h2 className="pc-title">Start with the right course</h2>
            <p className="pc-subtitle">Practical paths . Real skills . Lifelong effect .</p>
          </div>
        </RevealOnScroll>

        <div className="pc-grid">
          <RevealOnScroll delay={100}>
            <div className="featured-card" id="featured-course">
              <img
                src={investingImg}
                alt="Budgeting Basics"
                className="featured-card-img"
              />
            </div>
          </RevealOnScroll>

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
            <button className="btn-hero-secondary" onClick={() => navigate("/courses")}>View all courses →</button>
          </div>
        </RevealOnScroll>
      </section>
    */}
      
      {/* WHY FINED SECTION */}
  {/* WHY FINED SECTION */ }
  <section className="why-fined-section" ref={whyFinedRef}>
    <RevealOnScroll>
      <div className="wf-header">
        {/* <span className="pc-eyebrow">Popular Courses</span> */}
        <h2 className="wf-title">Everything you need to build a <br /> <span className="wf-highlight">strong financial future</span></h2>
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
            <path
              className="wf-dynamic-tail"
              d={d}
              fill="none"
              stroke="#4A3AFF"
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{ strokeDasharray: '16 10000', strokeDashoffset: 0, opacity: 0 }}
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

      <div className="wf-row" id="wf-row-1" ref={el => wfRowRefs.current[0] = el}>
        <RevealOnScroll delay={0}>
          <div className="wf-img-placeholder"><img src={wfBiteSizeLessson} alt="Bite-sized lessons" className="wf-img" /></div>
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
      <div className="wf-row" id="wf-row-2" ref={el => wfRowRefs.current[1] = el}>
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
      <div className="wf-row" id="wf-row-3" ref={el => wfRowRefs.current[2] = el}>
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
      <div className="wf-row" id="wf-row-4" ref={el => wfRowRefs.current[3] = el}>
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

  {/* ARTICLES SECTION */ }
  {/* ARTICLES SECTION */ }
  {/* ARTICLES SECTION */ }
  <section className="articles-section">
    <RevealOnScroll>
      <div className="articles-header">
        <span className="pc-eyebrow-1">From our articles</span>
        <h2 className="articles-title">Insights to grow your money</h2>
        <p className="pc-subtitle-ar">Short reads . Big takeaways .</p>
      </div>
    </RevealOnScroll>



    <div className="articles-swiper-container">
      <div className="swiper-custom-prev">❮</div>
      <div className="swiper-custom-next">❯</div>

      <RevealOnScroll delay={100}>
        <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          loop={true}
          speed={500}
          navigation={{
            prevEl: '.swiper-custom-prev',
            nextEl: '.swiper-custom-next',
          }}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 100,
            modifier: 2,
            slideShadows: false,
          }}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          modules={[EffectCoverflow, Pagination, Autoplay, Navigation]}
          className="articles-swiper"
        >
          {(articles.length > 0 ? articles : [null, null, null, null, null]).map((article, index) => {
            const isPlaceholder = !article;
            const articleData = isPlaceholder ? null : article;
            return (
              <SwiperSlide key={index}>
                <div
                  className="article-swiper-card"
                  onClick={() => !isPlaceholder ? navigate(`/articles/${generateSlug(articleData.title)}`) : null}
                >
                  <img
                    src={!isPlaceholder && articleData.image_url ? articleData.image_url : satvikImg}
                    alt={!isPlaceholder ? articleData.title : "Article"}
                    className="article-swiper-img"
                  />
                  <div className="article-swiper-meta">
                    <div className="article-swiper-footer-top">
                      <span className="article-swiper-author">By {!isPlaceholder ? (articleData.author || "Shravan Mutha") : 'Shravan Mutha'}</span>
                      <span className="article-swiper-date">
                        {!isPlaceholder ? new Date(articleData.published_at || articleData.created_at).toLocaleDateString("en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "Jul 1, 2026"}
                      </span>
                    </div>
                    <h3 className="article-swiper-title">
                      {!isPlaceholder ? articleData.title : "The $500 saving rule students should know"}
                    </h3>
                    <p className="article-swiper-desc">
                      {!isPlaceholder && articleData.content
                        ? `${articleData.content.substring(0, 100)}...`
                        : "The saving rule that will change your financial future. The saving rule that will change your financial future. The saving rule that will change your financial future."}
                    </p>
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </RevealOnScroll>
    </div>

    <RevealOnScroll delay={100}>
      {/* <div className="pc-view-all">
            <a href="/articles" className="view-all-articles">View all articles →</a>
          </div> */}
      <div className="pc-view-all">
        <button className="btn-hero-secondary-blue" onClick={() => navigate("/articles")}>Explore all articles</button>
      </div>

    </RevealOnScroll>
  </section>
  {/* TESTIMONIALS SECTION */ }
  {/* TESTIMONIALS SECTION */ }
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

  {/* FOOTER CTA SECTION */ }
      <div className="footer-gradient-strip"></div>
      <section
        className="footer-cta-section"
        style={{ backgroundImage: `url(${newfooterImg})` }}
      >
        <RevealOnScroll delay={100}>
          <div className="footer-cta-content">
            <h2 className="footer-cta-title">Your financial journey<br />starts here.</h2>
            <p className="footer-cta-sub">Small steps today. Bigger opportunities tomorrow.</p>
            <button className="btn-footer-cta" onClick={() => navigate("/articles")}>Explore Articles</button>
          </div>
        </RevealOnScroll>
      </section>
    </>
  );
}

export default Hero;
