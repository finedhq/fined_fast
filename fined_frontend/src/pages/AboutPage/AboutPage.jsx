// The About page (/about), in the landing page's look (same palette, type and
// illustrated world). Top to bottom: hero over the road-to-the-temple scene →
// a facts card resting on the hero's edge → why we built FinEd (what school
// taught us vs what it didn't) → our mission (a purple panel: simple, practical,
// accessible) → how you learn on FinEd → the founders → the expert authors
// (every author except the founders, from the authors list, in a sideways row
// like the landing page) → education, not advice → partnerships.
// Facts match the rest of the site: the learner count matches the landing
// page, the course numbers match the course page, the authors come from the
// authors list.
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import {
  PiArrowRightBold,
  PiArrowUpRightBold,
  PiBookOpenTextBold,
  PiCaretLeftBold,
  PiCaretRightBold,
  PiCheckBold,
  PiDeviceMobileBold,
  PiEnvelopeSimpleBold,
  PiFeatherBold,
  PiLinkedinLogoFill,
  PiShieldCheckBold,
  PiSparkleFill,
  PiToolboxBold,
} from "react-icons/pi";
import { fetchAuthors } from "../../services/api";
import { AUTHOR_TITLES, DEFAULT_AUTHOR_TITLE, FOUNDER_SLUGS, authorBlurb } from "../../lib/authorTitles";
import CertificatePreview from "../../components/Certificate/CertificatePreview";
import sceneImg from "../../assets/file_000000008f747208b046fb7821caefc9.webp";
import imgCourses from "../../assets/wf-interactivelearning.webp";
import imgArticles from "../../assets/wf-bite-size-lessons.webp";
import imgLens from "../../assets/wf-personalrecommend.webp";
import imgRewards from "../../assets/wf-rewards&LeaderBoard.webp";
import imgPartner from "../../assets/institutional-partnerships.webp";
import "./AboutPage.css";

const EASE = [0.16, 1, 0.3, 1];
const CONTACT_EMAIL = "support@myfined.com";

// Founders: the roles and bios written for this page (roles confirmed by the
// owner); photo and LinkedIn come from the authors list.
const FOUNDERS = [
  {
    slug: "shravan-mutha",
    name: "Shravan Mutha",
    role: "Product, technology and content",
    bio: "Shravan is passionate about making financial education simple and accessible. He leads the product, technology, and content at FinEd, working on everything from building the platform to creating easy-to-understand courses and articles. His goal is to help young people develop the financial knowledge needed to make better money decisions throughout their lives.",
  },
  {
    slug: "anish-pujari",
    name: "Anish Pujari",
    role: "Design, branding and marketing",
    bio: "Anish leads the design, branding, and marketing. He focuses on creating an engaging user experience while growing FinEd's reach through creative campaigns and storytelling. His goal is to make learning about finance feel approachable, enjoyable, and relevant for the next generation.",
  },
];

const SCHOOL_TAUGHT = ["Trigonometry", "Photosynthesis", "The dates of the Battle of Plassey", "How to write a formal letter"];
const NOBODY_TAUGHT = ["How a credit score works", "What a mutual fund actually is", "How to budget a month's salary", "Why tax is cut from your salary"];

const MISSION = [
  {
    word: "Simple",
    icon: PiFeatherBold,
    text: "Complex financial topics broken into simple, engaging, bite-sized lessons that fit into a busy life.",
  },
  {
    word: "Practical",
    icon: PiToolboxBold,
    text: "Skills and confidence for real money decisions, taught with Indian examples like UPI, EMIs, IPOs and your salary slip.",
  },
  {
    word: "Accessible",
    icon: PiDeviceMobileBold,
    text: "Free to learn and built for your phone, so anyone who wants to understand money can start today.",
  },
];

// Fade-and-rise once on scroll in; static with reduced motion.
function Reveal({ as = "div", delay = 0, amount = 0.3, y = 28, className, children, ...rest }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.75, delay: reduce ? 0 : delay, ease: EASE }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Hero() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const sceneY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const rise = (delay) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay, ease: EASE } };

  const scrollToTeam = () => {
    document.getElementById("team")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <section className="ab-hero" ref={ref}>
      <div className="ab-hero-copy">
        <motion.h1 className="ab-hero-title" {...rise(0.05)}>
          Making financial education <span className="ab-mark">simple</span>, <span className="ab-mark">practical</span> and{" "}
          <span className="ab-mark">accessible</span>.
        </motion.h1>
        <motion.p className="ab-hero-sub" {...rise(0.18)}>
          FinEd is a free learning platform that helps young Indians understand money, one short lesson at a time.
        </motion.p>
        <motion.div className="ab-hero-ctas" {...rise(0.3)}>
          <button type="button" className="ab-btn ab-btn-primary" onClick={() => navigate("/try")}>
            Try Module 1 <PiArrowRightBold aria-hidden="true" />
          </button>
          <button type="button" className="ab-btn ab-btn-ghost" onClick={scrollToTeam}>
            Meet the team
          </button>
        </motion.div>
      </div>
      <motion.div className="ab-hero-scene" style={reduce ? undefined : { y: sceneY }} aria-hidden="true">
        <img src={sceneImg} alt="" fetchPriority="high" />
      </motion.div>
    </section>
  );
}

// Four facts on one card that rests on the hero's bottom edge. The experts
// count waits for the authors list (a placeholder bar holds its place).
function Facts({ expertCount, loading }) {
  const facts = [
    { big: "2,000+", text: "learners building their financial future" },
    { big: "₹0", text: "to learn. Every course and article is free" },
    { big: "12", text: "modules in Basics of Stock Market, a new one every Monday" },
  ];
  if (loading || expertCount > 0) facts.push({ big: loading ? null : String(expertCount), text: "finance experts writing for FinEd" });

  return (
    <section className="ab-facts" aria-label="FinEd in numbers">
      <Reveal as="ul" y={40} amount={0.4} className={`ab-facts-card ab-facts-card--${facts.length}`}>
        {facts.map((f) => (
          <li key={f.text} className="ab-fact">
            {f.big ? <span className="ab-fact-big">{f.big}</span> : <span className="ab-skel ab-fact-skel" aria-hidden="true" />}
            <span className="ab-fact-text">{f.text}</span>
          </li>
        ))}
      </Reveal>
    </section>
  );
}

function Story() {
  return (
    <section className="ab-story">
      <div className="ab-wrap">
        <Reveal className="ab-head ab-head--center">
          <h2 className="ab-h2">
            Why we built <span>FinEd</span>
          </h2>
          <p className="ab-sub">
            Most of us finished school without ever learning how money works. Then the first salary arrives, and we are left to figure it out
            by trial and error.
          </p>
        </Reveal>

        <div className="ab-compare">
          <Reveal delay={0.05}>
            <div className="ab-note ab-note--school">
              <h3 className="ab-note-title">
                <PiBookOpenTextBold aria-hidden="true" /> What school taught us
              </h3>
              <ul>
                {SCHOOL_TAUGHT.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.18}>
            <div className="ab-note ab-note--life">
              <h3 className="ab-note-title">
                <PiSparkleFill aria-hidden="true" /> What nobody taught us
              </h3>
              <ul>
                {NOBODY_TAUGHT.map((t) => (
                  <li key={t}>
                    <PiCheckBold className="ab-note-tick" aria-hidden="true" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>

        <Reveal as="p" className="ab-story-close">
          <strong>We built FinEd to fix that gap.</strong> Our goal is to make finance intuitive, without long, dry textbooks. Our lessons are
          stories where the charts move as you read and you make a guess before every answer, so you learn by doing.
        </Reveal>
      </div>
    </section>
  );
}

function Mission() {
  return (
    <section className="ab-mission">
      <div className="ab-wrap">
        <div className="ab-mission-panel">
          <Reveal className="ab-mission-intro">
            <h2 className="ab-mission-title">
              Our <span>mission</span>
            </h2>
            <p className="ab-mission-statement">
              Bridge the gap traditional education left, and help you build a foundation for lifelong financial independence.
            </p>
          </Reveal>
          <ul className="ab-pillars">
            {MISSION.map((m, i) => {
              const Icon = m.icon;
              return (
                <Reveal as="li" key={m.word} delay={i * 0.12} amount={0.6} className="ab-pillar">
                  <span className="ab-pillar-icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <h3 className="ab-pillar-word">{m.word}</h3>
                    <p>{m.text}</p>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Learn() {
  const tiles = [
    {
      key: "courses",
      to: "/courses",
      title: "Story-led courses",
      text: "Basics of Stock Market walks you through how markets work, one story at a time. Charts move as you scroll and quick checks keep you thinking.",
      art: <img src={imgCourses} alt="" loading="lazy" />,
    },
    {
      key: "articles",
      to: "/articles",
      title: "Articles by people in finance",
      text: "Clear explainers on taxes, credit, investing and the economy.",
      art: <img src={imgArticles} alt="" loading="lazy" />,
    },
    {
      key: "lens",
      to: "/articles",
      title: "Personal Lens",
      text: "Answer a few quick questions on an article and get a takeaway written for your situation.",
      art: <img src={imgLens} alt="" loading="lazy" />,
    },
    {
      key: "rewards",
      title: "Rewards and leaderboards",
      text: "Every lesson earns you points. Keep your streak going and see where you stand.",
      art: <img src={imgRewards} alt="" loading="lazy" />,
    },
    {
      key: "cert",
      title: "A certificate you can share",
      text: "Finish a course and get a certificate with a QR code that anyone can scan to verify it.",
      art: (
        <div className="ab-cert-thumb">
          <CertificatePreview name="Your Name" courseTitle="Basics of Stock Market" modulesCount={12} sample />
        </div>
      ),
    },
  ];

  return (
    <section className="ab-learn">
      <div className="ab-wrap">
        <Reveal className="ab-head">
          <h2 className="ab-h2">
            How you learn on <span>FinEd</span>
          </h2>
          <p className="ab-sub">Short, hands-on and made for your phone. No 45-minute lectures.</p>
        </Reveal>
        <div className="ab-bento">
          {tiles.map((t, i) => {
            const inner = (
              <>
                <div className="ab-tile-art">{t.art}</div>
                <div className="ab-tile-copy">
                  <h3>
                    {t.title}
                    {t.to && <PiArrowUpRightBold className="ab-tile-go" aria-hidden="true" />}
                  </h3>
                  <p>{t.text}</p>
                </div>
              </>
            );
            return (
              <Reveal key={t.key} delay={(i % 3) * 0.08} amount={0.25} className={`ab-tile-cell ab-tile-cell--${t.key}`}>
                <div className={`ab-tile ab-tile--${t.key}`}>
                  {t.to ? (
                    <Link to={t.to} className="ab-tile-link">
                      {inner}
                    </Link>
                  ) : (
                    <div className="ab-tile-link">{inner}</div>
                  )}
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Photo({ author, name, className }) {
  return (
    <div className={className}>
      {author?.image_url ? <img src={author.image_url} alt="" loading="lazy" /> : <span className="ab-initial">{name[0]}</span>}
    </div>
  );
}

function LinkedIn({ url, name, className = "" }) {
  if (!url) return null;
  return (
    <a className={`ab-in ${className}`} href={url} target="_blank" rel="noopener" referrerPolicy="origin" aria-label={`${name} on LinkedIn`}>
      <PiLinkedinLogoFill aria-hidden="true" />
    </a>
  );
}

function Founders({ authors }) {
  return (
    <section className="ab-founders" id="team">
      <div className="ab-wrap">
        <Reveal className="ab-head">
          <h2 className="ab-h2">
            Meet the <span>founders</span>
          </h2>
          <p className="ab-sub">Two engineering students who wanted the money lessons school never taught.</p>
        </Reveal>
        <div className="ab-founder-grid">
          {FOUNDERS.map((f, i) => {
            const author = authors.find((a) => a.slug === f.slug);
            return (
              <Reveal as="article" key={f.slug} delay={i * 0.12} amount={0.2} className="ab-founder">
                <div className="ab-founder-top">
                  <Photo author={author} name={f.name} className="ab-founder-photo" />
                  <div className="ab-founder-id">
                    <span className="ab-founder-tag">Co-founder</span>
                    <h3>{f.name}</h3>
                    <p className="ab-founder-role">{f.role}</p>
                  </div>
                </div>
                <p className="ab-founder-bio">{f.bio}</p>
                <div className="ab-founder-foot">
                  <Link to={`/authors/${f.slug}`} className="ab-text-link">
                    Read articles <PiArrowRightBold aria-hidden="true" />
                  </Link>
                  <LinkedIn url={author?.linkedin_url} name={f.name} />
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Every author except the founders, in one row that scrolls sideways (swipe,
// trackpad or the arrow buttons). Each arrow switches off at its end.
function Experts({ experts, loading }) {
  const reduce = useReducedMotion();
  const trackRef = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !track.children.length) return undefined;
    const first = track.children[0];
    const last = track.children[track.children.length - 1];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.target === first) setAtStart(e.intersectionRatio > 0.9);
          if (e.target === last) setAtEnd(e.intersectionRatio > 0.9);
        });
      },
      { root: track, threshold: [0, 0.9, 1] }
    );
    observer.observe(first);
    observer.observe(last);
    return () => observer.disconnect();
  }, [experts.length, loading]);

  const step = (dir) => {
    const track = trackRef.current;
    const card = track?.children[0];
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: reduce ? "auto" : "smooth" });
  };

  if (!loading && !experts.length) return null;
  const showArrows = !(atStart && atEnd);

  return (
    <section className="ab-experts">
      <div className="ab-wrap">
        <div className="ab-exp-head">
          <Reveal className="ab-head">
            <h2 className="ab-h2">
              The experts <span>behind FinEd</span>
            </h2>
            <p className="ab-sub">Learn from industry experts with years of experience in finance.</p>
          </Reveal>
          {showArrows && (
            <div className="ab-exp-nav">
              <button type="button" className="ab-arrow" onClick={() => step(-1)} disabled={atStart} aria-label="Previous experts">
                <PiCaretLeftBold aria-hidden="true" />
              </button>
              <button type="button" className="ab-arrow" onClick={() => step(1)} disabled={atEnd} aria-label="More experts">
                <PiCaretRightBold aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        <ul className="ab-exp-row" ref={trackRef} aria-busy={loading || undefined}>
          {loading
            ? [0, 1, 2, 3].map((i) => (
                <li key={i} className="ab-exp ab-exp--skeleton" aria-hidden="true">
                  <div className="ab-exp-photo" />
                  <span className="ab-skel ab-skel-name" />
                  <span className="ab-skel ab-skel-role" />
                  <span className="ab-skel" />
                </li>
              ))
            : experts.map((a, i) => {
                const title = AUTHOR_TITLES[a.slug] || DEFAULT_AUTHOR_TITLE;
                const blurb = authorBlurb(a, title);
                return (
                  <Reveal as="li" key={a.id || a.slug} delay={Math.min(i, 3) * 0.08} amount={0.2} className="ab-exp">
                    <Link to={`/authors/${a.slug}`} className="ab-exp-link" aria-label={`Read ${a.name}'s articles`}>
                      <div className="ab-exp-photo">
                        {a.image_url ? <img src={a.image_url} alt="" loading="lazy" /> : <span className="ab-initial">{a.name[0]}</span>}
                        <span className="ab-exp-go" aria-hidden="true">
                          <PiArrowUpRightBold />
                        </span>
                      </div>
                      <h3>{a.name}</h3>
                      <p className="ab-exp-role" title={title}>
                        {title}
                      </p>
                      {blurb && <p className="ab-exp-bio">{blurb}</p>}
                    </Link>
                    <LinkedIn url={a.linkedin_url} name={a.name} className="ab-in--photo" />
                  </Reveal>
                );
              })}
        </ul>
      </div>
    </section>
  );
}

function AdviceNote() {
  return (
    <section className="ab-promise">
      <div className="ab-wrap">
        <Reveal className="ab-promise-card">
          <div className="ab-promise-icon" aria-hidden="true">
            <PiShieldCheckBold />
          </div>
          <div>
            <h2 className="ab-promise-title">Education, not advice</h2>
            <p>
              FinEd teaches how money works. We are not SEBI-registered investment advisers, so we never tell you which stock or fund to buy,
              and we don&apos;t push financial products. The numbers in our lessons explain an idea; they are not forecasts.
            </p>
            <Link to="/termsofservice" className="ab-text-link">
              Read our terms <PiArrowRightBold aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Partner() {
  const navigate = useNavigate();
  return (
    <section className="ab-partner">
      <div className="ab-wrap">
        <div className="ab-partner-panel">
          <Reveal className="ab-partner-copy">
            <h2 className="ab-h2">
              For institutional <span>partnerships</span>
            </h2>
            <p className="ab-sub">
              Want FinEd for your college, student club or organisation? Tell us what you have in mind and our team will get back to you.
            </p>
            <div className="ab-partner-ctas">
              <button type="button" className="ab-btn ab-btn-primary" onClick={() => navigate("/contact")}>
                Partner with us <PiArrowRightBold aria-hidden="true" />
              </button>
              <a href={`mailto:${CONTACT_EMAIL}`} className="ab-mail">
                <PiEnvelopeSimpleBold aria-hidden="true" /> {CONTACT_EMAIL}
              </a>
            </div>
          </Reveal>
          <Reveal className="ab-partner-art" delay={0.1}>
            <img src={imgPartner} alt="" loading="lazy" />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

export default function AboutPage() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchAuthors()
      .then((data) => !cancelled && setAuthors(Array.isArray(data) ? data : data?.authors || []))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const named = authors.filter((a) => a?.name && a.slug);
  const experts = named.filter((a) => !FOUNDER_SLUGS.has(a.slug));

  return (
    <div className="ab">
      <Hero />
      <Facts expertCount={experts.length} loading={loading} />
      <Story />
      <Mission />
      <Learn />
      <Founders authors={named} />
      <Experts experts={experts} loading={loading} />
      <AdviceNote />
      <Partner />
    </div>
  );
}
