// Landing hero: the illustrated path-to-the-temple scene, the headline and the
// two CTAs on the left, and on the right Module 1 playing itself (see
// ModulePreview), so "Try Module 1" points at something you can already see.
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { PiArrowRightBold } from "react-icons/pi";
import ModulePreview from "./ModulePreview";
import sceneImg from "../../../assets/newnewbg-imgofhomepg.webp";
import planeImg from "../../../assets/newnewplane.webp";
import "./HeroSection.css";

const EASE = [0.16, 1, 0.3, 1];

// The plane's flight: one smooth curve (a quadratic Bezier from bottom-left up
// to its spot by the card), sampled into transform keyframes. Animating the
// whole transform lets the browser run it off the main thread, so it doesn't
// stutter while the rest of the page is still loading.
const FLIGHT = (() => {
  const from = [-420, 260];
  const via = [-200, 10];
  const steps = 24;
  const frames = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = 1 - (1 - i / steps) ** 3; // ease out: fast launch, gentle landing
    const u = 1 - t;
    const x = u * u * from[0] + 2 * u * t * via[0];
    const y = u * u * from[1] + 2 * u * t * via[1];
    frames.push(`translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(-18 * u).toFixed(2)}deg)`);
  }
  return frames;
})();
const HOVER = ["translate(0px, 0px) rotate(0deg)", "translate(0px, -7px) rotate(-2deg)", "translate(0px, 0px) rotate(0deg)"];

const rise = (delay) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE },
});

export default function HeroSection({ bundle }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);

  // The illustration drifts down a little slower than the page scrolls.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 90]);

  // Depth with the mouse: the hills lean one way, the card and plane the other.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });
  const sceneX = useTransform(smx, (v) => v * -14);
  const sideX = useTransform(smx, (v) => v * 16);
  const sideY = useTransform(smy, (v) => v * 10);
  const planeX = useTransform(smx, (v) => v * 34);
  const planeY = useTransform(smy, (v) => v * 22);
  const onPointerMove = (e) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  // After landing, the plane keeps a slow hover so the scene doesn't freeze.
  const [landed, setLanded] = useState(false);

  return (
    <section className="lp-hero" ref={sectionRef} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      <motion.div className="lp-hero-scene" style={reduce ? undefined : { y: sceneY, x: sceneX }} aria-hidden="true">
        <img src={sceneImg} alt="" fetchPriority="high" />
      </motion.div>

      <div className="lp-hero-inner">
        <div className="lp-hero-copy">
          <motion.h1 className="lp-hero-title" {...(reduce ? {} : rise(0.05))}>
            Learn money skills in{" "}
            <span className="lp-hero-hl">
              10 minutes
              <svg className="lp-hero-underline" viewBox="0 0 300 24" preserveAspectRatio="none" aria-hidden="true">
                <motion.path
                  d="M4 16 C 70 6, 150 4, 296 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="7"
                  strokeLinecap="round"
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.75, ease: "easeOut" }}
                />
              </svg>
            </span>{" "}
            a day
          </motion.h1>

          <motion.p className="lp-hero-sub" {...(reduce ? {} : rise(0.18))}>
            Bite-sized interactive personal finance courses built for the youth. No jargon, no fees, no excuses.
          </motion.p>

          <motion.div className="lp-hero-ctas" {...(reduce ? {} : rise(0.3))}>
            <button
              type="button"
              className="lp-btn lp-btn-primary"
              onClick={() => navigate("/try")}
            >
              Try Module 1 <PiArrowRightBold aria-hidden="true" />
            </button>
            <motion.button
              type="button"
              className="lp-btn lp-btn-ghost"
              onClick={() => navigate("/articles")}
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.97 }}
            >
              Explore Articles
            </motion.button>
          </motion.div>
        </div>

        <motion.div className="lp-hero-side" style={reduce ? undefined : { x: sideX, y: sideY }}>
          {/* The paper plane flies in once, lands by the module card, then hovers. */}
          <motion.div className="lp-hero-plane" style={reduce ? undefined : { x: planeX, y: planeY }} aria-hidden="true">
            <motion.img
              src={planeImg}
              alt=""
              initial={reduce ? false : { opacity: 0, transform: FLIGHT[0] }}
              animate={landed ? { opacity: 1, transform: HOVER } : { opacity: 1, transform: FLIGHT }}
              transition={
                landed
                  ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
                  : { transform: { duration: 1.8, delay: 0.3, ease: "linear" }, opacity: { duration: 0.35, delay: 0.3 } }
              }
              onAnimationComplete={() => !reduce && setLanded(true)}
            />
          </motion.div>
          <ModulePreview bundle={bundle} />
        </motion.div>
      </div>
    </section>
  );
}
