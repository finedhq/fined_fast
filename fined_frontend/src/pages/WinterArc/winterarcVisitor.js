// What this browser knows about the visitor and WinterArc. Storage can be
// blocked (private mode); then everything reads as "not yet", which only
// means the popup may show when it didn't need to.

const JOINED_KEY = "fined_winterarc_joined_v1"; // localStorage: joined the waitlist
const SHOWN_KEY = "fined_winterarc_popup_shown"; // sessionStorage: popup shown this visit

const get = (store, key) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const set = (store, key, value) => {
  try {
    store.setItem(key, value);
  } catch {
    // ignore
  }
};

export const hasJoined = () => !!get(window.localStorage, JOINED_KEY);
export const markJoined = () => set(window.localStorage, JOINED_KEY, new Date().toISOString());

export const popupShownThisVisit = () => !!get(window.sessionStorage, SHOWN_KEY);
export const markPopupShown = () => set(window.sessionStorage, SHOWN_KEY, "1");
