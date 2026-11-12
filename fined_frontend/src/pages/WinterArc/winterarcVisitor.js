// What this browser knows about the visitor and WinterArc. Storage can be
// blocked (private mode); then everything reads as "not yet", which only
// means the popup may show when it didn't need to, or the join form shows
// instead of the visitor's invite link.

const JOINED_KEY = "fined_winterarc_joined_v1"; // localStorage: joined the waitlist (+ their invite code)
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

/** Remember that this browser joined, and the invite code it was given. */
export const markJoined = (code) =>
  set(window.localStorage, JOINED_KEY, JSON.stringify({ at: new Date().toISOString(), code: code || null }));

/** The invite code this browser was given when it joined (null if unknown;
 *  older entries stored only a date). */
export function joinedCode() {
  const raw = get(window.localStorage, JOINED_KEY);
  if (!raw || !raw.startsWith("{")) return null;
  try {
    return JSON.parse(raw).code || null;
  } catch {
    return null;
  }
}

/** Forget it (the visitor wants to join with a different email). */
export const forgetJoined = () => {
  try {
    window.localStorage.removeItem(JOINED_KEY);
  } catch {
    // ignore
  }
};

export const popupShownThisVisit = () => !!get(window.sessionStorage, SHOWN_KEY);
export const markPopupShown = () => set(window.sessionStorage, SHOWN_KEY, "1");
