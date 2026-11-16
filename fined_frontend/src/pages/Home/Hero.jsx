// The landing page (/). Signed-in visitors go straight to their dashboard.
// Top to bottom: hero (Module 1 playing itself) → learner count → "most
// people never learned about money" + topics → the four features (from the
// original page) → the course carousel (original page) → articles → the
// experts → what learners say → the end.
// Module 1, the articles and the authors are loaded once here and handed down;
// a section whose data can't be loaded simply isn't shown.
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { fetchArticles, fetchAuthors, getSampleModule } from "../../services/api";
import HeroSection from "./sections/HeroSection";
import LearnersStrip from "./sections/LearnersStrip";
import StorySection from "./sections/StorySection";
import FeaturesSection from "./sections/FeaturesSection";
import CoursesSection from "./sections/CoursesSection";
import ArticlesSection from "./sections/ArticlesSection";
import ExpertsSection from "./sections/ExpertsSection";
import TestimonialsSection from "./sections/TestimonialsSection";
import FinalCta from "./sections/FinalCta";
import FloatingWhatsAppButton from "../../components/Community/FloatingWhatsAppButton";
import WinterArcPopup from "../WinterArc/WinterArcPopup";
import "./landing.css";

export default function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth0();
  const [sampleModule, setSampleModule] = useState(null);
  const [articles, setArticles] = useState([]);
  const [authors, setAuthors] = useState([]);

  useEffect(() => {
    // Signed-in visitors skip the home page. But not while Auth0 is finishing a
    // sign-in here: Auth0ProviderWithNavigate is sending them back to where they
    // started (returnTo). React Router renders that move a beat later than the
    // address bar changes, so this page can still be showing; redirecting now
    // would win the race and drop them on the dashboard instead.
    const params = new URLSearchParams(window.location.search);
    const finishingSignIn = params.has("code") && params.has("state");
    const leaving = window.location.pathname !== "/";
    if (!isLoading && isAuthenticated && !finishingSignIn && !leaving) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    let cancelled = false;
    getSampleModule()
      .then((data) => !cancelled && setSampleModule(data))
      .catch(() => {});
    fetchArticles({ limit: 10, offset: 0 })
      .then((data) => !cancelled && setArticles(Array.isArray(data) ? data : data?.articles || []))
      .catch(() => {});
    fetchAuthors()
      .then((data) => !cancelled && setAuthors(Array.isArray(data) ? data : data?.authors || []))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="lp">
      <HeroSection bundle={sampleModule} />
      {!isAuthenticated && <WinterArcPopup />}
      <LearnersStrip />
      <StorySection />
      <FeaturesSection />
      <CoursesSection />
      <ArticlesSection articles={articles} />
      <ExpertsSection authors={authors} />
      <TestimonialsSection />
      <FinalCta />
      <FloatingWhatsAppButton />
    </div>
  );
}
