// ═══════════════════════════════════════════════════════════════
// FitOptim AI — Plan Generator Page
// ═══════════════════════════════════════════════════════════════
import { getState, setState } from '../state.js';
import { api } from '../api.js';
import { toast } from '../components/toast.js';
import { rerender } from '../router.js';

const LOAD_STEPS = ['Analyzing your profile...', 'Calculating TDEE & macros...', 'Running NSGA-II optimizer...', 'Selecting Pareto-optimal plan...', 'Formatting your plan...'];

export function renderGenerate() {
  const { user, generating, generatedPlan, loadStep, planSaved } = getState();
  const p = user?.profile;
  if (!p) return '<div class="empty-state"><div class="empty-title">Complete your profile first</div></div>';

  setTimeout(bindGenEvents, 0);

  const goalLabels = { muscle_gain: '💪 Muscle Gain', weight_loss: '🔥 Weight Loss', maintenance: '⚖️ Maintenance', endurance: '🏃 Endurance', flexibility: '🧘 Flexibility' };

  return `
    <div class="page-header">
      <h1>Generate Plan</h1>
      <p>AI will optimize your diet and workout using NSGA-II multi-objective optimization</p>
    </div>
    <div class="gen-layout">
      <div class="gen-form">
        <div class="section-title" style="margin-bottom:1.25rem">Your Parameters</div>
        <div class="field"><label>Goal</label>
          <select id="gen-goal">
            ${Object.entries(goalLabels).map(([k, v]) => `<option value="${k}" ${p.goal === k ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Budget (${p.currency || 'INR'}/day)</label>
          <input type="number" id="gen-budget" value="${p.budget || 300}" placeholder="300">
        </div>
        <div class="field"><label>Preferences <span class="optional">(optional)</span></label>
          <input type="text" id="gen-notes" placeholder="e.g. no eggs, prefer South Indian food...">
        </div>

        <div class="profile-summary" style="margin-bottom:1.25rem">
          <div style="font-weight:600;color:var(--text);margin-bottom:.35rem">Profile summary</div>
          ${p.age}y • ${p.weight}kg • ${p.height}cm • TDEE: <span class="highlight">${p.tdee} kcal</span> • ${p.diet || 'non-veg'} • ${p.region || 'indian'}
        </div>

        <button class="btn btn-primary btn-full btn-lg" id="gen-btn" ${generating ? 'disabled' : ''}>
          ${generating ? 'Generating...' : '⚡ Generate Optimal Plan'}
        </button>
      </div>

      <div class="gen-result ${generating ? 'loading' : ''}">
        ${generating ? renderLoading(loadStep) : generatedPlan ? renderResult(generatedPlan, planSaved) : renderEmpty()}
      </div>
    </div>
  `;
}

function renderEmpty() {
  return `
    <div style="text-align:center;padding:3rem 2rem;color:var(--text-3)">
      <div style="font-size:3rem;margin-bottom:1rem" class="animate-float">🧬</div>
      <div style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;color:var(--text-2);margin-bottom:.4rem">Your plan will appear here</div>
      <div style="font-size:.85rem">Fill in parameters and hit Generate</div>
    </div>
  `;
}

function renderLoading(step) {
  return `
    <div class="spinner"></div>
    <div class="loading-text">Optimizing your plan...</div>
    <div class="loading-steps">
      ${LOAD_STEPS.map((s, i) => `
        <div class="loading-step ${i < step ? 'done' : i === step ? 'active' : ''}">
          <div class="loading-step-dot"></div>${s}
        </div>
      `).join('')}
    </div>
  `;
}

function renderResult(plan, saved) {
  const macroTotal = plan.stats.protein * 4 + plan.stats.carbs * 4 + plan.stats.fat * 9 || 1;
  return `
    <div>
      <div class="flex-between" style="margin-bottom:1.5rem">
        <div style="font-family:'Syne',sans-serif;font-size:1.1rem;font-weight:700">${plan.title}</div>
        ${saved ? '<div class="saved-badge">✓ Saved</div>' : ''}
      </div>

      <div style="margin-bottom:1.25rem">
        <div class="rs-title" style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:600;margin-bottom:.75rem">Macros</div>
        <div class="macro-bar">
          <div class="macro-bar-top"><span style="color:var(--text-2)">Protein</span><span style="color:var(--accent-light)">${plan.stats.protein}g</span></div>
          <div class="macro-bar-track"><div class="macro-bar-fill" style="width:${Math.round(plan.stats.protein * 4 / macroTotal * 100)}%;background:var(--accent)"></div></div>
        </div>
        <div class="macro-bar">
          <div class="macro-bar-top"><span style="color:var(--text-2)">Carbs</span><span style="color:var(--green)">${plan.stats.carbs}g</span></div>
          <div class="macro-bar-track"><div class="macro-bar-fill" style="width:${Math.round(plan.stats.carbs * 4 / macroTotal * 100)}%;background:var(--green)"></div></div>
        </div>
        <div class="macro-bar">
          <div class="macro-bar-top"><span style="color:var(--text-2)">Fat</span><span style="color:var(--amber)">${plan.stats.fat}g</span></div>
          <div class="macro-bar-track"><div class="macro-bar-fill" style="width:${Math.round(plan.stats.fat * 9 / macroTotal * 100)}%;background:var(--amber)"></div></div>
        </div>
        <div style="text-align:right;font-size:.78rem;color:var(--text-3);margin-top:.3rem">Total: ${plan.stats.calories} kcal${plan.stats.cost ? ` • ₹${plan.stats.cost}` : ''}</div>
      </div>

      <div style="margin-bottom:1.25rem">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:600;margin-bottom:.5rem">🍽 Meals</div>
        ${plan.meals.map(m => `
          <div class="meal-item">
            <div class="item-dot accent"></div>
            <div class="item-name">${m.name}</div>
            <div class="item-detail">${m.calories} kcal</div>
          </div>
        `).join('')}
      </div>

      <div style="margin-bottom:1.25rem">
        <div style="font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--text-3);font-weight:600;margin-bottom:.5rem">💪 Workout</div>
        ${plan.exercises.map(e => `
          <div class="workout-item">
            <div class="item-dot green"></div>
            <div class="item-name">${e.name}</div>
            <div class="item-detail">${e.detail}</div>
          </div>
        `).join('')}
      </div>

      ${plan.tips ? `<div class="tip-card"><div class="tip-label">AI Tips</div><div class="tip-text">${plan.tips}</div></div>` : ''}

      <div class="result-actions">
        <button class="btn btn-primary" id="save-plan-btn" ${saved ? 'disabled style="opacity:.5"' : ''}>${saved ? '✓ Saved' : 'Save Plan'}</button>
        <button class="btn btn-secondary" id="regen-btn">↻ Regenerate</button>
      </div>
    </div>
  `;
}

function bindGenEvents() {
  const genBtn = document.getElementById('gen-btn');
  const saveBtn = document.getElementById('save-plan-btn');
  const regenBtn = document.getElementById('regen-btn');

  if (genBtn) genBtn.addEventListener('click', doGenerate);
  if (saveBtn) saveBtn.addEventListener('click', doSave);
  if (regenBtn) regenBtn.addEventListener('click', doGenerate);
}

async function doGenerate() {
  const goal = document.getElementById('gen-goal')?.value;
  const budget = document.getElementById('gen-budget')?.value;

  setState({ generating: true, loadStep: 0, generatedPlan: null, planSaved: false });
  rerender();

  const interval = setInterval(() => {
    const s = getState();
    if (s.loadStep < LOAD_STEPS.length - 1) {
      setState({ loadStep: s.loadStep + 1 });
      rerender();
    }
  }, 900);

  try {
    const data = await api.post('/generate', { goal, budget: parseInt(budget) });
    clearInterval(interval);
    setState({ generating: false, generatedPlan: data.plan, loadStep: LOAD_STEPS.length - 1 });
    rerender();
  } catch (e) {
    clearInterval(interval);
    setState({ generating: false });
    toast('Plan generation failed. Please try again.', 'error');
    rerender();
  }
}

async function doSave() {
  const plan = getState().generatedPlan;
  if (!plan) return;

  try {
    const data = await api.post('/plans', plan);
    const currentPlans = getState().plans;
    setState({
      planSaved: true,
      plans: [data.plan, ...currentPlans],
    });
    toast('Plan saved! ✓');
    rerender();
  } catch (e) {
    toast('Failed to save plan.', 'error');
  }
}
