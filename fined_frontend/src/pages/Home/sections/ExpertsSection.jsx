// The experts: every author on the site except the two co-founders, straight
// from the authors list (so a new author appears here by themselves). Photos
// wipe in as they scroll into view; each card opens that author's page.
// Always one row: four fit on desktop, and the row swipes sideways when there
// are more than fit (phones, or a 5th expert).
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { PiArrowUpRightBold, PiLinkedinLogoFill } from "react-icons/pi";
import "./ExpertsSection.css";

const EASE = [0.16, 1, 0.3, 1];

// Co-founders are left out of this section (owner's call).
const EXCLUDED = new Set(["anish-pujari", "shravan-mutha"]);

// Titles as written for the old landing page's authors strip.
const TITLES = {
  "shishir-bhartia": "Directional Strategy Consultant, Ex Head Times Group Alliances and Brand Capital West",
  "deepan-datta": "Investment Writer",
  "dharsana-gandhi-r": "Finance Professional",
  madhvendra: "Finance Writer",
  "puja-tayal": "Financial Writer & Equity Analyst",
};

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
const same = (a, b) => clean(a).replace(/[^a-z]/gi, "").toLowerCase() === clean(b).replace(/[^a-z]/gi, "").toLowerCase();

export default function ExpertsSection({ authors }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const experts = (authors || []).filter((a) => a?.name && !EXCLUDED.has(a.slug));
  if (!experts.length) return null;

  return (
    <section className="lp-exp">
      <div className="lp-exp-inner">
        <motion.div
          className="lp-exp-head"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <h2 className="lp-exp-title">
            The experts <span>behind FinEd</span>
          </h2>
          <p className="lp-exp-sub">Learn from industry experts with years of experience in finance.</p>
        </motion.div>

        {/* The row animates in as a whole: a card half off-screen (the one that
            hints you can swipe) still appears with the others. */}
        <motion.ul
          className="lp-exp-grid"
          initial={reduce ? false : "hidden"}
          whileInView="shown"
          viewport={{ once: true, amount: 0.2 }}
        >
          {experts.map((a, i) => {
            const title = TITLES[a.slug] || "Writer at FinEd";
            // Some bios just repeat the title; then the longer description reads better.
            const text = clean(a.bio && !same(a.bio, title.replace(",", "")) ? a.bio : a.description);
            return (
              <motion.li
                key={a.id || a.slug}
                className="lp-exp-card"
                variants={{ hidden: { opacity: 0, y: 40 }, shown: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.7, delay: reduce ? 0 : i * 0.1, ease: EASE }}
              >
                <button type="button" className="lp-exp-open" onClick={() => navigate(`/authors/${a.slug}`)} aria-label={`Read ${a.name}'s articles`}>
                  <motion.div
                    className="lp-exp-photo"
                    variants={{ hidden: { clipPath: "inset(100% 0% 0% 0%)" }, shown: { clipPath: "inset(0% 0% 0% 0%)" } }}
                    transition={{ duration: 0.9, delay: reduce ? 0 : 0.15 + i * 0.1, ease: EASE }}
                  >
                    {a.image_url ? <img src={a.image_url} alt="" loading="lazy" /> : <span className="lp-exp-initial">{a.name[0]}</span>}
                    <span className="lp-exp-go" aria-hidden="true">
                      <PiArrowUpRightBold />
                    </span>
                  </motion.div>
                  <div className="lp-exp-body">
                    <h3>{a.name}</h3>
                    <p className="lp-exp-role" title={title}>{title}</p>
                    {text && <p className="lp-exp-bio">{text}</p>}
                  </div>
                </button>
                {a.linkedin_url && (
                  <a className="lp-exp-in" href={a.linkedin_url} target="_blank" rel="noopener" referrerPolicy="origin" aria-label={`${a.name} on LinkedIn`}>
                    <PiLinkedinLogoFill aria-hidden="true" />
                  </a>
                )}
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}
