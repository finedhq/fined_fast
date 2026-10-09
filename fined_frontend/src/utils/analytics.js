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
