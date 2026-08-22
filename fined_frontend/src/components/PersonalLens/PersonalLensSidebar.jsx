import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiZap, FiLayers, FiCheckCircle, FiCpu } from "react-icons/fi";
import { IoSparkles } from "react-icons/io5";
import LensQuestionnaire from "./LensQuestionnaire";
import GeneratingLens from "./GeneratingLens";
import LensResultCard from "./LensResultCard";
import { DEMO_QUESTIONS } from "../../lib/demoArticle";
import { fetchPersonalLens, fetchArticleQuestions, fetchArticles } from "../../services/api";
import { hasAiLens } from "../../utils/textFormatters";
import "./PersonalLens.css";

export default function PersonalLensSidebar({
  article = null,
  articleId = "",
  articleTitle = "",
  articleTag = "",
  customQuestions = null,
  isMobileDrawer = false,
  onCloseDrawer = null,
}) {
  const navigate = useNavigate();
  const isEnabled = article ? hasAiLens(article) : false;

  const storageKey = `fined-personal-lens-${articleId || (article?.slug || "general")}`;

  const [questions, setQuestions] = useState(customQuestions || DEMO_QUESTIONS);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [viewState, setViewState] = useState("intro"); // "intro" | "questionnaire" | "generating" | "result"
  const [lensData, setLensData] = useState(null);
  const [error, setError] = useState("");

  // Check localStorage and fetch dynamic questions on article change
  useEffect(() => {
    // 1. Check local storage
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.whyItMatters || parsed.why_it_matters)) {
          setLensData(parsed);
          setViewState("result");
        } else {
          setLensData(null);
          setViewState("intro");
        }
      } else {
        setLensData(null);
        setViewState("intro");
      }
    } catch (e) {
      console.warn("Could not parse saved personal lens from localStorage", e);
      setLensData(null);
      setViewState("intro");
    }

    setAnswers({});
    setStepIndex(0);

    if (customQuestions && customQuestions.length > 0) {
      setQuestions(customQuestions);
      return;
    }

    // 2. Fetch questions from backend for this article
    if (articleId && articleId !== "etf-101-guide" && articleId !== "understanding-etfs-exchange-traded-funds") {
      fetchArticleQuestions(articleId)
        .then((res) => {
          if (res && res.questions && res.questions.length > 0) {
            setQuestions(res.questions);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch questions from server", err);
        });
    } else {
      setQuestions(DEMO_QUESTIONS);
    }
  }, [articleId, customQuestions, storageKey]);

  const handleStart = () => {
    setStepIndex(0);
    setViewState("questionnaire");
  };

  const handleSelectOption = async (questionId, optionId, label, questionText) => {
    const updatedAnswers = {
      ...answers,
      [questionId]: {
        question: questionText || questionId,
        answer: label,
        label,
        question_id: questionId,
        option_id: optionId
      },
    };
    setAnswers(updatedAnswers);

    if (stepIndex < questions.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      // Completed all questions -> Trigger generation
      setViewState("generating");
      setError("");

      const formattedAnswers = Object.values(updatedAnswers).map((a) => ({
        question: a.question || a.question_id,
        answer: a.answer || a.label,
        label: a.label,
        question_id: a.question_id,
        option_id: a.option_id,
      }));

      try {
        const response = await fetchPersonalLens(articleId, formattedAnswers);
        const resultLens = response.lens || response;

        setLensData(resultLens);
        // Persist to localStorage
        localStorage.setItem(storageKey, JSON.stringify(resultLens));
        setViewState("result");
      } catch (err) {
        console.warn("Backend Personal Lens API failed, using client fallback", err);
        // Client fallback generation
        const fallbackLens = generateLocalFallbackLens(updatedAnswers, article?.title || articleTitle || "this topic");
        setLensData(fallbackLens);
        localStorage.setItem(storageKey, JSON.stringify(fallbackLens));
        setViewState("result");
      }
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 0) {
      setStepIndex((prev) => prev - 1);
    } else {
      setViewState("intro");
    }
  };

  const handleReset = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch (e) { }
    setAnswers({});
    setStepIndex(0);
    setLensData(null);
    setViewState("intro");

    if (articleId) {
      fetchArticleQuestions(articleId)
        .then((res) => {
          if (res && res.questions && res.questions.length > 0) {
            setQuestions(res.questions);
          }
        })
        .catch(console.warn);
    }
  };

  const handleGoToLatest = async () => {
    if (onCloseDrawer) onCloseDrawer();
    try {
      const data = await fetchArticles({ limit: 10, offset: 0 });
      const list = Array.isArray(data) ? data : (data?.articles || []);
      const target = list.find((a) => hasAiLens(a)) || list[0];
      if (target?.slug) {
        navigate(`/articles/${target.slug}`);
      } else {
        navigate(`/articles`);
      }
    } catch (e) {
      navigate(`/articles`);
    }
  };

  if (!isEnabled) {
    return (
      <div className="pl-container">
        <div className="pl-inner-card">
          {/* Integrated Minimal Top Bar */}
          <div className="pl-top-bar">
            <div className="pl-top-branding">
              <div className="pl-neon-indicator">
                <span className="pl-neon-dot" style={{ background: "#94a3b8", boxShadow: "none" }} />
              </div>
              <div>
                <div className="pl-brand-title">
                  <span>Personal Lens</span>
                  <span className="pl-brand-ai-tag" style={{ color: "#64748b", borderColor: "#cbd5e1", background: "#f1f5f9" }}>AI</span>
                </div>
                <p className="pl-brand-subtitle">Pre-Reading Companion</p>
              </div>
            </div>
            <span className="pl-status-pill disabled">
              Not Enabled
            </span>
          </div>

          {/* Disabled State Body */}
          <div className="pl-intro-body">
            <div className="pl-focus-lens-visual">
              <div className="pl-focus-lens-center" style={{ background: "#f8fafc", borderColor: "#e2e8f0", color: "#94a3b8", boxShadow: "none" }}>
                <IoSparkles size={18} />
              </div>
            </div>
            <h3 className="pl-intro-heading">
              Personal Lens Not Enabled
            </h3>
            <p className="pl-intro-desc">
              Personal Lens generates customized analogies, priority sections, and tailored takeaways for your background.
            </p>
            <p className="pl-intro-desc" style={{ fontSize: "12.5px", color: "#94a3b8", marginBottom: "20px" }}>
              This feature is currently available on selected articles and will roll out everywhere soon.
            </p>

            <button
              type="button"
              className="pl-start-btn"
              onClick={handleGoToLatest}
              style={{
                background: "#f8fafc",
                color: "#4f46e5",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
              }}
            >
              <span>Try on the latest article</span>
              <FiArrowRight className="pl-start-btn-icon" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pl-container">
      <div className="pl-inner-card">
        {/* Integrated Minimal Top Bar */}
        <div className="pl-top-bar">
          <div className="pl-top-branding">
            <div className="pl-neon-indicator">
              <span className="pl-neon-ping" />
              <span className="pl-neon-dot" />
            </div>
            <div>
              <div className="pl-brand-title">
                <span>Personal Lens</span>
                <span className="pl-brand-ai-tag">AI</span>
              </div>
              <p className="pl-brand-subtitle">Pre-Reading Companion</p>
            </div>
          </div>
          <span className="pl-status-pill">
            {viewState === "result" ? "Personalized" : "Ready"}
          </span>
        </div>

        {/* State 1: Intro Card */}
        {viewState === "intro" && (
          <div className="pl-intro-body">
            <div className="pl-focus-lens-visual">
              <div className="pl-focus-lens-ring" />
              <div className="pl-focus-lens-ring-2" />
              <div className="pl-focus-lens-center">
                <IoSparkles size={18} />
              </div>
            </div>
            <h3 className="pl-intro-heading">Make this article about you</h3>
            <p className="pl-intro-desc">
              Answer 4 quick questions (~20s) to get custom analogies, priority sections, and takeaways tailored to your background.
            </p>

            <div className="pl-feature-pills">
              <span className="pl-feature-pill">
                <FiCheckCircle size={11} />
                <span>Zero Jargon</span>
              </span>
              <span className="pl-feature-pill">
                <FiZap size={11} />
                <span>Key Analogies</span>
              </span>
              <span className="pl-feature-pill">
                <FiLayers size={11} />
                <span>Focus Sections</span>
              </span>
            </div>

            <button
              type="button"
              className="pl-start-btn"
              onClick={handleStart}
            >
              <span>Personalize Article</span>
              <FiArrowRight className="pl-start-btn-icon" />
            </button>
          </div>
        )}

        {/* State 2: 4-Step Questionnaire */}
        {viewState === "questionnaire" && (
          <LensQuestionnaire
            questions={questions}
            currentIndex={stepIndex}
            answers={answers}
            onSelectOption={handleSelectOption}
            onPrevStep={handlePrevStep}
          />
        )}

        {/* State 3: Generating */}
        {viewState === "generating" && (
          <GeneratingLens answers={answers} />
        )}

        {/* State 4: Tailored Result Takeaways */}
        {viewState === "result" && (
          <LensResultCard lens={lensData} onReset={handleReset} onClose={onCloseDrawer} />
        )}
      </div>
    </div>
  );
}

// Resilient local fallback in case network / API is unavailable
function generateLocalFallbackLens(answers, topic = "this topic") {
  const ansMap = {};
  Object.values(answers).forEach((a) => {
    ansMap[a.question_id] = (a.label || a.option_id || "").toLowerCase();
  });

  const familiarity = ansMap["familiarity"] || "";
  const motivation = ansMap["motivation"] || "";
  const habits = ansMap["habits"] || "";

  const isBeginner =
    familiarity.includes("never") ||
    motivation.includes("beginner") ||
    habits.includes("none") ||
    habits.includes("haven't");

  if (isBeginner) {
    return {
      whyItMatters:
        `Exploring financial concepts can feel overwhelming. This guide breaks down ${topic} into clear, foundational building blocks without unnecessary jargon.`,
      personalSummary:
        `Focus on the core fundamentals first. Understand the high-level principles of ${topic} before diving into complex formulas or edge cases.`,
      focusSections: [
        "Core Concepts & Foundational Principles",
        "Key Differences & Everyday Analogies",
        "Actionable Beginner Takeaways",
      ],
      takeaway:
        `Understand the practical rationale behind ${topic} and how it connects to your personal financial growth.`,
      whatToDo:
        "Note down the primary terms and concepts as you read through the article.",
    };
  }

  return {
    whyItMatters:
      `Since you already have exposure to financial concepts, this guide highlights nuanced mechanics, strategic considerations, and key trade-offs regarding ${topic}.`,
    personalSummary:
      `Examine practical application, structural trade-offs, and long-term strategic benefits for ${topic}.`,
    focusSections: [
      "Key Differences & Advanced Mechanics",
      "Cost Structures, Fees, and Nuances",
      "Strategic Implementation Steps",
    ],
    takeaway:
      `Evaluate how the principles of ${topic} align with your overall long-term financial strategy.`,
    whatToDo:
      "Compare the key trade-offs and implementation considerations against your existing knowledge.",
  };
}
