import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiAperture } from "react-icons/fi";
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
  customQuestions = null,
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
  const [, setError] = useState("");
  const [nudging, setNudging] = useState(false);
  const nudgedRef = useRef(false);

  // Once the reader has scrolled a little way into the article, the intro card
  // lifts once to point them at the lens. Only once per visit, only on the intro.
  useEffect(() => {
    if (!isEnabled || viewState !== "intro" || nudgedRef.current) return undefined;
    let timer;
    const onScroll = (e) => {
      const t = e.target;
      if (t instanceof Element && t.closest(".pl-container")) return; // scrolling inside the lens itself
      const top = t instanceof Element ? t.scrollTop : window.scrollY;
      if (top < 600) return;
      nudgedRef.current = true;
      document.removeEventListener("scroll", onScroll, true);
      setNudging(true);
      timer = setTimeout(() => setNudging(false), 2600);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      clearTimeout(timer);
    };
  }, [isEnabled, viewState]);

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
    } catch {
      // storage blocked (private mode): nothing to clear
    }
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
    } catch {
      navigate(`/articles`);
    }
  };

  const header = (subtitle, markClass = "") => (
    <div className="pl-top-bar">
      <span className={`pl-brand-mark ${markClass}`.trim()} aria-hidden="true">
        <FiAperture />
      </span>
      <div>
        <h2 className="pl-brand-title">Personal Lens</h2>
        <p className="pl-brand-subtitle" key={subtitle}>{subtitle}</p>
      </div>
    </div>
  );

  if (!isEnabled) {
    return (
      <div className="pl-container" data-lenis-prevent="true">
        <div className="pl-inner-card">
          {header("Read any article your way", "is-muted")}
          <div className="pl-intro-body">
            <h3 className="pl-intro-heading">Not on this article yet</h3>
            <p className="pl-intro-desc">
              Personal Lens points you to the parts of an article that matter most for you, with a takeaway in
              plain words. It's on selected articles for now and coming to the rest soon.
            </p>
            <button type="button" className="pl-secondary-btn" onClick={handleGoToLatest}>
              <span>Try it on the latest article</span>
              <FiArrowRight className="pl-start-btn-icon" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const SUBTITLES = {
    intro: "Read this article your way",
    questionnaire: "A few quick questions",
    generating: "Almost ready",
    result: "Made for your answers",
  };
  const subtitle = SUBTITLES[viewState] || SUBTITLES.intro;

  return (
    <div
      className={`pl-container is-${viewState}${nudging ? " is-nudging" : ""}`}
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
    >
      <div className="pl-inner-card">
        {header(subtitle, viewState === "generating" ? "is-working" : "")}

        {viewState === "intro" && (
          <div className="pl-intro-body">
            <h3 className="pl-intro-heading">
              Make this article <span className="pl-mark">about you</span>
            </h3>
            <p className="pl-intro-desc">
              Answer {questions.length} quick questions and we'll show you what to focus on, based on where you are
              with money right now.
            </p>

            <span className="pl-label">You'll get</span>
            <ol className="pl-get-list">
              <li className="pl-get-item"><span className="pl-get-num">1</span>Why this matters to you</li>
              <li className="pl-get-item"><span className="pl-get-num">2</span>Which sections to read first</li>
              <li className="pl-get-item"><span className="pl-get-num">3</span>One thing to remember</li>
            </ol>

            <button type="button" className="pl-start-btn" onClick={handleStart}>
              <span>Personalize this article</span>
              <FiArrowRight className="pl-start-btn-icon" />
            </button>
            <p className="pl-intro-meta">Takes about 20 seconds</p>
          </div>
        )}

        {viewState === "questionnaire" && (
          <LensQuestionnaire
            questions={questions}
            currentIndex={stepIndex}
            answers={answers}
            onSelectOption={handleSelectOption}
            onPrevStep={handlePrevStep}
          />
        )}

        {viewState === "generating" && <GeneratingLens />}

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
