// Latest articles: a row you can swipe or scroll sideways (arrow buttons on
// desktop), cards rising in one after another. Real articles only; if they
// can't be loaded the section isn't shown.
import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import { PiArrowLeftBold, PiArrowRightBold } from "react-icons/pi";
import "./ArticlesSection.css";

const EASE = [0.16, 1, 0.3, 1];

const slugOf = (a) =>
  a.slug ||
  (a.title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const dateOf = (a) =>
  new Date(a.published_at || a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default function ArticlesSection({ articles }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const rowRef = useRef(null);
  const list = (articles || []).filter((a) => a?.title).slice(0, 10);
  if (!list.length) return null;

  const scrollBy = (dir) => {
    const row = rowRef.current;
    if (!row) return;
    const card = row.querySelector(".lp-art-card");
    row.scrollBy({ left: dir * ((card?.offsetWidth || 320) + 20), behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section className="lp-art">
      <div className="lp-art-head">
        <div>
          <h2 className="lp-art-title">Insights to grow your money</h2>
          <p className="lp-art-sub">Short reads. Big takeaways.</p>
        </div>
        <div className="lp-art-nav">
          <button type="button" onClick={() => scrollBy(-1)} aria-label="Previous articles">
            <PiArrowLeftBold aria-hidden="true" />
          </button>
          <button type="button" onClick={() => scrollBy(1)} aria-label="More articles">
            <PiArrowRightBold aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="lp-art-row" ref={rowRef}>
        {list.map((a, i) => (
          <motion.a
            key={a.id || a.slug || i}
            href={`/articles/${slugOf(a)}`}
            className="lp-art-card"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/articles/${slugOf(a)}`);
            }}
            initial={reduce ? false : { opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: Math.min(i, 4) * 0.08, ease: EASE }}
          >
            <div className="lp-art-img">
              {a.image_url && <img src={a.image_url} alt="" loading="lazy" />}
              {a.tag && <span className="lp-art-tag">{a.tag}</span>}
            </div>
            <div className="lp-art-body">
              <h3>{a.title}</h3>
              {a.description && <p>{a.description}</p>}
              <div className="lp-art-meta">
                <span>{a.authors?.name || a.author || "FinEd"}</span>
                <span>{dateOf(a)}</span>
              </div>
            </div>
          </motion.a>
        ))}
      </div>

      <div className="lp-art-more">
        <button type="button" className="lp-btn lp-btn-ghost" onClick={() => navigate("/articles")}>
          Explore all articles
        </button>
      </div>
    </section>
  );
}
