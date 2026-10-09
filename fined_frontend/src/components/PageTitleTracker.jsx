
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getTitleForPath, getCanonicalForPath, getDescriptionForPath } from "../config/pageTitles";

// Read before React mounts, so a page that sets its own description on first load can't become the "default".
const DEFAULT_DESCRIPTION =
  typeof document !== "undefined"
    ? document.head.querySelector('meta[name="description"]')?.getAttribute("content") ?? null
    : null;

/**
 * PageTitleTracker — Automatically syncs document.title, the canonical link and the meta description
 * for static routes upon navigation.
 * Place this once inside <BrowserRouter> alongside <ScrollToTop>.
 */
export default function PageTitleTracker() {
  const { pathname } = useLocation();
  const setCanonicalRef = useRef(null);
  const setDescriptionRef = useRef(null);

  useEffect(() => {
    const title = getTitleForPath(pathname);
    if (title) {
      document.title = title;
    }

    const canonicalUrl = getCanonicalForPath(pathname);
    let tag = document.head.querySelector('link[rel="canonical"]');
    if (canonicalUrl) {
      if (!tag) {
        tag = document.createElement("link");
        tag.setAttribute("rel", "canonical");
        document.head.appendChild(tag);
      }
      tag.setAttribute("href", canonicalUrl);
      setCanonicalRef.current = canonicalUrl;
    } else {
      // Only remove a canonical this component set; article pages manage their own.
      if (tag && setCanonicalRef.current && tag.getAttribute("href") === setCanonicalRef.current) {
        tag.parentNode.removeChild(tag);
      }
      setCanonicalRef.current = null;
    }

    const description = getDescriptionForPath(pathname);
    const descTag = document.head.querySelector('meta[name="description"]');
    if (descTag) {
      if (description) {
        descTag.setAttribute("content", description);
        setDescriptionRef.current = description;
      } else {
        // Only put the default back if this component set the current value; article pages manage their own.
        if (
          DEFAULT_DESCRIPTION !== null &&
          setDescriptionRef.current &&
          descTag.getAttribute("content") === setDescriptionRef.current
        ) {
          descTag.setAttribute("content", DEFAULT_DESCRIPTION);
        }
        setDescriptionRef.current = null;
      }
    }
  }, [pathname]);

  return null;
}
