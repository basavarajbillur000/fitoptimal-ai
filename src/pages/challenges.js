// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Challenges Hub
// ═══════════════════════════════════════════════════════════════
import { getState, setState } from '../state.js';
import { api } from '../api.js';
import { toast } from '../components/toast.js';
import { rerender } from '../router.js';
import { CHALLENGE_LIST } from '../data/challenges.js';
import { progressRing } from '../components/chart.js';

let viewingChallenge = null;
let loaded = false;

export function renderChallenges() {
  const { challenges } = getState();

  if (!loaded) {
    loaded = true;
    loadChallenges();
  }

  if (viewingChallenge) return renderChallengeDetail(viewingChallenge);

  setTimeout(bindChallengeEvents, 0);

  // Separate active from available
  const activeIds = new Set(challenges.filter(c => c.status === 'active').map(c => c.challenge_id));
  const completedIds = new Set(challenges.filter(c => c.status === 'completed').map(c => c.challenge_id));
  const activeChallenges = challenges.filter(c => c.status === 'active');

  const diffColors = { beginner: 'diff-beginner', intermediate: 'diff-intermediate', advanced: 'diff-advanced', elite: 'diff-elite' };

  return `
    <div class="page-header">
      <h1>Challenges 🏆</h1>
      <p>Take on challenges, build habits, and earn XP</p>
    </div>

    ${activeChallenges.length > 0 ? `
      <div class="section-title" style="margin-bottom:1rem">Active Challenges</div>
      <div class="challenge-grid" style="margin-bottom:2rem">
        ${activeChallenges.map(uc => {
          const def = CHALLENGE_LIST.find(c => c.id === uc.challenge_id);
          if (!def) return '';
          const progress = Math.round((uc.days_completed.length / def.days) * 100);
          return `
            <div class="challenge-card active" data-view-challenge="${uc.id}">
              <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.5rem">
                <div class="challenge-icon">${def.icon}</div>
                <div>
                  <div class="challenge-name">${def.name}</div>
                  <div class="challenge-days">${uc.days_completed.length}/${def.days} days</div>
                </div>
              </div>
              <div class="challenge-progress-bar">
                <div class="challenge-progress-fill" style="width:${progress}%"></div>
              </div>
              <div style="text-align:right;font-size:.7rem;color:var(--accent-light);margin-top:.3rem">${progress}% complete</div>
            </div>
          `;
        }).join('')}
      </div>
    ` : ''}

    <div class="section-title" style="margin-bottom:1rem">Available Challenges</div>
    <div class="challenge-grid stagger-children">
      ${CHALLENGE_LIST.map(def => {
        const isActive = activeIds.has(def.id);
        const isCompleted = completedIds.has(def.id);
        return `
          <div class="challenge-card ${isActive ? 'active' : ''}" data-start-challenge="${def.id}" ${isActive ? 'style="opacity:.6;pointer-events:none"' : ''}>
            <div class="challenge-icon">${def.icon}</div>
            <div class="challenge-name">${def.name}</div>
            <div class="challenge-desc">${def.description}</div>
            <div class="challenge-meta">
              <div class="challenge-days">${def.days} days</div>
              <span class="challenge-diff ${diffColors[def.difficulty]}">${def.difficulty}</span>
              <span class="badge badge-accent" style="margin-left:auto">+${def.xpReward} XP</span>
            </div>
            ${isCompleted ? '<div style="margin-top:.5rem"><span class="badge badge-green">✓ Completed</span></div>' : ''}
            ${isActive ? '<div style="margin-top:.5rem"><span class="badge badge-accent">Active</span></div>' : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderChallengeDetail(userChallenge) {
  const def = CHALLENGE_LIST.find(c => c.id === userChallenge.challenge_id);
  if (!def) return '';

  const progress = Math.round((userChallenge.days_completed.length / def.days) * 100);
  const startDate = new Date(userChallenge.started_at);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkedToday = userChallenge.days_completed.includes(today.toISOString().split('T')[0]);

  // Build calendar
  let calHtml = '';
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  calHtml += dayLabels.map(d => `<div style="text-align:center;font-size:.65rem;color:var(--text-3);font-weight:600">${d}</div>`).join('');

  for (let i = 0; i < def.days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const dateStr = d.toISOString().split('T')[0];
    const completed = userChallenge.days_completed.includes(dateStr);
    const isToday = d.getTime() === today.getTime();
    const isFuture = d > today;
    let cls = '';
    if (completed) cls = 'completed';
    else if (isToday) cls = 'today';
    else if (isFuture) cls = 'future';
    else if (d < today) cls = 'missed';
    calHtml += `<div class="cal-day ${cls}">${d.getDate()}</div>`;
  }

  setTimeout(() => {
    document.getElementById('ch-back')?.addEventListener('click', () => { viewingChallenge = null; rerender(); });
    document.getElementById('ch-checkin')?.addEventListener('click', () => doCheckin(userChallenge.id));
    document.getElementById('ch-abandon')?.addEventListener('click', () => doAbandon(userChallenge.id));
  }, 0);

  // Streak within challenge
  let challengeStreak = 0;
  const sorted = [...userChallenge.days_completed].sort().reverse();
  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    if (sorted[i] === expected.toISOString().split('T')[0]) challengeStreak++;
    else break;
  }

  return `
    <button class="back-btn" id="ch-back">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/></svg>
      Back to Challenges
    </button>

    <div class="challenge-detail-header">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1rem">
        <div style="font-size:2.5rem">${def.icon}</div>
        <div>
          <h2 style="font-family:'Syne',sans-serif;font-size:1.3rem;font-weight:700">${def.name}</h2>
          <p style="color:var(--text-2);font-size:.85rem;margin-top:.2rem">${def.description}</p>
        </div>
      </div>

      <div class="grid-4 stagger-children" style="margin-bottom:1.25rem">
        <div class="stat-card accent">
          <div class="stat-label">Progress</div>
          <div class="stat-value">${progress}%</div>
        </div>
        <div class="stat-card green">
          <div class="stat-label">Days Done</div>
          <div class="stat-value">${userChallenge.days_completed.length}/${def.days}</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">Streak</div>
          <div class="stat-value">${challengeStreak} 🔥</div>
        </div>
        <div class="stat-card cyan">
          <div class="stat-label">XP Reward</div>
          <div class="stat-value">+${def.xpReward}</div>
        </div>
      </div>

      <div style="display:flex;gap:.75rem">
        <button class="btn btn-primary btn-lg" id="ch-checkin" ${checkedToday ? 'disabled style="opacity:.5"' : ''}>
          ${checkedToday ? '✓ Checked in today' : '✓ Check in for today'}
        </button>
        <button class="btn btn-danger btn-sm" id="ch-abandon">Abandon</button>
      </div>
    </div>

    <div class="card" style="margin-top:1.5rem">
      <div class="section-title" style="margin-bottom:.75rem">Daily Progress</div>
      <div style="font-size:.78rem;color:var(--text-3);margin-bottom:.5rem">Today's task: ${def.dailyTask}</div>
      <div class="challenge-calendar">${calHtml}</div>
      <div style="display:flex;gap:.75rem;margin-top:.75rem;font-size:.72rem;color:var(--text-3)">
        <div style="display:flex;align-items:center;gap:.25rem"><div style="width:10px;height:10px;border-radius:3px;background:var(--green-bg);border:1px solid rgba(34,201,106,.3)"></div> Completed</div>
        <div style="display:flex;align-items:center;gap:.25rem"><div style="width:10px;height:10px;border-radius:3px;background:var(--red-bg);border:1px solid rgba(255,77,106,.2)"></div> Missed</div>
        <div style="display:flex;align-items:center;gap:.25rem"><div style="width:10px;height:10px;border-radius:3px;border:1px solid var(--accent)"></div> Today</div>
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <div style="position:relative;display:flex;justify-content:center">
        ${progressRing(progress, 'done', 'var(--accent)', 140)}
      </div>
    </div>
  `;
}

function bindChallengeEvents() {
  document.querySelectorAll('[data-start-challenge]').forEach(el => {
    el.addEventListener('click', () => startChallenge(el.dataset.startChallenge));
  });
  document.querySelectorAll('[data-view-challenge]').forEach(el => {
    el.addEventListener('click', () => {
      const uc = getState().challenges.find(c => c.id == el.dataset.viewChallenge);
      if (uc) { viewingChallenge = uc; rerender(); }
    });
  });
}

async function loadChallenges() {
  try {
    const data = await api.get('/challenges');
    setState({ challenges: data.challenges || [] });
    rerender();
  } catch (e) {
    console.error('Failed to load challenges:', e);
  }
}

async function startChallenge(challengeId) {
  try {
    const data = await api.post('/challenges/start', { challengeId });
    const challenges = [...getState().challenges, data.challenge];
    setState({ challenges });
    viewingChallenge = data.challenge;
    toast('Challenge started! 🏆');
    rerender();
  } catch (e) {
    toast(e.message || 'Failed to start challenge', 'error');
  }
}

async function doCheckin(id) {
  try {
    const data = await api.post(`/challenges/${id}/checkin`);
    const challenges = getState().challenges.map(c => c.id === id ? data.challenge : c);
    setState({ challenges });
    viewingChallenge = data.challenge;

    // Check if challenge is complete
    const def = CHALLENGE_LIST.find(ch => ch.id === data.challenge.challenge_id);
    if (def && data.challenge.days_completed.length >= def.days) {
      await api.post(`/challenges/${id}/complete`);
      toast(`Challenge completed! +${def.xpReward} XP 🎉`);
    } else {
      toast('Checked in! +15 XP ✓');
    }
    rerender();
  } catch (e) {
    toast('Check-in failed', 'error');
  }
}

async function doAbandon(id) {
  try {
    await api.post(`/challenges/${id}/abandon`);
    const challenges = getState().challenges.map(c => c.id === id ? { ...c, status: 'abandoned' } : c);
    setState({ challenges });
    viewingChallenge = null;
    toast('Challenge abandoned');
    rerender();
  } catch (e) {
    toast('Failed to abandon', 'error');
  }
}
