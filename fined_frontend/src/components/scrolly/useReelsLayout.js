// Whether the module page uses its phone layout, Reels (scrolly-reels.css):
// at 960 px or narrower — the width where the page already goes to one
// column — and never in the admin's embedded card preview.
import { useEffect, useState } from "react";

const QUERY = "(max-width: 960px)";

export default function useReelsLayout(disabled) {
  const [narrow, setNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return !disabled && narrow;
}
