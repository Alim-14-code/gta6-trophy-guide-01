// Ledger progress store: localStorage save, export to a file, import back.
export const LEDGER_STORAGE_KEY = "leonida-ledger-v1";
export const GRADE_POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };

export function emptyLedgerState() {
  return { earned: [], counts: {}, spoiler: false };
}

export function loadLedgerState() {
  const state = emptyLedgerState();
  try {
    const raw = localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return state;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((n) => Number.isInteger(n));
    if (parsed.counts && typeof parsed.counts === "object") {
      for (const [key, value] of Object.entries(parsed.counts)) {
        if (Number.isInteger(value) && value >= 0) state.counts[key] = value;
      }
    }
    if (typeof parsed.spoiler === "boolean") state.spoiler = parsed.spoiler;
  } catch (error) {
    // A damaged save is ignored; the ledger starts empty rather than breaking.
  }
  return state;
}

export function saveLedgerState(state) {
  try {
    localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Storage may be unavailable (for example on file://); the ledger still works in memory.
  }
}

export function isEarned(state, trophyId) {
  return state.earned.includes(trophyId);
}

export function toggleEarned(state, trophyId) {
  const at = state.earned.indexOf(trophyId);
  if (at >= 0) state.earned.splice(at, 1);
  else state.earned.push(trophyId);
  saveLedgerState(state);
}

export function trophyCount(state, trophy) {
  if (!trophy.count) return 0;
  return state.counts[String(trophy.id)] || 0;
}

export function changeTrophyCount(state, trophy, delta) {
  if (!trophy.count) return 0;
  const next = Math.max(0, Math.min(trophy.count.target, trophyCount(state, trophy) + delta));
  state.counts[String(trophy.id)] = next;
  if (next >= trophy.count.target && !isEarned(state, trophy.id)) state.earned.push(trophy.id);
  if (next < trophy.count.target && isEarned(state, trophy.id)) {
    state.earned = state.earned.filter((id) => id !== trophy.id);
  }
  saveLedgerState(state);
  return next;
}

export function earnedPoints(state, trophies) {
  let points = 0;
  for (const trophy of trophies) {
    if (isEarned(state, trophy.id)) points += GRADE_POINTS[trophy.grade] || 0;
  }
  return points;
}

export function totalPoints(trophies) {
  let points = 0;
  for (const trophy of trophies) points += GRADE_POINTS[trophy.grade] || 0;
  return points;
}

export function exportLedgerState(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "leonida-trophy-ledger.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function parseImportedLedger(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== "object") throw new Error("not an object");
  const state = emptyLedgerState();
  if (Array.isArray(parsed.earned)) state.earned = parsed.earned.filter((n) => Number.isInteger(n));
  if (parsed.counts && typeof parsed.counts === "object") {
    for (const [key, value] of Object.entries(parsed.counts)) {
      if (Number.isInteger(value) && value >= 0) state.counts[key] = value;
    }
  }
  if (typeof parsed.spoiler === "boolean") state.spoiler = parsed.spoiler;
  return state;
}
