// Tracker filters: kind, missable, search, and the spoiler rule.
export const KIND_FILTERS = [
  { key: "all", label: "All 55" },
  { key: "story", label: "Story" },
  { key: "missable", label: "Missable" },
  { key: "collectibles", label: "Collectibles" },
  { key: "activities", label: "Activities" },
  { key: "online", label: "Online" },
];

export function isMissableFlagged(trophy) {
  return trophy.risk === "possible" || trophy.risk === "at-risk";
}

export function spoilerHides(state, trophy) {
  return Boolean(state.spoiler) && trophy.hidden && trophy.kinds.includes("story") && !state.earned.includes(trophy.id);
}

export function applyLedgerFilters(trophies, state, kind, query) {
  const needle = query.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (kind === "story" && !trophy.kinds.includes("story")) return false;
    if (kind === "missable" && !isMissableFlagged(trophy)) return false;
    if (kind === "collectibles" && !trophy.kinds.includes("collectibles")) return false;
    if (kind === "activities" && !trophy.kinds.includes("activities")) return false;
    if (kind === "online") return false;
    if (needle) {
      const hay = (trophy.name + " " + trophy.description).toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}
