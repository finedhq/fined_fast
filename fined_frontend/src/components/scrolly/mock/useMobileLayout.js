// EXPERIMENTAL (mobile layout mock, 2026-10-13): which phone layout to try.
// Add ?layout=reels, ?layout=stories or ?layout=snap to a module URL and view it at phone
// width (≤ 960 px); wider screens always get the normal page.
import { useEffect, useState } from "react";

const QUERY = "(max-width: 960px)";
const LAYOUTS = ["reels", "stories", "snap"];

export default function useMobileLayout(disabled) {
  const wanted = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("layout");
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (disabled || !narrow || !LAYOUTS.includes(wanted)) return null;
  return wanted;
}
