// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Dashboard Page
// ═══════════════════════════════════════════════════════════════
import { getState, setState, calcStreak } from '../state.js';
import { api } from '../api.js';
import { navigate } from '../router.js';
import { progressRing, contributionCalendar } from '../components/chart.js';

let loaded = false;

export function renderDashboard() {
  const { user, plans, progressLogs, xp } = getState();
  if (!user) return '';
  const p = user.profile;
  if (!p) return '';

  if (!loaded) {
    loaded = true;
    loadDashboardData();
  }

  const streak = calcStreak(progressLogs);
  const latestWeight = progressLogs.find(l => l.weight)?.weight || p.weight;
  const goalLabels = { muscle_gain: 'Muscle Gain', weight_loss: 'Weight Loss', maintenance: 'Maintenance', endurance: 'Endurance', flexibility: 'Flexibility' };

  // Activity dates for calendar
  const activityDates = progressLogs.map(l => l.logged_at);

  return `
    <div class="page-header">
      <h1>Hey, ${user.name.split(' ')[0]} 👋</h1>
      <p>Here's your fitness overview — keep pushing!</p>
    </div>

    <!-- Stats Row -->
    <div class="grid-4 stagger-children" style="margin-bottom:2rem">
      <div class="stat-card accent">
        <div class="stat-label">Daily Target</div>
        <div class="stat-value text-gradient">${p.tdee || '—'}</div>
        <div class="stat-sub">kcal / day</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Day Streak</div>
        <div class="stat-value" style="color:var(--green)">${streak} <span style="font-size:.7rem">🔥</span></div>
        <div class="stat-sub">consecutive days logged</div>
      </div>
      <div class="stat-card cyan">
        <div class="stat-label">Current Weight</div>
        <div class="stat-value">${latestWeight || '—'}</div>
        <div class="stat-sub">kg</div>
      </div>
      <div class="stat-card amber">
        <div class="stat-label">Level</div>
        <div class="stat-value" style="color:var(--amber)">${xp.level}</div>
        <div class="stat-sub">${xp.totalXP} XP total</div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="grid-3" style="margin-bottom:2rem">
      <div class="card card-interactive card-glow" onclick="window.location.hash='#/generate'" style="cursor:pointer;text-align:center;padding:1.75rem">
        <div style="font-size:2rem;margin-bottom:.5rem">⚡</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;margin-bottom:.25rem">Generate Plan</div>
        <div style="font-size:.8rem;color:var(--text-2)">AI-optimized diet & workout</div>
      </div>
      <div class="card card-interactive card-glow" onclick="window.location.hash='#/challenges'" style="cursor:pointer;text-align:center;padding:1.75rem">
        <div style="font-size:2rem;margin-bottom:.5rem">🏆</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;margin-bottom:.25rem">Challenges</div>
        <div style="font-size:.8rem;color:var(--text-2)">Take on a fitness challenge</div>
      </div>
      <div class="card card-interactive card-glow" onclick="window.location.hash='#/progress'" style="cursor:pointer;text-align:center;padding:1.75rem">
        <div style="font-size:2rem;margin-bottom:.5rem">📊</div>
        <div style="font-family:'Syne',sans-serif;font-weight:700;margin-bottom:.25rem">Track Progress</div>
        <div style="font-size:.8rem;color:var(--text-2)">Log weight & measurements</div>
      </div>
    </div>

    <!-- XP Bar -->
    <div class="card" style="margin-bottom:2rem">
      <div class="flex-between" style="margin-bottom:.75rem">
        <div class="section-title">Your Level Progress</div>
        <span class="badge badge-accent">Level ${xp.level}</span>
      </div>
      <div class="xp-bar" style="height:10px;border-radius:5px">
        <div class="xp-fill" style="width:${(xp.currentLevelXP / xp.xpToNext) * 100}%;height:100%;border-radius:5px"></div>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:.4rem;font-size:.75rem;color:var(--text-3)">
        <span>${xp.currentLevelXP} XP</span>
        <span>${xp.xpToNext} XP to Level ${xp.level + 1}</span>
      </div>
    </div>

    <!-- Activity Calendar -->
    <div class="card" style="margin-bottom:2rem">
      <div class="section-title" style="margin-bottom:.75rem">Activity Calendar</div>
      ${contributionCalendar(activityDates, 12)}
      <div style="display:flex;align-items:center;gap:.5rem;margin-top:.75rem;justify-content:flex-end">
        <span style="font-size:.7rem;color:var(--text-3)">Less</span>
        <div style="width:10px;height:10px;border-radius:2px;background:var(--bg-4)"></div>
        <div style="width:10px;height:10px;border-radius:2px;background:rgba(108,99,255,.3)"></div>
        <div style="width:10px;height:10px;border-radius:2px;background:rgba(108,99,255,.6)"></div>
        <div style="width:10px;height:10px;border-radius:2px;background:var(--accent)"></div>
        <span style="font-size:.7rem;color:var(--text-3)">More</span>
      </div>
    </div>

    <!-- Recent Plans -->
    <div class="section-header">
      <div class="section-title">Recent Plans</div>
      ${plans.length > 3 ? `<button class="btn btn-ghost btn-sm" onclick="window.location.hash='#/plans'">View all →</button>` : ''}
    </div>
    ${plans.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">⚡</div>
        <div class="empty-title">No plans yet</div>
        <div class="empty-sub">Generate your first AI-optimized fitness plan</div>
        <button class="btn btn-primary" onclick="window.location.hash='#/generate'">Generate Plan →</button>
      </div>
    ` : `
      <div class="plans-grid stagger-children">
        ${plans.slice(0, 3).map(p => renderPlanCard(p)).join('')}
      </div>
    `}

    <!-- Profile Summary -->
    <div class="card" style="margin-top:2rem">
      <div class="section-title" style="margin-bottom:.75rem">Your Profile Summary</div>
      <div class="grid-4" style="gap:.5rem">
        <div style="text-align:center">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem">${p.age}</div>
          <div style="font-size:.7rem;color:var(--text-3)">Age</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem">${p.weight}kg</div>
          <div style="font-size:.7rem;color:var(--text-3)">Weight</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem">${p.height}cm</div>
          <div style="font-size:.7rem;color:var(--text-3)">Height</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:1.1rem;color:var(--accent-light)">${goalLabels[p.goal] || p.goal}</div>
          <div style="font-size:.7rem;color:var(--text-3)">Goal</div>
        </div>
      </div>
    </div>
  `;
}

function renderPlanCard(plan) {
  const goalColors = { muscle_gain: 'accent', weight_loss: 'amber', maintenance: 'green', endurance: 'blue', flexibility: 'cyan' };
  const goalNames = { muscle_gain: 'Muscle Gain', weight_loss: 'Weight Loss', maintenance: 'Maintenance', endurance: 'Endurance', flexibility: 'Flexibility' };
  const created = new Date(plan.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return `
    <div class="plan-card" onclick="window.location.hash='#/plans?view=${plan.id}'">
      <div class="plan-card-header">
        <div>
          <div class="plan-title">${plan.title || 'Optimized Plan'}</div>
          <div class="plan-date">${created}</div>
        </div>
        <span class="badge badge-${goalColors[plan.goal] || 'accent'}">${goalNames[plan.goal] || plan.goal}</span>
      </div>
      <div class="plan-macros">
        <div class="macro-item"><div class="macro-val">${plan.stats?.calories || '—'}</div><div class="macro-label">kcal</div></div>
        <div class="macro-item"><div class="macro-val">${plan.stats?.protein || '—'}g</div><div class="macro-label">protein</div></div>
        <div class="macro-item"><div class="macro-val">${plan.stats?.carbs || '—'}g</div><div class="macro-label">carbs</div></div>
        <div class="macro-item"><div class="macro-val">${plan.stats?.fat || '—'}g</div><div class="macro-label">fat</div></div>
      </div>
    </div>
  `;
}

async function loadDashboardData() {
  try {
    const [plansData, progressData, xpData] = await Promise.all([
      api.get('/plans'),
      api.get('/progress'),
      api.get('/xp'),
    ]);
    setState({
      plans: plansData.plans || [],
      progressLogs: progressData.logs || [],
      xp: xpData || { totalXP: 0, level: 1, currentLevelXP: 0, xpToNext: 200 },
    });
    // Re-render with data
    import('../router.js').then(r => r.rerender());
  } catch (e) {
    console.error('Failed to load dashboard data:', e);
  }
}
