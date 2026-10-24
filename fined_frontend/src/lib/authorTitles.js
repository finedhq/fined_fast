// Author job titles and the co-founder slugs, shared by the landing page's
// experts section and the About page so both say the same thing.

// The two co-founders: shown in their own section, never among the experts.
export const FOUNDER_SLUGS = new Set(["anish-pujari", "shravan-mutha"]);

// Titles as written for the old landing page's authors strip.
export const AUTHOR_TITLES = {
  "shishir-bhartia": "Directional Strategy Consultant, Ex Head Times Group Alliances and Brand Capital West",
  "deepan-datta": "Investment Writer",
  "dharsana-gandhi-r": "Finance Professional",
  madhvendra: "Finance Writer",
  "puja-tayal": "Financial Writer & Equity Analyst",
};

export const DEFAULT_AUTHOR_TITLE = "Writer at FinEd";

const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
const letters = (s) => clean(s).replace(/[^a-z]/gi, "").toLowerCase();

// The short text to show under an author's name. Some bios just repeat the
// title; then the longer description reads better.
export function authorBlurb(author, title) {
  const bio = clean(author?.bio);
  if (bio && letters(bio) !== letters((title || "").replace(",", ""))) return bio;
  return clean(author?.description);
}
