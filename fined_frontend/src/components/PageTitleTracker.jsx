
import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { getTitleForPath, getCanonicalForPath } from "../config/pageTitles";

/**
 * PageTitleTracker — Automatically syncs document.title and the canonical link for static routes upon navigation.
 * Place this once inside <BrowserRouter> alongside <ScrollToTop>.
 */
export default function PageTitleTracker() {
  const { pathname } = useLocation();
  const setCanonicalRef = useRef(null);

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
  }, [pathname]);

  return null;
}
