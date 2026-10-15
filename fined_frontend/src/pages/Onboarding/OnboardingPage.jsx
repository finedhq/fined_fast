import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "motion/react";
import {
  PiStudent, PiRocketLaunch, PiBriefcase, PiLaptop,
  PiPlant, PiTrendUp, PiChartLineUp,
  PiChartPieSlice, PiLightning, PiPiggyBank, PiCreditCard, PiReceipt,
  PiCheckBold, PiArrowRightBold, PiArrowLeftBold, PiStarFill, PiSealCheckFill,
} from "react-icons/pi";
import { useUserProfile } from "../../context/UserProfileContext";
import { getCourses } from "../../services/api";
import finedMark from "../../assets/fined-mark.png";
import stockMarketBanner from "../../assets/basics-of-stock-market-banner.jpeg";
import "./OnboardingPage.css";

// Values must match the Edit Profile modal's lists
const CAREER_OPTIONS = [
  { id: "Student", title: "Student", hint: "School or college", Icon: PiStudent },
  { id: "Early Career", title: "Early career", hint: "First few years of salary", Icon: PiRocketLaunch },
  { id: "Working Professional", title: "Working professional", hint: "Growing income and tax", Icon: PiBriefcase },
  { id: "Freelancer / Self-Employed", title: "Freelancer", hint: "Uneven, self-managed income", Icon: PiLaptop },
];

const LEVEL_OPTIONS = [
  { id: "Beginner (Level 1) - Starting with basics", title: "Beginner", hint: "Starting from the basics", Icon: PiPlant },
  { id: "Intermediate (Level 2) - Familiar with mutual funds & stocks", title: "Intermediate", hint: "I know mutual funds and stocks", Icon: PiTrendUp },
  { id: "Advanced (Level 3) - Actively investing & tax planning", title: "Advanced", hint: "I invest and plan my tax", Icon: PiChartLineUp },
];

const INTEREST_OPTIONS = [
  { id: "Stock Market", label: "Stock market", Icon: PiChartLineUp },
  { id: "Mutual Funds", label: "Mutual funds", Icon: PiChartPieSlice },
  { id: "UPI", label: "UPI & payments", Icon: PiLightning },
  { id: "Budgeting", label: "Budgeting & saving", Icon: PiPiggyBank },
  { id: "Credit & Debt", label: "Credit & debt", Icon: PiCreditCard },
  { id: "Tax Planning", label: "Tax planning", Icon: PiReceipt },
];

const QUESTIONS = 4;
const FIRST_COURSE_SLUG = "basics-of-stock-market";
const ease = [0.22, 1, 0.36, 1];

const titleOf = (list, id) => list.find((o) => o.id === id)?.title;

export default function OnboardingPage() {
  const { profile, loading, saveProfile } = useUserProfile();
  // Wait for the profile so the wizard can start from the user's saved answers
  if (!profile) {
    return loading ? <div className="ob-page" /> : null;
  }
  return <OnboardingWizard profile={profile} saveProfile={saveProfile} />;
}

function OnboardingWizard({ profile, saveProfile }) {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  // Accounts that existed before onboarding may skip it
  const isOptional = !profile.onboarding_required;

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [username, setUsername] = useState(profile.username || "");
  const [careerStage, setCareerStage] = useState(
    () => CAREER_OPTIONS.find((c) => c.id === profile.career_stage)?.id || null
  );
  const [level, setLevel] = useState(
    () => LEVEL_OPTIONS.find((l) => l.id === profile.financial_level)?.id || null
  );
  const [interests, setInterests] = useState(() => profile.learning_interests || []);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [plannedModules, setPlannedModules] = useState(null);
  const [courseSlug, setCourseSlug] = useState(FIRST_COURSE_SLUG);
  const saveRef = useRef(null);

  // Whole planned course length (modules are released weekly)
  useEffect(() => {
    let cancelled = false;
    getCourses()
      .then((courses) => {
        const list = Array.isArray(courses) ? courses : [];
        // Fall back to the first listed course if the slug ever changes
        const course = list.find((c) => c.slug === FIRST_COURSE_SLUG) || list[0];
        if (cancelled || !course) return;
        if (course.slug) setCourseSlug(course.slug);
        const count = Math.max(Number(course.planned_modules) || 0, Number(course.modules_count) || 0);
        if (count > 0) setPlannedModules(count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const handle = username.trim().replace(/^@/, "");

  const canContinue =
    (step === 1 && handle.length >= 3) ||
    (step === 2 && !!careerStage) ||
    (step === 3 && !!level) ||
    (step === 4 && interests.length > 0);

  const go = (next) => {
    setError("");
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  // Saved once after the last question; the finish buttons wait for the same save
  const persist = () => {
    if (!saveRef.current) {
      setSaving(true);
      saveRef.current = saveProfile({
        username: handle,
        career_stage: careerStage,
        financial_level: level,
        learning_interests: interests,
        onboarding_completed: true,
      }).finally(() => setSaving(false));
    }
    return saveRef.current;
  };

  const next = async () => {
    if (step === 1) {
      if (handle.length < 3 || handle.length > 30) {
        setError("Your handle needs 3 to 30 letters, numbers or underscores.");
        return;
      }
    } else if (step === 4) {
      if (interests.length === 0) {
        setError("Pick at least one topic.");
        return;
      }
      await persist();
    } else if (!canContinue) {
      return;
    }
    go(step + 1);
  };

  const pick = (setter, value) => {
    setter(value);
    setError("");
    // Single-choice steps move on by themselves after a beat
    setTimeout(() => {
      setDirection(1);
      setStep((s) => (s === 2 || s === 3 ? s + 1 : s));
    }, reduce ? 0 : 380);
  };

  const toggleInterest = (id) => {
    setError("");
    setInterests((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const skip = async () => {
    setSaving(true);
    await saveProfile({ onboarding_dismissed: true });
    navigate("/dashboard", { replace: true });
  };

  const finish = async (to) => {
    await persist();
    navigate(to, { replace: true });
  };

  // Enter continues; number keys choose on single-choice steps
  const keyRef = useRef(null);
  useEffect(() => {
    keyRef.current = (e) => {
      if (e.key === "Enter" && step <= QUESTIONS && e.target.tagName !== "BUTTON") {
        e.preventDefault();
        next();
        return;
      }
      const n = Number(e.key);
      if (e.target.tagName === "INPUT" || !n) return;
      if (step === 2 && CAREER_OPTIONS[n - 1]) pick(setCareerStage, CAREER_OPTIONS[n - 1].id);
      if (step === 3 && LEVEL_OPTIONS[n - 1]) pick(setLevel, LEVEL_OPTIONS[n - 1].id);
    };
  });
  useEffect(() => {
    const onKey = (e) => keyRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const card = {
    handle,
    stage: titleOf(CAREER_OPTIONS, careerStage),
    level: titleOf(LEVEL_OPTIONS, level),
    interests: INTEREST_OPTIONS.filter((i) => interests.includes(i.id)).map((i) => i.label),
  };

  const slide = {
    enter: (d) => ({ opacity: 0, x: reduce ? 0 : d * 40 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: reduce ? 0 : d * -40 }),
  };

  const done = step > QUESTIONS;

  return (
    <div className="ob-page">
      <section className="ob-left">
        <header className="ob-top">
          <span className="ob-logo" aria-label="FinEd">
            <img src={finedMark} alt="" />
            <span className="ob-wordmark">Fin<b>Ed</b></span>
          </span>
          {isOptional && !done && (
            <button type="button" className="ob-skip" onClick={skip} disabled={saving}>
              Skip for now
            </button>
          )}
        </header>

        <div className="ob-main">
          {!done && (
            <div className="ob-progress" aria-label={`Question ${step} of ${QUESTIONS}`}>
              {Array.from({ length: QUESTIONS }, (_, i) => (
                <span key={i} className="ob-progress-seg">
                  <motion.span
                    className="ob-progress-fill"
                    initial={false}
                    animate={{ scaleX: i < step ? 1 : 0 }}
                    transition={{ duration: 0.6, ease }}
                  />
                </span>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={step}
              className="ob-step"
              custom={direction}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.38, ease }}
            >
              {step === 1 && (
                <>
                  <h1 className="ob-h1">Pick your handle</h1>
                  <p className="ob-sub">
                    {isOptional
                      ? "Optional: four quick questions so we can tailor your lessons."
                      : "Four quick questions so we can tailor your lessons."}
                  </p>
                  <label className="ob-field">
                    <span className="ob-at">@</span>
                    <input
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""));
                        setError("");
                      }}
                      maxLength={30}
                      placeholder="yourname"
                      aria-label="Username"
                      autoFocus
                    />
                  </label>
                  <p className="ob-note">Shown on leaderboards. You can change it later.</p>
                </>
              )}

              {step === 2 && (
                <>
                  <h1 className="ob-h1">Where are you right now?</h1>
                  <p className="ob-sub">We'll match examples to your money life.</p>
                  <Choices options={CAREER_OPTIONS} value={careerStage} onPick={(v) => pick(setCareerStage, v)} />
                </>
              )}

              {step === 3 && (
                <>
                  <h1 className="ob-h1">How comfortable are you with money?</h1>
                  <p className="ob-sub">This sets where your lessons start.</p>
                  <Choices options={LEVEL_OPTIONS} value={level} onPick={(v) => pick(setLevel, v)} />
                </>
              )}

              {step === 4 && (
                <>
                  <h1 className="ob-h1">What do you want to learn?</h1>
                  <p className="ob-sub">Pick as many as you like.</p>
                  <div className="ob-chips">
                    {INTEREST_OPTIONS.map((o, i) => {
                      const on = interests.includes(o.id);
                      return (
                        <motion.button
                          key={o.id}
                          type="button"
                          aria-pressed={on}
                          className={`ob-chip ${on ? "is-on" : ""}`}
                          onClick={() => toggleInterest(o.id)}
                          initial={reduce ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, ease, delay: 0.05 + i * 0.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          <o.Icon />
                          {o.label}
                          <AnimatePresence initial={false}>
                            {on && (
                              <motion.span
                                className="ob-chip-tick"
                                initial={{ scale: 0, width: 0 }}
                                animate={{ scale: 1, width: 18 }}
                                exit={{ scale: 0, width: 0 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <PiCheckBold />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}

              {done && (
                <>
                  <motion.span
                    className="ob-done-badge"
                    initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.1 }}
                  >
                    <PiSealCheckFill />
                  </motion.span>
                  <div className="ob-mobile-card">
                    <LearnerCard {...card} issued />
                  </div>
                  <h1 className="ob-h1">You're all set, @{handle}</h1>
                  <p className="ob-sub">We recommend starting here.</p>
                  <div className="ob-course">
                    <img src={stockMarketBanner} alt="" className="ob-course-img" />
                    <div className="ob-course-body">
                      <span className="ob-course-title">Basics of Stock Market</span>
                      <span className="ob-course-meta">
                        {plannedModules ? `${plannedModules} modules · ` : ""}10 minutes a day
                      </span>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                className="ob-error"
                role="alert"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="ob-actions">
            {done ? (
              <>
                <button type="button" className="ob-link" onClick={() => finish("/dashboard")} disabled={saving}>
                  Go to dashboard
                </button>
                <PrimaryButton onClick={() => finish(`/courses/${courseSlug}`)} disabled={saving}>
                  Start the course
                </PrimaryButton>
              </>
            ) : (
              <>
                {step > 1 ? (
                  <button type="button" className="ob-link" onClick={() => go(step - 1)}>
                    <PiArrowLeftBold /> Back
                  </button>
                ) : <span />}
                <PrimaryButton onClick={next} disabled={!canContinue || saving}>
                  {step === QUESTIONS ? (saving ? "Saving" : "Finish") : "Continue"}
                </PrimaryButton>
              </>
            )}
          </div>
        </div>
      </section>

      <aside className="ob-right" aria-hidden="true">
        <span className="ob-ring ob-ring--1" />
        <span className="ob-ring ob-ring--2" />
        <LearnerCard {...card} issued={done} />
        <p className="ob-right-note">
          {done ? "Your learner card is ready" : "Your learner card fills in as you answer"}
        </p>
      </aside>
    </div>
  );
}

function PrimaryButton({ children, ...props }) {
  return (
    <motion.button type="button" className="ob-cta" whileTap={{ scale: 0.97 }} {...props}>
      {children}
      <span className="ob-cta-arrow"><PiArrowRightBold /></span>
    </motion.button>
  );
}

function Choices({ options, value, onPick }) {
  const reduce = useReducedMotion();
  return (
    <LayoutGroup>
      <div className="ob-choices" role="radiogroup">
        {options.map((o, i) => {
          const on = value === o.id;
          return (
            <motion.button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              className={`ob-choice ${on ? "is-on" : ""}`}
              onClick={() => onPick(o.id)}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease, delay: 0.06 + i * 0.05 }}
              whileTap={{ scale: 0.985 }}
            >
              {on && (
                <motion.span
                  layoutId="ob-choice-on"
                  className="ob-choice-bg"
                  transition={{ type: "spring", stiffness: 450, damping: 36 }}
                />
              )}
              <span className="ob-choice-icon"><o.Icon /></span>
              <span className="ob-choice-text">
                <span className="ob-choice-title">{o.title}</span>
                <span className="ob-choice-hint">{o.hint}</span>
              </span>
              <span className="ob-choice-tick">{on && <PiCheckBold />}</span>
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}

function CardValue({ value, empty }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value || "empty"}
        className={value ? "ob-card-v" : "ob-card-v ob-card-v--empty"}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
        transition={{ duration: 0.35, ease }}
      >
        {value || empty}
      </motion.span>
    </AnimatePresence>
  );
}

// The learner's FinEd card, filling in as they answer
function LearnerCard({ handle, stage, level, interests, issued }) {
  const shown = interests.slice(0, 2);
  const extra = interests.length - shown.length;
  return (
    <motion.div
      className={`ob-card ${issued ? "is-issued" : ""}`}
      initial={{ opacity: 0, y: 40, rotate: -6 }}
      animate={{ opacity: 1, y: 0, rotate: issued ? 0 : -3, scale: issued ? 1.04 : 1 }}
      transition={{ duration: 0.9, ease }}
    >
      <span className="ob-card-shine" />
      <div className="ob-card-top">
        <span className="ob-card-brand">
          <img src={finedMark} alt="" />
          <span>Fin<b>Ed</b></span>
        </span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={issued ? "issued" : "draft"}
            className="ob-card-chip"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {issued ? "Issued" : "Learner card"}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="ob-card-handle">
        <CardValue value={handle && `@${handle}`} empty="@yourname" />
      </div>
      <dl className="ob-card-rows">
        <div><dt>Stage</dt><dd><CardValue value={stage} empty="—" /></dd></div>
        <div><dt>Level</dt><dd><CardValue value={level} empty="—" /></dd></div>
        <div>
          <dt>Learning</dt>
          <dd>
            <CardValue
              value={interests.length ? `${shown.join(", ")}${extra > 0 ? ` +${extra}` : ""}` : ""}
              empty="—"
            />
          </dd>
        </div>
      </dl>
      <div className="ob-card-foot">
        <span><PiStarFill /> FinScore 0</span>
        <span>Day 1</span>
      </div>
    </motion.div>
  );
}
