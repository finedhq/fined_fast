// The last screen: the road-to-the-temple illustration, the closing line and
// the same two buttons as the hero. The scene eases in as you arrive.
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { PiArrowRightBold } from "react-icons/pi";
import sceneImg from "../../../assets/file_000000008f747208b046fb7821caefc9.webp";
import "./FinalCta.css";

const EASE = [0.16, 1, 0.3, 1];

export default function FinalCta() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1.12, 1]);
  const sceneY = useTransform(scrollYProgress, [0, 1], [60, 0]);

  const rise = (delay) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 30 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 0.8, delay, ease: EASE },
        };

  return (
    <section className="lp-end" ref={ref}>
      <motion.div className="lp-end-scene" style={reduce ? undefined : { scale: sceneScale, y: sceneY }} aria-hidden="true">
        <img src={sceneImg} alt="" loading="lazy" />
      </motion.div>

      <div className="lp-end-inner">
        <motion.h2 className="lp-end-title" {...rise(0)}>
          Your financial journey
          <br />
          starts here.
        </motion.h2>
        <motion.p className="lp-end-sub" {...rise(0.12)}>
          Small steps today. Bigger opportunities tomorrow.
        </motion.p>
        <motion.div className="lp-end-ctas" {...rise(0.24)}>
          <button
            type="button"
            className="lp-btn lp-btn-primary"
            onClick={() => navigate("/try")}
          >
            Try Module 1 <PiArrowRightBold aria-hidden="true" />
          </button>
          <motion.button
            type="button"
            className="lp-btn lp-btn-ghost lp-end-ghost"
            onClick={() => navigate("/articles")}
            whileHover={reduce ? undefined : { y: -2 }}
            whileTap={reduce ? undefined : { scale: 0.97 }}
          >
            Explore Articles
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}
