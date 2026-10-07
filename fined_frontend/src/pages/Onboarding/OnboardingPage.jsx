import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useUserProfile } from "../../context/UserProfileContext";
import stockMarketBanner from "../../assets/basics-of-stock-market-banner.jpeg";
import "./OnboardingPage.css";

const CAREER_OPTIONS = [
  {
    id: "Student",
    title: "Student",
    desc: "School or college learner building money habits and investing literacy.",
  },
  {
    id: "Early Career",
    title: "Early Career",
    desc: "0–3 years in workforce, starting salary, emergency funds & SIPs.",
  },
  {
    id: "Professional",
    title: "Professional",
    desc: "Optimizing taxes, multi-asset portfolios & long-term wealth growth.",
  },
  {
    id: "Freelancer",
    title: "Freelancer",
    desc: "Managing variable income, tax write-offs & solo retirement plans.",
  },
];

const FINANCIAL_LEVEL_OPTIONS = [
  {
    id: "Beginner",
    dbValue: "Beginner (Level 1) - Starting with basics",
    title: "Beginner",
    desc: "New to personal finance. Want clear, jargon-free budgeting & saving tips.",
  },
  {
    id: "Intermediate",
    dbValue: "Intermediate (Level 2) - Familiar with mutual funds & stocks",
    title: "Intermediate",
    desc: "Familiar with stocks & mutual funds. Want daily habits and portfolio balance.",
  },
  {
    id: "Advanced",
    dbValue: "Advanced (Level 3) - Actively investing & tax planning",
    title: "Advanced",
    desc: "Active in equities & derivatives. Want macro insights and tax harvesting.",
  },
];

const LEARNING_INTERESTS_OPTIONS = [
  { id: "Stock Market", label: "Stock Market", icon: "📈" },
  { id: "UPI", label: "UPI & Digital Payments", icon: "⚡" },
  { id: "Mutual Funds", label: "Mutual Funds", icon: "📊" },
  { id: "Budgeting", label: "Budgeting & Savings", icon: "💰" },
  { id: "Credit & Debt", label: "Credit & Debt", icon: "💳" },
  { id: "Tax Planning", label: "Tax Planning", icon: "🛡️" },
];

const STAGE_BADGES = {
  1: "🌱 SOWING HABIT",
  2: "🌿 ROOTING IN",
  3: "🍃 BRANCHING OUT",
  4: "🪴 THRIVING DISCIPLINE",
  5: "🌻 FULL BLOOM",
};

const EDITORIAL_QUOTES = {
  1: "Financial discipline is like watering a plant 10 minutes a day. It grows quietly, then all at once.",
  2: "Career stage changes how you manage risk, not whether you should start.",
  3: "Half of India thinks money is about chasing stock tips. Real literacy is knowing how the economic engine functions.",
  4: "Curiosity beats jargon every single time.",
  5: "Your personalized FinEd ecosystem is ready to grow.",
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth0();
  const { profile, saveProfile } = useUserProfile();

  const initialStep = parseInt(searchParams.get("step") || "1", 10) || 1;
  const initialCurating = searchParams.get("curating") === "true";

  const [step, setStep] = useState(initialStep);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [careerStage, setCareerStage] = useState(CAREER_OPTIONS[0].id);
  const [financialLevel, setFinancialLevel] = useState(FINANCIAL_LEVEL_OPTIONS[0].dbValue);
  const [selectedInterests, setSelectedInterests] = useState([
    "Stock Market",
    "Mutual Funds",
    "Budgeting",
  ]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Clean Editorial Loading Transition State (Between Step 4 and Step 5)
  const [isCurating, setIsCurating] = useState(initialCurating);
  const [curateStatusText, setCurateStatusText] = useState("Reviewing starting modules...");
  const curationTimersRef = useRef([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      curationTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  // Initialize from user / profile context
  useEffect(() => {
    if (profile) {
      if (profile.display_name && !displayName) {
        setDisplayName(profile.display_name);
      } else if (user?.name && !displayName) {
        setDisplayName(user.name);
      }

      if (profile.username && !username) {
        setUsername(profile.username);
      } else if (!username && user?.email) {
        const handle = user.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
        setUsername(handle);
      }

      if (profile.career_stage) {
        const match = CAREER_OPTIONS.find(
          (c) => c.id === profile.career_stage || c.title === profile.career_stage
        );
        if (match) setCareerStage(match.id);
      }

      if (profile.financial_level) {
        setFinancialLevel(profile.financial_level);
      }

      const existingInterests = profile.macro_profile?.learning_interests;
      if (Array.isArray(existingInterests) && existingInterests.length > 0) {
        setSelectedInterests(existingInterests);
      }
    }
  }, [profile, user]);

  const handleUsernameChange = (e) => {
    const clean = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
    setUsername(clean);
    if (error) setError("");
  };

  const toggleInterest = (interestId) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((item) => item !== interestId)
        : [...prev, interestId]
    );
  };

  // Validate step 1
  const validateStep1 = () => {
    if (!displayName.trim()) {
      setError("Please enter your name.");
      return false;
    }
    const cleanHandle = username.trim().replace(/^@/, "");
    if (!cleanHandle) {
      setError("Please choose a username handle.");
      return false;
    }
    if (cleanHandle.length < 3 || cleanHandle.length > 30) {
      setError("Username must be between 3 and 30 characters.");
      return false;
    }
    setError("");
    return true;
  };

  // Persist directly to Supabase users table & update UserProfileContext
  const persistProfile = async () => {
    const cleanUser = username.trim().replace(/^@/, "");
    const bioText = `${careerStage} building daily personal finance & investing discipline 10 minutes a day on FinEd.`;

    const payload = {
      display_name: displayName.trim() || "FinEd Learner",
      username: cleanUser,
      career_stage: careerStage,
      financial_level: financialLevel,
      location: "Nagpur, IN",
      bio: bioText,
      macro_profile: {
        onboarding_completed: true,
        learning_interests: selectedInterests,
        career_stage: careerStage,
        financial_level: financialLevel,
      },
      onboarding_completed: true,
      learning_interests: selectedInterests,
    };

    setSaving(true);
    try {
      if (saveProfile) {
        await saveProfile(payload);
      }
      localStorage.setItem("fined_onboarding_completed", "true");
    } catch (err) {
      console.warn("Notice: profile save handled gracefully:", err);
      localStorage.setItem("fined_onboarding_completed", "true");
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    setError("");
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (selectedInterests.length === 0) {
        setError("Please choose at least one topic.");
        return;
      }
      // Start clean editorial loading transition (2.1s)
      setIsCurating(true);
      setCurateStatusText("Reviewing starting modules...");

      // Persist profile in background
      persistProfile();

      // Clear any prior timers
      curationTimersRef.current.forEach(clearTimeout);
      curationTimersRef.current = [];

      // Cycle status micro-copy at 1.0s
      const t1 = setTimeout(() => {
        setCurateStatusText("Preparing Basics of Stock Market...");
      }, 1000);

      // Smooth auto-navigation to Step 5 at 2.1s
      const t2 = setTimeout(() => {
        setIsCurating(false);
        setStep(5);
      }, 2100);

      curationTimersRef.current.push(t1, t2);
    }
  };

  const handleBack = () => {
    setError("");
    if (step > 1 && !isCurating) {
      setStep((prev) => prev - 1);
    }
  };

  const handleStartCourse = async () => {
    await persistProfile();
    navigate("/courses/basics-of-stock-market");
  };

  const handleGoDashboard = async () => {
    await persistProfile();
    navigate("/dashboard");
  };

  const currentHandle = username.trim().replace(/^@/, "") || "learner";

  // Clean financial level label for summary display
  const cleanFinancialLevel = financialLevel.includes("Beginner")
    ? "Beginner"
    : financialLevel.includes("Intermediate")
    ? "Intermediate"
    : financialLevel.includes("Advanced")
    ? "Advanced"
    : financialLevel;

  return (
    <div className="onboard-page-wrapper">
      <div className="onboard-card-container">
        {/* ── LEFT PANEL: Step-by-Step Question Wizard ── */}
        <div className="onboard-left-panel">
          <div>
            {/* Header: Logo + Step Indicator + 5 Segmented Dashes */}
            <div className="onboard-left-header">
              <Link to="/" className="onboard-brand-row" aria-label="FinEd Home">
                <img src="/logo.ico" alt="FinEd" className="onboard-logo-img" />
                <span className="onboard-brand-name">
                  Fin<span className="onboard-brand-accent">Ed</span>
                </span>
              </Link>

              <div className="onboard-progress-strip">
                <div className="onboard-dashes-row" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <div
                      key={s}
                      className={`onboard-dash ${
                        s === step
                          ? "onboard-dash--active bg-[#FA7516]"
                          : s < step
                          ? "onboard-dash--completed bg-[#FA7516]"
                          : ""
                      }`}
                    />
                  ))}
                </div>
                <div className="onboard-step-text">
                  {isCurating ? "Curating your track..." : `Step ${step} of 5`}
                </div>
              </div>
            </div>

            {error && <div className="onboard-error-msg">{error}</div>}

            {/* ── 1. CLEAN EDITORIAL LOADING / TRANSITION (Between Step 4 & 5) ── */}
            {isCurating ? (
              <div className="onboard-editorial-loading">
                <h2 className="onboard-loading-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
                  Curating your personal learning path
                </h2>
                <p className="onboard-loading-subtext text-sm sm:text-base font-medium text-slate-500 mt-2">
                  Tailoring daily bite-sized concepts for @{currentHandle} based on your selected interests.
                </p>

                {/* Smooth Animated Gradient Progress Bar */}
                <div className="onboard-progress-track w-full max-w-md h-2 bg-slate-100 rounded-full overflow-hidden mt-6">
                  <div className="onboard-progress-fill h-full rounded-full bg-gradient-to-r from-orange-400 to-[#FA7516]" />
                </div>

                {/* Pulsating Status Micro-Copy */}
                <div className="onboard-loading-status mt-3 flex items-center gap-2 text-sm font-semibold text-slate-500 animate-pulse">
                  <span className="onboard-loading-spinner-dot" />
                  <span>{curateStatusText}</span>
                </div>
              </div>
            ) : (
              <>
                {/* ── STEP 1: Name & Handle ── */}
                {step === 1 && (
                  <div className="onboard-step-fade">
                    <h1 className="onboard-heading">What should we call you?</h1>
                    <p className="onboard-subcopy">
                      This handle will be your public signature on leaderboards and community discussions.
                    </p>

                    <div className="onboard-field-group">
                      <label className="onboard-label">Full Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => {
                          setDisplayName(e.target.value);
                          if (error) setError("");
                        }}
                        placeholder="Type your name here"
                        className="onboard-input-box"
                        autoFocus
                      />
                    </div>

                    <div className="onboard-field-group">
                      <label className="onboard-label">Username Handle</label>
                      <div className="onboard-input-prefix-wrap">
                        <span className="onboard-prefix-icon">@</span>
                        <input
                          type="text"
                          value={username}
                          onChange={handleUsernameChange}
                          placeholder="username"
                          maxLength={30}
                          className="onboard-input-box"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Career Stage ── */}
                {step === 2 && (
                  <div className="onboard-step-fade">
                    <h1 className="onboard-heading">Where are you in your journey?</h1>
                    <p className="onboard-subcopy">
                      We customize course examples, calculators, and exercises to your income reality.
                    </p>

                    <div className="onboard-options-list" role="radiogroup">
                      {CAREER_OPTIONS.map((opt) => {
                        const isSelected = careerStage === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setCareerStage(opt.id)}
                            className={`onboard-option-pill ${
                              isSelected ? "onboard-option-pill--selected ring-2 ring-[#FA7516]" : ""
                            }`}
                          >
                            <div className="onboard-opt-left">
                              <div className="onboard-opt-title">{opt.title}</div>
                              <div className="onboard-opt-desc">{opt.desc}</div>
                            </div>
                            <span className="onboard-opt-check">
                              {isSelected && "✓"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 3: Financial Knowledge Level ── */}
                {step === 3 && (
                  <div className="onboard-step-fade">
                    <h1 className="onboard-heading">Your current financial comfort?</h1>
                    <p className="onboard-subcopy">
                      We'll configure your starting module difficulty and core economic concepts.
                    </p>

                    <div className="onboard-options-list" role="radiogroup">
                      {FINANCIAL_LEVEL_OPTIONS.map((opt) => {
                        const isSelected = financialLevel === opt.dbValue;
                        return (
                          <button
                            key={opt.dbValue}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setFinancialLevel(opt.dbValue)}
                            className={`onboard-option-pill ${
                              isSelected ? "onboard-option-pill--selected ring-2 ring-[#FA7516]" : ""
                            }`}
                          >
                            <div className="onboard-opt-left">
                              <div className="onboard-opt-title">{opt.title}</div>
                              <div className="onboard-opt-desc">{opt.desc}</div>
                            </div>
                            <span className="onboard-opt-check">
                              {isSelected && "✓"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── STEP 4: Learning Interests (Multi-select pill tags) ── */}
                {step === 4 && (
                  <div className="onboard-step-fade">
                    <h1 className="onboard-heading">What do you want to master first?</h1>
                    <p className="onboard-subcopy">
                      Select your core topics ({selectedInterests.length} selected). We'll seed your personalized feed.
                    </p>

                    <div className="onboard-pill-tags-grid">
                      {LEARNING_INTERESTS_OPTIONS.map((item) => {
                        const isSelected = selectedInterests.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleInterest(item.id)}
                            className={`onboard-tag-pill ${
                              isSelected ? "onboard-tag-pill--selected ring-2 ring-[#FA7516]" : ""
                            }`}
                          >
                            <span className="onboard-tag-icon">{item.icon}</span>
                            <span className="onboard-tag-label">{item.label}</span>
                            {isSelected && <span className="onboard-tag-check">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="onboard-pill-hint">
                      Tap to add or remove topics. Your plant on the right reflects your choices!
                    </p>
                  </div>
                )}

                {/* ── STEP 5: STANDALONE HIGH-FIDELITY RECOMMENDED COURSE + SUMMARY ── */}
                {step === 5 && (
                  <div className="onboard-step-fade onboard-step5-container">
                    <div className="onboard-step5-header">
                      <span className="onboard-recom-kicker">✨ PERSONALIZED RECOMMENDATION</span>
                      <h1 className="onboard-heading" style={{ fontSize: "1.65rem", marginBottom: "0.25rem" }}>
                        We recommend you start here
                      </h1>
                      <p className="onboard-subcopy" style={{ marginBottom: "1rem" }}>
                        Based on your profile and daily 10-minute habit, this course builds your fastest economic intuition.
                      </p>
                    </div>

                    {/* A. Standalone High-Fidelity Course Card */}
                    <div className="onboard-course-card-standalone">
                      {/* Responsive 16:9 banner wrapper with zero vertical clipping */}
                      <div className="onboard-course-banner-wrap w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100">
                        <img
                          src={stockMarketBanner}
                          alt="Basics of Stock Market"
                          className="onboard-course-banner-img w-full h-full object-contain p-2"
                        />
                      </div>

                      {/* Course Card Body */}
                      <div className="onboard-course-body">
                        {/* Badges Row */}
                        <div className="onboard-course-badges-row flex flex-wrap items-center gap-2 my-3">
                          <span className="onboard-badge-pill onboard-badge--orange">
                            RECOMMENDED
                          </span>
                          <span className="onboard-badge-pill onboard-badge--slate">
                            3 MODULES • 10 MINS/DAY
                          </span>
                          <span className="onboard-badge-pill onboard-badge--emerald">
                            BEGINNER FRIENDLY
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="onboard-course-main-title text-xl font-bold text-slate-900">
                          Basics of Stock Market
                        </h3>

                        {/* Description */}
                        <p className="onboard-course-main-desc text-xs text-slate-500 line-clamp-2 mt-1">
                          Understand how the market works, from stocks and IPOs to analysing companies with zero jargon.
                        </p>

                        {/* Full-width Prominent CTA Button */}
                        <button
                          type="button"
                          className="onboard-course-main-btn w-full bg-[#FA7516] hover:bg-[#e0640d] text-white font-bold py-3 rounded-xl transition-all shadow-md mt-4 flex items-center justify-center gap-2 cursor-pointer"
                          onClick={handleStartCourse}
                        >
                          <span>Start This Course</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>

                    {/* B. Summary Strip Directly Below Course Card */}
                    <div className="onboard-summary-strip">
                      <div className="onboard-summary-item">
                        <span className="onboard-summary-lbl">Learner</span>
                        <span className="onboard-summary-val">@{currentHandle}</span>
                      </div>
                      <div className="onboard-summary-item">
                        <span className="onboard-summary-lbl">Life Stage</span>
                        <span className="onboard-summary-val">{careerStage}</span>
                      </div>
                      <div className="onboard-summary-item">
                        <span className="onboard-summary-lbl">Financial Level</span>
                        <span className="onboard-summary-val">{cleanFinancialLevel}</span>
                      </div>
                      <div className="onboard-summary-item">
                        <span className="onboard-summary-lbl">Baseline FinScore</span>
                        <span className="onboard-summary-val text-violet-700 font-bold">500</span>
                      </div>
                    </div>

                    {/* Secondary Navigation Links */}
                    <div className="onboard-step5-footer-links">
                      <button
                        type="button"
                        className="onboard-link-dashboard"
                        onClick={handleGoDashboard}
                      >
                        Or go directly to Dashboard →
                      </button>
                      <button
                        type="button"
                        className="onboard-link-back-subtle"
                        onClick={() => setStep(4)}
                      >
                        ← Edit topics
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Navigation Buttons for Steps 1-4 */}
          {!isCurating && step < 5 && (
            <div className="onboard-btn-row">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="onboard-btn-back"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={saving}
                className="onboard-btn-continue"
              >
                {saving ? "Saving..." : "Continue →"}
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL: THE LIVING WEALTH GARDEN + EDITORIAL QUOTE ── */}
        <div
          className="onboard-right-panel bg-gradient-to-br from-emerald-50/70 via-orange-50/30 to-amber-50/50 p-8 sm:p-10 flex flex-col justify-between border-l border-slate-100 rounded-r-3xl relative overflow-hidden"
          aria-label="Living Wealth Garden"
        >
          {/* Subtle Ambient Orbs */}
          <div className="garden-orb garden-orb--emerald" />
          <div className="garden-orb garden-orb--amber" />

          {/* A. Top Status Header */}
          <div className="garden-status-header">
            <span className="garden-stage-badge">
              {STAGE_BADGES[step]}
            </span>
            <span className="garden-streak-pill">
              🔥 Day 1 Streak
            </span>
          </div>

          {/* B. Center: Dynamic Animated Plant Canvas (Polished & Organic SVG) */}
          <div className="garden-canvas-wrap">
            {/* Floating micro-chips beside plant */}
            <div className="garden-chip-float garden-chip-float--left">
              500 FinScore
            </div>
            <div className="garden-chip-float garden-chip-float--right">
              10 Mins / Day
            </div>

            {/* Floating interest tags picked on the left (Step 4 & 5) */}
            {step >= 4 && selectedInterests.length > 0 && (
              <div className="garden-floating-interests" aria-label="Picked Topics">
                {selectedInterests.slice(0, 3).map((item, idx) => (
                  <span
                    key={item}
                    className={`garden-chip-interest garden-chip-interest--${idx}`}
                  >
                    ✨ {item}
                  </span>
                ))}
              </div>
            )}

            {/* Organic Plant SVG */}
            <svg
              className={`garden-plant-svg ${step >= 3 ? "sway-animation" : ""}`}
              viewBox="0 0 260 230"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Pot Body Gradient with Soft Ceramic Lighting */}
                <linearGradient id="potGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="65%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>
                {/* Brand Stripe Gradient */}
                <linearGradient id="rimGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fa7516" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                {/* Organic Botanical Leaf Gradients */}
                <linearGradient id="leafGrad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#15803d" />
                </linearGradient>
                <linearGradient id="leafGrad2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#86efac" />
                  <stop offset="50%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
                <radialGradient id="flowerGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="45%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ea580c" />
                </radialGradient>
                <filter id="seedGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ── Pot & Soil Base ── */}
              {/* Soft Drop Shadow under Pot */}
              <ellipse cx="130" cy="222" rx="46" ry="5.5" fill="rgba(15, 23, 42, 0.08)" />

              {/* Flared Ceramic Pot Body */}
              <path
                d="M 82 172 L 178 172 C 176 195, 169 216, 164 219 L 96 219 C 91 216, 84 195, 82 172 Z"
                fill="url(#potGrad)"
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />

              {/* Dynamic Handle Badge on Pot */}
              <g transform="translate(130, 198)">
                <rect x="-40" y="-9" width="80" height="18" rx="9" fill="rgba(255, 255, 255, 0.95)" stroke="#e2e8f0" strokeWidth="1" />
                <text
                  x="0"
                  y="3.5"
                  textAnchor="middle"
                  fontSize="9.5"
                  fontWeight="800"
                  fill="#fa7516"
                  letterSpacing="0.03em"
                >
                  @{currentHandle.length > 11 ? `${currentHandle.slice(0, 10)}…` : currentHandle}
                </text>
              </g>

              {/* Pot Rim with Accent Stripe */}
              <rect
                x="76"
                y="164"
                width="108"
                height="10"
                rx="5"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />
              <rect x="88" y="168" width="84" height="2" rx="1" fill="url(#rimGrad)" />

              {/* Organic Soil Bed */}
              <ellipse cx="130" cy="165" rx="44" ry="6.5" fill="#334155" />
              <ellipse cx="130" cy="165" rx="38" ry="4.5" fill="#1e293b" />

              {/* ── Plant Stage 1: Golden Seed & Tiny Curved Sprout ── */}
              {step === 1 && (
                <g className="animate-in fade-in zoom-in-75 duration-300">
                  {/* Glowing Golden Seed */}
                  <ellipse
                    cx="130"
                    cy="165"
                    rx="7.5"
                    ry="5"
                    fill="#f59e0b"
                    filter="url(#seedGlow)"
                  />
                  <ellipse cx="130" cy="164" rx="4.5" ry="3" fill="#fef08a" />
                  {/* Delicate Sprout Tip */}
                  <path
                    d="M 130 163 C 130 152, 134 147, 137 142 C 139 146, 135 155, 132 163 Z"
                    fill="#22c55e"
                  />
                  <circle cx="137" cy="142" r="2" fill="#86efac" />
                </g>
              )}

              {/* ── Plant Stage 2: Tapered Stem + 2 Curved Leaves (Scale-up) ── */}
              {step === 2 && (
                <g className="animate-in fade-in zoom-in-90 duration-300">
                  {/* Organic Curved Stem */}
                  <path
                    d="M 130 165 C 128 145, 131 128, 130 112"
                    stroke="#15803d"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Left Leaf with Natural Curvature */}
                  <path
                    d="M 129 136 C 108 132, 98 116, 102 108 C 112 110, 122 122, 129 136 Z"
                    fill="url(#leafGrad1)"
                  />
                  {/* Right Leaf with Natural Curvature */}
                  <path
                    d="M 130 128 C 150 124, 160 110, 156 102 C 146 104, 136 118, 130 128 Z"
                    fill="url(#leafGrad2)"
                  />
                  {/* Sprout Tip */}
                  <circle cx="130" cy="111" r="3" fill="#4ade80" />
                </g>
              )}

              {/* ── Plant Stage 3: Sturdier Stem + 4 Lush Leaves (Swaying) ── */}
              {step === 3 && (
                <g className="animate-in fade-in zoom-in-95 duration-300">
                  {/* Organic Sturdy Stem */}
                  <path
                    d="M 130 165 C 126 135, 132 105, 130 80"
                    stroke="#15803d"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Lower Left Leaf */}
                  <path
                    d="M 128 144 C 102 140, 90 122, 94 112 C 106 114, 120 128, 128 144 Z"
                    fill="url(#leafGrad1)"
                  />
                  {/* Lower Right Leaf */}
                  <path
                    d="M 129 132 C 154 126, 166 108, 162 98 C 148 100, 136 118, 129 132 Z"
                    fill="url(#leafGrad2)"
                  />
                  {/* Upper Left Leaf */}
                  <path
                    d="M 128 108 C 110 102, 102 86, 106 78 C 116 82, 124 94, 128 108 Z"
                    fill="url(#leafGrad1)"
                  />
                  {/* Upper Right Leaf */}
                  <path
                    d="M 130 98 C 148 92, 156 76, 150 68 C 140 72, 134 86, 130 98 Z"
                    fill="url(#leafGrad2)"
                  />
                  {/* Growing Tip */}
                  <circle cx="130" cy="80" r="3.5" fill="#86efac" />
                </g>
              )}

              {/* ── Plant Stage 4: Bushy Foliage + Opening Bud ── */}
              {step === 4 && (
                <g className="animate-in fade-in zoom-in-95 duration-300">
                  {/* Thick Organic Stem */}
                  <path
                    d="M 130 165 C 125 125, 132 90, 130 66"
                    stroke="#15803d"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Tiered Lush Leaves */}
                  <path
                    d="M 128 145 C 98 142, 84 118, 90 106 C 104 108, 120 128, 128 145 Z"
                    fill="url(#leafGrad1)"
                  />
                  <path
                    d="M 129 134 C 158 128, 172 104, 166 94 C 150 96, 136 118, 129 134 Z"
                    fill="url(#leafGrad2)"
                  />
                  <path
                    d="M 128 106 C 104 98, 94 78, 100 68 C 112 72, 122 88, 128 106 Z"
                    fill="url(#leafGrad1)"
                  />
                  <path
                    d="M 130 96 C 154 88, 162 70, 156 60 C 144 64, 136 80, 130 96 Z"
                    fill="url(#leafGrad2)"
                  />
                  {/* Golden Emerging Bud */}
                  <ellipse cx="130" cy="62" rx="9" ry="12" fill="#f59e0b" />
                  <ellipse cx="130" cy="61" rx="5.5" ry="9" fill="#fef08a" />
                  <path
                    d="M 125 70 C 123 62, 126 56, 130 52 C 134 56, 137 62, 135 70 Z"
                    fill="#fa7516"
                  />
                </g>
              )}

              {/* ── Plant Stage 5: Full Blooming Sunflower with Confetti & Glow ── */}
              {step === 5 && (
                <g className="animate-in fade-in zoom-in duration-300">
                  {/* Sturdy Stem */}
                  <path
                    d="M 130 165 C 126 120, 131 85, 130 58"
                    stroke="#15803d"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Lush Foliage Leaves */}
                  <path
                    d="M 128 142 C 96 140, 82 116, 88 102 C 102 104, 120 124, 128 142 Z"
                    fill="url(#leafGrad1)"
                  />
                  <path
                    d="M 130 130 C 160 124, 174 100, 168 88 C 152 90, 136 112, 130 130 Z"
                    fill="url(#leafGrad2)"
                  />
                  <path
                    d="M 128 98 C 100 88, 92 68, 98 56 C 112 60, 122 80, 128 98 Z"
                    fill="url(#leafGrad1)"
                  />
                  <path
                    d="M 130 88 C 158 78, 168 58, 160 46 C 146 50, 136 70, 130 88 Z"
                    fill="url(#leafGrad2)"
                  />

                  {/* Golden Blooming Flower Petals with Pulse & Particles */}
                  <g className="bloom-glow-animation animate-pulse">
                    {/* Outer Petals */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                      <ellipse
                        key={deg}
                        cx="130"
                        cy="55"
                        rx="6.5"
                        ry="18"
                        fill="#fbbf24"
                        transform={`rotate(${deg} 130 55)`}
                      />
                    ))}
                    {/* Inner Petals */}
                    {[15, 45, 75, 105, 135, 165, 195, 225, 255, 285, 315, 345].map((deg) => (
                      <ellipse
                        key={deg}
                        cx="130"
                        cy="55"
                        rx="5"
                        ry="13"
                        fill="#f59e0b"
                        transform={`rotate(${deg} 130 55)`}
                      />
                    ))}
                    {/* Flower Center Core */}
                    <circle cx="130" cy="55" r="12" fill="url(#flowerGlow)" />
                    <circle cx="130" cy="55" r="8.5" fill="#78350f" />
                    <circle cx="130" cy="55" r="5" fill="#451a03" />

                    {/* Confetti & Particle Sparks */}
                    <circle cx="72" cy="42" r="2.5" fill="#f59e0b" />
                    <circle cx="184" cy="38" r="2" fill="#22c55e" />
                    <circle cx="176" cy="85" r="2" fill="#fa7516" />
                    <circle cx="82" cy="88" r="1.5" fill="#3b82f6" />
                    <text x="80" y="42" fontSize="13" fill="#f59e0b">✦</text>
                    <text x="172" y="36" fontSize="11" fill="#fbbf24">✦</text>
                    <text x="156" y="82" fontSize="10" fill="#fa7516">✦</text>
                  </g>
                </g>
              )}
            </svg>
          </div>

          {/* C. Editorial Wisdom Card */}
          <div className="garden-editorial-card bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/60 shadow-sm transition-all">
            <div className="garden-quote-mark">“</div>
            <p className="garden-quote-text">
              {EDITORIAL_QUOTES[step]}
            </p>
            <span className="garden-quote-author">— FinEd Editorial Philosophy</span>
          </div>

          {/* D. Bottom Social Proof Strip */}
          <div className="garden-social-strip border-t border-slate-200/60 pt-3 flex items-center justify-between text-xs">
            <div className="garden-avatar-stack flex items-center">
              <div className="garden-avatar-circle garden-avatar-circle--orange">RK</div>
              <div className="garden-avatar-circle garden-avatar-circle--blue">AM</div>
              <div className="garden-avatar-circle garden-avatar-circle--emerald">SP</div>
            </div>
            <span className="garden-social-text text-slate-600 font-medium">
              Joined by 2,000+ curious learners building daily discipline.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
