// Public: Module 1 of the stock-market course for visitors without an account
// (linked from the landing page). Drawn exactly like the real module page, but
// nothing is saved; the completion's "Up next" box asks them to sign up.
import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { getSampleModule } from "../../services/api";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import ModuleLoader from "../CoursesPage/CardViewer/ModuleLoader";
import "../CoursesPage/CardViewer/CardViewer.css";

const ScrollyModulePage = lazy(() => import("../../components/scrolly/ScrollyModulePage"));

export default function TryModule() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const [bundle, setBundle] = useState(null);
  const [error, setError] = useState("");

  useDocumentTitle(bundle?.module_title ? `${bundle.module_title} | FinEd` : "Try a module | FinEd");

  useEffect(() => {
    let cancelled = false;
    getSampleModule()
      .then((data) => !cancelled && setBundle(data))
      .catch((err) => !cancelled && setError(err.message || "Failed to load the module."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="cv-status">
        <p>{error}</p>
        <Link to="/">Back to home</Link>
      </div>
    );
  }
  if (!bundle) return <ModuleLoader />;

  const coursePage = bundle.course_slug ? `/courses/${bundle.course_slug}` : "/courses";
  return (
    <Suspense fallback={<ModuleLoader />}>
      <ScrollyModulePage
        bundle={bundle}
        preview
        backTo={isAuthenticated ? coursePage : "/"}
        onSignup={isAuthenticated ? undefined : () => loginWithRedirect({ appState: { returnTo: coursePage } })}
      />
    </Suspense>
  );
}
