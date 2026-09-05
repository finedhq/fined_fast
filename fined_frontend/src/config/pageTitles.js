export const DEFAULT_TITLE = "FinEd - Financial Education Made Simple";

export const STATIC_ROUTE_TITLES = {
  "/": DEFAULT_TITLE,
  "/courses": "Courses | FinEd",
  "/articles": "Articles | FinEd",
  "/about": "About Us | FinEd",
  "/contact": "Contact Us | FinEd",
  "/feedback": "Feedback | FinEd",
  "/dashboard": "Dashboard | FinEd",
  "/fin-tools": "Financial Tools | FinEd",
  "/fin-tools/expensetracker": "Expense Tracker | FinEd",
  "/policies": "Policies & Schemes | FinEd",
  "/notifications": "Notifications | FinEd",
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
