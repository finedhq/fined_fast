import { useEffect, useRef } from "react";
import { DEFAULT_TITLE } from "../config/pageTitles";

/**
 * Custom hook to dynamically update document.title
 * @param {string} title - The page-specific title to set
 * @param {Object} options
 * @param {boolean} options.retainOnUnmount - Whether to keep the title after unmounting
 * @param {string} options.fallback - Fallback title while waiting for async data
 */
export function useDocumentTitle(title, options = {}) {
  const { retainOnUnmount = false, fallback = DEFAULT_TITLE } = options;
  const previousTitleRef = useRef(document.title);

  useEffect(() => {
    previousTitleRef.current = document.title;
  }, []);

  useEffect(() => {
    const activeTitle = title || fallback;
    if (!activeTitle) return;

    const formattedTitle = activeTitle.includes("FinEd")
      ? activeTitle
      : `${activeTitle} | FinEd`;

    document.title = formattedTitle;

    return () => {
      if (!retainOnUnmount) {
        document.title = previousTitleRef.current || DEFAULT_TITLE;
      }
    };
  }, [title, fallback, retainOnUnmount]);
}

export default useDocumentTitle;
