// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Plans Page & Plan Detail
// ═══════════════════════════════════════════════════════════════
import { getState, setState } from '../state.js';
import { api } from '../api.js';
import { toast } from '../components/toast.js';
import { rerender } from '../router.js';

let detailPlan = null;
let plansLoaded = false;

export function renderPlans() {
  const { plans } = getState();

  if (!plansLoaded) {
    plansLoaded = true;
    loadPlans();
  }

  // Check if viewing a specific plan
  const hash = window.location.hash;
  const viewMatch = hash.match(/view=(\d+)/);
  if (viewMatch) {
    const plan = plans.find(p => p.id == viewMatch[1]);
    if (plan) return renderDetail(plan);
  }

  if (detailPlan) {
    const result = renderDetail(detailPlan);
    return result;
  }

  setTimeout(bindPlansEvents, 0);

  const goalColors = { muscle_gain: 'accent', weight_loss: 'amber', maintenance: 'green', endurance: 'blue', flexibility: 'cyan' };
  const goalNames = { muscle_gain: 'Muscle Gain', weight_loss: 'Weight Loss', maintenance: 'Maintenance', endurance: 'Endurance', flexibility: 'Flexibility' };

  return `
    <div class="page-header">
      <h1>My Plans</h1>
      <p>All your saved AI-optimized plans</p>
    </div>
    ${plans.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">No saved plans</div>
        <div class="empty-sub">Generate your first plan to get started</div>
        <button class="btn btn-primary" onclick="window.location.hash='#/generate'">Generate Plan →</button>
      </div>
    ` : `
      <div class="plans-grid stagger-children">
        ${plans.map(p => {
          const created = new Date(p.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
          return `
            <div class="plan-card" data-plan-id="${p.id}">
              <div class="plan-card-header">
                <div>
                  <div class="plan-title">${p.title || 'Optimized Plan'}</div>
                  <div class="plan-date">${created}</div>
                </div>
                <span class="badge badge-${goalColors[p.goal] || 'accent'}">${goalNames[p.goal] || p.goal}</span>
              </div>
              <div class="plan-macros">
                <div class="macro-item"><div class="macro-val">${p.stats?.calories || '—'}</div><div class="macro-label">kcal</div></div>
                <div class="macro-item"><div class="macro-val">${p.stats?.protein || '—'}g</div><div class="macro-label">protein</div></div>
                <div class="macro-item"><div class="macro-val">${p.stats?.carbs || '—'}g</div><div class="macro-label">carbs</div></div>
                <div class="macro-item"><div class="macro-val">${p.stats?.fat || '—'}g</div><div class="macro-label">fat</div></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `}
  `;
}

function renderDetail(plan) {
  setTimeout(() => {
    document.getElementById('plan-back')?.addEventListener('click', () => {
      detailPlan = null;
      window.location.hash = '#/plans';
    });
    document.getElementById('plan-delete')?.addEventListener('click', () => doDelete(plan.id));
  }, 0);

  const created = new Date(plan.created_at).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return `
    <button class="back-btn" id="plan-back">
      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"/></svg>
      Back to Plans
    </button>
    <div class="plan-detail">
      <div class="pd-header">
        <div>
          <div class="pd-title">${plan.title || 'Optimized Plan'}</div>
          <div class="pd-date">Generated on ${created}</div>
        </div>
        <button class="btn btn-danger btn-sm" id="plan-delete">🗑 Delete</button>
      </div>

      <div class="pd-stats stagger-children">
        <div class="pd-stat"><div class="pd-stat-val" style="color:var(--accent-light)">${plan.stats?.calories || '—'}</div><div class="pd-stat-label">Calories</div></div>
        <div class="pd-stat"><div class="pd-stat-val" style="color:var(--green)">${plan.stats?.protein || '—'}g</div><div class="pd-stat-label">Protein</div></div>
        <div class="pd-stat"><div class="pd-stat-val" style="color:var(--amber)">${plan.stats?.carbs || '—'}g</div><div class="pd-stat-label">Carbs</div></div>
        <div class="pd-stat"><div class="pd-stat-val" style="color:#F06292">${plan.stats?.fat || '—'}g</div><div class="pd-stat-label">Fat</div></div>
      </div>

      ${plan.meals?.length ? `
        <div class="pd-section">
          <div class="pd-section-title">🍽 Diet Plan</div>
          ${plan.meals.map((m, i) => `
            <div class="pd-meal">
              <div class="pd-meal-num">${i + 1}</div>
              <div class="pd-meal-info">
                <div class="pd-meal-name">${m.name}</div>
                <div class="pd-meal-detail">${m.items || ''}</div>
              </div>
              <div class="pd-meal-cal">${m.calories} kcal</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${plan.exercises?.length ? `
        <div class="pd-section">
          <div class="pd-section-title">💪 Workout Plan</div>
          ${plan.exercises.map(e => `
            <div class="pd-exercise">
              <div class="pd-ex-icon">⚡</div>
              <div class="pd-ex-info">
                <div class="pd-ex-name">${e.name}</div>
                <div class="pd-ex-detail">${e.detail || ''}</div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${plan.tips ? `<div class="tip-card"><div class="tip-label">AI Tips</div><div class="tip-text">${plan.tips}</div></div>` : ''}
    </div>
  `;
}

function bindPlansEvents() {
  document.querySelectorAll('[data-plan-id]').forEach(el => {
    el.addEventListener('click', () => {
      const plan = getState().plans.find(p => p.id == el.dataset.planId);
      if (plan) { detailPlan = plan; rerender(); }
    });
  });
}

async function doDelete(id) {
  try {
    await api.delete(`/plans/${id}`);
    const plans = getState().plans.filter(p => p.id !== id);
    setState({ plans });
    detailPlan = null;
    toast('Plan deleted');
    rerender();
  } catch (e) {
    toast('Failed to delete plan', 'error');
  }
}

async function loadPlans() {
  try {
    const data = await api.get('/plans');
    setState({ plans: data.plans || [] });
    rerender();
  } catch (e) {
    console.error('Failed to load plans:', e);
  }
}
