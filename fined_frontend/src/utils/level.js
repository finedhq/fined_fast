// A user's level follows their current FinScore, so it rises and falls with it
// (FinScore drops with inactivity). Five stages of 200 points each.
export const POINTS_PER_LEVEL = 200;

const LEVEL_NAMES = ["Newbie", "Locked In", "Vibing", "Main Character", "GOAT"];

export function getLevel(finScore) {
  const score = Math.max(0, Math.floor(Number(finScore) || 0));
  const level = Math.min(Math.floor(score / POINTS_PER_LEVEL) + 1, LEVEL_NAMES.length);
  const isTop = level === LEVEL_NAMES.length;

  return {
    level,
    name: LEVEL_NAMES[level - 1],
    label: `Level ${level} · ${LEVEL_NAMES[level - 1]}`,
    // null once the top level is reached
    pointsToNext: isTop ? null : level * POINTS_PER_LEVEL - score,
    nextName: isTop ? null : LEVEL_NAMES[level],
  };
}

// Reads FinScore from API/profile objects, which use either key
export const getUserLevel = (data) => getLevel(data?.fin_score ?? data?.finscore);
