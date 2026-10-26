/**
 * Google Tag Manager & Google Analytics 4 event tracking helper
 */

export const trackEvent = (eventName, params = {}) => {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }
};

/**
 * Track user login / authentication
 * @param {string} method - 'auth0', 'email', etc.
 */
export const trackAuthLogin = (method = "auth0") => {
  trackEvent("user_login", {
    method,
  });
};

// Remembers in this browser that a once-only event was sent. Storage can be
// blocked (private mode), so failures just mean "not remembered".
const sentOnce = (key) => {
  try {
    if (localStorage.getItem(key)) return true;
    localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
  return false;
};

/** Auth0 user id prefix -> sign-up method ("google-oauth2|..." -> "google"). */
export const signupMethod = (userSub = "") => {
  if (userSub.startsWith("google-oauth2|")) return "google";
  if (userSub.startsWith("auth0|") || userSub.startsWith("email|")) return "email";
  return userSub.split("|")[0] || "unknown";
};

/**
 * Track a new account, once per user in this browser.
 * @param {string} userSub - Auth0 user id
 */
export const trackSignUp = (userSub) => {
  if (!userSub || sentOnce(`fined_ga_sign_up_${userSub}`)) return;
  trackEvent("sign_up", { method: signupMethod(userSub) });
};

/**
 * Track a learner's first saved progress in a course. The server decides it is
 * the first (first_in_course); the browser check stops parallel saves doubling it.
 * @param {string} courseSlug
 */
export const trackCourseStart = (courseSlug) => {
  if (!courseSlug || sentOnce(`fined_ga_course_start_${courseSlug}`)) return;
  trackEvent("course_start", { course_slug: courseSlug });
};

/**
 * Track lead / feedback form submission
 * @param {'feedback' | 'contact'} formType
 * @param {object} extra
 */
export const trackFormSubmission = (formType, extra = {}) => {
  trackEvent("form_submission", {
    form_type: formType,
    ...extra,
  });
};

/**
 * Track social / article sharing
 * @param {string} platform - 'whatsapp' | 'twitter' | 'linkedin' | 'copy_link' | 'native'
 * @param {string} articleTitle
 */
export const trackArticleShare = (platform, articleTitle) => {
  trackEvent("article_share", {
    platform,
    article_title: articleTitle,
  });
};
