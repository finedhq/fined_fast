// The module page keeps the learner's in-progress answers (hero poll, guesses,
// quick-check picks, slider positions) in sessionStorage, like the prototype, so a refresh
// doesn't lose them. Finished parts are also saved to the learner's account.
const key = (moduleId) => `nc:${moduleId}`;

// hero: {poll, savings, amount} · steps: {[chapterSlug]: figure state}
// checks: {[quizSlug]: optionId} · tools: {[modelSlug]: tool state}
export const EMPTY_PAGE_STATE = { hero: {}, steps: {}, checks: {}, tools: {} };

export function loadPageState(moduleId) {
  try {
    const raw = sessionStorage.getItem(key(moduleId));
    if (raw) return { ...EMPTY_PAGE_STATE, ...JSON.parse(raw) };
  } catch {
    /* private mode / blocked storage */
  }
  return { ...EMPTY_PAGE_STATE };
}

export function savePageState(moduleId, state) {
  try {
    sessionStorage.setItem(key(moduleId), JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
