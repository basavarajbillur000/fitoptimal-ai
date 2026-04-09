// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Global State Management
// ═══════════════════════════════════════════════════════════════

let state = {
  user: null,
  token: null,
  plans: [],
  progressLogs: [],
  challenges: [],
  xp: { totalXP: 0, level: 1, currentLevelXP: 0, xpToNext: 200 },

  // UI state
  generatedPlan: null,
  generating: false,
  loadStep: 0,
  planSaved: false,
  selectedPlan: null,
  selectedChallenge: null,
  onboardStep: 1,
  onboardData: {},
};

const listeners = [];

export function getState() {
  return state;
}

export function setState(patch) {
  Object.assign(state, patch);
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const idx = listeners.indexOf(fn);
    if (idx > -1) listeners.splice(idx, 1);
  };
}

export function loadUser(user, token) {
  state.user = user;
  state.token = token;
  if (token) localStorage.setItem('fitoptim_token', token);
}

export function logout() {
  state.user = null;
  state.token = null;
  state.plans = [];
  state.progressLogs = [];
  state.challenges = [];
  state.xp = { totalXP: 0, level: 1, currentLevelXP: 0, xpToNext: 200 };
  localStorage.removeItem('fitoptim_token');
}

// ── Computed helpers ─────────────────────────────────────────
export function calcStreak(logs) {
  const weightLogs = (logs || state.progressLogs).filter(l => l.weight);
  if (!weightLogs.length) return 0;
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dates = new Set(weightLogs.map(l => new Date(l.logged_at).toDateString()));
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (dates.has(d.toDateString())) streak++;
    else break;
  }
  return streak;
}
