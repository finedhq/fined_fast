import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getTitleForPath } from "../config/pageTitles";

/**
 * PageTitleTracker — Automatically syncs document.title for static routes upon navigation.
 * Place this once inside <BrowserRouter> alongside <ScrollToTop>.
 */
export default function PageTitleTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    const title = getTitleForPath(pathname);
    if (title) {
      document.title = title;
    }
  }, [pathname]);

  return null;
}
