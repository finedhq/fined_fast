export const DEFAULT_TITLE = "FinEd: Learn Personal Finance & Investing in India";

export const STATIC_ROUTE_DESCRIPTIONS = {
  "/": "Clear, practical finance explainers, market insights and bite-sized courses on investing, UPI, IPOs and personal finance in India.",
  "/articles": "Plain-English explainers on investing, IPOs, UPI, taxes and the Indian economy, from quick reads to deep dives by the FinEd team.",
  "/courses": "Learn investing and personal finance step by step with short, interactive FinEd courses made for Indian learners.",
  "/about": "FinEd breaks down complex financial topics into simple, bite-sized lessons so you can make confident money decisions.",
  "/contact": "Questions or feedback about FinEd? Get in touch with our team.",
  "/feedback": "Share your experience with FinEd and help us improve our articles, courses and platform.",
  "/help": "Help and support for using FinEd's articles, courses and account features.",
  "/privacy-policy": "How FinEd collects, uses and protects your personal data.",
  "/termsofservice": "The terms of service for using FinEd's website, articles and courses.",
};

const TAG_NAMES = {
  "personal-finance": "Personal Finance",
  "ipo": "IPO",
  "investing": "Investing",
  "deep-dives": "Deep Dives",
  "economy": "Economy",
};

export const STATIC_ROUTE_TITLES = {
  "/": DEFAULT_TITLE,
  "/courses": "Courses | FinEd",
  "/articles": "Articles | FinEd",
  "/about": "About Us | FinEd",
  "/contact": "Contact Us | FinEd",
  "/feedback": "Feedback | FinEd",
  "/dashboard": "Dashboard | FinEd",
  "/notifications": "Notifications | FinEd",
  "/leaderboard": "Leaderboard | FinEd",
  "/help": "Help & Support | FinEd",
  "/privacy-policy": "Privacy Policy | FinEd",
  "/termsofservice": "Terms of Service | FinEd",
  "/admin": "Admin Dashboard | FinEd",
  "/admin/articles": "Manage Articles | FinEd Admin",
  "/admin/articles/add": "Add Article | FinEd Admin",
  "/admin/newsletters": "Newsletters | FinEd Admin",
  "/admin/courses": "Manage Courses | FinEd Admin",
  "/admin/courses/add": "Add Course | FinEd Admin",
  "/admin/cards/add": "Add Card | FinEd Admin",
};

const SITE_ORIGIN = "https://myfined.com";

const CANONICAL_STATIC_PATHS = new Set([
  "/", "/courses", "/articles", "/about", "/contact", "/feedback",
  "/help", "/privacy-policy", "/termsofservice",
]);

/**
 * Returns the canonical URL for public pages whose canonical is not set by a component
 * (trailing slash dropped), or null for everything else (articles set their own).
 */
export function getCanonicalForPath(pathname) {
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (
    CANONICAL_STATIC_PATHS.has(cleanPath) ||
    /^\/(tags|authors|courses)\/[^/]+$/.test(cleanPath)
  ) {
    return `${SITE_ORIGIN}${cleanPath}`;
  }
  return null;
}

/**
 * Returns the meta description for static public pages and known tag pages,
 * or null when a component sets its own (articles) or the site default applies.
 */
export function getDescriptionForPath(pathname) {
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  if (STATIC_ROUTE_DESCRIPTIONS[cleanPath]) {
    return STATIC_ROUTE_DESCRIPTIONS[cleanPath];
  }
  const tagMatch = cleanPath.match(/^\/tags\/([^/]+)$/);
  if (tagMatch && TAG_NAMES[tagMatch[1]]) {
    return `${TAG_NAMES[tagMatch[1]]} explainers and guides from FinEd: clear, practical finance articles for India.`;
  }
  return null;
}

/**
 * Returns a static title if mapped, or a derived fallback title for known patterns.
 * Returns null if the route title is fully managed dynamically by the component (e.g. articles).
 */
export function getTitleForPath(pathname) {
  // Normalize trailing slashes
  const cleanPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;

  if (STATIC_ROUTE_TITLES[cleanPath]) {
    return STATIC_ROUTE_TITLES[cleanPath];
  }

  // Admin module paths
  if (/^\/admin\/courses\/[^/]+\/modules\/add$/.test(cleanPath)) {
    return "Add Course Module | FinEd Admin";
  }
  if (/^\/admin\/courses\/[^/]+\/modules$/.test(cleanPath)) {
    return "Course Modules | FinEd Admin";
  }

  // Dynamic routes (defer to component or provide sensible initial fallback)
  if (/^\/courses\/[^/]+$/.test(cleanPath)) {
    return null; // Managed by CourseOverview
  }
  if (/^\/cards\/[^/]+$/.test(cleanPath)) {
    return null; // Managed by CardViewer
  }
  if (/^\/articles\/[^/]+$/.test(cleanPath)) {
    return null; // Managed by ArticleReader
  }
  if (/^\/tags\/[^/]+/.test(cleanPath)) {
    return null; // Managed by TagArticlesPage
  }
  if (/^\/authors\/[^/]+/.test(cleanPath)) {
    return null; // Managed by AuthorPage
  }

  return null;
}
