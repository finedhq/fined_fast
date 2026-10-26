// Stand-in for the 'firebase/analytics' browser library (app build only, via vite.config.app.js).
// @capacitor-firebase/analytics imports it for its *browser* version, which the Android app never
// runs: on the phone the plugin talks to the native Firebase SDK. This avoids bundling Google's
// whole Firebase JS SDK for a code path that can't be reached. The website doesn't use this plugin.
const unavailable = () => {
  throw new Error('Firebase Analytics browser version is not included in the FinEd app');
};

export const getAnalytics = unavailable;
export const logEvent = unavailable;
export const setAnalyticsCollectionEnabled = unavailable;
export const setConsent = unavailable;
export const setUserId = unavailable;
export const setUserProperties = unavailable;
