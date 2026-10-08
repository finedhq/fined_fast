// "Start with the right course": the original page's course section,
// redesigned for the new look. One featured card for the live course (from
// the course list), then a row of "coming soon" placeholders and the original
// "Explore all courses" link. The card rises in, and its picture tilts toward
// the mouse.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { PiArrowRightBold, PiBooksBold, PiClockBold, PiLockSimpleBold, PiTagBold } from "react-icons/pi";
import instance from "../../../lib/axios";
import featuredImg from "../../../assets/featured-img.webp";
import "./CoursesSection.css";

const EASE = [0.16, 1, 0.3, 1];

// The original page's description, shown only until the course list loads
// (or if it can't); the admin description is used once it arrives.
const FALLBACK_DESCRIPTION =
  "This course will provide you everything you need to start investing in India. The stock market can seem complicated, but it doesn't have to be. This course breaks down how the market works, from stocks, IPOs, and key market terms to the basics of analysing companies and the economy.";

function Thumb({ src, alt }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-7, 7]), { stiffness: 150, damping: 18 });
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 18 });
  return (
    <motion.div
      className="lp-cs-thumb"
      style={reduce ? undefined : { rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <img src={src} alt={alt} />
    </motion.div>
  );
}

export default function CoursesSection() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [course, setCourse] = useState(null);

  useEffect(() => {
    let cancelled = false;
    instance
      .get("/courses/getall")
      .then((res) => {
        const list = res.data || [];
        if (!cancelled && list.length) setCourse(list.find((c) => (c.title || "").toLowerCase().includes("stock market")) || list[0]);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // The admin title carries a "v2" marker; learners shouldn't see it.
  const title = (course?.title || "Basics of Stock Market").replace(/\s+v\d+$/i, "");
  const coursePage = course?.slug ? `/courses/${course.slug}` : "/courses";
  const rise = (delay = 0) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 36 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.3 },
          transition: { duration: 0.75, delay, ease: EASE },
        };

  return (
    <section className="lp-cs">
      <div className="lp-cs-inner">
        <motion.div className="lp-cs-head" {...rise()}>
          <h2 className="lp-cs-title">
            Start with the <span>right course</span>
          </h2>
          <p className="lp-cs-sub">Practical paths. Real skills. Lifelong effect.</p>
        </motion.div>

        <motion.article className="lp-cs-card" {...rise(0.1)}>
          <Thumb src={course?.thumbnail_url || featuredImg} alt={title} />
          <div className="lp-cs-body">
            <h3>{title}</h3>
            <ul className="lp-cs-facts">
              <li>
                {/* The course's planned length, not just the modules released so far */}
                <PiBooksBold aria-hidden="true" /> {course?.planned_modules || course?.modules_count || 12} Modules
              </li>
              <li>
                <PiClockBold aria-hidden="true" /> {course?.duration || 15} mins
              </li>
              <li>
                <PiTagBold aria-hidden="true" /> Free
              </li>
            </ul>
            <p className="lp-cs-desc">{course?.description || FALLBACK_DESCRIPTION}</p>
            <div className="lp-cs-ctas">
              <button type="button" className="lp-btn lp-btn-primary" onClick={() => navigate(coursePage)}>
                View Course <PiArrowRightBold aria-hidden="true" />
              </button>
            </div>
          </div>
        </motion.article>

        <motion.div className="lp-cs-soon" {...rise(0.2)}>
          <div className="lp-cs-soon-copy">
            <h3>More courses coming soon...</h3>
            <p>Stay tuned for new financial lessons</p>
          </div>
          <div className="lp-cs-soon-cards" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="lp-cs-ghost">
                <PiLockSimpleBold />
                <span />
                <span />
              </div>
            ))}
          </div>
        </motion.div>

        <div className="lp-cs-all">
          <button type="button" className="lp-btn lp-btn-ghost" onClick={() => navigate("/courses")}>
            Explore all courses
          </button>
        </div>
      </div>
    </section>
  );
}
